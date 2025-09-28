import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const formData = await req.formData()
    const placeId = formData.get('placeId') as string | null
    const placeName = formData.get('placeName') as string
    const latitude = parseFloat(formData.get('latitude') as string)
    const longitude = parseFloat(formData.get('longitude') as string)
    const timestamp = formData.get('timestamp') as string
    const notes = formData.get('notes') as string | null
    const imageFile = formData.get('image') as File | null

    let imageUrl: string | null = null

    // Guardar imagen si existe
    if (imageFile) {
      const uploadsDir = join(process.cwd(), 'public', 'uploads')
      await mkdir(uploadsDir, { recursive: true })

      const fileName = `${Date.now()}-${imageFile.name}`
      const filePath = join(uploadsDir, fileName)

      const bytes = await imageFile.arrayBuffer()
      const buffer = Buffer.from(bytes)

      await writeFile(filePath, buffer)
      imageUrl = `/uploads/${fileName}`
    }

    // Crear checkpoint
    const checkpoint = await prisma.checkpoint.create({
      data: {
        userId: payload.userId,
        placeId: placeId || null,
        placeName,
        latitude,
        longitude,
        timestamp: new Date(timestamp),
        notes: notes || null,
        imageUrl,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Ubicación registrada exitosamente',
      checkpointId: checkpoint.id,
    })
  } catch (error) {
    console.error('Create checkpoint error:', error)
    return NextResponse.json({ error: 'Error al registrar ubicación' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Obtener checkpoints del usuario
    const checkpoints = await prisma.checkpoint.findMany({
      where: {
        userId: payload.userId,
      },
      include: {
        place: {
          select: {
            name: true,
            address: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await prisma.checkpoint.count({
      where: {
        userId: payload.userId,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        checkpoints,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    })
  } catch (error) {
    console.error('Get checkpoints error:', error)
    return NextResponse.json({ error: 'Error al obtener checkpoints' }, { status: 500 })
  }
}