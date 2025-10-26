import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CheckpointType } from '@prisma/client'
import { JourneyNotifications } from '@/lib/push-notifications'

// Configuración
const HEARTBEAT_TIMEOUT_MINUTES = 15 // Si no recibe heartbeat en 15 min -> alerta

export async function POST() {
  try {
    console.log('🔍 Iniciando monitoreo de jornadas...')

    // Obtener todas las jornadas activas (que tienen JOURNEY_START pero no JOURNEY_END)
    const activeJourneys = await prisma.checkpoint.findMany({
      where: {
        type: CheckpointType.JOURNEY_START
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { timestamp: 'desc' }
    })

    let alertsSent = 0
    let journeysChecked = 0

    for (const journey of activeJourneys) {
      try {
        // Verificar si tiene un JOURNEY_END posterior
        const journeyEnd = await prisma.checkpoint.findFirst({
          where: {
            userId: journey.userId,
            type: CheckpointType.JOURNEY_END,
            timestamp: { gt: journey.timestamp }
          }
        })

        // Si tiene JOURNEY_END, skip
        if (journeyEnd) continue

        journeysChecked++

        // Obtener información del monitor
        const monitor = await prisma.journeyMonitor.findUnique({
          where: {
            userId_journeyId: {
              userId: journey.userId,
              journeyId: journey.id
            }
          }
        })

        if (!monitor) {
          console.log(`⚠️ No hay monitor para jornada ${journey.id} del usuario ${journey.user.firstName} ${journey.user.lastName}`)
          continue
        }

        const now = new Date()
        const timeSinceLastHeartbeat = now.getTime() - monitor.lastHeartbeat.getTime()
        const minutesSinceHeartbeat = Math.floor(timeSinceLastHeartbeat / (1000 * 60))

        // Obtener tokens administrativos
        const adminTokens = await prisma.pushToken.findMany({
          where: {
            isAdminDevice: true,
            isActive: true
          },
          select: { token: true }
        })

        const adminTokenList = adminTokens.map(t => t.token)

        if (adminTokenList.length === 0) {
          console.log('⚠️ No hay tokens administrativos configurados')
          continue
        }

        // Calcular duración de jornada
        const journeyDuration = now.getTime() - journey.timestamp.getTime()
        const journeyHours = Math.floor(journeyDuration / (1000 * 60 * 60))
        const journeyMinutes = Math.floor((journeyDuration % (1000 * 60 * 60)) / (1000 * 60))
        const durationText = `${journeyHours}h ${journeyMinutes}m`

        // CASO 1: Sin heartbeat por mucho tiempo (app crashed/cerrada)
        if (minutesSinceHeartbeat > HEARTBEAT_TIMEOUT_MINUTES && !monitor.alertSent) {
          console.log(`🚨 Jornada sin heartbeat: ${journey.user.firstName} ${journey.user.lastName} - ${minutesSinceHeartbeat} minutos`)

          await JourneyNotifications.sendJourneyInactiveAlert(
            adminTokenList,
            {
              name: `${journey.user.firstName} ${journey.user.lastName}`,
              email: journey.user.email
            },
            {
              duration: durationText,
              lastSeen: `${minutesSinceHeartbeat} min`
            }
          )

          // Marcar alerta como enviada
          await prisma.journeyMonitor.update({
            where: { id: monitor.id },
            data: { alertSent: true }
          })

          alertsSent++
          continue
        }


        // CASO 2: Jornada recuperada (heartbeat reciente después de alerta)
        if (minutesSinceHeartbeat <= 5 && monitor.alertSent) {
          console.log(`✅ Jornada recuperada: ${journey.user.firstName} ${journey.user.lastName}`)

          await JourneyNotifications.sendJourneyRecoveredAlert(
            adminTokenList,
            {
              name: `${journey.user.firstName} ${journey.user.lastName}`,
              email: journey.user.email
            }
          )

          // Reset alerta (ya se hace en el heartbeat endpoint, pero por si acaso)
          await prisma.journeyMonitor.update({
            where: { id: monitor.id },
            data: { alertSent: false }
          })
        }

      } catch (error) {
        console.error(`❌ Error procesando jornada ${journey.id}:`, error)
      }
    }

    console.log(`✅ Monitoreo completado: ${journeysChecked} jornadas verificadas, ${alertsSent} alertas enviadas`)

    return NextResponse.json({
      success: true,
      message: 'Monitoreo de jornadas completado',
      data: {
        journeysChecked,
        alertsSent,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Error en monitoreo de jornadas:', error)
    return NextResponse.json({
      success: false,
      error: 'Error en monitoreo de jornadas'
    }, { status: 500 })
  }
}

// También permitir GET para testing manual
export async function GET() {
  return POST()
}