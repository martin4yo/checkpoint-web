import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth'

const prisma = new PrismaClient()

// GET: Obtener configuración de campos obligatorios de legajos
export async function GET(request: NextRequest) {
  try {
    // Try Bearer token first (mobile API), then cookie (web admin)
    let token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      token = request.cookies.get('token')?.value
    }

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get tenantId from query params (for superusers) or use user's tenantId
    const { searchParams } = new URL(request.url)
    const queryTenantId = searchParams.get('tenantId')

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, tenantId: true, superuser: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Si es superuser y proporciona tenantId, usar ese; sino usar el del usuario
    const targetTenantId = (user.superuser && queryTenantId) ? queryTenantId : user.tenantId

    // Buscar configuración existente
    const config = await prisma.legajoFieldConfig.findUnique({
      where: { tenantId: targetTenantId }
    })

    // Si no existe, devolver configuración por defecto
    if (!config) {
      const defaultConfig = {
        datosPersonales: {
          dni: false,
          cuil: false,
          emailPersonal: false,
          emailCorporativo: false,
          telefono: false,
          telefonoAlternativo: false,
          fechaNacimiento: false,
          lugarNacimiento: false,
          nacionalidad: false,
          sexo: false,
          estadoCivil: false,
          domicilio: false,
          localidad: false,
          provincia: false,
          codigoPostal: false
        },
        datosFamiliares: {
          hijosACargo: false,
          grupoFamiliarACargo: false
        },
        contactosEmergencia: {
          required: false // Si tiene al menos un contacto
        },
        datosLaborales: {
          puesto: false,
          area: false,
          sector: false,
          supervisor: false,
          fechaIngreso: false,
          fechaEgreso: false,
          motivoEgreso: false,
          tipoContrato: false,
          jornada: false,
          modalidad: false,
          ubicacion: false
        },
        datosRemuneracion: {
          salarioBasico: false,
          tipoLiquidacion: false,
          banco: false,
          cbu: false,
          obraSocial: false,
          arl: false,
          adicionales: false,
          beneficios: false
        },
        formacion: {
          required: false // Si tiene al menos una formación
        },
        capacitaciones: {
          required: false // Si tiene al menos una capacitación
        },
        documentos: {
          required: false // Si tiene al menos un documento
        },
        datosAdministrativos: {
          legajoFisico: false,
          observaciones: false
        }
      }

      return NextResponse.json({
        id: null,
        tenantId: targetTenantId,
        requiredFields: defaultConfig,
        createdAt: null,
        updatedAt: null
      })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching legajo config:', error)
    return NextResponse.json(
      { error: 'Error fetching legajo configuration' },
      { status: 500 }
    )
  }
}

// POST/PUT: Guardar configuración de campos obligatorios
export async function POST(request: NextRequest) {
  try {
    // Try Bearer token first (mobile API), then cookie (web admin)
    let token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      token = request.cookies.get('token')?.value
    }

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, tenantId: true, superuser: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { requiredFields, tenantId } = body

    // Validar que el usuario pueda modificar ese tenant
    const targetTenantId = (user.superuser && tenantId) ? tenantId : user.tenantId

    // Upsert (crear o actualizar) la configuración
    const config = await prisma.legajoFieldConfig.upsert({
      where: { tenantId: targetTenantId },
      create: {
        tenantId: targetTenantId,
        requiredFields: requiredFields
      },
      update: {
        requiredFields: requiredFields
      }
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error saving legajo config:', error)
    return NextResponse.json(
      { error: 'Error saving legajo configuration' },
      { status: 500 }
    )
  }
}
