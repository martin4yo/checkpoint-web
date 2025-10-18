import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// POST /api/novelties/[id]/approve - Approve or reject a novelty
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, tenantId: true, superuser: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Only superusers can approve/reject
    if (!currentUser.superuser) {
      return NextResponse.json(
        { error: 'Solo los administradores pueden aprobar/rechazar novedades' },
        { status: 403 }
      )
    }

    const { status } = await req.json()

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Estado inválido. Debe ser APPROVED o REJECTED' },
        { status: 400 }
      )
    }

    const novelty = await prisma.novelty.findUnique({
      where: { id: params.id }
    })

    if (!novelty) {
      return NextResponse.json({ error: 'Novedad no encontrada' }, { status: 404 })
    }

    if (novelty.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Solo se pueden aprobar/rechazar novedades pendientes' },
        { status: 400 }
      )
    }

    const updatedNovelty = await prisma.novelty.update({
      where: { id: params.id },
      data: {
        status,
        approvedById: currentUser.id,
        approvedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        noveltyType: true,
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            attachments: true
          }
        }
      }
    })

    return NextResponse.json(updatedNovelty)
  } catch (error) {
    console.error('Error approving/rejecting novelty:', error)
    return NextResponse.json({ error: 'Error al procesar novedad' }, { status: 500 })
  }
}
