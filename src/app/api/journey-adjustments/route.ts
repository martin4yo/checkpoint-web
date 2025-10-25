import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      checkpointId,
      manualStartTime,
      manualEndTime,
      lunchStartTime,
      lunchEndTime,
      notes
    } = body

    // Get checkpoint to get tenantId
    const checkpoint = await prisma.checkpoint.findUnique({
      where: { id: checkpointId },
      select: { tenantId: true }
    })

    if (!checkpoint) {
      return NextResponse.json(
        { error: 'Checkpoint no encontrado' },
        { status: 404 }
      )
    }

    // Convertir strings a DateTime donde sea necesario
    const data: {
      checkpointId: string
      tenantId: string
      notes?: string | null
      manualStartTime?: Date
      manualEndTime?: Date
      lunchStartTime?: Date
      lunchEndTime?: Date
    } = {
      checkpointId,
      tenantId: checkpoint.tenantId,
      notes: notes || null
    }

    if (manualStartTime) {
      data.manualStartTime = new Date(manualStartTime)
    }

    if (manualEndTime) {
      data.manualEndTime = new Date(manualEndTime)
    }

    if (lunchStartTime) {
      // Para campos de tiempo, usamos una fecha base
      data.lunchStartTime = new Date(`1970-01-01T${lunchStartTime}:00`)
    }

    if (lunchEndTime) {
      data.lunchEndTime = new Date(`1970-01-01T${lunchEndTime}:00`)
    }

    // Verificar si ya existe un ajuste para este checkpoint
    const existingAdjustment = await prisma.journeyAdjustment.findUnique({
      where: { checkpointId }
    })

    let adjustment
    if (existingAdjustment) {
      // Actualizar ajuste existente
      adjustment = await prisma.journeyAdjustment.update({
        where: { checkpointId },
        data
      })
    } else {
      // Crear nuevo ajuste
      adjustment = await prisma.journeyAdjustment.create({
        data
      })
    }

    return NextResponse.json({
      success: true,
      data: adjustment
    })

  } catch (error) {
    console.error('Error saving journey adjustment:', error)
    return NextResponse.json(
      { error: 'Error al guardar ajustes de jornada' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const checkpointId = searchParams.get('checkpointId')

    if (!checkpointId) {
      return NextResponse.json(
        { error: 'checkpointId is required' },
        { status: 400 }
      )
    }

    const adjustment = await prisma.journeyAdjustment.findUnique({
      where: { checkpointId }
    })

    return NextResponse.json(adjustment)

  } catch (error) {
    console.error('Error fetching journey adjustment:', error)
    return NextResponse.json(
      { error: 'Error al obtener ajustes de jornada' },
      { status: 500 }
    )
  }
}