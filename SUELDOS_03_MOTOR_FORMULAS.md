# MÓDULO DE SUELDOS - MOTOR DE FÓRMULAS

## Descripción
Este documento describe el motor de fórmulas para el cálculo de conceptos de liquidación, incluyendo la sintaxis, variables disponibles, funciones predefinidas y el modo híbrido (visual + código).

---

## 1. Arquitectura del Motor de Fórmulas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MOTOR DE FÓRMULAS                                    │
└─────────────────────────────────────────────────────────────────────────────┘

     ┌─────────────────┐         ┌─────────────────┐
     │   MODO VISUAL   │         │  MODO FÓRMULA   │
     │   (Asistente)   │         │    (Código)     │
     └────────┬────────┘         └────────┬────────┘
              │                           │
              └───────────┬───────────────┘
                          │
                          ▼
              ┌─────────────────────┐
              │   PARSER/COMPILER   │
              │  (Validación AST)   │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   FORMULA ENGINE    │
              │    (Ejecución)      │
              └──────────┬──────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
  ┌────────────┐  ┌────────────┐  ┌────────────┐
  │ Variables  │  │ Funciones  │  │  Valores   │
  │  Context   │  │ Biblioteca │  │  Legales   │
  └────────────┘  └────────────┘  └────────────┘
```

---

## 2. Variables Disponibles

### 2.1 Variables del Empleado

| Variable | Tipo | Descripción | Origen |
|----------|------|-------------|--------|
| `BASICO` | Número | Sueldo básico de la categoría | EscalaSalarialCCT |
| `ANTIGUEDAD_AÑOS` | Número | Años de antigüedad | Calculado de fechaIngreso |
| `ANTIGUEDAD_MESES` | Número | Meses totales de antigüedad | Calculado de fechaIngreso |
| `CATEGORIA` | Texto | Código de categoría | CategoriaCCT |
| `CATEGORIA_NIVEL` | Número | Nivel jerárquico | CategoriaCCT |
| `CCT` | Texto | Código del convenio | ConvenioCCT |
| `TIPO_JORNADA` | Texto | "COMPLETA", "PARCIAL" | DatosLaboralesCCT |
| `HORAS_SEMANALES` | Número | Horas de jornada semanal | DatosLaboralesCCT |
| `AFILIADO_SINDICATO` | Booleano | Si está afiliado | DatosLaboralesCCT |

### 2.2 Variables del Período

| Variable | Tipo | Descripción | Origen |
|----------|------|-------------|--------|
| `DIAS_MES` | Número | Días del mes | Sistema |
| `DIAS_HABILES` | Número | Días hábiles del mes | Sistema |
| `DIAS_TRABAJADOS` | Número | Días efectivamente trabajados | Fichadas |
| `DIAS_AUSENCIA` | Número | Días de ausencia | Calculado |
| `DIAS_LICENCIA` | Número | Días de licencia con goce | Novedades |
| `DIAS_VACACIONES` | Número | Días de vacaciones | Novedades |
| `PERIODO_MES` | Número | Mes del período (1-12) | Período |
| `PERIODO_AÑO` | Número | Año del período | Período |

### 2.3 Variables de Fichadas/Horas

| Variable | Tipo | Descripción | Origen |
|----------|------|-------------|--------|
| `HORAS_TRABAJADAS` | Número | Total horas normales | Fichadas |
| `HORAS_EXTRAS_50` | Número | Horas extra al 50% | Fichadas |
| `HORAS_EXTRAS_100` | Número | Horas extra al 100% | Fichadas |
| `HORAS_NOCTURNAS` | Número | Horas en horario nocturno | Fichadas |
| `HORAS_FERIADO` | Número | Horas trabajadas en feriado | Fichadas |
| `LLEGADAS_TARDE` | Número | Cantidad de llegadas tarde | Fichadas |
| `MINUTOS_TARDE` | Número | Total minutos tarde | Fichadas |

### 2.4 Variables de Liquidación

| Variable | Tipo | Descripción | Origen |
|----------|------|-------------|--------|
| `REMUNERATIVO` | Número | Total de conceptos remunerativos | Calculado |
| `NO_REMUNERATIVO` | Número | Total de conceptos no remunerativos | Calculado |
| `BRUTO` | Número | Total bruto (rem + no rem) | Calculado |
| `MEJOR_SUELDO_SEMESTRE` | Número | Mayor sueldo del semestre (para SAC) | Histórico |
| `MESES_TRABAJADOS_SEMESTRE` | Número | Meses trabajados en el semestre | Histórico |

### 2.5 Variables de Valores Legales

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `TOPE_SIPA_MAX` | Número | Tope máximo para aportes SIPA |
| `TOPE_SIPA_MIN` | Número | Tope mínimo para aportes SIPA |
| `MNI_SOLTERO` | Número | Mínimo no imponible soltero |
| `MNI_CASADO` | Número | Mínimo no imponible casado |
| `DEDUCCION_CONYUGE` | Número | Deducción por cónyuge |
| `DEDUCCION_HIJO` | Número | Deducción por hijo |
| `ALICUOTA_JUBILACION` | Número | Porcentaje aporte jubilación (0.11) |
| `ALICUOTA_OBRA_SOCIAL` | Número | Porcentaje obra social (0.03) |
| `ALICUOTA_PAMI` | Número | Porcentaje PAMI (0.03) |

---

## 3. Sintaxis de Fórmulas

### 3.1 Operadores Básicos

```javascript
// Aritméticos
BASICO + 1000           // Suma
BASICO - 500            // Resta
BASICO * 0.10           // Multiplicación
BASICO / 25             // División
BASICO % 30             // Módulo

// Comparación
ANTIGUEDAD_AÑOS >= 5    // Mayor o igual
CATEGORIA = "ADMIN"     // Igual (texto)
HORAS_EXTRAS_50 > 0     // Mayor que

// Lógicos
Y(condicion1, condicion2)     // AND
O(condicion1, condicion2)     // OR
NO(condicion)                 // NOT
```

### 3.2 Funciones Condicionales

```javascript
// SI simple
SI(AUSENCIAS = 0, BASICO * 0.0833, 0)

// SI anidado
SI(ANTIGUEDAD_AÑOS >= 10,
   BASICO * 0.25,
   SI(ANTIGUEDAD_AÑOS >= 5,
      BASICO * 0.15,
      BASICO * ANTIGUEDAD_AÑOS * 0.01))

// ELEGIR (switch)
ELEGIR(CATEGORIA,
  "VIG_GRAL", BASICO * 1.0,
  "VIG_BOMB", BASICO * 1.1,
  "VIG_PRINC", BASICO * 1.2,
  BASICO)  // default
```

### 3.3 Funciones Matemáticas

```javascript
// Límites
MIN(valor, maximo)              // Mínimo entre dos valores
MAX(valor, minimo)              // Máximo entre dos valores
REDONDEAR(valor, decimales)     // Redondeo
TRUNCAR(valor, decimales)       // Truncar decimales
ABS(valor)                      // Valor absoluto

// Ejemplos
MIN(BASICO * ANTIGUEDAD_AÑOS * 0.01, BASICO * 0.25)  // Tope antigüedad
MAX(BASICO, MNI_SOLTERO)                              // Garantizar mínimo
REDONDEAR(BASICO / 25, 2)                             // Valor hora
```

---

## 4. Funciones Predefinidas (Específicas de Liquidación)

### 4.1 Cálculo de Horas

```javascript
// Valor hora normal
HORA_NORMAL(basico, horasMensuales)
// Implementación: basico / horasMensuales
// Ejemplo: HORA_NORMAL(BASICO, 200) → $500.000 / 200 = $2.500

// Valor hora extra
HORA_EXTRA(basico, porcentajeRecargo)
// Implementación: HORA_NORMAL(basico) * (1 + porcentajeRecargo/100)
// Ejemplo: HORA_EXTRA(BASICO, 50) → $2.500 * 1.5 = $3.750

// Total horas extras
TOTAL_HORAS_EXTRAS()
// Implementación: HORAS_EXTRAS_50 * HORA_EXTRA(BASICO, 50) +
//                 HORAS_EXTRAS_100 * HORA_EXTRA(BASICO, 100)
```

### 4.2 Proporcionales

```javascript
// Proporcional por días trabajados
PROPORCION(monto, diasTrabajados, diasMes)
// Ejemplo: PROPORCION(BASICO, 15, 30) → mitad del sueldo

// Proporcional automático (usa DIAS_TRABAJADOS y DIAS_MES)
PROPORCIONAL(monto)
// Ejemplo: PROPORCIONAL(BASICO) → básico proporcional
```

### 4.3 SAC (Aguinaldo)

```javascript
// SAC completo (medio aguinaldo)
SAC()
// Implementación: MEJOR_SUELDO_SEMESTRE / 2

// SAC proporcional
SAC_PROPORCIONAL()
// Implementación: (MEJOR_SUELDO_SEMESTRE / 12) * MESES_TRABAJADOS_SEMESTRE

// SAC con verificación
SAC_CALCULAR()
// Implementación: SI(MESES_TRABAJADOS_SEMESTRE >= 6, SAC(), SAC_PROPORCIONAL())
```

### 4.4 Vacaciones

```javascript
// Días de vacaciones por antigüedad
DIAS_VACACIONES_LEGALES()
// Implementación:
//   SI(ANTIGUEDAD_AÑOS > 20, 35,
//      SI(ANTIGUEDAD_AÑOS > 10, 28,
//         SI(ANTIGUEDAD_AÑOS > 5, 21, 14)))

// Plus vacacional
PLUS_VACACIONAL(diasVacaciones)
// Implementación: (BASICO / 25) * diasVacaciones
// Nota: Se divide por 25 (no 30) según LCT Art. 155
```

### 4.5 Topes SIPA

```javascript
// Aplicar tope máximo SIPA
TOPE_SIPA(baseImponible)
// Implementación: MIN(baseImponible, TOPE_SIPA_MAX)

// Verificar tope mínimo
VERIFICAR_MINIMO_SIPA(baseImponible)
// Implementación: MAX(baseImponible, TOPE_SIPA_MIN)
```

### 4.6 Impuesto a las Ganancias

```javascript
// Calcular retención ganancias (simplificado)
GANANCIAS(baseImponible, deducciones)
// Implementación: Aplica tabla progresiva vigente

// Base imponible
BASE_GANANCIAS()
// Implementación: Suma de conceptos sujetos a ganancias - deducciones
```

---

## 5. Modo Visual (Asistente)

### 5.1 Plantillas de Conceptos Comunes

```typescript
const plantillasConceptos = [
  {
    nombre: "Adicional por Antigüedad",
    descripcion: "Porcentaje sobre básico por años trabajados",
    tipo: "REMUNERATIVO",
    configuracion: {
      tipo: "PORCENTAJE_POR_UNIDAD",
      unidad: "ANTIGUEDAD_AÑOS",
      porcentaje: 1,          // 1% por año
      tope: 25,               // Máximo 25%
      base: "BASICO"
    },
    formulaGenerada: "MIN(BASICO * ANTIGUEDAD_AÑOS * 0.01, BASICO * 0.25)"
  },
  {
    nombre: "Presentismo",
    descripcion: "Adicional por asistencia perfecta",
    tipo: "REMUNERATIVO",
    configuracion: {
      tipo: "CONDICIONAL",
      condicion: { variable: "AUSENCIAS", operador: "=", valor: 0 },
      siVerdadero: { tipo: "PORCENTAJE", base: "BASICO", valor: 8.33 },
      siFalso: 0
    },
    formulaGenerada: "SI(AUSENCIAS = 0, BASICO * 0.0833, 0)"
  },
  {
    nombre: "Horas Extras 50%",
    descripcion: "Horas extras en días comunes",
    tipo: "REMUNERATIVO",
    configuracion: {
      tipo: "CANTIDAD_POR_VALOR",
      cantidad: "HORAS_EXTRAS_50",
      valorUnitario: "HORA_EXTRA(BASICO, 50)"
    },
    formulaGenerada: "HORAS_EXTRAS_50 * HORA_EXTRA(BASICO, 50)"
  },
  {
    nombre: "Viáticos por día",
    descripcion: "Viático fijo por día trabajado",
    tipo: "NO_REMUNERATIVO",
    configuracion: {
      tipo: "CANTIDAD_POR_VALOR",
      cantidad: "DIAS_TRABAJADOS",
      valorUnitario: 5000  // Valor fijo
    },
    formulaGenerada: "DIAS_TRABAJADOS * 5000"
  }
];
```

### 5.2 Interface Visual del Configurador

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CREADOR DE CONCEPTO                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Nombre: [Adicional por Antigüedad                    ]                     │
│                                                                             │
│  Tipo: (●) Remunerativo  ( ) No Remunerativo  ( ) Descuento                │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ¿Cómo se calcula?                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ [▼] Porcentaje por unidad                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Aplicar [1    ]% sobre [Sueldo Básico    ▼]                               │
│                                                                             │
│  Por cada [Año de antigüedad ▼]                                            │
│                                                                             │
│  ☑ Aplicar tope máximo: [25   ]%                                           │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ☑ Aplica aportes y contribuciones                                         │
│  ☑ Se incluye en SAC                                                       │
│  ☑ Se incluye en base de vacaciones                                        │
│  ☑ Se incluye en Impuesto a las Ganancias                                  │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  📝 Fórmula generada:                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ MIN(BASICO * ANTIGUEDAD_AÑOS * 0.01, BASICO * 0.25)                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  📊 Vista previa (con datos de ejemplo):                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Empleado       │ Básico     │ Antigüedad │ Resultado               │   │
│  ├─────────────────────────────────────────────────────────────────────│   │
│  │ García, Juan   │ $500.000   │ 3 años     │ $15.000                 │   │
│  │ López, María   │ $600.000   │ 12 años    │ $72.000                 │   │
│  │ Pérez, Carlos  │ $800.000   │ 30 años    │ $200.000 (tope 25%)     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [Guardar]  [Probar con otros empleados]  [Ver modo fórmula]  [Cancelar]  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Modo Fórmula (Avanzado)

### 6.1 Editor de Código

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ EDITOR DE FÓRMULA                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1 │ // Adicional por productividad escalonado                       │   │
│  │ 2 │ SI(PRODUCTIVIDAD >= 1.2,                                        │   │
│  │ 3 │    BASICO * 0.10,                                               │   │
│  │ 4 │    SI(PRODUCTIVIDAD >= 1.0,                                     │   │
│  │ 5 │       BASICO * 0.05,                                            │   │
│  │ 6 │       0))                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  📚 Variables disponibles:          🔧 Funciones:                          │
│  ┌────────────────────────┐        ┌────────────────────────────────┐     │
│  │ BASICO        $500.000 │        │ SI(cond, verdadero, falso)     │     │
│  │ ANTIGUEDAD_AÑOS      5 │        │ MIN(a, b)                      │     │
│  │ PRODUCTIVIDAD     1.15 │        │ MAX(a, b)                      │     │
│  │ HORAS_EXTRAS_50     12 │        │ REDONDEAR(valor, dec)          │     │
│  │ AUSENCIAS           0  │        │ HORA_NORMAL(basico, horas)     │     │
│  │ ...                    │        │ ...                            │     │
│  └────────────────────────┘        └────────────────────────────────┘     │
│                                                                             │
│  ✓ Sintaxis válida                                                         │
│  ⚠️ Advertencia: La variable PRODUCTIVIDAD no tiene valor por defecto     │
│                                                                             │
│  [Validar] [Ejecutar prueba] [Ver modo visual] [Guardar]                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Ejemplos de Fórmulas Complejas

```javascript
// Adicional por zona con múltiples condiciones
SI(LUGAR_TRABAJO = "TIERRA_DEL_FUEGO",
   BASICO * 0.20,
   SI(LUGAR_TRABAJO = "PATAGONIA",
      BASICO * 0.15,
      SI(LUGAR_TRABAJO = "NEA" O LUGAR_TRABAJO = "NOA",
         BASICO * 0.10,
         0)))

// Bono trimestral por rendimiento
SI(MES_ACTUAL = 3 O MES_ACTUAL = 6 O MES_ACTUAL = 9 O MES_ACTUAL = 12,
   SI(CUMPLE_OBJETIVO_TRIMESTRE,
      BASICO * 0.5,
      0),
   0)

// Descuento por llegadas tarde progresivo
SI(LLEGADAS_TARDE = 0,
   0,
   SI(LLEGADAS_TARDE <= 2,
      BASICO * 0.01 * LLEGADAS_TARDE,
      SI(LLEGADAS_TARDE <= 5,
         BASICO * 0.02 * LLEGADAS_TARDE,
         BASICO * 0.05 * LLEGADAS_TARDE)))

// Viático por visitas con tope mensual
MIN(VISITAS_REALIZADAS * 2500, 75000)

// Horas nocturnas con adicional del convenio
HORAS_NOCTURNAS * ((BASICO + REMUNERATIVO) * 0.001)
```

---

## 7. Validación y Pruebas

### 7.1 Validaciones Automáticas

```typescript
interface ValidacionFormula {
  // Sintaxis
  esValida: boolean;
  erroresSintaxis: string[];

  // Semántica
  variablesDesconocidas: string[];
  funcionesDesconocidas: string[];

  // Advertencias
  advertencias: string[];  // Ej: "División por cero posible"

  // Tipo de resultado
  tipoResultado: 'NUMERO' | 'TEXTO' | 'BOOLEANO';
}

const validaciones = [
  // Variables existen
  { tipo: 'VARIABLE', mensaje: 'La variable {var} no existe' },

  // Funciones existen
  { tipo: 'FUNCION', mensaje: 'La función {func} no existe' },

  // Tipos compatibles
  { tipo: 'TIPOS', mensaje: 'No se puede comparar {tipo1} con {tipo2}' },

  // División por cero
  { tipo: 'DIVISION', mensaje: 'Posible división por cero en {expr}' },

  // Recursión infinita
  { tipo: 'RECURSION', mensaje: 'Referencia circular detectada' }
];
```

### 7.2 Sandbox de Pruebas

```typescript
interface PruebaFormula {
  // Datos de entrada
  empleado: {
    nombre: string;
    basico: number;
    antiguedad: number;
    // ... otras variables
  };

  // Resultado esperado (opcional)
  resultadoEsperado?: number;

  // Resultado real
  resultado: number;

  // Detalle de ejecución
  pasos: {
    expresion: string;
    valor: any;
  }[];
}

// Ejemplo de ejecución de prueba
const prueba: PruebaFormula = {
  empleado: {
    nombre: "García, Juan",
    basico: 500000,
    antiguedad: 5
  },
  resultado: 25000,
  pasos: [
    { expresion: "BASICO", valor: 500000 },
    { expresion: "ANTIGUEDAD_AÑOS", valor: 5 },
    { expresion: "BASICO * ANTIGUEDAD_AÑOS", valor: 2500000 },
    { expresion: "... * 0.01", valor: 25000 },
    { expresion: "BASICO * 0.25", valor: 125000 },
    { expresion: "MIN(25000, 125000)", valor: 25000 }
  ]
};
```

---

## 8. Implementación Técnica

### 8.1 Parser de Fórmulas

```typescript
// Usar librería como math.js adaptada o crear parser propio

import { Parser } from './formula-parser';

class FormulaEngine {
  private parser: Parser;
  private funciones: Map<string, Function>;
  private valoresLegales: Map<string, number>;

  constructor() {
    this.parser = new Parser();
    this.registrarFunciones();
  }

  private registrarFunciones() {
    this.funciones.set('SI', (cond, v, f) => cond ? v : f);
    this.funciones.set('MIN', Math.min);
    this.funciones.set('MAX', Math.max);
    this.funciones.set('REDONDEAR', (v, d) => Number(v.toFixed(d)));
    this.funciones.set('HORA_NORMAL', (basico, horas = 200) => basico / horas);
    this.funciones.set('HORA_EXTRA', (basico, pct) =>
      this.funciones.get('HORA_NORMAL')(basico) * (1 + pct/100));
    // ... más funciones
  }

  async ejecutar(
    formula: string,
    contexto: ContextoLiquidacion
  ): Promise<number> {
    // 1. Parsear la fórmula
    const ast = this.parser.parse(formula);

    // 2. Validar
    const validacion = this.validar(ast, contexto);
    if (!validacion.esValida) {
      throw new FormulaError(validacion.errores);
    }

    // 3. Resolver variables
    const variables = await this.resolverVariables(ast, contexto);

    // 4. Ejecutar
    const resultado = this.evaluar(ast, variables);

    return resultado;
  }

  private async resolverVariables(
    ast: AST,
    contexto: ContextoLiquidacion
  ): Promise<Map<string, any>> {
    const variables = new Map();

    // Variables del empleado
    variables.set('BASICO', await this.obtenerBasico(contexto));
    variables.set('ANTIGUEDAD_AÑOS', this.calcularAntiguedad(contexto));

    // Variables del período
    variables.set('DIAS_MES', contexto.periodo.diasMes);
    variables.set('DIAS_TRABAJADOS', await this.obtenerDiasTrabajados(contexto));

    // Variables de fichadas
    const fichadas = await this.obtenerResumenFichadas(contexto);
    variables.set('HORAS_TRABAJADAS', fichadas.horasNormales);
    variables.set('HORAS_EXTRAS_50', fichadas.horasExtras50);
    variables.set('HORAS_EXTRAS_100', fichadas.horasExtras100);

    // Valores legales vigentes
    const valoresLegales = await this.obtenerValoresLegales(contexto.periodo.fecha);
    valoresLegales.forEach((v, k) => variables.set(k, v));

    return variables;
  }
}
```

### 8.2 Contexto de Liquidación

```typescript
interface ContextoLiquidacion {
  // Empleado
  empleado: {
    id: string;
    fechaIngreso: Date;
    categoriaId: string;
    cctId: string;
    datosLaborales: DatosLaboralesCCT;
  };

  // Período
  periodo: {
    id: string;
    fechaDesde: Date;
    fechaHasta: Date;
    diasMes: number;
    diasHabiles: number;
  };

  // Caché de cálculos previos
  conceptosCalculados: Map<string, number>;

  // Para referencia a otros conceptos
  obtenerConcepto: (codigo: string) => number | null;
}
```

---

## 9. Migraciones y Compatibilidad

### 9.1 Conversión de Fórmulas Existentes

Si existen fórmulas en el sistema actual (`LegajoDatosRemuneracion.adicionales`), se pueden migrar:

```typescript
// Mapeo de adicionales existentes a fórmulas
const migracionAdicionales = {
  'FIJO': (monto) => `${monto}`,  // Valor fijo
  'VARIABLE': (monto) => `${monto}`,  // Valor variable (se carga cada mes)
  'PRESENTISMO': () => `SI(AUSENCIAS = 0, BASICO * 0.0833, 0)`,
  'PRODUCTIVIDAD': (pct) => `BASICO * ${pct / 100}`,
  'OTRO': (monto) => `${monto}`
};
```

---

*Documento creado: 28/11/2024*
*Última actualización: 28/11/2024*
