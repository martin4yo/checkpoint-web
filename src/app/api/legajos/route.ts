import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

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

    // Get current user info
    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        tenantId: true,
        superuser: true
      }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const legajoId = req.nextUrl.searchParams.get('legajoId')

    // Si se pide un legajo específico, devolverlo con todas sus relaciones
    if (legajoId) {
      const legajo = await prisma.legajo.findUnique({
        where: { id: legajoId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          datosPersonales: true,
          datosFamiliares: true,
          datosLaborales: true,
          datosRemuneracion: true,
          datosAdministrativos: true,
          contactosEmergencia: {
            orderBy: { orden: 'asc' }
          },
          formacion: {
            orderBy: { createdAt: 'desc' }
          },
          capacitaciones: {
            orderBy: { createdAt: 'desc' }
          },
          documentos: {
            orderBy: { createdAt: 'desc' }
          },
          horarios: {
            orderBy: { vigenciaDesde: 'desc' }
          }
        }
      })

      if (!legajo) {
        return NextResponse.json({ error: 'Legajo no encontrado' }, { status: 404 })
      }

      return NextResponse.json(legajo)
    }

    // Get tenant filter parameter
    const tenantIdParam = req.nextUrl.searchParams.get('tenantId')

    // Determine which tenantId to filter by
    let filterTenantId = currentUser.tenantId

    // If user is superuser and specifies a tenantId, use that
    if (currentUser.superuser && tenantIdParam) {
      filterTenantId = tenantIdParam
    }

    // Si no, devolver todos los usuarios con sus legajos (si existen) filtrados por tenant
    const users = await prisma.user.findMany({
      where: {
        tenantId: filterTenantId
      },
      include: {
        legajo: {
          include: {
            datosPersonales: {
              select: {
                dni: true,
                cuil: true,
              }
            },
            datosLaborales: {
              select: {
                puesto: true,
                area: true,
                fechaIngreso: true,
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      users,
      currentUser: {
        id: currentUser.id,
        tenantId: currentUser.tenantId,
        superuser: currentUser.superuser
      }
    })
  } catch (error) {
    console.error('Get legajos error:', error)
    return NextResponse.json({ error: 'Error al obtener legajos' }, { status: 500 })
  }
}

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

    const { userId, numeroLegajo } = await req.json()

    if (!userId || !numeroLegajo) {
      return NextResponse.json(
        { error: 'Usuario ID y número de legajo son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Verificar que el usuario no tenga ya un legajo
    const existingLegajo = await prisma.legajo.findUnique({
      where: { userId }
    })

    if (existingLegajo) {
      return NextResponse.json(
        { error: 'El usuario ya tiene un legajo asignado' },
        { status: 400 }
      )
    }

    // Crear el legajo
    const legajo = await prisma.legajo.create({
      data: {
        userId,
        numeroLegajo,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json(legajo, { status: 201 })
  } catch (error) {
    console.error('Create legajo error:', error)
    return NextResponse.json({ error: 'Error al crear legajo' }, { status: 500 })
  }
}

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

    const data = await req.json()
    const { legajoId, ...updateData } = data

    if (!legajoId) {
      return NextResponse.json({ error: 'Legajo ID es requerido' }, { status: 400 })
    }

    // Helper function to clean and convert data for Prisma
    const cleanData = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj

      if (Array.isArray(obj)) {
        return obj.map(item => cleanData(item))
      }

      const cleaned: any = {}
      // Fields to exclude (auto-generated by Prisma)
      const excludeFields = ['id', 'legajoId', 'createdAt', 'updatedAt']

      for (const key in obj) {
        // Skip excluded fields
        if (excludeFields.includes(key)) {
          continue
        }

        const value = obj[key]
        // Skip empty strings, undefined, and null values
        if (value === '' || value === undefined || value === null) {
          continue
        }
        if (typeof value === 'object') {
          cleaned[key] = cleanData(value)
        } else {
          // Convert date strings (YYYY-MM-DD) to ISO DateTime for Prisma
          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            // If it looks like a date (YYYY-MM-DD), convert to ISO DateTime
            cleaned[key] = new Date(value + 'T00:00:00.000Z').toISOString()
          } else {
            cleaned[key] = value
          }
        }
      }
      return cleaned
    }

    // Actualizar datos según la sección que se esté editando
    const updateOperations: Record<string, unknown> = {}

    // Datos personales
    if (updateData.datosPersonales) {
      const cleanedPersonales = cleanData(updateData.datosPersonales)
      updateOperations.datosPersonales = {
        upsert: {
          create: cleanedPersonales,
          update: cleanedPersonales,
        }
      }
    }

    // Datos familiares
    if (updateData.datosFamiliares) {
      const cleanedFamiliares = cleanData(updateData.datosFamiliares)
      updateOperations.datosFamiliares = {
        upsert: {
          create: cleanedFamiliares,
          update: cleanedFamiliares,
        }
      }
    }

    // Datos laborales
    if (updateData.datosLaborales) {
      const cleanedLaborales = cleanData(updateData.datosLaborales)
      updateOperations.datosLaborales = {
        upsert: {
          create: cleanedLaborales,
          update: cleanedLaborales,
        }
      }
    }

    // Datos de remuneración
    if (updateData.datosRemuneracion) {
      const cleanedRemuneracion = cleanData(updateData.datosRemuneracion)
      updateOperations.datosRemuneracion = {
        upsert: {
          create: cleanedRemuneracion,
          update: cleanedRemuneracion,
        }
      }
    }

    // Datos administrativos
    if (updateData.datosAdministrativos) {
      const cleanedAdministrativos = cleanData(updateData.datosAdministrativos)
      updateOperations.datosAdministrativos = {
        upsert: {
          create: cleanedAdministrativos,
          update: cleanedAdministrativos,
        }
      }
    }

    // Actualizar el legajo
    const legajo = await prisma.legajo.update({
      where: { id: legajoId },
      data: updateOperations,
      include: {
        user: true,
        datosPersonales: true,
        datosFamiliares: true,
        datosLaborales: true,
        datosRemuneracion: true,
        datosAdministrativos: true,
        contactosEmergencia: true,
        formacion: true,
        capacitaciones: true,
        documentos: true,
        horarios: true,
      }
    })

    return NextResponse.json(legajo)
  } catch (error) {
    console.error('Update legajo error:', error)
    return NextResponse.json({ error: 'Error al actualizar legajo' }, { status: 500 })
  }
}

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

    const { legajoId } = await req.json()

    if (!legajoId) {
      return NextResponse.json({ error: 'Legajo ID es requerido' }, { status: 400 })
    }

    await prisma.legajo.delete({
      where: { id: legajoId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete legajo error:', error)
    return NextResponse.json({ error: 'Error al eliminar legajo' }, { status: 500 })
  }
}
