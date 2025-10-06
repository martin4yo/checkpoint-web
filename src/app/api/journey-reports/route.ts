import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CheckpointType } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const userId = searchParams.get('userId')
    const search = searchParams.get('search')

    // Construir filtros
    const where: {
      type: CheckpointType
      timestamp?: { gte?: Date; lte?: Date }
      userId?: string
      OR?: Array<{
        placeName?: { contains: string; mode: 'insensitive' }
        user?: { name: { contains: string; mode: 'insensitive' } }
      }>
    } = {
      type: CheckpointType.JOURNEY_START
    }

    if (dateFrom || dateTo) {
      where.timestamp = {}
      if (dateFrom) where.timestamp.gte = new Date(dateFrom)
      if (dateTo) where.timestamp.lte = new Date(dateTo + 'T23:59:59')
    }

    if (userId) {
      where.userId = userId
    }

    if (search) {
      where.OR = [
        { placeName: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Obtener jornadas con sus ajustes
    const journeys = await prisma.checkpoint.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        journeyAdjustments: true
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    // Formatear datos para el reporte
    const journeyReports = journeys.map(journey => {
      const startDate = journey.timestamp.toISOString().split('T')[0]
      const startTime = journey.timestamp.toTimeString().slice(0, 5)

      let endDate: string | undefined
      let endTime: string | undefined
      let duration = '00:00'

      if (journey.endTimestamp) {
        endDate = journey.endTimestamp.toISOString().split('T')[0]
        endTime = journey.endTimestamp.toTimeString().slice(0, 5)

        // Calcular duración considerando ajustes
        const effectiveStart = journey.journeyAdjustments?.manualStartTime || journey.timestamp
        const effectiveEnd = journey.journeyAdjustments?.manualEndTime || journey.endTimestamp

        let totalMs = effectiveEnd.getTime() - effectiveStart.getTime()

        // Restar tiempo de almuerzo si está configurado
        if (journey.journeyAdjustments?.lunchStartTime && journey.journeyAdjustments?.lunchEndTime) {
          const lunchStartTime = journey.journeyAdjustments.lunchStartTime.toTimeString().slice(0, 5)
          const lunchEndTime = journey.journeyAdjustments.lunchEndTime.toTimeString().slice(0, 5)
          const lunchStart = new Date(`${startDate}T${lunchStartTime}`)
          const lunchEnd = new Date(`${startDate}T${lunchEndTime}`)
          const lunchDuration = lunchEnd.getTime() - lunchStart.getTime()
          if (lunchDuration > 0) {
            totalMs -= lunchDuration
          }
        }

        const hours = Math.floor(totalMs / (1000 * 60 * 60))
        const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60))
        duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      } else {
        // Jornada en curso - calcular duración hasta ahora
        const now = new Date()
        const effectiveStart = journey.journeyAdjustments?.manualStartTime || journey.timestamp
        let totalMs = now.getTime() - effectiveStart.getTime()

        // Restar tiempo de almuerzo si está configurado
        if (journey.journeyAdjustments?.lunchStartTime && journey.journeyAdjustments?.lunchEndTime) {
          const lunchStartTime = journey.journeyAdjustments.lunchStartTime.toTimeString().slice(0, 5)
          const lunchEndTime = journey.journeyAdjustments.lunchEndTime.toTimeString().slice(0, 5)
          const lunchStart = new Date(`${startDate}T${lunchStartTime}`)
          const lunchEnd = new Date(`${startDate}T${lunchEndTime}`)
          const lunchDuration = lunchEnd.getTime() - lunchStart.getTime()
          if (lunchDuration > 0) {
            totalMs -= lunchDuration
          }
        }

        const hours = Math.floor(totalMs / (1000 * 60 * 60))
        const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60))
        duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} (en curso)`
      }

      return {
        id: journey.id,
        placeName: journey.placeName,
        userName: journey.user.name,
        userEmail: journey.user.email,
        startDate,
        startTime,
        endDate,
        endTime,
        duration,
        adjustments: journey.journeyAdjustments ? {
          id: journey.journeyAdjustments.id,
          manualStartTime: journey.journeyAdjustments.manualStartTime?.toISOString().slice(0, 16),
          manualEndTime: journey.journeyAdjustments.manualEndTime?.toISOString().slice(0, 16),
          lunchStartTime: journey.journeyAdjustments.lunchStartTime?.toTimeString().slice(0, 5),
          lunchEndTime: journey.journeyAdjustments.lunchEndTime?.toTimeString().slice(0, 5),
          notes: journey.journeyAdjustments.notes
        } : undefined
      }
    })

    return NextResponse.json(journeyReports)

  } catch (error) {
    console.error('Error fetching journey reports:', error)
    return NextResponse.json(
      { error: 'Error al obtener reporte de jornadas' },
      { status: 500 }
    )
  }
}