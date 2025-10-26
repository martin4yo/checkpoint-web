import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const assignments = await prisma.userPlaceAssignment.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        place: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, placeId } = await req.json()

    if (!userId || !placeId) {
      return NextResponse.json(
        { error: 'Usuario y lugar son requeridos' },
        { status: 400 }
      )
    }

    // Get user's tenantId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que no existe ya la asignación
    const existingAssignment = await prisma.userPlaceAssignment.findUnique({
      where: {
        userId_placeId: {
          userId,
          placeId,
        },
      },
    })

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Esta asignación ya existe' },
        { status: 400 }
      )
    }

    const assignment = await prisma.userPlaceAssignment.create({
      data: {
        userId,
        placeId,
        tenantId: user.tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        place: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 })
    }

    await prisma.userPlaceAssignment.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}