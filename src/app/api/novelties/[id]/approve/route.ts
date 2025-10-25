import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { sendNoveltyStatusEmail } from '@/lib/email'

// POST /api/novelties/[id]/approve - Approve or reject a novelty
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, tenantId: true, superuser: true, authorizesNovelties: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Only users with authorizesNovelties permission can approve/reject
    if (!currentUser.authorizesNovelties && !currentUser.superuser) {
      return NextResponse.json(
        { error: 'No tienes permisos para aprobar/rechazar novedades' },
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

    // Send email notification to the user who created the novelty
    try {
      const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

      await sendNoveltyStatusEmail(updatedNovelty.user.email, {
        noveltyTypeName: updatedNovelty.noveltyType.name,
        status: status as 'APPROVED' | 'REJECTED',
        approverName: currentUser.name,
        webAppUrl
      })
    } catch (emailError) {
      console.error('Error sending novelty status email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json(updatedNovelty)
  } catch (error) {
    console.error('Error approving/rejecting novelty:', error)
    return NextResponse.json({ error: 'Error al procesar novedad' }, { status: 500 })
  }
}
