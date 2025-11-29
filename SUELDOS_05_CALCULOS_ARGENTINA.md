# MÓDULO DE SUELDOS - CÁLCULOS ESPECÍFICOS ARGENTINA

## Descripción
Este documento detalla todos los cálculos específicos de la legislación laboral argentina, incluyendo aportes, contribuciones, SAC, vacaciones, horas extras e Impuesto a las Ganancias.

---

## 1. Estructura del Recibo de Sueldo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RECIBO DE SUELDO                                     │
│                     (Art. 140 - Ley 20.744 LCT)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  HABERES (Conceptos Remunerativos)                                         │
│  ─────────────────────────────────                                         │
│  + Sueldo Básico                                                           │
│  + Adicionales (antigüedad, presentismo, etc.)                             │
│  + Horas Extras                                                             │
│  + Otros remunerativos                                                      │
│  ────────────────────────────────────────                                   │
│  = TOTAL REMUNERATIVO                                                       │
│                                                                             │
│  HABERES (Conceptos No Remunerativos)                                       │
│  ─────────────────────────────────────                                      │
│  + Viáticos                                                                 │
│  + Asignaciones familiares                                                  │
│  + Otros no remunerativos                                                   │
│  ────────────────────────────────────────                                   │
│  = TOTAL NO REMUNERATIVO                                                    │
│                                                                             │
│  ════════════════════════════════════════                                   │
│  = TOTAL BRUTO (Rem + No Rem)                                              │
│                                                                             │
│  DEDUCCIONES                                                                │
│  ───────────                                                                │
│  - Jubilación (11%)                                                         │
│  - Obra Social (3%)                                                         │
│  - PAMI (3%)                                                                │
│  - Sindicato (si aplica)                                                    │
│  - Impuesto a las Ganancias (si aplica)                                    │
│  - Otros descuentos                                                         │
│  ────────────────────────────────────────                                   │
│  = TOTAL DEDUCCIONES                                                        │
│                                                                             │
│  ════════════════════════════════════════                                   │
│  = NETO A PAGAR                                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Aportes del Empleado

### 2.1 Tabla de Aportes

| Concepto | Alícuota | Base de Cálculo | Destino |
|----------|----------|-----------------|---------|
| Jubilación (SIPA) | 11% | Remuneración bruta | ANSES |
| Obra Social | 3% | Remuneración bruta | Obra Social elegida |
| PAMI (INSSJP) | 3% | Remuneración bruta | PAMI |
| **TOTAL** | **17%** | | |

### 2.2 Aportes Sindicales (según CCT)

| CCT | Concepto | Alícuota | Condición |
|-----|----------|----------|-----------|
| 507/07 (Vigiladores) | Cuota Sindical | 2.5% | Afiliados |
| 507/07 (Vigiladores) | Aporte Solidario | 2% | No afiliados |
| 130/75 (Comercio) | Cuota Sindical | 2% | Afiliados |
| 130/75 (Comercio) | Aporte Solidario | 1% | No afiliados |

### 2.3 Implementación

```typescript
interface AportesEmpleado {
  jubilacion: number;      // 11%
  obraSocial: number;      // 3%
  pami: number;            // 3%
  sindicato?: number;      // Según CCT
  ganancias?: number;      // Si aplica
  otros?: number;          // Otros descuentos
}

function calcularAportesEmpleado(
  remuneracionBruta: number,
  empleado: EmpleadoData,
  valoresLegales: ValoresLegales
): AportesEmpleado {
  // Aplicar topes SIPA
  const baseImponible = Math.min(
    Math.max(remuneracionBruta, valoresLegales.TOPE_SIPA_MIN),
    valoresLegales.TOPE_SIPA_MAX
  );

  return {
    jubilacion: baseImponible * 0.11,
    obraSocial: baseImponible * 0.03,
    pami: baseImponible * 0.03,
    sindicato: empleado.afiliadoSindicato
      ? remuneracionBruta * empleado.cuotaSindical
      : remuneracionBruta * (empleado.aporteSolidario || 0)
  };
}
```

---

## 3. Contribuciones Patronales

### 3.1 Tabla de Contribuciones

| Concepto | Alícuota Gral. | Alícuota PyME | Destino |
|----------|----------------|---------------|---------|
| SIPA (Jubilación) | 10.77% | 10.77% | ANSES |
| PAMI (INSSJP) | 1.58% | 1.58% | PAMI |
| Asig. Familiares | 4.70% | 4.70% | ANSES |
| Fondo Nac. Empleo | 0.95% | 0.95% | FNE |
| **Subtotal SUSS** | **18.00%** | **18.00%** | |
| Obra Social | 6.00% | 6.00% | OS |
| ART | Variable | Variable | ART |
| Seguro Vida Obl. | Variable | Variable | Aseguradora |
| **TOTAL APROX.** | **~26%** | **~26%** | |

### 3.2 Contribuciones según Tipo de Empleador

```typescript
enum TipoEmpleador {
  SECTOR_PRIVADO_LUCRO = 'PRIVADO_LUCRO',       // 20.40%
  SECTOR_PRIVADO_SIN_LUCRO = 'PRIVADO_SIN_LUCRO', // 18.00%
  PYME = 'PYME',                                  // 18.00%
  MICRO = 'MICRO'                                 // 18.00% + beneficios
}

function obtenerAlicuotaSUSS(tipo: TipoEmpleador): number {
  switch (tipo) {
    case TipoEmpleador.SECTOR_PRIVADO_LUCRO:
      return 0.2040;  // Servicios y comercio > límite facturación
    default:
      return 0.1800;  // Resto de empleadores
  }
}
```

### 3.3 Detracción de Contribuciones

```typescript
// La detracción reduce la base imponible para contribuciones
// Se actualiza periódicamente por AFIP

interface DetraccionContribuciones {
  montoMensual: number;      // Detracción mensual vigente
  montoSAC: number;          // 50% de la detracción para SAC
  vigenciaDesde: Date;
}

function calcularContribucionesPatronales(
  remuneracionBruta: number,
  detraccion: number,
  tipoEmpleador: TipoEmpleador,
  alicuotaART: number,
  cuotaSeguroVida: number
): ContribucionesPatronales {
  // Base con detracción
  const baseConDetraccion = Math.max(0, remuneracionBruta - detraccion);

  const alicuotaSUSS = obtenerAlicuotaSUSS(tipoEmpleador);

  return {
    sipa: baseConDetraccion * 0.1077,
    pami: baseConDetraccion * 0.0158,
    asignacionesFamiliares: baseConDetraccion * 0.0470,
    fne: baseConDetraccion * 0.0095,
    subtotalSUSS: baseConDetraccion * alicuotaSUSS,
    obraSocial: remuneracionBruta * 0.06,  // Sin detracción
    art: remuneracionBruta * alicuotaART,
    seguroVida: cuotaSeguroVida
  };
}
```

---

## 4. Sueldo Anual Complementario (SAC / Aguinaldo)

### 4.1 Normativa
- **Ley**: 20.744 (LCT), Arts. 121-122, modificada por Ley 27.073
- **Pago**: 2 cuotas anuales (junio y diciembre)
- **Cálculo**: 50% de la mayor remuneración mensual del semestre

### 4.2 Fechas de Pago

| Cuota | Período | Fecha Límite | Gracia |
|-------|---------|--------------|--------|
| 1ra | Enero - Junio | 30 de junio | 4 días hábiles |
| 2da | Julio - Diciembre | 18 de diciembre | 4 días hábiles |

### 4.3 Implementación

```typescript
interface CalculoSAC {
  mejorSueldoSemestre: number;
  mesesTrabajados: number;
  esProporcional: boolean;
  montoSAC: number;
  aportes: AportesEmpleado;
  netoSAC: number;
}

function calcularSAC(
  empleado: EmpleadoData,
  liquidacionesSemestre: Liquidacion[],
  semestre: 1 | 2
): CalculoSAC {
  // Obtener el mejor sueldo del semestre
  const mejorSueldo = Math.max(
    ...liquidacionesSemestre.map(l => l.totalRemunerativo)
  );

  // Contar meses trabajados
  const mesesTrabajados = liquidacionesSemestre.length;

  // Determinar si es proporcional
  const esProporcional = mesesTrabajados < 6;

  // Calcular monto
  let montoSAC: number;
  if (esProporcional) {
    // Fórmula proporcional: (mejor sueldo / 12) * meses trabajados
    montoSAC = (mejorSueldo / 12) * mesesTrabajados;
  } else {
    // Fórmula completa: mejor sueldo / 2
    montoSAC = mejorSueldo / 2;
  }

  // El SAC tributa aportes
  const aportes = calcularAportesEmpleado(montoSAC, empleado, valoresLegales);

  return {
    mejorSueldoSemestre: mejorSueldo,
    mesesTrabajados,
    esProporcional,
    montoSAC,
    aportes,
    netoSAC: montoSAC - Object.values(aportes).reduce((a, b) => a + (b || 0), 0)
  };
}
```

### 4.4 SAC Proporcional (casos especiales)

```typescript
// Para ingresos o egresos durante el semestre

function calcularSACProporcional(
  mejorSueldo: number,
  fechaIngreso: Date,
  fechaEgreso: Date | null,
  semestre: { inicio: Date, fin: Date }
): number {
  // Días trabajados en el semestre
  const inicioCalculo = fechaIngreso > semestre.inicio
    ? fechaIngreso
    : semestre.inicio;

  const finCalculo = fechaEgreso && fechaEgreso < semestre.fin
    ? fechaEgreso
    : semestre.fin;

  const diasTrabajados = differenceInDays(finCalculo, inicioCalculo);
  const diasSemestre = differenceInDays(semestre.fin, semestre.inicio);

  // Proporcional por días
  return (mejorSueldo / 2) * (diasTrabajados / diasSemestre);
}
```

---

## 5. Vacaciones

### 5.1 Días por Antigüedad (Art. 150 LCT)

| Antigüedad | Días Corridos |
|------------|---------------|
| Hasta 5 años | 14 días |
| Más de 5 hasta 10 años | 21 días |
| Más de 10 hasta 20 años | 28 días |
| Más de 20 años | 35 días |

### 5.2 Requisitos
- Haber trabajado al menos la mitad de los días hábiles del año
- Si no cumple, 1 día de vacaciones cada 20 días trabajados

### 5.3 Plus Vacacional (Art. 155 LCT)

```typescript
function calcularPlusVacacional(
  salarioMensual: number,
  diasVacaciones: number
): number {
  // Se divide por 25 (no por 30) según LCT
  // Esto genera el "plus" vacacional
  const valorDia = salarioMensual / 25;
  return valorDia * diasVacaciones;
}

function calcularVacaciones(
  empleado: EmpleadoData,
  salarioActual: number
): CalculoVacaciones {
  const antiguedad = calcularAntiguedadAños(empleado.fechaIngreso);

  // Determinar días según antigüedad
  let diasCorresponden: number;
  if (antiguedad > 20) diasCorresponden = 35;
  else if (antiguedad > 10) diasCorresponden = 28;
  else if (antiguedad > 5) diasCorresponden = 21;
  else diasCorresponden = 14;

  // Calcular plus vacacional
  const plusVacacional = calcularPlusVacacional(salarioActual, diasCorresponden);

  // El plus vacacional es remunerativo, tributa aportes
  const aportes = calcularAportesEmpleado(plusVacacional, empleado, valoresLegales);

  return {
    diasCorresponden,
    diasGozados: empleado.vacacionesGozadas,
    diasPendientes: diasCorresponden - empleado.vacacionesGozadas,
    plusVacacional,
    aportes,
    netoPlusVacacional: plusVacacional - sumarAportes(aportes)
  };
}
```

### 5.4 Vacaciones No Gozadas (Liquidación Final)

```typescript
function calcularVacacionesNoGozadas(
  empleado: EmpleadoData,
  salarioActual: number,
  fechaEgreso: Date
): number {
  // Proporcional del año en curso
  const diasDelAño = isLeapYear(fechaEgreso) ? 366 : 365;
  const diasTrabajadosAño = getDayOfYear(fechaEgreso);

  const diasVacacionesAnuales = obtenerDiasVacaciones(empleado);
  const diasProporcionales = (diasVacacionesAnuales / diasDelAño) * diasTrabajadosAño;

  // Menos los ya gozados
  const diasNoGozados = diasProporcionales - empleado.vacacionesGozadasAño;

  return calcularPlusVacacional(salarioActual, diasNoGozados);
}
```

---

## 6. Horas Extras

### 6.1 Normativa (Art. 201 LCT)

| Tipo | Recargo | Cuándo Aplica |
|------|---------|---------------|
| 50% | +50% | Días comunes |
| 100% | +100% | Sábados después 13hs, domingos, feriados |

### 6.2 Límites (Decreto 484/2000)

| Límite | Cantidad |
|--------|----------|
| Diario | 3 horas |
| Mensual | 30 horas |
| Anual | 200 horas |

### 6.3 Implementación

```typescript
interface HorasExtras {
  horas50: number;
  horas100: number;
  valorHora50: number;
  valorHora100: number;
  totalHorasExtras: number;
}

function calcularHorasExtras(
  salarioMensual: number,
  horasMensuales: number,
  horas50: number,
  horas100: number
): HorasExtras {
  // Valor hora normal
  const valorHoraNormal = salarioMensual / horasMensuales;

  // Horas extras al 50%
  const valorHora50 = valorHoraNormal * 1.5;
  const totalHoras50 = horas50 * valorHora50;

  // Horas extras al 100%
  const valorHora100 = valorHoraNormal * 2;
  const totalHoras100 = horas100 * valorHora100;

  return {
    horas50,
    horas100,
    valorHora50,
    valorHora100,
    totalHorasExtras: totalHoras50 + totalHoras100
  };
}

// Validar límites
function validarLimitesHorasExtras(
  horasMes: number,
  horasAcumuladasAño: number
): ValidationResult {
  const errores: string[] = [];

  if (horasMes > 30) {
    errores.push(`Excede límite mensual de 30hs (tiene ${horasMes}hs)`);
  }

  if (horasAcumuladasAño + horasMes > 200) {
    errores.push(`Excedería límite anual de 200hs`);
  }

  return {
    valid: errores.length === 0,
    errores
  };
}
```

---

## 7. Impuesto a las Ganancias (4ta Categoría)

### 7.1 Escala Progresiva 2024/2025

| Ganancia Neta Acumulada | Pagarán | Más el % | Sobre excedente de |
|-------------------------|---------|----------|---------------------|
| Hasta $X | $0 | 5% | $0 |
| Más de $X hasta $Y | $A | 9% | $X |
| Más de $Y hasta $Z | $B | 12% | $Y |
| ... | ... | ... | ... |
| Más de $W | $N | 35% | $W |

*Nota: Los valores se actualizan semestralmente por IPC*

### 7.2 Deducciones Personales (Art. 30)

| Concepto | Monto Anual (ejemplo) | Monto Mensual |
|----------|----------------------|---------------|
| Ganancia No Imponible | $X.XXX.XXX | $XXX.XXX |
| Deducción Especial | $X.XXX.XXX | $XXX.XXX |
| Cónyuge | $XXX.XXX | $XX.XXX |
| Hijo (cada uno) | $XXX.XXX | $XX.XXX |

### 7.3 Otras Deducciones (F.572/SIRADIG)

- Alquiler de vivienda (tope 40% del MNI)
- Cuotas médico-asistenciales
- Servicio doméstico
- Gastos de sepelio
- Intereses préstamo hipotecario
- Donaciones
- Primas de seguro de vida
- Gastos educativos

### 7.4 Implementación

```typescript
interface CalculoGanancias {
  baseImponibleMensual: number;
  deduccionesPersonales: DeduccionesPersonales;
  deduccionesAdicionales: number;
  gananciaNeta: number;
  retencionMensual: number;
  retencionAcumulada: number;
}

function calcularImpuestoGanancias(
  empleado: EmpleadoData,
  liquidacionActual: Liquidacion,
  liquidacionesPrevias: Liquidacion[],
  valoresGanancias: ValoresGanancias
): CalculoGanancias {
  // 1. Base imponible mensual (conceptos sujetos a ganancias)
  const baseImponibleMensual = liquidacionActual.conceptos
    .filter(c => c.aplicaGanancias)
    .reduce((sum, c) => sum + c.monto, 0);

  // 2. Sumar SAC proporcional (1/12 mensual)
  const sacProporcional = baseImponibleMensual / 12;
  const baseConSAC = baseImponibleMensual + sacProporcional;

  // 3. Deducciones personales mensuales
  const deduccionesPersonales = calcularDeduccionesPersonales(
    empleado,
    valoresGanancias
  );

  // 4. Deducciones adicionales (SIRADIG)
  const deduccionesAdicionales = empleado.deduccionesGanancias
    .filter(d => d.periodoFiscal === new Date().getFullYear())
    .reduce((sum, d) => sum + d.montoMensual, 0);

  // 5. Ganancia neta del mes
  const totalDeducciones =
    deduccionesPersonales.total + deduccionesAdicionales;
  const gananciaNeta = Math.max(0, baseConSAC - totalDeducciones);

  // 6. Calcular ganancia acumulada del año
  const gananciaAcumuladaAnterior = liquidacionesPrevias
    .reduce((sum, l) => sum + (l.datosGanancias?.gananciaNeta || 0), 0);

  const gananciaAcumuladaTotal = gananciaAcumuladaAnterior + gananciaNeta;

  // 7. Aplicar tabla progresiva
  const impuestoAcumulado = aplicarTablaProgresiva(
    gananciaAcumuladaTotal,
    valoresGanancias.tablaProgresiva
  );

  // 8. Restar retenciones anteriores
  const retencionesAnteriores = liquidacionesPrevias
    .reduce((sum, l) => sum + (l.datosGanancias?.retencion || 0), 0);

  const retencionMensual = impuestoAcumulado - retencionesAnteriores;

  return {
    baseImponibleMensual: baseConSAC,
    deduccionesPersonales,
    deduccionesAdicionales,
    gananciaNeta,
    retencionMensual: Math.max(0, retencionMensual),
    retencionAcumulada: impuestoAcumulado
  };
}

function aplicarTablaProgresiva(
  gananciaAcumulada: number,
  tabla: TramoGanancias[]
): number {
  let impuesto = 0;
  let gananciaRestante = gananciaAcumulada;

  for (const tramo of tabla) {
    if (gananciaRestante <= 0) break;

    const baseTramo = tramo.hasta - tramo.desde;
    const gananciaEnTramo = Math.min(gananciaRestante, baseTramo);

    impuesto += gananciaEnTramo * tramo.alicuota;
    gananciaRestante -= gananciaEnTramo;
  }

  return impuesto;
}
```

---

## 8. CCT 507/07 - Vigiladores (Piloto)

### 8.1 Categorías y Funciones

| Categoría | Función |
|-----------|---------|
| Vigilador General | Tareas de vigilancia básica |
| Vigilador Bombero | Vigilancia + prevención de incendios |
| Vigilador Principal | Responsable de turno |
| Verificador de Eventos | Respuesta a alarmas |
| Operador de Monitoreo | Monitoreo de sistemas |
| Controlador de Admisión | Control de acceso |
| Administrativo | Tareas administrativas |
| Guía Técnico | Atención y asesoramiento |

### 8.2 Composición del Sueldo

```typescript
interface SueldoVigilador {
  // Básico según categoría
  basico: number;

  // Adicionales remunerativos
  presentismo: number;        // 8.33% sobre básico
  antiguedad: number;         // 1% por año

  // No remunerativos
  viaticos: number;           // Por día trabajado
  beneficioSocial: number;    // Vales de alimentación

  // Adicionales especiales
  nocturnidad?: number;       // Si trabaja horario nocturno
  reintegroVehiculo?: number; // Si usa vehículo propio
}

function liquidarVigilador(
  empleado: EmpleadoVigilador,
  periodo: Periodo
): Liquidacion {
  const escala = obtenerEscalaVigente(empleado.categoriaId, periodo.fecha);

  // Básico
  const basico = escala.salarioBasico;

  // Presentismo (si no tiene ausencias)
  const presentismo = empleado.ausencias === 0
    ? basico * 0.0833
    : 0;

  // Antigüedad (1% por año)
  const antiguedad = basico * empleado.antiguedadAños * 0.01;

  // Viáticos (por día trabajado, no remunerativo)
  const viaticos = empleado.diasTrabajados * escala.viaticoDiario;

  // Nocturnidad (si aplica)
  const nocturnidad = empleado.horasNocturnas > 0
    ? empleado.horasNocturnas * ((basico + presentismo + antiguedad) * 0.001)
    : 0;

  // ... resto de la liquidación
}
```

### 8.3 Adicionales Específicos del CCT

```typescript
const conceptosCCT507 = [
  {
    codigo: 'PRESENTISMO_507',
    nombre: 'Presentismo',
    formula: 'SI(AUSENCIAS = 0, BASICO * 0.0833, 0)',
    tipo: 'REMUNERATIVO'
  },
  {
    codigo: 'ANTIGUEDAD_507',
    nombre: 'Adicional Antigüedad',
    formula: 'BASICO * ANTIGUEDAD_AÑOS * 0.01',
    tipo: 'REMUNERATIVO'
  },
  {
    codigo: 'VIATICOS_507',
    nombre: 'Viáticos',
    formula: 'DIAS_TRABAJADOS * VALOR_VIATICO_DIARIO',
    tipo: 'NO_REMUNERATIVO'
  },
  {
    codigo: 'BENEFICIO_SOCIAL_507',
    nombre: 'Beneficio Social (Vales)',
    formula: 'DIAS_TRABAJADOS * VALOR_VALE_DIARIO',
    tipo: 'NO_REMUNERATIVO'
  },
  {
    codigo: 'NOCTURNIDAD_507',
    nombre: 'Adicional Nocturno',
    formula: 'HORAS_NOCTURNAS * ((BASICO + REMUNERATIVO) * 0.001)',
    tipo: 'REMUNERATIVO'
  },
  {
    codigo: 'VEHICULO_507',
    nombre: 'Reintegro Vehículo',
    formula: 'SI(USA_VEHICULO_PROPIO, VALOR_REINTEGRO_VEHICULO, 0)',
    tipo: 'NO_REMUNERATIVO'
  },
  {
    codigo: 'FERIADO_507',
    nombre: 'Feriado Trabajado',
    formula: 'HORAS_FERIADO * HORA_NORMAL * 2',
    tipo: 'REMUNERATIVO'
  }
];
```

---

## 9. Liquidación Final

### 9.1 Conceptos a Incluir

```typescript
interface LiquidacionFinal {
  // Proporcionales del mes
  sueldoProporcional: number;

  // Vacaciones no gozadas
  vacacionesNoGozadas: number;

  // SAC proporcional
  sacProporcional: number;

  // Indemnizaciones (si corresponde)
  preaviso?: number;              // 15 días a 2 meses según antigüedad
  indemnizacionAntigüedad?: number;  // 1 mes por año
  integracionMes?: number;        // Días hasta fin de mes

  // Otros
  diasTrabajados: number;
  otrosConceptos: Concepto[];
}

function calcularLiquidacionFinal(
  empleado: EmpleadoData,
  fechaEgreso: Date,
  tipoDespido: TipoDespido
): LiquidacionFinal {
  const salarioBase = empleado.salarioActual;

  // Días trabajados del mes
  const diasTrabajados = fechaEgreso.getDate();
  const sueldoProporcional = (salarioBase / 30) * diasTrabajados;

  // Vacaciones no gozadas
  const vacacionesNoGozadas = calcularVacacionesNoGozadas(
    empleado,
    salarioBase,
    fechaEgreso
  );

  // SAC proporcional
  const sacProporcional = calcularSACProporcional(
    salarioBase,
    empleado.fechaIngreso,
    fechaEgreso,
    obtenerSemestreActual(fechaEgreso)
  );

  // Indemnizaciones (solo si es despido sin causa)
  let preaviso = 0;
  let indemnizacionAntiguedad = 0;
  let integracionMes = 0;

  if (tipoDespido === TipoDespido.SIN_CAUSA) {
    const antiguedad = calcularAntiguedadAños(empleado.fechaIngreso);

    // Preaviso (Art. 231-232 LCT)
    preaviso = antiguedad < 5 ? salarioBase : salarioBase * 2;

    // Indemnización por antigüedad (Art. 245 LCT)
    // 1 mes por año o fracción > 3 meses
    const años = Math.ceil(antiguedad);
    indemnizacionAntiguedad = salarioBase * años;

    // Integración mes de despido
    const diasHastaFinMes = getDaysInMonth(fechaEgreso) - fechaEgreso.getDate();
    integracionMes = (salarioBase / 30) * diasHastaFinMes;
  }

  return {
    sueldoProporcional,
    vacacionesNoGozadas,
    sacProporcional,
    preaviso,
    indemnizacionAntigüedad: indemnizacionAntiguedad,
    integracionMes,
    diasTrabajados,
    otrosConceptos: []
  };
}
```

---

## 10. Valores Legales - Estructura

```typescript
// Valores que se actualizan periódicamente

interface ValoresLegales {
  // Topes SIPA
  TOPE_SIPA_MIN: number;
  TOPE_SIPA_MAX: number;

  // Impuesto Ganancias
  MNI_SOLTERO: number;
  MNI_CASADO: number;
  DEDUCCION_ESPECIAL: number;
  DEDUCCION_CONYUGE: number;
  DEDUCCION_HIJO: number;
  TABLA_PROGRESIVA: TramoGanancias[];

  // Contribuciones
  DETRACCION_MENSUAL: number;
  DETRACCION_SAC: number;

  // Otros
  SALARIO_MINIMO_VITAL_MOVIL: number;

  // Vigencia
  vigenciaDesde: Date;
  vigenciaHasta: Date | null;
}

// Ejemplo de estructura de tabla progresiva
interface TramoGanancias {
  desde: number;
  hasta: number;
  fijo: number;
  alicuota: number;  // 0.05, 0.09, 0.12, ... 0.35
}
```

---

*Documento creado: 28/11/2024*
*Última actualización: 28/11/2024*
*Fuentes: Ley 20.744 (LCT), Ley 24.241 (SIPA), Ley 20.628 (Ganancias), CCT 507/07*
