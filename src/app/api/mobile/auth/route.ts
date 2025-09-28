import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePasswords, generateToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
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
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const isValidPassword = await comparePasswords(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const token = await generateToken({ userId: user.id, email: user.email })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      places: user.assignments.map(a => ({
        id: a.place.id,
        name: a.place.name,
        address: a.place.address,
        lat: a.place.latitude,
        lng: a.place.longitude,
      })),
    })
  } catch (error) {
    console.error('Mobile login error:', error)
    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
  }
}