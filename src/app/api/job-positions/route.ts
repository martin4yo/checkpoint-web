import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET - Obtener todos los puestos de trabajo
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true, superuser: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const tenantId = user.superuser && searchParams.get('tenantId')
      ? searchParams.get('tenantId')!
      : user.tenantId

    const positions = await prisma.jobPosition.findMany({
      where: { tenantId },
      orderBy: [
        { code: 'asc' }
      ]
    })

    return NextResponse.json({ positions })
  } catch (error) {
    console.error('Error fetching job positions:', error)
    return NextResponse.json(
      { error: 'Error al obtener puestos' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo puesto de trabajo
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const body = await req.json()
    const {
      code,
      name,
      description,
      workDays,
      scheduleType,
      startTime,
      endTime,
      hoursPerDay,
      hoursPerWeek,
      overtimeAllowed,
      overtimeRate,
      breakMinutes
    } = body

    if (!code || !name || !scheduleType || !workDays) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // Verificar si ya existe
    const existing = await prisma.jobPosition.findUnique({
      where: {
        tenantId_code: {
          tenantId: user.tenantId,
          code
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un puesto con ese código' },
        { status: 400 }
      )
    }

    const position = await prisma.jobPosition.create({
      data: {
        tenantId: user.tenantId,
        code: code.trim(),
        name: name.trim(),
        description: description?.trim(),
        workDays,
        scheduleType,
        startTime,
        endTime,
        hoursPerDay,
        hoursPerWeek,
        overtimeAllowed: overtimeAllowed ?? false,
        overtimeRate,
        breakMinutes
      }
    })

    return NextResponse.json({ position }, { status: 201 })
  } catch (error) {
    console.error('Error creating job position:', error)
    return NextResponse.json(
      { error: 'Error al crear puesto' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar puesto de trabajo
export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const body = await req.json()
    const {
      id,
      code,
      name,
      description,
      workDays,
      scheduleType,
      startTime,
      endTime,
      hoursPerDay,
      hoursPerWeek,
      overtimeAllowed,
      overtimeRate,
      breakMinutes,
      isActive
    } = body

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 })
    }

    // Verificar que el puesto pertenece al tenant
    const existing = await prisma.jobPosition.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Puesto no encontrado' }, { status: 404 })
    }

    const position = await prisma.jobPosition.update({
      where: { id },
      data: {
        code: code?.trim() || existing.code,
        name: name?.trim() || existing.name,
        description: description?.trim() ?? existing.description,
        workDays: workDays || existing.workDays,
        scheduleType: scheduleType || existing.scheduleType,
        startTime: startTime ?? existing.startTime,
        endTime: endTime ?? existing.endTime,
        hoursPerDay: hoursPerDay ?? existing.hoursPerDay,
        hoursPerWeek: hoursPerWeek ?? existing.hoursPerWeek,
        overtimeAllowed: overtimeAllowed ?? existing.overtimeAllowed,
        overtimeRate: overtimeRate ?? existing.overtimeRate,
        breakMinutes: breakMinutes ?? existing.breakMinutes,
        isActive: isActive ?? existing.isActive
      }
    })

    return NextResponse.json({ position })
  } catch (error) {
    console.error('Error updating job position:', error)
    return NextResponse.json(
      { error: 'Error al actualizar puesto' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar puesto de trabajo
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 })
    }

    // Verificar que el puesto pertenece al tenant
    const existing = await prisma.jobPosition.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Puesto no encontrado' }, { status: 404 })
    }

    await prisma.jobPosition.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting job position:', error)
    return NextResponse.json(
      { error: 'Error al eliminar puesto' },
      { status: 500 }
    )
  }
}
