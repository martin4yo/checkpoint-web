# MÓDULO DE SUELDOS - MODELO DE DATOS

## Descripción
Este documento define el modelo de datos completo para el módulo de liquidación de sueldos, incluyendo todas las entidades Prisma necesarias.

---

## 1. Diagrama de Entidades

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MODELO DE DATOS                                     │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │      Tenant      │
                    └────────┬─────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐  ┌──────────────┐   ┌────────────────────┐
│   ConvenioCCT   │  │    User      │   │  ValorLegalVersion │
└────────┬────────┘  └──────┬───────┘   └────────────────────┘
         │                  │
         ▼                  │
┌─────────────────┐         │
│  CategoriaCCT   │◄────────┤
└─────────────────┘         │
                            │
┌─────────────────┐         │
│ConceptoLiquidac.│◄────────┤
└────────┬────────┘         │
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌──────────────────┐
│     Formula     │  │ PeriodoLiquidac. │
└─────────────────┘  └────────┬─────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │   Liquidacion    │
                     └────────┬─────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
     ┌────────────────┐ ┌───────────┐ ┌──────────────┐
     │LiquidacionConc.│ │LiquidAudit│ │LiquidSnapshot│
     └────────────────┘ └───────────┘ └──────────────┘
```

---

## 2. Entidades de Configuración

### 2.1 Convenio Colectivo de Trabajo (CCT)

```prisma
// Convenio Colectivo de Trabajo
model ConvenioCCT {
  id              String   @id @default(cuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id])

  codigo          String   // Ej: "507/07", "130/75"
  nombre          String   // Ej: "Vigiladores Seguridad Privada"
  sindicato       String?  // Ej: "UPSRA", "FAECYS"

  vigenciaDesde   DateTime
  vigenciaHasta   DateTime?

  isActive        Boolean  @default(true)

  // Configuración específica del CCT
  configJson      Json?    // Adicionales específicos, reglas, etc.

  // Relaciones
  categorias      CategoriaCCT[]
  conceptos       ConceptoCCT[]
  empleados       DatosLaboralesCCT[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([tenantId, codigo])
  @@index([tenantId])
}

// Categorías del CCT
model CategoriaCCT {
  id              String   @id @default(cuid())
  cctId           String
  cct             ConvenioCCT @relation(fields: [cctId], references: [id], onDelete: Cascade)

  codigo          String   // Ej: "VIG_GRAL", "VIG_BOMB"
  nombre          String   // Ej: "Vigilador General", "Vigilador Bombero"
  nivel           Int      // Orden jerárquico
  descripcion     String?

  // Relaciones
  escalas         EscalaSalarialCCT[]
  empleados       DatosLaboralesCCT[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([cctId, codigo])
  @@index([cctId])
}

// Escala salarial por categoría (versionada)
model EscalaSalarialCCT {
  id              String   @id @default(cuid())
  categoriaId     String
  categoria       CategoriaCCT @relation(fields: [categoriaId], references: [id], onDelete: Cascade)

  salarioBasico   Decimal  @db.Decimal(12, 2)

  vigenciaDesde   DateTime
  vigenciaHasta   DateTime?

  // Adicionales fijos del convenio
  adicionales     Json?    // { "presentismo": 8.33, "viaticos": 5000, ... }

  createdAt       DateTime @default(now())

  @@index([categoriaId, vigenciaDesde])
}

// Conceptos específicos del CCT
model ConceptoCCT {
  id              String   @id @default(cuid())
  cctId           String
  cct             ConvenioCCT @relation(fields: [cctId], references: [id], onDelete: Cascade)

  codigo          String   // Ej: "VIATICOS_507", "NOCTURNIDAD"
  nombre          String
  tipo            TipoConcepto

  // Si tiene fórmula específica del CCT
  formulaId       String?
  formula         Formula? @relation(fields: [formulaId], references: [id])

  // Configuración de aplicación
  aplicaAportes   Boolean  @default(true)
  aplicaGanancias Boolean  @default(true)
  aplicaSAC       Boolean  @default(true)
  aplicaVacaciones Boolean @default(true)

  orden           Int      @default(0)
  isActive        Boolean  @default(true)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([cctId, codigo])
  @@index([cctId])
}
```

### 2.2 Conceptos de Liquidación (Generales del Tenant)

```prisma
enum TipoConcepto {
  REMUNERATIVO           // Sujeto a aportes, incluye en SAC/Vacaciones
  NO_REMUNERATIVO        // No sujeto a aportes
  DESCUENTO              // Se resta del bruto
  APORTE_EMPLEADO        // Aportes obligatorios
  CONTRIBUCION_PATRONAL  // Contribuciones del empleador
}

enum OrigenConcepto {
  SISTEMA     // Conceptos del sistema (no editables)
  CCT         // Del convenio colectivo
  TENANT      // Creados por el tenant
  EMPLEADO    // Específicos de un empleado
}

// Conceptos de liquidación
model ConceptoLiquidacion {
  id              String   @id @default(cuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id])

  codigo          String   // Ej: "BASICO", "ANTIGUEDAD", "HS_EXTRA_50"
  nombre          String   // Ej: "Sueldo Básico", "Adicional por Antigüedad"
  nombreCorto     String?  // Para el recibo: "Ant.", "Hs.Ex.50%"

  tipo            TipoConcepto
  origen          OrigenConcepto @default(TENANT)

  // Fórmula de cálculo (opcional, puede ser valor fijo)
  formulaId       String?
  formula         Formula? @relation(fields: [formulaId], references: [id])

  // Configuración de aplicación
  aplicaAportes   Boolean  @default(true)
  aplicaGanancias Boolean  @default(true)
  aplicaSAC       Boolean  @default(true)
  aplicaVacaciones Boolean @default(true)

  // Para conceptos de aportes/contribuciones
  codigoAFIP      String?  // Código para F.931

  orden           Int      @default(0)
  isActive        Boolean  @default(true)

  // Relaciones
  lineasLiquidacion LiquidacionConcepto[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([tenantId, codigo])
  @@index([tenantId])
}
```

### 2.3 Motor de Fórmulas

```prisma
enum TipoResultadoFormula {
  MONTO       // Resultado en pesos
  PORCENTAJE  // Resultado como porcentaje
  CANTIDAD    // Resultado numérico (horas, días, etc.)
  BOOLEANO    // Verdadero/Falso
}

// Fórmulas de cálculo
model Formula {
  id              String   @id @default(cuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id])

  nombre          String
  descripcion     String?

  // La expresión de la fórmula
  expresion       String   @db.Text
  // Versión en lenguaje natural (generada por IA)
  descripcionNL   String?  @db.Text

  // Tipo de resultado esperado
  tipoResultado   TipoResultadoFormula @default(MONTO)

  // Variables que usa esta fórmula
  variablesUsadas Json     // ["BASICO", "ANTIGUEDAD_AÑOS", ...]

  // Condiciones de aplicación (opcional)
  condiciones     Json?    // [{ "variable": "CATEGORIA", "operador": "=", "valor": "ADMIN" }]

  // Metadata de IA
  creadaPorIA     Boolean  @default(false)
  promptOriginal  String?  @db.Text

  isActive        Boolean  @default(true)

  // Relaciones
  conceptos       ConceptoLiquidacion[]
  conceptosCCT    ConceptoCCT[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([tenantId])
}

// Variables disponibles para fórmulas
model VariableFormula {
  id              String   @id @default(cuid())

  codigo          String   @unique  // Ej: "BASICO", "ANTIGUEDAD_AÑOS"
  nombre          String            // Ej: "Sueldo Básico", "Años de Antigüedad"
  descripcion     String?

  tipo            String   // "NUMBER", "STRING", "DATE", "BOOLEAN"
  origen          String   // "EMPLEADO", "LIQUIDACION", "FICHADAS", "SISTEMA"

  // Cómo obtener el valor
  campoFuente     String?  // Campo del modelo fuente
  calculoCustom   String?  // Función de cálculo si es calculada

  isActive        Boolean  @default(true)
}
```

### 2.4 Valores Legales Versionados

```prisma
// Tipos de valores legales
model TipoValorLegal {
  id              String   @id @default(cuid())

  codigo          String   @unique  // Ej: "TOPE_SIPA_MAX", "MNI_SOLTERO"
  nombre          String
  descripcion     String?
  categoria       String   // "SIPA", "GANANCIAS", "APORTES", "CONTRIBUCIONES"

  valores         ValorLegalVersion[]
}

// Versiones de valores legales
model ValorLegalVersion {
  id              String   @id @default(cuid())
  tipoId          String
  tipo            TipoValorLegal @relation(fields: [tipoId], references: [id])

  valor           Decimal  @db.Decimal(14, 4)

  vigenciaDesde   DateTime
  vigenciaHasta   DateTime?

  // Referencia normativa
  normaReferencia String?  // Ej: "RG AFIP 5531/2024"

  createdAt       DateTime @default(now())
  createdBy       String?

  @@index([tipoId, vigenciaDesde])
}
```

---

## 3. Entidades de Empleados (Extensión)

```prisma
// Datos laborales específicos para liquidación
model DatosLaboralesCCT {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // CCT y Categoría
  cctId           String?
  cct             ConvenioCCT? @relation(fields: [cctId], references: [id])
  categoriaId     String?
  categoria       CategoriaCCT? @relation(fields: [categoriaId], references: [id])

  // Fechas clave
  fechaIngreso    DateTime
  fechaEgreso     DateTime?
  fechaAntiguedad DateTime?  // Si es diferente a ingreso

  // Tipo de contrato
  tipoContrato    TipoContrato @default(TIEMPO_INDETERMINADO)

  // Jornada
  tipoJornada     TipoJornada @default(COMPLETA)
  horasSemanales  Decimal?  @db.Decimal(4, 2)

  // Sindicato
  afiliadoSindicato Boolean @default(false)
  cuotaSindical    Decimal? @db.Decimal(5, 2)  // Porcentaje

  // Datos bancarios (extensión del modelo existente)
  banco           String?
  cbu             String?
  tipoCuenta      String?  // "CA", "CC"

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum TipoContrato {
  TIEMPO_INDETERMINADO
  PLAZO_FIJO
  TEMPORADA
  EVENTUAL
  PASANTIA
}

enum TipoJornada {
  COMPLETA
  PARCIAL
  REDUCIDA
}

// Datos de Impuesto a las Ganancias por empleado
model DatosGananciasEmpleado {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  periodoFiscal   Int      // Año fiscal: 2024, 2025

  // Cargas de familia
  conyuge         Boolean  @default(false)
  cantidadHijos   Int      @default(0)

  // Deducciones especiales (del F.572/SIRADIG)
  deducciones     Json?    // Array de deducciones con tipo, monto, etc.

  // Totales calculados para el período
  deduccionesAcumuladas Decimal? @db.Decimal(14, 2)
  retencionesAcumuladas Decimal? @db.Decimal(14, 2)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([userId, periodoFiscal])
  @@index([userId])
}
```

---

## 4. Entidades de Liquidación

```prisma
enum EstadoPeriodo {
  ABIERTO        // Se pueden hacer cambios
  EN_CALCULO     // Procesando liquidaciones
  EN_REVISION    // Pendiente de revisión
  APROBADO       // Aprobado, pendiente de cierre
  CERRADO        // Cerrado definitivamente
  ANULADO        // Período anulado
}

enum TipoPeriodo {
  MENSUAL
  QUINCENAL_1    // Primera quincena
  QUINCENAL_2    // Segunda quincena
  SEMANAL
  SAC_1          // Aguinaldo primera cuota
  SAC_2          // Aguinaldo segunda cuota
  VACACIONES
  FINAL          // Liquidación final
  CUSTOM
}

// Período de liquidación
model PeriodoLiquidacion {
  id              String   @id @default(cuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id])

  tipo            TipoPeriodo @default(MENSUAL)
  nombre          String   // Ej: "Noviembre 2024", "1ra Quincena Nov 2024"

  fechaDesde      DateTime
  fechaHasta      DateTime
  fechaPago       DateTime?

  estado          EstadoPeriodo @default(ABIERTO)

  // Workflow
  workflowActual  Int      @default(0)  // Paso actual del workflow

  // Relaciones
  liquidaciones   Liquidacion[]
  aprobaciones    AprobacionPeriodo[]

  // Snapshot de configuración al cerrar
  snapshotConfig  Json?

  cerradoAt       DateTime?
  cerradoPor      String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([tenantId, fechaDesde])
}

// Aprobaciones del período
model AprobacionPeriodo {
  id              String   @id @default(cuid())
  periodoId       String
  periodo         PeriodoLiquidacion @relation(fields: [periodoId], references: [id], onDelete: Cascade)

  paso            Int
  nombrePaso      String   // Ej: "Revisión RRHH", "Aprobación Gerencia"

  estado          EstadoAprobacion @default(PENDIENTE)

  aprobadoPor     String?
  aprobador       User?    @relation(fields: [aprobadoPor], references: [id])
  aprobadoAt      DateTime?

  comentarios     String?

  createdAt       DateTime @default(now())
}

enum EstadoAprobacion {
  PENDIENTE
  APROBADO
  RECHAZADO
  OMITIDO
}

// Liquidación individual
model Liquidacion {
  id              String   @id @default(cuid())
  periodoId       String
  periodo         PeriodoLiquidacion @relation(fields: [periodoId], references: [id], onDelete: Cascade)

  userId          String
  user            User     @relation(fields: [userId], references: [id])

  version         Int      @default(1)  // Para historial

  // Totales
  totalRemunerativo     Decimal @db.Decimal(14, 2) @default(0)
  totalNoRemunerativo   Decimal @db.Decimal(14, 2) @default(0)
  totalDescuentos       Decimal @db.Decimal(14, 2) @default(0)
  totalAportesEmpleado  Decimal @db.Decimal(14, 2) @default(0)
  netoAPagar            Decimal @db.Decimal(14, 2) @default(0)

  // Contribuciones (para información, no afecta neto)
  totalContribuciones   Decimal @db.Decimal(14, 2) @default(0)

  // Datos de ganancias
  baseImponibleGanancias  Decimal? @db.Decimal(14, 2)
  deduccionesGanancias    Decimal? @db.Decimal(14, 2)
  retencionGanancias      Decimal? @db.Decimal(14, 2)

  // Estado
  estado          EstadoLiquidacion @default(BORRADOR)

  // Recibo
  reciboGenerado  Boolean  @default(false)
  reciboUrl       String?

  // Relaciones
  conceptos       LiquidacionConcepto[]
  auditLog        LiquidacionAudit[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([periodoId, userId, version])
  @@index([periodoId])
  @@index([userId])
}

enum EstadoLiquidacion {
  BORRADOR
  CALCULADO
  REVISADO
  APROBADO
  CERRADO
  ERROR
}

// Líneas de la liquidación (cada concepto)
model LiquidacionConcepto {
  id              String   @id @default(cuid())
  liquidacionId   String
  liquidacion     Liquidacion @relation(fields: [liquidacionId], references: [id], onDelete: Cascade)

  conceptoId      String
  concepto        ConceptoLiquidacion @relation(fields: [conceptoId], references: [id])

  // Valores de cálculo
  cantidad        Decimal? @db.Decimal(10, 4)  // Ej: horas, días
  base            Decimal? @db.Decimal(14, 2)  // Base de cálculo
  porcentaje      Decimal? @db.Decimal(8, 4)   // Si aplica porcentaje

  // Resultado
  monto           Decimal  @db.Decimal(14, 2)

  // Para auditoría
  formulaUsada    String?  @db.Text
  variablesUsadas Json?

  orden           Int      @default(0)

  createdAt       DateTime @default(now())

  @@index([liquidacionId])
}
```

---

## 5. Entidades de Auditoría

```prisma
enum TipoAccionAudit {
  CREAR
  MODIFICAR
  CALCULAR
  APROBAR
  RECHAZAR
  CERRAR
  REABRIR
}

// Log de auditoría de liquidaciones
model LiquidacionAudit {
  id              String   @id @default(cuid())
  liquidacionId   String
  liquidacion     Liquidacion @relation(fields: [liquidacionId], references: [id], onDelete: Cascade)

  accion          TipoAccionAudit
  descripcion     String

  // Qué cambió
  cambios         Json?    // { campo: { antes, despues } }

  // Quién y cuándo
  usuarioId       String
  usuario         User     @relation(fields: [usuarioId], references: [id])
  timestamp       DateTime @default(now())

  // IP y contexto
  ip              String?
  userAgent       String?

  @@index([liquidacionId])
  @@index([timestamp])
}

// Snapshots de configuración (al cerrar período)
model SnapshotConfiguracion {
  id              String   @id @default(cuid())
  periodoId       String   @unique
  periodo         PeriodoLiquidacion @relation(fields: [periodoId], references: [id])

  // Copia de toda la configuración vigente
  conceptos       Json     // Todos los conceptos activos
  formulas        Json     // Todas las fórmulas
  valoresLegales  Json     // Valores vigentes a la fecha
  ccts            Json     // CCTs y categorías

  createdAt       DateTime @default(now())
}
```

---

## 6. Entidades de Workflow

```prisma
// Configuración de workflow por tenant
model WorkflowConfig {
  id              String   @id @default(cuid())
  tenantId        String   @unique
  tenant          Tenant   @relation(fields: [tenantId], references: [id])

  nombre          String
  descripcion     String?

  pasos           WorkflowPaso[]

  isActive        Boolean  @default(true)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// Pasos del workflow
model WorkflowPaso {
  id              String   @id @default(cuid())
  workflowId      String
  workflow        WorkflowConfig @relation(fields: [workflowId], references: [id], onDelete: Cascade)

  orden           Int
  nombre          String   // Ej: "Revisión RRHH"
  descripcion     String?

  // Quién puede aprobar este paso
  rolRequerido    String?  // Ej: "LIQUIDADOR", "SUPERVISOR", "GERENTE"
  usuariosIds     Json?    // IDs específicos de usuarios

  // Configuración
  requiereComentario Boolean @default(false)
  puedeOmitirse      Boolean @default(false)

  createdAt       DateTime @default(now())

  @@unique([workflowId, orden])
}
```

---

## 7. CCT Piloto: Vigiladores (507/07)

### Configuración inicial del CCT

```typescript
// Seed data para CCT 507/07 - Vigiladores
const cctVigiladores = {
  codigo: "507/07",
  nombre: "Vigiladores Seguridad Privada",
  sindicato: "UPSRA",

  categorias: [
    { codigo: "VIG_GRAL", nombre: "Vigilador General", nivel: 1 },
    { codigo: "VIG_BOMB", nombre: "Vigilador Bombero", nivel: 2 },
    { codigo: "VIG_PRINC", nombre: "Vigilador Principal", nivel: 3 },
    { codigo: "VERIF_EV", nombre: "Verificador de Eventos", nivel: 2 },
    { codigo: "OP_MONIT", nombre: "Operador de Monitoreo", nivel: 2 },
    { codigo: "CTRL_ADM", nombre: "Controlador Admisión", nivel: 1 },
    { codigo: "ADMIN", nombre: "Administrativo", nivel: 1 },
    { codigo: "GUIA_TEC", nombre: "Guía Técnico", nivel: 1 },
  ],

  conceptosEspecificos: [
    {
      codigo: "PRESENTISMO_507",
      nombre: "Presentismo",
      tipo: "REMUNERATIVO",
      formula: "SI(AUSENCIAS = 0, BASICO * 0.0833, 0)",
      aplicaAportes: true,
      aplicaSAC: true
    },
    {
      codigo: "VIATICOS_507",
      nombre: "Viáticos",
      tipo: "NO_REMUNERATIVO",
      formula: "DIAS_TRABAJADOS * VALOR_VIATICO_DIARIO",
      aplicaAportes: false,
      aplicaSAC: false
    },
    {
      codigo: "ANTIGUEDAD_507",
      nombre: "Adicional Antigüedad",
      tipo: "REMUNERATIVO",
      formula: "BASICO * ANTIGUEDAD_AÑOS * 0.01",
      aplicaAportes: true,
      aplicaSAC: true
    },
    {
      codigo: "NOCTURNIDAD_507",
      nombre: "Adicional Nocturno",
      tipo: "REMUNERATIVO",
      formula: "HORAS_NOCTURNAS * ((BASICO + REMUNERATIVO) * 0.001)",
      aplicaAportes: true,
      aplicaSAC: true
    },
    {
      codigo: "VEHICULO_507",
      nombre: "Reintegro Vehículo Propio",
      tipo: "NO_REMUNERATIVO",
      formula: "SI(USA_VEHICULO_PROPIO, VALOR_REINTEGRO_VEHICULO, 0)",
      aplicaAportes: false,
      aplicaSAC: false
    }
  ]
}
```

---

## 8. Índices Recomendados

```sql
-- Índices para performance en volumen alto

-- Liquidaciones por período y estado
CREATE INDEX idx_liquidacion_periodo_estado ON "Liquidacion" ("periodoId", "estado");

-- Búsqueda de liquidaciones por empleado
CREATE INDEX idx_liquidacion_user_fecha ON "Liquidacion" ("userId", "createdAt" DESC);

-- Conceptos de liquidación
CREATE INDEX idx_liquidacion_concepto ON "LiquidacionConcepto" ("liquidacionId", "orden");

-- Valores legales vigentes
CREATE INDEX idx_valor_legal_vigencia ON "ValorLegalVersion" ("tipoId", "vigenciaDesde" DESC);

-- Auditoría
CREATE INDEX idx_audit_fecha ON "LiquidacionAudit" ("timestamp" DESC);

-- Escalas salariales vigentes
CREATE INDEX idx_escala_vigencia ON "EscalaSalarialCCT" ("categoriaId", "vigenciaDesde" DESC);
```

---

## 9. Notas de Migración

### Relación con modelos existentes

El modelo `User` existente ya tiene:
- Datos personales básicos
- Relación con `Tenant`
- Relación con `LegajoDatosRemuneracion`

Se recomienda:
1. Extender `User` con relación a `DatosLaboralesCCT`
2. Extender `User` con relación a `DatosGananciasEmpleado`
3. Mantener `LegajoDatosRemuneracion` para datos de recibo (banco, CBU)
4. Agregar relaciones a `Tenant` para nuevos modelos

---

*Documento creado: 28/11/2024*
*Última actualización: 28/11/2024*
