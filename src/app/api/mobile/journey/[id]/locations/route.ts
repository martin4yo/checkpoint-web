import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Obtener las ubicaciones de la jornada específica
    const locations = await prisma.journeyLocation.findMany({
      where: {
        startCheckpointId: id
      },
      orderBy: {
        recordedAt: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      locations
    })
  } catch (error) {
    console.error('Error fetching journey locations:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener ubicaciones de jornada'
    }, { status: 500 })
  }
}