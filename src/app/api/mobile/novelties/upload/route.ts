import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token no proporcionado' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token)

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Obtener el usuario para conseguir su tenantId
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { tenantId: true, isActive: true },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado o inactivo' },
        { status: 404 }
      )
    }

    const formData = await req.formData()
    const noveltyId = formData.get('noveltyId') as string
    const file = formData.get('file') as File | null

    if (!noveltyId) {
      return NextResponse.json(
        { success: false, error: 'ID de novedad requerido' },
        { status: 400 }
      )
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Archivo requerido' },
        { status: 400 }
      )
    }

    // Verificar que la novedad existe y pertenece al usuario
    const novelty = await prisma.novelty.findFirst({
      where: {
        id: noveltyId,
        userId: decoded.userId,
        tenantId: user.tenantId,
      },
      include: {
        noveltyType: {
          select: {
            allowsAttachments: true,
          },
        },
      },
    })

    if (!novelty) {
      return NextResponse.json(
        { success: false, error: 'Novedad no encontrada' },
        { status: 404 }
      )
    }

    if (!novelty.noveltyType.allowsAttachments) {
      return NextResponse.json(
        { success: false, error: 'Este tipo de novedad no permite archivos adjuntos' },
        { status: 400 }
      )
    }

    console.log('📎 Backend: Archivo recibido:', file.name, 'Tamaño:', Math.round(file.size / 1024), 'KB')

    // Guardar archivo
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'novelties')
    await mkdir(uploadsDir, { recursive: true })

    const fileName = `${Date.now()}-${file.name}`
    const filePath = join(uploadsDir, fileName)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    await writeFile(filePath, buffer)
    const fileUrl = `/uploads/novelties/${fileName}`

    console.log('📎 Backend: Archivo guardado en:', fileUrl)

    // Crear registro de adjunto
    const attachment = await prisma.noveltyAttachment.create({
      data: {
        noveltyId,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
      },
    })

    console.log('📎 Backend: Adjunto creado:', attachment.id)

    return NextResponse.json({
      success: true,
      data: attachment,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
