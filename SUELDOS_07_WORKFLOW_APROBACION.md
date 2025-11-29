# MÓDULO DE SUELDOS - WORKFLOW DE APROBACIÓN

## Descripción
Este documento describe el sistema de workflow configurable para la aprobación de liquidaciones de sueldos, incluyendo estados, roles, pasos y configuración por tenant.

---

## 1. Visión General del Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUJO DE APROBACIÓN                                  │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
    │ ABIERTO  │────▶│EN CÁLCULO│────▶│EN REVISIÓN────▶│ APROBADO │
    └──────────┘     └──────────┘     └──────────┘     └──────────┘
         │                                  │                │
         │                                  │                │
         │           ┌──────────┐           │                │
         │           │ RECHAZADO│◀──────────┘                │
         │           └──────────┘                            │
         │                │                                  │
         │                ▼                                  ▼
         │           (vuelve a                          ┌──────────┐
         │            ABIERTO)                          │ CERRADO  │
         │                                              └──────────┘
         │
         ▼
    ┌──────────┐
    │ ANULADO  │
    └──────────┘
```

---

## 2. Estados del Período de Liquidación

### 2.1 Definición de Estados

```typescript
enum EstadoPeriodo {
  ABIERTO = 'ABIERTO',           // Se pueden hacer cambios
  EN_CALCULO = 'EN_CALCULO',     // Procesando liquidaciones
  EN_REVISION = 'EN_REVISION',   // Pendiente de revisión/aprobación
  APROBADO = 'APROBADO',         // Aprobado, pendiente de cierre
  CERRADO = 'CERRADO',           // Cerrado definitivamente
  ANULADO = 'ANULADO'            // Período anulado
}

interface TransicionEstado {
  desde: EstadoPeriodo;
  hacia: EstadoPeriodo;
  accion: string;
  requierePermiso: string;
  validaciones: string[];
}

const TRANSICIONES_VALIDAS: TransicionEstado[] = [
  {
    desde: EstadoPeriodo.ABIERTO,
    hacia: EstadoPeriodo.EN_CALCULO,
    accion: 'CALCULAR',
    requierePermiso: 'liquidacion:calcular',
    validaciones: ['hayEmpleados', 'hayConceptos']
  },
  {
    desde: EstadoPeriodo.EN_CALCULO,
    hacia: EstadoPeriodo.EN_REVISION,
    accion: 'ENVIAR_REVISION',
    requierePermiso: 'liquidacion:enviar',
    validaciones: ['todasLiquidacionesCalculadas', 'sinErroresCriticos']
  },
  {
    desde: EstadoPeriodo.EN_REVISION,
    hacia: EstadoPeriodo.APROBADO,
    accion: 'APROBAR',
    requierePermiso: 'liquidacion:aprobar',
    validaciones: ['todosLosAprobadores']
  },
  {
    desde: EstadoPeriodo.EN_REVISION,
    hacia: EstadoPeriodo.ABIERTO,
    accion: 'RECHAZAR',
    requierePermiso: 'liquidacion:rechazar',
    validaciones: []
  },
  {
    desde: EstadoPeriodo.APROBADO,
    hacia: EstadoPeriodo.CERRADO,
    accion: 'CERRAR',
    requierePermiso: 'liquidacion:cerrar',
    validaciones: ['recibosGenerados', 'reportesGenerados']
  },
  {
    desde: EstadoPeriodo.ABIERTO,
    hacia: EstadoPeriodo.ANULADO,
    accion: 'ANULAR',
    requierePermiso: 'liquidacion:anular',
    validaciones: []
  }
];
```

### 2.2 Validaciones por Estado

```typescript
interface ValidacionEstado {
  estado: EstadoPeriodo;
  puedeEditar: boolean;
  puedeAgregar: boolean;
  puedeEliminar: boolean;
  puedeRecalcular: boolean;
  descripcion: string;
}

const VALIDACIONES_ESTADO: ValidacionEstado[] = [
  {
    estado: EstadoPeriodo.ABIERTO,
    puedeEditar: true,
    puedeAgregar: true,
    puedeEliminar: true,
    puedeRecalcular: true,
    descripcion: 'Período abierto para modificaciones'
  },
  {
    estado: EstadoPeriodo.EN_CALCULO,
    puedeEditar: false,
    puedeAgregar: false,
    puedeEliminar: false,
    puedeRecalcular: false,
    descripcion: 'Procesando liquidaciones, espere...'
  },
  {
    estado: EstadoPeriodo.EN_REVISION,
    puedeEditar: false,
    puedeAgregar: false,
    puedeEliminar: false,
    puedeRecalcular: false,
    descripcion: 'Pendiente de aprobación'
  },
  {
    estado: EstadoPeriodo.APROBADO,
    puedeEditar: false,
    puedeAgregar: false,
    puedeEliminar: false,
    puedeRecalcular: false,
    descripcion: 'Aprobado, listo para cerrar'
  },
  {
    estado: EstadoPeriodo.CERRADO,
    puedeEditar: false,
    puedeAgregar: false,
    puedeEliminar: false,
    puedeRecalcular: false,
    descripcion: 'Período cerrado definitivamente'
  }
];
```

---

## 3. Configuración de Workflow por Tenant

### 3.1 Modelo de Datos

```typescript
interface WorkflowConfig {
  id: string;
  tenantId: string;
  nombre: string;
  descripcion?: string;
  pasos: WorkflowPaso[];
  isActive: boolean;
}

interface WorkflowPaso {
  id: string;
  workflowId: string;
  orden: number;
  nombre: string;
  descripcion?: string;

  // Quién puede aprobar
  tipoAprobador: TipoAprobador;
  rolRequerido?: string;
  usuariosIds?: string[];

  // Configuración
  requiereComentario: boolean;
  puedeOmitirse: boolean;
  tiempoLimiteHoras?: number;

  // Notificaciones
  notificarEmail: boolean;
  notificarPush: boolean;
}

enum TipoAprobador {
  ROL = 'ROL',               // Cualquier usuario con el rol
  USUARIOS = 'USUARIOS',     // Usuarios específicos
  JERARQUIA = 'JERARQUIA',   // Superior jerárquico
  TODOS = 'TODOS'            // Todos los del grupo deben aprobar
}
```

### 3.2 Ejemplos de Configuración

```typescript
// Ejemplo 1: Workflow simple (2 pasos)
const workflowSimple: WorkflowConfig = {
  id: 'wf-simple',
  tenantId: 'tenant-1',
  nombre: 'Aprobación Simple',
  descripcion: 'Liquidador prepara, Gerente aprueba',
  pasos: [
    {
      orden: 1,
      nombre: 'Revisión Liquidador',
      tipoAprobador: TipoAprobador.ROL,
      rolRequerido: 'LIQUIDADOR',
      requiereComentario: false,
      puedeOmitirse: false,
      notificarEmail: true
    },
    {
      orden: 2,
      nombre: 'Aprobación Gerencia',
      tipoAprobador: TipoAprobador.ROL,
      rolRequerido: 'GERENTE',
      requiereComentario: true,
      puedeOmitirse: false,
      notificarEmail: true
    }
  ],
  isActive: true
};

// Ejemplo 2: Workflow completo (4 pasos)
const workflowCompleto: WorkflowConfig = {
  id: 'wf-completo',
  tenantId: 'tenant-2',
  nombre: 'Aprobación Completa',
  descripcion: 'RRHH → Contabilidad → Finanzas → Gerencia',
  pasos: [
    {
      orden: 1,
      nombre: 'Preparación RRHH',
      tipoAprobador: TipoAprobador.ROL,
      rolRequerido: 'RRHH',
      requiereComentario: false,
      puedeOmitirse: false
    },
    {
      orden: 2,
      nombre: 'Revisión Contabilidad',
      tipoAprobador: TipoAprobador.ROL,
      rolRequerido: 'CONTADOR',
      requiereComentario: false,
      puedeOmitirse: true,
      tiempoLimiteHoras: 48
    },
    {
      orden: 3,
      nombre: 'Aprobación Finanzas',
      tipoAprobador: TipoAprobador.USUARIOS,
      usuariosIds: ['user-cfo', 'user-tesorero'],
      requiereComentario: true,
      puedeOmitirse: false
    },
    {
      orden: 4,
      nombre: 'Aprobación Final',
      tipoAprobador: TipoAprobador.ROL,
      rolRequerido: 'GERENTE_GENERAL',
      requiereComentario: true,
      puedeOmitirse: false
    }
  ],
  isActive: true
};

// Ejemplo 3: Sin workflow (solo cierre)
const sinWorkflow: WorkflowConfig = {
  id: 'wf-sin',
  tenantId: 'tenant-3',
  nombre: 'Sin Aprobación',
  descripcion: 'Cierre directo sin pasos de aprobación',
  pasos: [],  // Sin pasos = transición directa
  isActive: true
};
```

---

## 4. Roles y Permisos

### 4.1 Roles Predefinidos

```typescript
interface RolSueldos {
  codigo: string;
  nombre: string;
  permisos: string[];
}

const ROLES_SUELDOS: RolSueldos[] = [
  {
    codigo: 'LIQUIDADOR',
    nombre: 'Liquidador',
    permisos: [
      'liquidacion:ver',
      'liquidacion:calcular',
      'liquidacion:modificar',
      'liquidacion:enviar',
      'novedades:cargar',
      'recibos:generar'
    ]
  },
  {
    codigo: 'REVISOR',
    nombre: 'Revisor',
    permisos: [
      'liquidacion:ver',
      'liquidacion:comentar',
      'liquidacion:aprobar_paso',
      'liquidacion:rechazar_paso'
    ]
  },
  {
    codigo: 'APROBADOR',
    nombre: 'Aprobador',
    permisos: [
      'liquidacion:ver',
      'liquidacion:aprobar',
      'liquidacion:rechazar',
      'liquidacion:cerrar'
    ]
  },
  {
    codigo: 'ADMIN_SUELDOS',
    nombre: 'Administrador de Sueldos',
    permisos: [
      'liquidacion:*',
      'conceptos:*',
      'formulas:*',
      'workflow:*',
      'reportes:*'
    ]
  }
];
```

### 4.2 Verificación de Permisos

```typescript
async function verificarPermiso(
  userId: string,
  permiso: string,
  tenantId: string
): Promise<boolean> {
  const usuario = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: true }
  });

  if (!usuario || usuario.tenantId !== tenantId) {
    return false;
  }

  // Superuser tiene todos los permisos
  if (usuario.superuser) {
    return true;
  }

  // Verificar permisos del rol
  for (const rol of usuario.roles) {
    const permisos = ROLES_SUELDOS.find(r => r.codigo === rol.codigo)?.permisos || [];

    if (permisos.includes(permiso) || permisos.includes(`${permiso.split(':')[0]}:*`)) {
      return true;
    }
  }

  return false;
}
```

---

## 5. Proceso de Aprobación

### 5.1 Enviar a Revisión

```typescript
async function enviarARevision(
  periodoId: string,
  userId: string
): Promise<ResultadoOperacion> {
  const periodo = await prisma.periodoLiquidacion.findUnique({
    where: { id: periodoId },
    include: { tenant: { include: { workflowConfig: true } } }
  });

  // Validar estado actual
  if (periodo.estado !== EstadoPeriodo.ABIERTO) {
    throw new Error('El período no está en estado ABIERTO');
  }

  // Validar que todas las liquidaciones estén calculadas
  const liquidacionesPendientes = await prisma.liquidacion.count({
    where: { periodoId, estado: { not: 'CALCULADO' } }
  });

  if (liquidacionesPendientes > 0) {
    throw new Error(`Hay ${liquidacionesPendientes} liquidaciones sin calcular`);
  }

  // Obtener workflow
  const workflow = periodo.tenant.workflowConfig;

  if (!workflow || workflow.pasos.length === 0) {
    // Sin workflow, pasar directo a APROBADO
    await prisma.periodoLiquidacion.update({
      where: { id: periodoId },
      data: { estado: EstadoPeriodo.APROBADO }
    });
  } else {
    // Con workflow, crear aprobaciones pendientes
    await prisma.$transaction([
      prisma.periodoLiquidacion.update({
        where: { id: periodoId },
        data: {
          estado: EstadoPeriodo.EN_REVISION,
          workflowActual: 1
        }
      }),
      ...workflow.pasos.map(paso =>
        prisma.aprobacionPeriodo.create({
          data: {
            periodoId,
            paso: paso.orden,
            nombrePaso: paso.nombre,
            estado: paso.orden === 1 ? 'PENDIENTE' : 'ESPERANDO'
          }
        })
      )
    ]);

    // Notificar al primer aprobador
    await notificarAprobador(periodoId, 1);
  }

  // Registrar auditoría
  await registrarAuditoria(periodoId, userId, 'ENVIAR_REVISION');

  return { success: true, mensaje: 'Período enviado a revisión' };
}
```

### 5.2 Aprobar Paso

```typescript
async function aprobarPaso(
  periodoId: string,
  pasoActual: number,
  userId: string,
  comentarios?: string
): Promise<ResultadoOperacion> {
  const periodo = await prisma.periodoLiquidacion.findUnique({
    where: { id: periodoId },
    include: {
      tenant: { include: { workflowConfig: { include: { pasos: true } } } },
      aprobaciones: true
    }
  });

  // Validar estado
  if (periodo.estado !== EstadoPeriodo.EN_REVISION) {
    throw new Error('El período no está en revisión');
  }

  // Validar que es el paso correcto
  if (periodo.workflowActual !== pasoActual) {
    throw new Error(`No es el paso actual (actual: ${periodo.workflowActual})`);
  }

  // Validar permisos del usuario
  const pasoConfig = periodo.tenant.workflowConfig.pasos.find(p => p.orden === pasoActual);
  const puedeAprobar = await verificarAprobador(userId, pasoConfig);

  if (!puedeAprobar) {
    throw new Error('No tiene permisos para aprobar este paso');
  }

  // Validar comentario si es requerido
  if (pasoConfig.requiereComentario && !comentarios) {
    throw new Error('Este paso requiere comentarios');
  }

  const totalPasos = periodo.tenant.workflowConfig.pasos.length;
  const esUltimoPaso = pasoActual === totalPasos;

  await prisma.$transaction([
    // Aprobar el paso actual
    prisma.aprobacionPeriodo.update({
      where: {
        periodoId_paso: { periodoId, paso: pasoActual }
      },
      data: {
        estado: 'APROBADO',
        aprobadoPor: userId,
        aprobadoAt: new Date(),
        comentarios
      }
    }),

    // Actualizar período
    prisma.periodoLiquidacion.update({
      where: { id: periodoId },
      data: esUltimoPaso
        ? { estado: EstadoPeriodo.APROBADO, workflowActual: 0 }
        : { workflowActual: pasoActual + 1 }
    }),

    // Si no es el último, activar siguiente paso
    ...(esUltimoPaso ? [] : [
      prisma.aprobacionPeriodo.update({
        where: {
          periodoId_paso: { periodoId, paso: pasoActual + 1 }
        },
        data: { estado: 'PENDIENTE' }
      })
    ])
  ]);

  // Notificar
  if (esUltimoPaso) {
    await notificarAprobacionFinal(periodoId);
  } else {
    await notificarAprobador(periodoId, pasoActual + 1);
  }

  // Auditoría
  await registrarAuditoria(periodoId, userId, 'APROBAR_PASO', { paso: pasoActual });

  return {
    success: true,
    mensaje: esUltimoPaso
      ? 'Período aprobado completamente'
      : `Paso ${pasoActual} aprobado, pendiente paso ${pasoActual + 1}`
  };
}
```

### 5.3 Rechazar

```typescript
async function rechazarPeriodo(
  periodoId: string,
  userId: string,
  motivo: string
): Promise<ResultadoOperacion> {
  const periodo = await prisma.periodoLiquidacion.findUnique({
    where: { id: periodoId }
  });

  if (periodo.estado !== EstadoPeriodo.EN_REVISION) {
    throw new Error('El período no está en revisión');
  }

  await prisma.$transaction([
    // Volver a ABIERTO
    prisma.periodoLiquidacion.update({
      where: { id: periodoId },
      data: {
        estado: EstadoPeriodo.ABIERTO,
        workflowActual: 0
      }
    }),

    // Marcar todas las aprobaciones como canceladas
    prisma.aprobacionPeriodo.updateMany({
      where: { periodoId },
      data: { estado: 'CANCELADO' }
    }),

    // Registrar el rechazo
    prisma.rechazosPeriodo.create({
      data: {
        periodoId,
        rechazadoPor: userId,
        motivo,
        rechazadoAt: new Date()
      }
    })
  ]);

  // Notificar al liquidador
  await notificarRechazo(periodoId, motivo);

  // Auditoría
  await registrarAuditoria(periodoId, userId, 'RECHAZAR', { motivo });

  return { success: true, mensaje: 'Período rechazado y reabierto' };
}
```

---

## 6. Interfaz de Usuario

### 6.1 Panel de Estado del Período

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PERÍODO: Noviembre 2024                                    Estado: EN REVISIÓN│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PROGRESO DEL WORKFLOW                                                       │
│  ─────────────────────                                                      │
│                                                                             │
│    ✓ Preparación RRHH              ● Revisión Contabilidad                  │
│    └─ Aprobado por: María López     └─ Pendiente                            │
│       15/11/2024 14:30                 Asignado a: Juan Pérez               │
│                                                                             │
│    ○ Aprobación Finanzas           ○ Aprobación Final                       │
│    └─ Esperando                    └─ Esperando                             │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ACCIONES DISPONIBLES (para Juan Pérez - Contador)                          │
│                                                                             │
│  [✓ Aprobar]  [✗ Rechazar]  [💬 Comentar]  [📋 Ver Detalle]                 │
│                                                                             │
│  Comentario (opcional):                                                     │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Historial de Aprobaciones

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HISTORIAL DE APROBACIONES                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  #  │ Paso                    │ Estado    │ Usuario        │ Fecha          │
│ ─────────────────────────────────────────────────────────────────────────── │
│  1  │ Preparación RRHH        │ ✓ Aprobado│ María López    │ 15/11 14:30    │
│  2  │ Revisión Contabilidad   │ ● Pendiente│ Juan Pérez    │ -              │
│  3  │ Aprobación Finanzas     │ ○ Esperando│ -             │ -              │
│  4  │ Aprobación Final        │ ○ Esperando│ -             │ -              │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  RECHAZOS ANTERIORES                                                         │
│                                                                             │
│  • 10/11/2024 - Rechazado por Pedro García (Finanzas)                       │
│    Motivo: "Faltan horas extras del sector producción"                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Configurador de Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CONFIGURACIÓN DE WORKFLOW                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Nombre: [Aprobación Estándar                            ]                  │
│  Descripción: [RRHH → Contabilidad → Gerencia            ]                  │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  PASOS DEL WORKFLOW                                                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1. Preparación RRHH                                            [≡] │   │
│  │    Aprobador: Rol [LIQUIDADOR ▼]                                   │   │
│  │    ☐ Requiere comentario  ☐ Puede omitirse  ☑ Notificar email     │   │
│  │                                                    [🗑️ Eliminar]   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 2. Revisión Contabilidad                                       [≡] │   │
│  │    Aprobador: Rol [CONTADOR ▼]                                     │   │
│  │    ☐ Requiere comentario  ☑ Puede omitirse  ☑ Notificar email     │   │
│  │    Tiempo límite: [48] horas                                       │   │
│  │                                                    [🗑️ Eliminar]   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 3. Aprobación Gerencia                                         [≡] │   │
│  │    Aprobador: Usuarios [Seleccionar... ▼]                          │   │
│  │    ☑ Requiere comentario  ☐ Puede omitirse  ☑ Notificar email     │   │
│  │                                                    [🗑️ Eliminar]   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [+ Agregar paso]                                                           │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  [Guardar configuración]  [Cancelar]  [Vista previa]                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Notificaciones

### 7.1 Tipos de Notificaciones

```typescript
enum TipoNotificacionWorkflow {
  ENVIO_REVISION = 'ENVIO_REVISION',
  PENDIENTE_APROBACION = 'PENDIENTE_APROBACION',
  PASO_APROBADO = 'PASO_APROBADO',
  PERIODO_APROBADO = 'PERIODO_APROBADO',
  PERIODO_RECHAZADO = 'PERIODO_RECHAZADO',
  RECORDATORIO = 'RECORDATORIO',
  TIEMPO_LIMITE = 'TIEMPO_LIMITE'
}

interface NotificacionWorkflow {
  tipo: TipoNotificacionWorkflow;
  destinatarios: string[];
  asunto: string;
  mensaje: string;
  datos: {
    periodoId: string;
    periodoNombre: string;
    paso?: number;
    pasoNombre?: string;
  };
}
```

### 7.2 Plantillas de Email

```typescript
const PLANTILLAS_EMAIL: Record<TipoNotificacionWorkflow, PlantillaEmail> = {
  [TipoNotificacionWorkflow.PENDIENTE_APROBACION]: {
    asunto: 'Aprobación pendiente: Liquidación {periodoNombre}',
    cuerpo: `
      <h2>Tiene una liquidación pendiente de aprobación</h2>

      <p><strong>Período:</strong> {periodoNombre}</p>
      <p><strong>Paso:</strong> {pasoNombre}</p>
      <p><strong>Acción requerida:</strong> Revisar y aprobar/rechazar</p>

      <p>
        <a href="{urlAprobacion}" style="...">Ir a aprobar</a>
      </p>
    `
  },

  [TipoNotificacionWorkflow.PERIODO_RECHAZADO]: {
    asunto: 'Liquidación rechazada: {periodoNombre}',
    cuerpo: `
      <h2>La liquidación fue rechazada</h2>

      <p><strong>Período:</strong> {periodoNombre}</p>
      <p><strong>Rechazado por:</strong> {rechazadoPor}</p>
      <p><strong>Motivo:</strong> {motivo}</p>

      <p>El período ha sido reabierto para correcciones.</p>

      <p>
        <a href="{urlPeriodo}" style="...">Ir al período</a>
      </p>
    `
  }
  // ... más plantillas
};
```

### 7.3 Recordatorios Automáticos

```typescript
// Cron job para recordatorios

async function enviarRecordatoriosPendientes(): Promise<void> {
  const aprobacionesPendientes = await prisma.aprobacionPeriodo.findMany({
    where: {
      estado: 'PENDIENTE',
      periodo: { estado: 'EN_REVISION' }
    },
    include: {
      periodo: { include: { tenant: { include: { workflowConfig: true } } } }
    }
  });

  for (const aprobacion of aprobacionesPendientes) {
    const pasoConfig = aprobacion.periodo.tenant.workflowConfig.pasos
      .find(p => p.orden === aprobacion.paso);

    // Verificar si pasó el tiempo límite
    if (pasoConfig.tiempoLimiteHoras) {
      const horasTranscurridas = differenceInHours(
        new Date(),
        aprobacion.createdAt
      );

      if (horasTranscurridas > pasoConfig.tiempoLimiteHoras) {
        // Enviar alerta de tiempo excedido
        await notificarTiempoExcedido(aprobacion);
      } else if (horasTranscurridas > pasoConfig.tiempoLimiteHoras * 0.75) {
        // Enviar recordatorio al 75%
        await notificarRecordatorio(aprobacion);
      }
    }
  }
}
```

---

## 8. Auditoría del Workflow

### 8.1 Registro de Acciones

```typescript
interface AuditoriaWorkflow {
  id: string;
  periodoId: string;
  accion: string;
  usuarioId: string;
  paso?: number;
  estadoAnterior: string;
  estadoNuevo: string;
  datos?: Record<string, any>;
  timestamp: Date;
  ip?: string;
}

async function registrarAuditoria(
  periodoId: string,
  usuarioId: string,
  accion: string,
  datos?: Record<string, any>
): Promise<void> {
  const periodo = await prisma.periodoLiquidacion.findUnique({
    where: { id: periodoId }
  });

  await prisma.auditoriaWorkflow.create({
    data: {
      periodoId,
      accion,
      usuarioId,
      estadoAnterior: periodo.estado,
      estadoNuevo: periodo.estado,  // Se actualizará después
      datos,
      timestamp: new Date()
    }
  });
}
```

### 8.2 Reporte de Auditoría

```typescript
interface ReporteAuditoriaWorkflow {
  periodo: string;
  fechaCreacion: Date;
  fechaCierre?: Date;
  duracionTotal?: string;

  pasos: {
    paso: number;
    nombre: string;
    estado: string;
    aprobador?: string;
    fechaAprobacion?: Date;
    duracion?: string;
    comentarios?: string;
  }[];

  rechazos: {
    fecha: Date;
    rechazadoPor: string;
    motivo: string;
  }[];

  acciones: {
    fecha: Date;
    usuario: string;
    accion: string;
    detalles?: string;
  }[];
}
```

---

## 9. Métricas del Workflow

```typescript
interface MetricasWorkflow {
  // Tiempos promedio
  tiempoPromedioAprobacion: number;  // horas
  tiempoPromedioPorPaso: Record<string, number>;

  // Tasas
  tasaAprobacion: number;           // %
  tasaRechazo: number;              // %
  tasaOmision: number;              // %

  // Volumen
  periodosAprobados: number;
  periodosRechazados: number;
  periodosPendientes: number;

  // Bottlenecks
  pasoMasLento: { nombre: string; promedio: number };
  pasoMasRechazos: { nombre: string; cantidad: number };
}

async function calcularMetricasWorkflow(
  tenantId: string,
  fechaDesde: Date,
  fechaHasta: Date
): Promise<MetricasWorkflow> {
  // Consultas agregadas para métricas
  // ...
}
```

---

*Documento creado: 28/11/2024*
*Última actualización: 28/11/2024*
