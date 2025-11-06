import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

interface SelectedFields {
  datosPersonales?: string[]
  datosFamiliares?: string[]
  datosLaborales?: string[]
  datosRemuneracion?: string[]
  datosAdministrativos?: string[]
  formacion?: boolean
  capacitaciones?: boolean
  documentos?: boolean
}

// GET - Obtener datos de legajo filtrados según un perfil de exportación
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const profileId = searchParams.get('profileId')
    const userIds = searchParams.get('userIds')?.split(',') // Lista de IDs de usuarios

    if (!profileId) {
      return NextResponse.json({ error: 'profileId es requerido' }, { status: 400 })
    }

    // Obtener el perfil de exportación
    const profile = await prisma.legajoExportProfile.findUnique({
      where: { id: profileId }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
    }

    const selectedFields = profile.selectedFields as SelectedFields

    // Construir el include dinámicamente según los campos seleccionados
    const include: Record<string, unknown> = {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }

    if (selectedFields.datosPersonales && selectedFields.datosPersonales.length > 0) {
      include.datosPersonales = true
    }

    if (selectedFields.datosFamiliares && selectedFields.datosFamiliares.length > 0) {
      include.datosFamiliares = true
    }

    if (selectedFields.datosLaborales && selectedFields.datosLaborales.length > 0) {
      include.datosLaborales = true
    }

    if (selectedFields.datosRemuneracion && selectedFields.datosRemuneracion.length > 0) {
      include.datosRemuneracion = true
    }

    if (selectedFields.datosAdministrativos && selectedFields.datosAdministrativos.length > 0) {
      include.datosAdministrativos = true
    }

    if (selectedFields.formacion) {
      include.formacion = true
    }

    if (selectedFields.capacitaciones) {
      include.capacitaciones = true
    }

    if (selectedFields.documentos) {
      include.documentos = true
    }

    // Construir where clause
    const where: Record<string, unknown> = {
      user: {
        tenantId: profile.tenantId
      }
    }

    if (userIds && userIds.length > 0) {
      where.userId = { in: userIds }
    }

    // Obtener legajos con las relaciones necesarias
    const legajos = await prisma.legajo.findMany({
      where,
      include
    })

    // Filtrar campos específicos según el perfil
    const filteredData = legajos.map(legajo => {
      const result: Record<string, unknown> = {
        numeroLegajo: legajo.numeroLegajo,
        usuario: `${legajo.user.firstName} ${legajo.user.lastName}`,
        email: legajo.user.email
      }

      // Filtrar datos personales
      if (legajo.datosPersonales && selectedFields.datosPersonales) {
        const datosPersonales: Record<string, unknown> = {}
        selectedFields.datosPersonales.forEach(field => {
          if (field in legajo.datosPersonales!) {
            datosPersonales[field] = (legajo.datosPersonales as Record<string, unknown>)[field]
          }
        })
        result.datosPersonales = datosPersonales
      }

      // Filtrar datos familiares
      if (legajo.datosFamiliares && selectedFields.datosFamiliares) {
        const datosFamiliares: Record<string, unknown> = {}
        selectedFields.datosFamiliares.forEach(field => {
          if (field in legajo.datosFamiliares!) {
            datosFamiliares[field] = (legajo.datosFamiliares as Record<string, unknown>)[field]
          }
        })
        result.datosFamiliares = datosFamiliares
      }

      // Filtrar datos laborales
      if (legajo.datosLaborales && selectedFields.datosLaborales) {
        const datosLaborales: Record<string, unknown> = {}
        selectedFields.datosLaborales.forEach(field => {
          if (field in legajo.datosLaborales!) {
            datosLaborales[field] = (legajo.datosLaborales as Record<string, unknown>)[field]
          }
        })
        result.datosLaborales = datosLaborales
      }

      // Filtrar datos remuneración
      if (legajo.datosRemuneracion && selectedFields.datosRemuneracion) {
        const datosRemuneracion: Record<string, unknown> = {}
        selectedFields.datosRemuneracion.forEach(field => {
          if (field in legajo.datosRemuneracion!) {
            datosRemuneracion[field] = (legajo.datosRemuneracion as Record<string, unknown>)[field]
          }
        })
        result.datosRemuneracion = datosRemuneracion
      }

      // Filtrar datos administrativos
      if (legajo.datosAdministrativos && selectedFields.datosAdministrativos) {
        const datosAdministrativos: Record<string, unknown> = {}
        selectedFields.datosAdministrativos.forEach(field => {
          if (field in legajo.datosAdministrativos!) {
            datosAdministrativos[field] = (legajo.datosAdministrativos as Record<string, unknown>)[field]
          }
        })
        result.datosAdministrativos = datosAdministrativos
      }

      // Incluir formación si está seleccionada
      if (selectedFields.formacion && legajo.formacion) {
        result.formacion = legajo.formacion
      }

      // Incluir capacitaciones si está seleccionada
      if (selectedFields.capacitaciones && legajo.capacitaciones) {
        result.capacitaciones = legajo.capacitaciones
      }

      // Incluir documentos si está seleccionada
      if (selectedFields.documentos && legajo.documentos) {
        result.documentos = legajo.documentos
      }

      return result
    })

    return NextResponse.json({
      profile: {
        id: profile.id,
        name: profile.name,
        description: profile.description
      },
      data: filteredData
    })
  } catch (error) {
    console.error('Error fetching export data:', error)
    return NextResponse.json(
      { error: 'Error al obtener datos de exportación' },
      { status: 500 }
    )
  }
}
