import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'

// GET /api/novelties/[id]/attachments - List attachments for a novelty
export async function GET(
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
      select: { id: true, superuser: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Check if novelty exists and user has access
    const novelty = await prisma.novelty.findUnique({
      where: { id: params.id }
    })

    if (!novelty) {
      return NextResponse.json({ error: 'Novedad no encontrada' }, { status: 404 })
    }

    if (novelty.userId !== currentUser.id && !currentUser.superuser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const attachments = await prisma.noveltyAttachment.findMany({
      where: { noveltyId: params.id },
      orderBy: { uploadedAt: 'desc' }
    })

    return NextResponse.json(attachments)
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json({ error: 'Error al obtener archivos adjuntos' }, { status: 500 })
  }
}

// POST /api/novelties/[id]/attachments - Upload attachment
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
      select: { id: true, superuser: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Check if novelty exists and user has access
    const novelty = await prisma.novelty.findUnique({
      where: { id: params.id },
      include: {
        noveltyType: true
      }
    })

    if (!novelty) {
      return NextResponse.json({ error: 'Novedad no encontrada' }, { status: 404 })
    }

    if (novelty.userId !== currentUser.id && !currentUser.superuser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (!novelty.noveltyType.allowsAttachments) {
      return NextResponse.json(
        { error: 'Este tipo de novedad no permite archivos adjuntos' },
        { status: 400 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'novelties')
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = join(uploadsDir, fileName)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    const fileUrl = `/uploads/novelties/${fileName}`

    // Save attachment record in database
    const attachment = await prisma.noveltyAttachment.create({
      data: {
        noveltyId: params.id,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type
      }
    })

    return NextResponse.json(attachment, { status: 201 })
  } catch (error) {
    console.error('Error uploading attachment:', error)
    return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 })
  }
}

// DELETE /api/novelties/[id]/attachments - Delete attachment
export async function DELETE(
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
      select: { id: true, superuser: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const { attachmentId } = await req.json()

    if (!attachmentId) {
      return NextResponse.json({ error: 'ID de archivo requerido' }, { status: 400 })
    }

    // Get attachment
    const attachment = await prisma.noveltyAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        novelty: true
      }
    })

    if (!attachment) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
    }

    // Check if user has access
    if (attachment.novelty.userId !== currentUser.id && !currentUser.superuser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Delete physical file
    try {
      const filePath = join(process.cwd(), 'public', attachment.fileUrl)
      await unlink(filePath)
    } catch (error) {
      console.warn('Could not delete physical file:', error)
      // Continue even if file deletion fails
    }

    // Delete database record
    await prisma.noveltyAttachment.delete({
      where: { id: attachmentId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting attachment:', error)
    return NextResponse.json({ error: 'Error al eliminar archivo' }, { status: 500 })
  }
}
