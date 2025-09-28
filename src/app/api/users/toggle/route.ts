import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { id, isActive } = await req.json()

    if (!id || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'ID y estado son requeridos' },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { id },
      data: { isActive },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error toggling user status:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}