# MÓDULO DE SUELDOS - INTEGRACIÓN CON CHECKPOINTS

## Descripción
Este documento describe cómo el módulo de sueldos se integra con el sistema de fichadas (checkpoints) existente para calcular automáticamente horas trabajadas, extras, ausencias y presentismo.

---

## 1. Arquitectura de Integración

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    INTEGRACIÓN CHECKPOINTS - SUELDOS                         │
└─────────────────────────────────────────────────────────────────────────────┘

  CHECKPOINTS (existente)              SUELDOS (nuevo)
  ─────────────────────                ────────────────

  ┌─────────────────┐                  ┌─────────────────┐
  │   Checkpoint    │                  │  Resumen        │
  │   (fichaje)     │────────────────▶ │  Fichadas       │
  └─────────────────┘                  └────────┬────────┘
                                                │
  ┌─────────────────┐                          │
  │ BiometricClock  │──────────────────────────┤
  │ (entrada/salida)│                          │
  └─────────────────┘                          │
                                               ▼
                                       ┌─────────────────┐
                                       │  Motor de       │
                                       │  Cálculo Horas  │
                                       └────────┬────────┘
                                                │
                       ┌────────────────────────┼────────────────────────┐
                       │                        │                        │
                       ▼                        ▼                        ▼
              ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
              │ Horas Normales  │      │ Horas Extras    │      │ Ausencias/      │
              │                 │      │ (50% y 100%)    │      │ Llegadas Tarde  │
              └────────┬────────┘      └────────┬────────┘      └────────┬────────┘
                       │                        │                        │
                       └────────────────────────┼────────────────────────┘
                                                │
                                                ▼
                                       ┌─────────────────┐
                                       │  Conceptos de   │
                                       │  Liquidación    │
                                       └─────────────────┘
```

---

## 2. Modelos de Datos Existentes

### 2.1 Checkpoint (Fichaje de ubicación)

```typescript
// Modelo existente en Prisma
model Checkpoint {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  placeId         String?
  place           Place?   @relation(fields: [placeId], references: [id])
  tenantId        String

  timestamp       DateTime @default(now())
  latitude        Float
  longitude       Float

  // Para jornadas completas
  type            CheckpointType @default(MANUAL)
  endTimestamp    DateTime?
  endLatitude     Float?
  endLongitude    Float?
}

enum CheckpointType {
  MANUAL
  JOURNEY_START
  JOURNEY_END
}
```

### 2.2 BiometricClock (Fichaje biométrico)

```typescript
// Modelo existente
model BiometricClock {
  id              String   @id @default(cuid())
  biometricDataId String
  biometricData   BiometricData @relation(fields: [biometricDataId], references: [id])
  placeId         String
  place           Place    @relation(fields: [placeId], references: [id])
  tenantId        String

  timestamp       DateTime @default(now())
  type            ClockType
  method          BiometricMethod
  confidence      Float
}

enum ClockType {
  CLOCK_IN
  CLOCK_OUT
}

enum BiometricMethod {
  FACE
  FINGERPRINT
  PIN
  QR
}
```

---

## 3. Nuevo Modelo: Resumen de Fichadas

```typescript
// Modelo para almacenar resumen procesado

model ResumenFichadas {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id])

  // Período
  fecha           DateTime @db.Date
  periodoId       String?
  periodo         PeriodoLiquidacion? @relation(fields: [periodoId], references: [id])

  // Horario esperado (del empleado)
  horaEntradaEsperada   DateTime?
  horaSalidaEsperada    DateTime?
  horasEsperadas        Decimal? @db.Decimal(4, 2)

  // Fichajes reales
  horaEntradaReal       DateTime?
  horaSalidaReal        DateTime?

  // Horas calculadas
  horasNormales         Decimal @db.Decimal(5, 2) @default(0)
  horasExtras50         Decimal @db.Decimal(5, 2) @default(0)
  horasExtras100        Decimal @db.Decimal(5, 2) @default(0)
  horasNocturnas        Decimal @db.Decimal(5, 2) @default(0)
  horasFeriado          Decimal @db.Decimal(5, 2) @default(0)

  // Incidencias
  minutosLlegadaTarde   Int @default(0)
  minutosSalidaTemprana Int @default(0)
  esAusencia            Boolean @default(false)
  tipoAusencia          TipoAusencia?

  // Estado
  estado                EstadoResumenFichada @default(PENDIENTE)
  observaciones         String?

  // Fuente de datos
  checkpointIds         String[]  // IDs de checkpoints usados
  biometricClockIds     String[]  // IDs de fichajes biométricos usados

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([userId, fecha])
  @@index([tenantId, fecha])
  @@index([periodoId])
}

enum TipoAusencia {
  INJUSTIFICADA
  LICENCIA
  VACACIONES
  FERIADO
  ENFERMEDAD
  OTRO
}

enum EstadoResumenFichada {
  PENDIENTE       // Sin procesar
  PROCESADO       // Calculado automáticamente
  AJUSTADO        // Modificado manualmente
  APROBADO        // Aprobado por supervisor
  ERROR           // Error en procesamiento
}
```

---

## 4. Servicio de Procesamiento de Fichadas

### 4.1 Procesador Principal

```typescript
class FichadasService {

  /**
   * Procesa todas las fichadas de un período para un empleado
   */
  async procesarFichadasEmpleado(
    userId: string,
    periodoId: string
  ): Promise<ResumenFichadasPeriodo> {
    const periodo = await this.getPeriodo(periodoId);
    const empleado = await this.getEmpleado(userId);
    const horario = await this.getHorarioEmpleado(userId);

    const resumen: ResumenFichadasPeriodo = {
      userId,
      periodoId,
      diasTrabajados: 0,
      horasNormales: 0,
      horasExtras50: 0,
      horasExtras100: 0,
      horasNocturnas: 0,
      horasFeriado: 0,
      ausencias: 0,
      llegadasTarde: 0,
      minutosLlegadaTarde: 0,
      detalleDiario: []
    };

    // Iterar cada día del período
    const dias = eachDayOfInterval({
      start: periodo.fechaDesde,
      end: periodo.fechaHasta
    });

    for (const dia of dias) {
      const resumenDia = await this.procesarDia(
        userId,
        dia,
        horario,
        empleado.tenantId
      );

      resumen.detalleDiario.push(resumenDia);

      // Acumular totales
      if (!resumenDia.esAusencia) {
        resumen.diasTrabajados++;
        resumen.horasNormales += resumenDia.horasNormales;
        resumen.horasExtras50 += resumenDia.horasExtras50;
        resumen.horasExtras100 += resumenDia.horasExtras100;
        resumen.horasNocturnas += resumenDia.horasNocturnas;
        resumen.horasFeriado += resumenDia.horasFeriado;
      } else {
        resumen.ausencias++;
      }

      if (resumenDia.minutosLlegadaTarde > 0) {
        resumen.llegadasTarde++;
        resumen.minutosLlegadaTarde += resumenDia.minutosLlegadaTarde;
      }
    }

    return resumen;
  }

  /**
   * Procesa un día específico
   */
  private async procesarDia(
    userId: string,
    fecha: Date,
    horario: HorarioEmpleado,
    tenantId: string
  ): Promise<ResumenFichadas> {
    // Obtener fichajes del día
    const fichajes = await this.obtenerFichajesDia(userId, fecha, tenantId);

    // Determinar si es día laborable
    const esLaborable = await this.esDialLaborable(fecha, horario, tenantId);

    if (!esLaborable.laborable) {
      return this.crearResumenNoLaborable(userId, fecha, esLaborable.motivo);
    }

    // Si no hay fichajes, es ausencia
    if (fichajes.length === 0) {
      return this.crearResumenAusencia(userId, fecha);
    }

    // Procesar fichajes
    const { entrada, salida } = this.determinarEntradaSalida(fichajes);

    // Calcular horas
    return this.calcularHoras(
      userId,
      fecha,
      entrada,
      salida,
      horario,
      tenantId
    );
  }

  /**
   * Obtiene todos los fichajes de un día (checkpoints + biométricos)
   */
  private async obtenerFichajesDia(
    userId: string,
    fecha: Date,
    tenantId: string
  ): Promise<Fichaje[]> {
    const inicioDia = startOfDay(fecha);
    const finDia = endOfDay(fecha);

    // Checkpoints
    const checkpoints = await prisma.checkpoint.findMany({
      where: {
        userId,
        tenantId,
        timestamp: { gte: inicioDia, lte: finDia }
      },
      orderBy: { timestamp: 'asc' }
    });

    // Fichajes biométricos
    const biometricos = await prisma.biometricClock.findMany({
      where: {
        biometricData: { userId },
        tenantId,
        timestamp: { gte: inicioDia, lte: finDia }
      },
      orderBy: { timestamp: 'asc' }
    });

    // Combinar y ordenar
    return this.combinarFichajes(checkpoints, biometricos);
  }

  /**
   * Determina entrada y salida del día
   */
  private determinarEntradaSalida(
    fichajes: Fichaje[]
  ): { entrada: Date | null; salida: Date | null } {
    if (fichajes.length === 0) {
      return { entrada: null, salida: null };
    }

    // Buscar fichajes explícitos de entrada/salida
    const entradaExplicita = fichajes.find(
      f => f.tipo === 'CLOCK_IN' || f.tipo === 'JOURNEY_START'
    );
    const salidaExplicita = fichajes.find(
      f => f.tipo === 'CLOCK_OUT' || f.tipo === 'JOURNEY_END'
    );

    // Si hay fichajes explícitos, usarlos
    if (entradaExplicita && salidaExplicita) {
      return {
        entrada: entradaExplicita.timestamp,
        salida: salidaExplicita.timestamp
      };
    }

    // Si no, usar primero y último fichaje
    return {
      entrada: fichajes[0].timestamp,
      salida: fichajes[fichajes.length - 1].timestamp
    };
  }

  /**
   * Calcula horas trabajadas, extras, nocturnas, etc.
   */
  private async calcularHoras(
    userId: string,
    fecha: Date,
    entrada: Date | null,
    salida: Date | null,
    horario: HorarioEmpleado,
    tenantId: string
  ): Promise<ResumenFichadas> {
    const resumen: ResumenFichadas = {
      userId,
      tenantId,
      fecha,
      horaEntradaEsperada: horario.horaEntrada,
      horaSalidaEsperada: horario.horaSalida,
      horasEsperadas: horario.horasDiarias,
      horaEntradaReal: entrada,
      horaSalidaReal: salida,
      horasNormales: 0,
      horasExtras50: 0,
      horasExtras100: 0,
      horasNocturnas: 0,
      horasFeriado: 0,
      minutosLlegadaTarde: 0,
      minutosSalidaTemprana: 0,
      esAusencia: false,
      estado: EstadoResumenFichada.PROCESADO
    };

    if (!entrada || !salida) {
      resumen.esAusencia = true;
      resumen.tipoAusencia = TipoAusencia.INJUSTIFICADA;
      resumen.estado = EstadoResumenFichada.ERROR;
      resumen.observaciones = 'Fichaje incompleto';
      return resumen;
    }

    // Calcular llegada tarde
    const horaEntradaEsperada = this.combinarFechaHora(fecha, horario.horaEntrada);
    if (entrada > horaEntradaEsperada) {
      resumen.minutosLlegadaTarde = differenceInMinutes(entrada, horaEntradaEsperada);
    }

    // Calcular salida temprana
    const horaSalidaEsperada = this.combinarFechaHora(fecha, horario.horaSalida);
    if (salida < horaSalidaEsperada) {
      resumen.minutosSalidaTemprana = differenceInMinutes(horaSalidaEsperada, salida);
    }

    // Total horas trabajadas
    const horasTotales = differenceInMinutes(salida, entrada) / 60;

    // Determinar tipo de día (normal, sábado, domingo, feriado)
    const tipoDia = await this.determinarTipoDia(fecha, tenantId);

    // Distribuir horas según tipo de día
    if (tipoDia === 'FERIADO') {
      resumen.horasFeriado = horasTotales;
    } else if (tipoDia === 'DOMINGO' || (tipoDia === 'SABADO' && entrada.getHours() >= 13)) {
      // Después de las 13hs del sábado o domingo = 100%
      resumen.horasExtras100 = horasTotales;
    } else {
      // Día normal
      const horasJornada = horario.horasDiarias;

      if (horasTotales <= horasJornada) {
        resumen.horasNormales = horasTotales;
      } else {
        resumen.horasNormales = horasJornada;
        resumen.horasExtras50 = horasTotales - horasJornada;
      }
    }

    // Calcular horas nocturnas (21:00 a 06:00)
    resumen.horasNocturnas = this.calcularHorasNocturnas(entrada, salida);

    return resumen;
  }

  /**
   * Calcula horas en horario nocturno
   */
  private calcularHorasNocturnas(entrada: Date, salida: Date): number {
    const HORA_INICIO_NOCTURNO = 21;
    const HORA_FIN_NOCTURNO = 6;

    let horasNocturnas = 0;
    let hora = new Date(entrada);

    while (hora < salida) {
      const horaDelDia = hora.getHours();

      if (horaDelDia >= HORA_INICIO_NOCTURNO || horaDelDia < HORA_FIN_NOCTURNO) {
        horasNocturnas += 1 / 60;  // Sumamos por minuto
      }

      hora = addMinutes(hora, 1);
    }

    return Math.round(horasNocturnas * 100) / 100;
  }
}
```

---

## 5. Configuración de Horarios

### 5.1 Modelo de Horario

```typescript
// Modelo existente (LegajoHorarioTrabajo) + extensiones

interface HorarioEmpleado {
  // Jornada estándar
  horaEntrada: string;       // "08:00"
  horaSalida: string;        // "17:00"
  horasDiarias: number;      // 8

  // Días laborables
  diasLaborables: DiaSemana[];  // ['LUN', 'MAR', 'MIE', 'JUE', 'VIE']

  // Tolerancias
  toleranciaEntradaMinutos: number;  // 10 minutos de gracia
  toleranciaSalidaMinutos: number;

  // Horarios rotativos
  esRotativo: boolean;
  turnoActual?: string;

  // Excepciones
  excepcionesHorario?: ExcepcionHorario[];
}

interface ExcepcionHorario {
  fechaDesde: Date;
  fechaHasta: Date;
  nuevoHorario: {
    horaEntrada: string;
    horaSalida: string;
  };
  motivo: string;
}
```

### 5.2 Configuración de Tolerancias

```typescript
interface ConfiguracionTolerancia {
  // Llegada tarde
  toleranciaLlegadaMinutos: number;    // Minutos de gracia
  descuentoPorMinutoTarde: boolean;     // Descontar cada minuto
  descuentoBloqueLlegadaTarde: number;  // O descontar en bloques (15 min)

  // Presentismo
  presentismoAfectadoPor: {
    llegadasTarde: boolean;
    llegadasTardeMaximas: number;       // Cuántas antes de perder
    minutosMaximosTotales: number;      // Minutos totales de tolerancia
    ausencias: boolean;
    ausenciasMaximas: number;
  };

  // Horas extras
  horasExtrasAutomaticas: boolean;      // Calcular automáticamente
  requiereAprobacionHorasExtras: boolean;
  maximoHorasExtrasDiarias: number;     // Límite legal: 3
  maximoHorasExtrasMensuales: number;   // Límite legal: 30
}
```

---

## 6. Importación a Liquidación

### 6.1 Proceso de Importación

```typescript
async function importarFichadasALiquidacion(
  periodoId: string
): Promise<ResultadoImportacion> {
  const periodo = await prisma.periodoLiquidacion.findUnique({
    where: { id: periodoId },
    include: { tenant: true }
  });

  // Obtener empleados del período
  const empleados = await prisma.user.findMany({
    where: {
      tenantId: periodo.tenantId,
      isActive: true
    }
  });

  const resultados: ResultadoEmpleado[] = [];

  for (const empleado of empleados) {
    // Procesar fichadas
    const resumen = await fichadasService.procesarFichadasEmpleado(
      empleado.id,
      periodoId
    );

    // Crear o actualizar liquidación
    let liquidacion = await prisma.liquidacion.findFirst({
      where: { periodoId, userId: empleado.id }
    });

    if (!liquidacion) {
      liquidacion = await prisma.liquidacion.create({
        data: {
          periodoId,
          userId: empleado.id,
          estado: 'BORRADOR'
        }
      });
    }

    // Agregar conceptos de horas
    await agregarConceptosHoras(liquidacion.id, resumen);

    resultados.push({
      empleadoId: empleado.id,
      empleadoNombre: `${empleado.lastName}, ${empleado.firstName}`,
      horasNormales: resumen.horasNormales,
      horasExtras50: resumen.horasExtras50,
      horasExtras100: resumen.horasExtras100,
      diasTrabajados: resumen.diasTrabajados,
      ausencias: resumen.ausencias,
      llegadasTarde: resumen.llegadasTarde,
      errores: resumen.errores
    });
  }

  return {
    periodoId,
    empleadosProcesados: resultados.length,
    empleadosConErrores: resultados.filter(r => r.errores?.length > 0).length,
    detalle: resultados
  };
}

async function agregarConceptosHoras(
  liquidacionId: string,
  resumen: ResumenFichadasPeriodo
): Promise<void> {
  const conceptos = [
    {
      codigo: 'DIAS_TRABAJADOS',
      cantidad: resumen.diasTrabajados,
      unidad: 'DIAS'
    },
    {
      codigo: 'HORAS_NORMALES',
      cantidad: resumen.horasNormales,
      unidad: 'HS'
    },
    {
      codigo: 'HS_EXTRA_50',
      cantidad: resumen.horasExtras50,
      unidad: 'HS'
    },
    {
      codigo: 'HS_EXTRA_100',
      cantidad: resumen.horasExtras100,
      unidad: 'HS'
    },
    {
      codigo: 'HS_NOCTURNAS',
      cantidad: resumen.horasNocturnas,
      unidad: 'HS'
    },
    {
      codigo: 'AUSENCIAS',
      cantidad: resumen.ausencias,
      unidad: 'DIAS'
    },
    {
      codigo: 'LLEGADAS_TARDE',
      cantidad: resumen.llegadasTarde,
      unidad: 'CANT'
    }
  ];

  for (const concepto of conceptos) {
    if (concepto.cantidad > 0) {
      await prisma.liquidacionConcepto.upsert({
        where: {
          liquidacionId_conceptoCodigo: {
            liquidacionId,
            conceptoCodigo: concepto.codigo
          }
        },
        update: { cantidad: concepto.cantidad },
        create: {
          liquidacionId,
          conceptoId: await obtenerConceptoId(concepto.codigo),
          cantidad: concepto.cantidad,
          unidad: concepto.unidad,
          monto: 0  // Se calculará después
        }
      });
    }
  }
}
```

---

## 7. Interfaz de Usuario

### 7.1 Panel de Control de Fichadas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CONTROL DE FICHADAS - Noviembre 2024                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  RESUMEN DEL PERÍODO                                                         │
│  ───────────────────                                                        │
│                                                                             │
│  Total empleados: 52          Días hábiles: 21                              │
│                                                                             │
│  ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐│
│  │ ✓ 48                 │ │ ⚠️ 3                 │ │ ❌ 1                 ││
│  │   Sin incidencias    │ │   Con alertas        │ │   Con errores        ││
│  └──────────────────────┘ └──────────────────────┘ └──────────────────────┘│
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  EMPLEADOS CON ALERTAS                                                       │
│                                                                             │
│  │ Empleado           │ Alerta                    │ Acción               │ │
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │ García, Juan       │ 35 hs extras (límite 30)  │ [Revisar]            ││
│  │ López, María       │ 5 llegadas tarde          │ [Revisar]            ││
│  │ Pérez, Carlos      │ 2 días sin fichaje        │ [Cargar novedad]     ││
│  │ Rodríguez, Ana     │ Fichaje incompleto 15/11  │ [Corregir]           ││
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ACCIONES                                                                    │
│                                                                             │
│  [📥 Importar a liquidación]  [📋 Ver detalle]  [📊 Reporte]               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Detalle por Empleado

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ FICHADAS: García, Juan - Noviembre 2024                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  RESUMEN                                                                     │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐│
│  │ Días trab: 21  │ │ Hs norm: 168   │ │ Hs ext 50%: 25 │ │ Hs ext 100%: 10││
│  └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘│
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  DETALLE DIARIO                                                              │
│                                                                             │
│  │ Fecha      │ Entrada │ Salida  │ Hs Norm │ Hs Ex │ Nocturno │ Estado   ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │ 01/11 Vie  │ 08:02   │ 17:15   │ 8.00    │ 0.25  │ -        │ ✓        ││
│  │ 02/11 Sáb  │ -       │ -       │ -       │ -     │ -        │ No lab.  ││
│  │ 03/11 Dom  │ -       │ -       │ -       │ -     │ -        │ No lab.  ││
│  │ 04/11 Lun  │ 08:00   │ 17:00   │ 8.00    │ -     │ -        │ ✓        ││
│  │ 05/11 Mar  │ 08:15   │ 17:00   │ 7.75    │ -     │ -        │ ⚠️ +15min ││
│  │ 06/11 Mié  │ 08:00   │ 19:30   │ 8.00    │ 2.50  │ -        │ ✓        ││
│  │ ...        │         │         │         │       │          │          ││
│  │ 15/11 Vie  │ 08:00   │ -       │ -       │ -     │ -        │ ❌ Incomp.││
│  │ ...        │         │         │         │       │          │          ││
│  │ 20/11 Mié  │ 20:00   │ 04:00   │ 8.00    │ -     │ 7.00     │ ✓ Noct.  ││
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ACCIONES PARA DÍA SELECCIONADO (15/11)                                     │
│                                                                             │
│  [✏️ Corregir fichaje]  [📝 Agregar novedad]  [❌ Marcar ausencia]          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Corrección de Fichaje

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CORREGIR FICHAJE                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Empleado: García, Juan                                                     │
│  Fecha: 15/11/2024                                                          │
│                                                                             │
│  Fichajes registrados:                                                      │
│  • 08:00 - Entrada (Biométrico - Rostro)                                   │
│  • (Sin salida registrada)                                                  │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Corrección:                                                                │
│                                                                             │
│  Hora de salida: [17:00     ]                                              │
│                                                                             │
│  Motivo de corrección:                                                      │
│  ( ) Olvidó fichar salida                                                  │
│  ( ) Falla en dispositivo                                                  │
│  (●) Otro: [Salió por emergencia, fichó supervisor          ]              │
│                                                                             │
│  Autorizado por: [Supervisor - María López ▼]                              │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ⚠️ Esta corrección quedará registrada en auditoría                        │
│                                                                             │
│  [Guardar corrección]  [Cancelar]                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Variables Generadas para Fórmulas

```typescript
// Variables que el motor de fichadas genera para las fórmulas de liquidación

const VARIABLES_FICHADAS = {
  // Días
  DIAS_MES: 'Días del mes',
  DIAS_HABILES: 'Días hábiles del mes',
  DIAS_TRABAJADOS: 'Días efectivamente trabajados',
  DIAS_AUSENCIA: 'Días de ausencia',
  DIAS_LICENCIA: 'Días de licencia con goce',
  DIAS_VACACIONES: 'Días de vacaciones gozados',

  // Horas
  HORAS_TRABAJADAS: 'Total horas normales trabajadas',
  HORAS_EXTRAS_50: 'Horas extras al 50%',
  HORAS_EXTRAS_100: 'Horas extras al 100%',
  HORAS_NOCTURNAS: 'Horas en horario nocturno',
  HORAS_FERIADO: 'Horas trabajadas en feriados',

  // Puntualidad
  LLEGADAS_TARDE: 'Cantidad de llegadas tarde',
  MINUTOS_TARDE: 'Total minutos de llegada tarde',
  SALIDAS_TEMPRANA: 'Cantidad de salidas antes de hora',

  // Calculados
  PORCENTAJE_ASISTENCIA: 'Días trabajados / días hábiles',
  TIENE_PRESENTISMO: 'Boolean: sin ausencias ni llegadas tarde'
};
```

---

## 9. Integración con Novedades

```typescript
// Las novedades (licencias, vacaciones, etc.) afectan el cálculo

interface NovedadFichadas {
  tipo: TipoNovedad;
  fechaDesde: Date;
  fechaHasta: Date;
  afectaPresentismo: boolean;
  afectaHorasTrabajadas: boolean;
  esConGoce: boolean;
}

async function aplicarNovedadesAFichadas(
  userId: string,
  periodoId: string,
  resumenFichadas: ResumenFichadasPeriodo
): Promise<ResumenFichadasPeriodo> {
  // Obtener novedades aprobadas del período
  const novedades = await prisma.novelty.findMany({
    where: {
      userId,
      status: 'APPROVED',
      OR: [
        { date: { gte: periodo.fechaDesde, lte: periodo.fechaHasta } },
        { startDate: { lte: periodo.fechaHasta }, endDate: { gte: periodo.fechaDesde } }
      ]
    },
    include: { noveltyType: true }
  });

  for (const novedad of novedades) {
    const diasNovedad = obtenerDiasNovedad(novedad, periodo);

    for (const dia of diasNovedad) {
      const resumenDia = resumenFichadas.detalleDiario.find(
        d => isSameDay(d.fecha, dia)
      );

      if (resumenDia) {
        // Marcar como licencia/vacaciones en lugar de ausencia
        resumenDia.esAusencia = true;
        resumenDia.tipoAusencia = mapearTipoNovedad(novedad.noveltyType.code);
        resumenDia.observaciones = novedad.notes;

        // Si es con goce, no afecta presentismo (según config)
        if (novedad.noveltyType.conGoce) {
          resumenFichadas.ausencias--;  // No cuenta como ausencia
        }
      }
    }
  }

  return resumenFichadas;
}
```

---

## 10. Auditoría y Trazabilidad

```typescript
interface AuditoriaFichadas {
  id: string;
  userId: string;
  fecha: Date;

  accion: 'IMPORTAR' | 'CORREGIR' | 'APROBAR' | 'RECHAZAR';

  valoresAnteriores?: {
    horaEntrada?: Date;
    horaSalida?: Date;
    horasNormales?: number;
  };

  valoresNuevos: {
    horaEntrada?: Date;
    horaSalida?: Date;
    horasNormales?: number;
  };

  motivo?: string;
  realizadoPor: string;
  aprobadoPor?: string;
  timestamp: Date;
}

// Todas las correcciones quedan registradas
async function registrarCorreccionFichaje(
  resumenId: string,
  correccion: CorreccionFichaje,
  usuarioId: string
): Promise<void> {
  const resumenAnterior = await prisma.resumenFichadas.findUnique({
    where: { id: resumenId }
  });

  await prisma.$transaction([
    // Actualizar resumen
    prisma.resumenFichadas.update({
      where: { id: resumenId },
      data: {
        ...correccion,
        estado: EstadoResumenFichada.AJUSTADO
      }
    }),

    // Registrar auditoría
    prisma.auditoriaFichadas.create({
      data: {
        resumenId,
        userId: resumenAnterior.userId,
        fecha: resumenAnterior.fecha,
        accion: 'CORREGIR',
        valoresAnteriores: {
          horaEntrada: resumenAnterior.horaEntradaReal,
          horaSalida: resumenAnterior.horaSalidaReal
        },
        valoresNuevos: {
          horaEntrada: correccion.horaEntrada,
          horaSalida: correccion.horaSalida
        },
        motivo: correccion.motivo,
        realizadoPor: usuarioId,
        timestamp: new Date()
      }
    })
  ]);
}
```

---

*Documento creado: 28/11/2024*
*Última actualización: 28/11/2024*
