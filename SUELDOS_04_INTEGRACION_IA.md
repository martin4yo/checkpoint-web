# MÓDULO DE SUELDOS - INTEGRACIÓN CON IA

## Descripción
Este documento describe cómo la Inteligencia Artificial se integra en el módulo de sueldos para simplificar la experiencia del usuario, permitiendo configurar fórmulas con lenguaje natural, detectar anomalías y responder consultas.

---

## 1. Visión General de la Integración IA

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MAPA DE INTEGRACIÓN IA                                    │
└─────────────────────────────────────────────────────────────────────────────┘

  CONFIGURACIÓN              OPERACIÓN               ANÁLISIS
  ─────────────              ─────────               ────────
  • Fórmulas NL    ───────▶  • Fichadas      ───▶   • Anomalías
  • CCT desde PDF            • Novedades            • Tendencias
  • Conceptos                • Errores              • Proyecciones
  • Ganancias                • Validación           • Consultas NL

  CUMPLIMIENTO               EMPLEADOS              REPORTES
  ───────────                ─────────              ────────
  • Legislación     ───────▶ • Onboarding    ───▶  • Generación NL
  • Alertas                  • Consultas            • Explicaciones
  • Actualizaciones          • Autogestión          • Comparativos
```

---

## 2. Servicios de IA

### 2.1 Arquitectura de Servicios

```typescript
// Servicios principales de IA

interface IAServices {
  // Conversión de lenguaje natural a fórmulas
  formulaService: FormulaIAService;

  // Análisis de liquidaciones
  liquidacionService: LiquidacionIAService;

  // Procesamiento de documentos
  documentService: DocumentIAService;

  // Consultas en lenguaje natural
  queryService: QueryIAService;

  // Asistente de configuración
  setupService: SetupIAService;
}
```

### 2.2 FormulaIAService - Fórmulas con Lenguaje Natural

```typescript
class FormulaIAService {

  /**
   * Convierte descripción en lenguaje natural a fórmula ejecutable
   */
  async naturalToFormula(
    input: string,
    context: TenantContext
  ): Promise<FormulaResult> {
    // Prompt para Claude
    const systemPrompt = `
      Eres un experto en liquidación de sueldos de Argentina.
      Convierte la siguiente descripción en una fórmula usando esta sintaxis:

      VARIABLES DISPONIBLES:
      - BASICO: Sueldo básico del empleado
      - ANTIGUEDAD_AÑOS: Años de antigüedad
      - DIAS_TRABAJADOS: Días efectivamente trabajados
      - HORAS_EXTRAS_50: Horas extra al 50%
      - HORAS_EXTRAS_100: Horas extra al 100%
      - AUSENCIAS: Cantidad de ausencias
      - LLEGADAS_TARDE: Cantidad de llegadas tarde
      - REMUNERATIVO: Total de conceptos remunerativos ya calculados
      ... (todas las variables del motor)

      FUNCIONES DISPONIBLES:
      - SI(condición, valor_verdadero, valor_falso)
      - MIN(a, b), MAX(a, b)
      - REDONDEAR(valor, decimales)
      - HORA_NORMAL(basico, horas_mensuales)
      - HORA_EXTRA(basico, porcentaje_recargo)
      ... (todas las funciones del motor)

      RESPONDE EN JSON:
      {
        "formula": "la fórmula generada",
        "concepto": {
          "nombre": "nombre sugerido",
          "nombreCorto": "abreviatura para recibo",
          "tipo": "REMUNERATIVO|NO_REMUNERATIVO|DESCUENTO",
          "aplicaAportes": true|false,
          "aplicaSAC": true|false,
          "aplicaVacaciones": true|false,
          "aplicaGanancias": true|false
        },
        "explicacion": "explicación en español de qué hace la fórmula",
        "advertencias": ["posibles problemas o consideraciones"],
        "confianza": 0.0-1.0
      }
    `;

    const response = await this.claude.complete({
      system: systemPrompt,
      user: input,
      model: 'claude-3-5-sonnet'
    });

    return this.parseResponse(response);
  }

  /**
   * Explica una fórmula existente en lenguaje natural
   */
  async explainFormula(formula: string): Promise<string> {
    const prompt = `
      Explica esta fórmula de liquidación de sueldos en español simple,
      como si le explicaras a alguien de RRHH sin conocimientos técnicos:

      ${formula}

      Incluye:
      1. Qué calcula
      2. Qué condiciones tiene
      3. Un ejemplo numérico
    `;

    return await this.claude.complete({ user: prompt });
  }

  /**
   * Sugiere mejoras a fórmulas existentes
   */
  async suggestImprovements(
    conceptos: ConceptoLiquidacion[]
  ): Promise<Sugerencia[]> {
    const prompt = `
      Analiza estos conceptos de liquidación y sugiere mejoras:
      ${JSON.stringify(conceptos, null, 2)}

      Busca:
      1. Fórmulas que podrían simplificarse
      2. Conceptos duplicados o similares
      3. Posibles errores lógicos
      4. Optimizaciones de rendimiento
      5. Mejores prácticas de Argentina
    `;

    return await this.claude.complete({ user: prompt });
  }
}
```

### 2.3 LiquidacionIAService - Análisis y Anomalías

```typescript
class LiquidacionIAService {

  /**
   * Análisis pre-cierre de liquidación
   */
  async analyzePreClose(
    periodo: PeriodoLiquidacion
  ): Promise<AnalisisPreCierre> {
    // Obtener todas las liquidaciones del período
    const liquidaciones = await this.getLiquidaciones(periodo.id);

    // Obtener período anterior para comparación
    const periodoAnterior = await this.getPeriodoAnterior(periodo);

    const prompt = `
      Analiza estas liquidaciones antes del cierre:

      PERÍODO ACTUAL: ${periodo.nombre}
      LIQUIDACIONES: ${liquidaciones.length} empleados

      DATOS POR EMPLEADO:
      ${JSON.stringify(liquidaciones.map(l => ({
        empleado: l.user.nombre,
        bruto: l.totalRemunerativo,
        neto: l.netoAPagar,
        horasExtras: l.conceptos.find(c => c.codigo.includes('EXTRA'))?.cantidad || 0,
        ausencias: l.conceptos.find(c => c.codigo === 'AUSENCIAS')?.cantidad || 0
      })), null, 2)}

      PERÍODO ANTERIOR (comparación):
      ${JSON.stringify(periodoAnterior?.resumen)}

      VALORES LEGALES VIGENTES:
      - Tope SIPA: $X.XXX.XXX
      - Límite horas extras mensuales: 30

      IDENTIFICA:
      1. CRÍTICO: Errores que deben corregirse
      2. ADVERTENCIAS: Situaciones a revisar
      3. INFORMACIÓN: Datos relevantes

      FORMATO JSON:
      {
        "criticos": [{ "empleado": "", "tipo": "", "descripcion": "", "sugerencia": "" }],
        "advertencias": [{ "empleado": "", "tipo": "", "descripcion": "" }],
        "informacion": [{ "tipo": "", "descripcion": "", "afectados": [] }],
        "resumen": "texto resumen general"
      }
    `;

    return await this.claude.complete({ user: prompt });
  }

  /**
   * Detecta anomalías en una liquidación individual
   */
  async detectAnomalies(
    liquidacion: Liquidacion,
    historico: Liquidacion[]
  ): Promise<Anomalia[]> {
    // Calcular promedios históricos
    const promedios = this.calcularPromedios(historico);

    const prompt = `
      Compara esta liquidación con el histórico del empleado:

      LIQUIDACIÓN ACTUAL:
      - Bruto: ${liquidacion.totalRemunerativo}
      - Neto: ${liquidacion.netoAPagar}
      - Horas extras: ${liquidacion.horasExtras}

      PROMEDIOS ÚLTIMOS 6 MESES:
      - Bruto promedio: ${promedios.bruto}
      - Neto promedio: ${promedios.neto}
      - Horas extras promedio: ${promedios.horasExtras}

      VARIACIÓN PERMITIDA: ±30%

      Identifica anomalías y su posible causa.
    `;

    return await this.claude.complete({ user: prompt });
  }

  /**
   * Responde consultas sobre liquidaciones
   */
  async queryLiquidaciones(
    query: string,
    tenantId: string
  ): Promise<QueryResponse> {
    // Determinar qué datos necesita la consulta
    const intentAnalysis = await this.analyzeIntent(query);

    // Obtener datos relevantes
    const datos = await this.fetchRelevantData(intentAnalysis, tenantId);

    const prompt = `
      Responde esta consulta sobre liquidaciones de sueldos:

      CONSULTA: "${query}"

      DATOS DISPONIBLES:
      ${JSON.stringify(datos, null, 2)}

      Responde de forma clara y concisa.
      Si hay números, formatea con separador de miles.
      Si es un listado, usa formato de tabla.
      Si se pide comparación, incluye porcentajes de variación.
    `;

    return await this.claude.complete({ user: prompt });
  }
}
```

### 2.4 DocumentIAService - Procesamiento de Documentos

```typescript
class DocumentIAService {

  /**
   * Procesa PDF de acuerdo paritario y extrae escalas
   */
  async processAgreement(
    pdfBuffer: Buffer,
    cctCodigo: string
  ): Promise<AcuerdoParitario> {
    // Extraer texto del PDF
    const texto = await this.extractPdfText(pdfBuffer);

    const prompt = `
      Analiza este acuerdo paritario del CCT ${cctCodigo}:

      ${texto}

      EXTRAE:
      1. Fecha de vigencia
      2. Nuevas escalas salariales por categoría
      3. Sumas no remunerativas (si hay)
      4. Adicionales nuevos o modificados
      5. Cualquier otra modificación relevante

      FORMATO JSON:
      {
        "vigenciaDesde": "YYYY-MM-DD",
        "escalas": [
          { "categoria": "", "salarioBasico": 0, "adicionales": {} }
        ],
        "sumasNoRemunerativas": [
          { "mes": "", "monto": 0, "descripcion": "" }
        ],
        "conceptosNuevos": [
          { "codigo": "", "nombre": "", "formula": "", "tipo": "" }
        ],
        "observaciones": ""
      }
    `;

    return await this.claude.complete({ user: prompt });
  }

  /**
   * Procesa DNI para alta de empleado
   */
  async processDNI(
    imageBuffer: Buffer
  ): Promise<DatosPersonales> {
    // Usar visión de Claude
    const prompt = `
      Extrae los datos de este DNI argentino:

      - Apellido y Nombre
      - Número de documento
      - Fecha de nacimiento
      - Sexo
      - Nacionalidad

      FORMATO JSON:
      {
        "apellido": "",
        "nombre": "",
        "dni": "",
        "fechaNacimiento": "YYYY-MM-DD",
        "sexo": "M|F",
        "nacionalidad": "",
        "cuilSugerido": "" // Calcular CUIL probable
      }
    `;

    return await this.claude.completeWithImage({
      user: prompt,
      image: imageBuffer
    });
  }

  /**
   * Procesa información de SIRADIG/F.572
   */
  async processSIRADIG(
    data: any
  ): Promise<DeduccionesGanancias> {
    const prompt = `
      Procesa estos datos del SIRADIG y calcula las deducciones:

      ${JSON.stringify(data)}

      Considera:
      - Cargas de familia
      - Alquiler de vivienda (tope 40% del MNI)
      - Cuotas médico-asistenciales
      - Servicio doméstico
      - Otras deducciones permitidas

      FORMATO JSON con totales mensuales y anuales.
    `;

    return await this.claude.complete({ user: prompt });
  }
}
```

### 2.5 QueryIAService - Consultas en Lenguaje Natural

```typescript
class QueryIAService {

  /**
   * Procesa consulta de empleado en portal de autogestión
   */
  async empleadoQuery(
    query: string,
    empleadoId: string
  ): Promise<RespuestaEmpleado> {
    // Obtener datos del empleado
    const empleado = await this.getEmpleadoData(empleadoId);
    const ultimasLiquidaciones = await this.getUltimasLiquidaciones(empleadoId, 3);

    const prompt = `
      Eres un asistente de RRHH respondiendo a un empleado.

      EMPLEADO: ${empleado.nombre}
      CONSULTA: "${query}"

      DATOS DISPONIBLES:
      - Últimas 3 liquidaciones: ${JSON.stringify(ultimasLiquidaciones)}
      - Saldo vacaciones: ${empleado.saldoVacaciones} días
      - Antigüedad: ${empleado.antiguedad} años

      REGLAS:
      1. Responde de forma amable y clara
      2. No reveles información sensible de otros empleados
      3. Si no podés responder, sugiere contactar a RRHH
      4. Usa formato de moneda argentina ($ con puntos de miles)
      5. Si es sobre deducciones, sugiere cargar en SIRADIG
    `;

    return await this.claude.complete({ user: prompt });
  }

  /**
   * Genera reportes a partir de descripción
   */
  async generateReport(
    descripcion: string,
    tenantId: string
  ): Promise<ReporteGenerado> {
    const prompt = `
      Genera un reporte basado en esta descripción:
      "${descripcion}"

      Define:
      1. Qué datos necesita
      2. Filtros a aplicar
      3. Agrupaciones
      4. Cálculos necesarios
      5. Formato de salida (tabla, gráfico, etc.)

      FORMATO JSON para que el sistema ejecute el reporte.
    `;

    const especificacion = await this.claude.complete({ user: prompt });

    // Ejecutar el reporte
    return await this.executeReport(especificacion, tenantId);
  }
}
```

### 2.6 SetupIAService - Asistente de Configuración

```typescript
class SetupIAService {

  /**
   * Asistente de configuración inicial
   */
  async setupWizard(
    tenantId: string,
    respuestas: Map<string, string>
  ): Promise<ConfiguracionSugerida> {
    const prompt = `
      Configura un módulo de sueldos para Argentina basado en estas respuestas:

      ${JSON.stringify(Object.fromEntries(respuestas))}

      SUGIERE:
      1. CCT recomendado (o configuración personalizada)
      2. Categorías a crear
      3. Conceptos base a configurar
      4. Workflow de aprobación
      5. Cualquier otra configuración relevante

      Ten en cuenta:
      - Legislación laboral argentina
      - Mejores prácticas de liquidación
      - Simplicidad para el usuario
    `;

    return await this.claude.complete({ user: prompt });
  }

  /**
   * Sugiere CCT basado en actividad
   */
  async suggestCCT(
    actividadPrincipal: string
  ): Promise<CCTSugerido[]> {
    const prompt = `
      Para una empresa con actividad: "${actividadPrincipal}"

      Sugiere los CCT aplicables en Argentina, ordenados por relevancia.

      Para cada uno incluye:
      - Código y nombre del CCT
      - Sindicato
      - Por qué aplica
      - Categorías principales
      - Adicionales típicos

      FORMATO JSON.
    `;

    return await this.claude.complete({ user: prompt });
  }
}
```

---

## 3. Flujos de Usuario con IA

### 3.1 Creación de Concepto con Lenguaje Natural

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CREADOR DE CONCEPTOS CON IA                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Describí el concepto que querés crear:                                    │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ "Quiero un bono por puntualidad: si el empleado no llegó tarde       │ │
│  │  ningún día del mes, cobra el 5% del básico. Si llegó tarde 1 o 2   │ │
│  │  veces, cobra la mitad. Más de 2 llegadas tarde, no cobra nada."    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│  [🎤 Dictar]  [📎 Adjuntar ejemplo]                                        │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  🤖 Interpreté lo siguiente:                                                │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ Concepto: "Bono por Puntualidad"                                      │ │
│  │ Nombre corto: "Puntual."                                              │ │
│  │ Tipo: Remunerativo ✓                                                  │ │
│  │                                                                       │ │
│  │ Fórmula:                                                              │ │
│  │ SI(LLEGADAS_TARDE = 0,                                                │ │
│  │    BASICO * 0.05,                                                     │ │
│  │    SI(LLEGADAS_TARDE <= 2,                                            │ │
│  │       BASICO * 0.025,                                                 │ │
│  │       0))                                                             │ │
│  │                                                                       │ │
│  │ Aplicaciones:                                                         │ │
│  │ ✓ Aportes y contribuciones                                           │ │
│  │ ✓ Base para SAC                                                      │ │
│  │ ✓ Base para vacaciones                                               │ │
│  │ ✓ Impuesto a las Ganancias                                           │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  📊 Simulación con datos reales (octubre 2024):                            │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ Empleado        │ Llegadas tarde │ Básico      │ Bono                │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │ García, Juan    │ 0              │ $500.000    │ $25.000  (100%)    │ │
│  │ López, María    │ 1              │ $600.000    │ $15.000  (50%)     │ │
│  │ Pérez, Carlos   │ 4              │ $550.000    │ $0       (0%)      │ │
│  │ Rodríguez, Ana  │ 2              │ $480.000    │ $12.000  (50%)     │ │
│  │ ... (ver 46 más)                                                     │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  💬 ¿Querés ajustar algo?                                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ "Que el tope sean 3 llegadas tarde para el 50%"                      │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  [✓ Crear concepto]  [🧪 Probar otro mes]  [✎ Editar fórmula]  [❌ Cancelar]│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Análisis Pre-Cierre con IA

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔍 ANÁLISIS PRE-CIERRE - Noviembre 2024                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🤖 Revisé 523 liquidaciones. Encontré:                                     │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  🔴 CRÍTICO (3) - Requiere corrección antes de cerrar                      │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ 1. González, Ana - Horas extras negativas (-12hs)                     │ │
│  │    Causa: Fichaje de salida antes de entrada el 15/11                │ │
│  │    Sugerencia: Corregir a 08:00-17:00 (horario habitual)             │ │
│  │    [Ver fichajes]  [Corregir automático]  [Ignorar]                  │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │ 2. Fernández, Luis - Sueldo $0                                        │ │
│  │    Causa: Sin fichajes todo el mes, sin licencia registrada          │ │
│  │    Sugerencia: ¿Baja no procesada? ¿Licencia sin goce?              │ │
│  │    [Ver legajo]  [Registrar baja]  [Agregar licencia]                │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │ 3. Martínez, Pedro - Básico menor al mínimo de convenio              │ │
│  │    Causa: Categoría "Vigilador Gral" requiere mín $XXX.XXX           │ │
│  │    Sugerencia: Actualizar básico o verificar categoría              │ │
│  │    [Actualizar sueldo]  [Cambiar categoría]  [Ver escala]           │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  🟡 ADVERTENCIA (8) - Revisar antes de cerrar                              │
│                                                                             │
│  ├─ 5 empleados con horas extras > 30 mensuales (límite legal)            │
│  │  [Ver listado]                                                         │
│  ├─ 2 empleados con variación > 40% vs mes anterior                       │
│  │  [Ver detalle]                                                         │
│  └─ 1 empleado próximo a superar tope SIPA                                │
│     [Ver detalle]                                                         │
│                                                                             │
│  🟢 INFORMACIÓN (15)                                                        │
│                                                                             │
│  ├─ 12 empleados cumplen aniversario (revisar adicional antigüedad)       │
│  ├─ 2 empleados completan período de prueba                               │
│  └─ 1 empleado alcanza 20 años (pasa a 35 días vacaciones)                │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  [Corregir todos los críticos]  [Exportar reporte]  [Continuar con cierre]  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Consultas en Lenguaje Natural

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 💬 CONSULTAS - Asistente IA                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ 👤 "¿Cuánto pagamos de aportes patronales el mes pasado?"             │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  🤖 En octubre 2024 pagaron $X.XXX.XXX en contribuciones patronales:       │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ Concepto                    │ Monto         │ %                       │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │ SIPA (Jubilación)           │ $X.XXX.XXX    │ 10.77%                  │ │
│  │ Obra Social                 │ $XXX.XXX      │ 6.00%                   │ │
│  │ PAMI (INSSJP)               │ $XXX.XXX      │ 1.58%                   │ │
│  │ Asig. Familiares            │ $XXX.XXX      │ 4.70%                   │ │
│  │ FNE                         │ $XX.XXX       │ 0.95%                   │ │
│  │ ART (variable)              │ $XXX.XXX      │ ~2.5%                   │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │ TOTAL                       │ $X.XXX.XXX    │ ~26.5%                  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  📈 Comparado con septiembre: +5.2%                                        │
│     Causa: Aumento paritario CCT 507/07 desde 01/10                        │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ 👤 "Dame el costo laboral por sucursal este año vs el anterior"       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  🤖 Generando reporte...                                                    │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ Sucursal     │ 2023         │ 2024         │ Variación               │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │ Casa Central │ $45.2M       │ $52.8M       │ +16.8%                  │ │
│  │ Zona Norte   │ $28.1M       │ $31.5M       │ +12.1%                  │ │
│  │ Zona Sur     │ $22.4M       │ $25.2M       │ +12.5%                  │ │
│  │ Interior     │ $18.7M       │ $24.3M       │ +29.9% ⚠️               │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │ TOTAL        │ $114.4M      │ $133.8M      │ +17.0%                  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  📊 [Ver gráfico]  📥 [Exportar Excel]  📄 [Generar PDF]                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Portal del Empleado con IA

### 4.1 Chatbot de Autogestión

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 💬 ASISTENTE RRHH - Portal del Empleado                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  👤 Juan García                                    🟢 Conectado            │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  👤 ¿Por qué me descontaron más este mes?                                  │
│                                                                             │
│  🤖 Hola Juan! Revisé tu recibo de noviembre y encontré                    │
│     que la diferencia es por:                                               │
│                                                                             │
│     1. Impuesto a las Ganancias: +$15.340                                  │
│        → El SAC de diciembre genera retención adicional                    │
│          (se prorratea mensualmente según RG 5531/2024)                    │
│                                                                             │
│     2. Cuota sindical extraordinaria: +$8.500                              │
│        → Aporte solidario acordado en última paritaria                     │
│                                                                             │
│     Tu neto pasó de $892.450 a $868.610 (-$23.840)                        │
│                                                                             │
│     ¿Querés ver el detalle de Ganancias?                                   │
│     ¿Tenés deducciones para cargar que reduzcan el impuesto?              │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  👤 Sí, empecé a alquilar hace 2 meses                                     │
│                                                                             │
│  🤖 ¡Eso te puede ayudar! El alquiler de vivienda se deduce               │
│     del Impuesto a las Ganancias.                                          │
│                                                                             │
│     Para cargarlo necesitás:                                                │
│     1. Entrar a SIRADIG (web de AFIP con clave fiscal)                    │
│     2. Ir a "Carga de formulario" → "Deducciones"                         │
│     3. Seleccionar "Alquiler de inmuebles destinados a casa-habitación"   │
│     4. Cargar los datos del propietario y monto mensual                   │
│     5. Adjuntar contrato de alquiler                                       │
│                                                                             │
│     📋 Te envié las instrucciones detalladas a tu email.                  │
│                                                                             │
│     ⚠️ Recordá que el tope deducible es el 40% del MNI                    │
│        (aprox. $XXX.XXX anuales actualmente)                               │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ Escribí tu consulta...                                    [Enviar 📤] │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  Consultas frecuentes:                                                      │
│  [📅 ¿Cuántos días de vacaciones tengo?]                                   │
│  [💰 ¿Cuándo cobro el aguinaldo?]                                          │
│  [📄 Descargar último recibo]                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Implementación Técnica

### 5.1 Configuración del Cliente Claude

```typescript
// lib/ia/claude-client.ts

import Anthropic from '@anthropic-ai/sdk';

class ClaudeClient {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  async complete(params: {
    system?: string;
    user: string;
    model?: string;
  }): Promise<string> {
    const response = await this.client.messages.create({
      model: params.model || 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: params.system,
      messages: [{ role: 'user', content: params.user }]
    });

    return response.content[0].text;
  }

  async completeWithImage(params: {
    user: string;
    image: Buffer;
  }): Promise<string> {
    const base64Image = image.toString('base64');

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: base64Image
            }
          },
          { type: 'text', text: params.user }
        ]
      }]
    });

    return response.content[0].text;
  }
}

export const claude = new ClaudeClient();
```

### 5.2 Cache de Respuestas IA

```typescript
// Para consultas frecuentes, cachear respuestas

class IACacheService {
  private cache: Map<string, CachedResponse>;

  async getCachedOrCompute(
    key: string,
    compute: () => Promise<string>,
    ttlMinutes: number = 60
  ): Promise<string> {
    const cached = this.cache.get(key);

    if (cached && !this.isExpired(cached, ttlMinutes)) {
      return cached.response;
    }

    const response = await compute();
    this.cache.set(key, {
      response,
      timestamp: Date.now()
    });

    return response;
  }
}
```

---

## 6. Consideraciones de Seguridad

### 6.1 Sanitización de Datos

```typescript
// Antes de enviar datos a la IA, sanitizar información sensible

function sanitizeForIA(data: any): any {
  return {
    ...data,
    // Reemplazar datos sensibles
    dni: 'XX.XXX.XXX',
    cbu: 'XXXXXXXXXXXXXXXXXXXX',
    email: data.email.replace(/(.{3}).*(@.*)/, '$1***$2'),
    // Mantener datos necesarios para análisis
    salario: data.salario,
    categoria: data.categoria
  };
}
```

### 6.2 Límites de Uso

```typescript
// Rate limiting para llamadas a la IA

const iaLimits = {
  // Por tenant
  maxRequestsPerHour: 100,
  maxTokensPerDay: 1_000_000,

  // Por usuario
  maxQueriesPerHour: 20,

  // Por tipo de operación
  limits: {
    formulaGeneration: 50,  // por día
    documentProcessing: 10, // por día
    queries: 200           // por día
  }
};
```

---

## 7. Mejora Continua

### 7.1 Feedback de Usuarios

```typescript
// Recopilar feedback para mejorar respuestas

interface IAFeedback {
  queryId: string;
  userId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  wasHelpful: boolean;
  correction?: string;  // Si el usuario corrigió algo
}

// Usar feedback para fine-tuning de prompts
```

### 7.2 Aprendizaje de Patrones

```typescript
// La IA puede detectar patrones en el uso

class PatternLearningService {

  async detectPatterns(tenantId: string): Promise<PatternSuggestion[]> {
    // Analizar ajustes manuales frecuentes
    // Sugerir automatización

    const prompt = `
      Analiza estos ajustes manuales del último trimestre:
      ${JSON.stringify(ajustesManuales)}

      ¿Hay patrones que sugieran crear conceptos o fórmulas automáticas?
    `;

    return await this.claude.complete({ user: prompt });
  }
}
```

---

*Documento creado: 28/11/2024*
*Última actualización: 28/11/2024*
