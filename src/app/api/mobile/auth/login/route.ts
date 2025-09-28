import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePasswords, generateToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email y contraseña requeridos'
        },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        assignments: {
          include: {
            place: true,
          },
        },
      },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Credenciales inválidas'
        },
        { status: 401 }
      )
    }

    const isValidPassword = await comparePasswords(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Credenciales inválidas'
        },
        { status: 401 }
      )
    }

    const token = await generateToken({ userId: user.id, email: user.email })

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        token,
        places: user.assignments.map(a => ({
          id: a.place.id,
          name: a.place.name,
          address: a.place.address,
          latitude: a.place.latitude,
          longitude: a.place.longitude,
        })),
      },
    })
  } catch (error) {
    console.error('Mobile login error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}