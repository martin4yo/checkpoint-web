# MÓDULO DE SUELDOS - ARQUITECTURA DE INTELIGENCIA ARTIFICIAL

## Descripción
Este documento detalla la arquitectura recomendada para la integración de IA en el módulo de sueldos, incluyendo comparativa de modelos, estrategias de implementación, costos y consideraciones de privacidad para Argentina.

---

## 1. Análisis del Mercado de LLMs

### 1.1 No Existe un Modelo Especializado en Payroll

No hay un LLM específicamente entrenado para liquidación de sueldos. La estrategia recomendada es usar **modelos de propósito general con prompts especializados** y, opcionalmente, fine-tuning.

### 1.2 Tendencias del Mercado 2024-2025

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EVOLUCIÓN DEL MERCADO ENTERPRISE                          │
└─────────────────────────────────────────────────────────────────────────────┘

  Market Share Enterprise LLMs:

  2023:  OpenAI ████████████████████████████████████████████████████ 50%
         Anthropic ████████████ 12%
         Google ██████████ 10%
         Otros ████████████████████████████ 28%

  2024:  OpenAI ██████████████████████████████████ 34%
         Anthropic ████████████████████████ 24%
         Google ████████████████ 16%
         Open Source ██████████████████████████ 26%

  Factores de cambio:
  • 46% citan seguridad como razón de cambio
  • 44% citan precio
  • 42% citan performance
  • 78% usan estrategia multi-modelo
```

---

## 2. Comparativa de Modelos para el Proyecto

### 2.1 Matriz de Evaluación

| Criterio | Claude | GPT-4 | Gemini | Llama 3.3 | Mistral |
|----------|--------|-------|--------|-----------|---------|
| **Generación de fórmulas** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Razonamiento multi-paso** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Contexto largo** | 200K | 128K-1M | 2M | 128K | 32K |
| **Procesamiento PDFs** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| **Seguridad/Privacidad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Español Argentina** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Costo API** | $3-15/1M | $2-10/1M | $1.25-2.50/1M | $0 | $0 |
| **Self-hosting** | ❌ | ❌ | ❌ | ✅ | ✅ |

### 2.2 Análisis Detallado por Modelo

#### Claude (Anthropic)

**Versiones disponibles:**
- **Claude Opus 4**: Máxima capacidad, ideal para tareas complejas
- **Claude Sonnet 4.5/4**: Balance óptimo calidad/costo (recomendado)
- **Claude Haiku 3.5**: Más rápido y económico, para tareas simples

**Fortalezas para este proyecto:**
- Mejor en razonamiento lógico y generación de código
- Constitutional AI (más seguro para datos sensibles)
- Excelente comprensión del español y contexto argentino
- API simple y bien documentada
- Soporte nativo para herramientas (function calling)

**Debilidades:**
- No permite self-hosting
- Costo medio-alto para volumen elevado

```typescript
// Ejemplo de uso
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const response = await client.messages.create({
  model: 'claude-sonnet-4-5-20250514',
  max_tokens: 4096,
  system: `Eres un experto en liquidación de sueldos de Argentina.
           Conocés la Ley 20.744, convenios colectivos y normativa AFIP.`,
  messages: [
    { role: 'user', content: 'Generá una fórmula para antigüedad al 1% por año' }
  ]
});
```

#### GPT-4 (OpenAI)

**Versiones disponibles:**
- **GPT-4 Turbo**: 128K contexto, buena relación calidad/precio
- **GPT-4o**: Optimizado para velocidad
- **GPT-4.1**: Última versión, mejor en código

**Fortalezas:**
- Ecosistema maduro con muchas integraciones
- Buena documentación y comunidad
- Function calling robusto

**Debilidades:**
- Menor precisión en razonamiento complejo vs Claude
- Políticas de datos menos claras

#### Gemini (Google)

**Versiones disponibles:**
- **Gemini 2.5 Pro**: Contexto de 2M tokens (ideal para legislación completa)
- **Gemini Flash**: Ultra económico ($0.075/1M tokens)

**Fortalezas:**
- Contexto masivo (puede cargar toda la LCT + CCTs)
- Excelente procesamiento de documentos
- Integración nativa con Google Workspace
- Muy económico

**Debilidades:**
- Menor calidad en razonamiento lógico
- Español técnico menos preciso

#### Llama 3.3 (Meta) - Open Source

**Versiones disponibles:**
- **Llama 3.3 70B**: Performance comparable a GPT-4
- **Llama 3.2 8B**: Ligero, para edge computing

**Fortalezas:**
- 100% self-hosted (privacidad total)
- Sin costos de API
- Licencia permisiva para uso comercial
- Fine-tuning posible

**Debilidades:**
- Requiere infraestructura propia
- Menor calidad en español que modelos propietarios
- Más complejo de mantener

#### Mistral (Mistral AI) - Open Source

**Versiones disponibles:**
- **Mistral Large**: Comparable a GPT-4
- **Mistral 7B**: Muy eficiente para su tamaño

**Fortalezas:**
- Excelente relación performance/recursos
- Licencia Apache 2.0
- Optimizado para inferencia rápida

**Debilidades:**
- Contexto limitado (32K tokens)
- Comunidad más pequeña que Llama

---

## 3. Arquitectura Recomendada

### 3.1 Estrategia: Arquitectura Híbrida

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA IA HÍBRIDA                                   │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │   AI ROUTER     │
                              │   (Decisor)     │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
           ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
           │  CLAUDE API     │ │  MODELO LOCAL   │ │  CACHE/REGLAS   │
           │  (Crítico)      │ │  (Volumen)      │ │  (Inmediato)    │
           └─────────────────┘ └─────────────────┘ └─────────────────┘
                    │                  │                  │
                    ▼                  ▼                  ▼
           ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
           │ • Fórmulas NL   │ │ • Chatbot       │ │ • FAQs          │
           │ • Anomalías     │ │ • Explicaciones │ │ • Validaciones  │
           │ • CCT/PDFs      │ │ • Consultas     │ │ • Lookups       │
           │ • Casos edge    │ │   frecuentes    │ │                 │
           └─────────────────┘ └─────────────────┘ └─────────────────┘
```

### 3.2 Distribución de Tareas por Modelo

```typescript
enum TareaIA {
  // Tier 1: Claude (crítico, baja frecuencia)
  FORMULA_GENERATION = 'FORMULA_GENERATION',
  ANOMALY_DETECTION = 'ANOMALY_DETECTION',
  CCT_PROCESSING = 'CCT_PROCESSING',
  COMPLEX_QUERY = 'COMPLEX_QUERY',

  // Tier 2: Local/Económico (alto volumen)
  EMPLOYEE_CHATBOT = 'EMPLOYEE_CHATBOT',
  RECEIPT_EXPLANATION = 'RECEIPT_EXPLANATION',
  SIMPLE_QUERY = 'SIMPLE_QUERY',

  // Tier 3: Cache/Reglas (inmediato)
  FAQ = 'FAQ',
  VALIDATION = 'VALIDATION',
  LOOKUP = 'LOOKUP'
}

interface AIRouterConfig {
  tier1: {
    model: 'claude-sonnet-4-5';
    provider: 'anthropic';
    useCases: TareaIA[];
    maxTokens: 4096;
    temperature: 0.3;  // Bajo para precisión
  };
  tier2: {
    model: 'llama3.3:70b' | 'mistral:7b';
    provider: 'ollama';
    useCases: TareaIA[];
    maxTokens: 2048;
    temperature: 0.5;
  };
  tier3: {
    type: 'cache' | 'rules';
    useCases: TareaIA[];
  };
}
```

### 3.3 Implementación del Router

```typescript
// lib/ia/ai-router.ts

import Anthropic from '@anthropic-ai/sdk';
import { Ollama } from 'ollama';

interface AIRequest {
  type: TareaIA;
  prompt: string;
  context?: any;
  userId?: string;
  tenantId: string;
}

interface AIResponse {
  content: string;
  model: string;
  tier: number;
  tokens: { input: number; output: number };
  latencyMs: number;
  cached: boolean;
}

class AIRouter {
  private claude: Anthropic;
  private ollama: Ollama;
  private cache: Map<string, CachedResponse>;

  constructor() {
    this.claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    this.ollama = new Ollama({
      host: process.env.OLLAMA_HOST || 'http://localhost:11434'
    });

    this.cache = new Map();
  }

  async process(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    // Tier 3: Cache/Reglas
    if (this.isCacheable(request.type)) {
      const cached = this.getFromCache(request);
      if (cached) {
        return {
          content: cached.content,
          model: 'cache',
          tier: 3,
          tokens: { input: 0, output: 0 },
          latencyMs: Date.now() - startTime,
          cached: true
        };
      }
    }

    // Tier 2: Modelo local
    if (this.isLocalTask(request.type)) {
      return this.processLocal(request, startTime);
    }

    // Tier 1: Claude
    return this.processClaude(request, startTime);
  }

  private async processClaude(
    request: AIRequest,
    startTime: number
  ): Promise<AIResponse> {
    const systemPrompt = this.getSystemPrompt(request.type);

    const response = await this.claude.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 4096,
      temperature: 0.3,
      system: systemPrompt,
      messages: [
        { role: 'user', content: request.prompt }
      ]
    });

    const content = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Cachear si es cacheable
    if (this.isCacheable(request.type)) {
      this.saveToCache(request, content);
    }

    return {
      content,
      model: 'claude-sonnet-4-5',
      tier: 1,
      tokens: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens
      },
      latencyMs: Date.now() - startTime,
      cached: false
    };
  }

  private async processLocal(
    request: AIRequest,
    startTime: number
  ): Promise<AIResponse> {
    const systemPrompt = this.getSystemPrompt(request.type);

    const response = await this.ollama.chat({
      model: 'llama3.3:70b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: request.prompt }
      ],
      options: {
        temperature: 0.5,
        num_predict: 2048
      }
    });

    return {
      content: response.message.content,
      model: 'llama3.3:70b',
      tier: 2,
      tokens: {
        input: response.prompt_eval_count || 0,
        output: response.eval_count || 0
      },
      latencyMs: Date.now() - startTime,
      cached: false
    };
  }

  private isLocalTask(type: TareaIA): boolean {
    return [
      TareaIA.EMPLOYEE_CHATBOT,
      TareaIA.RECEIPT_EXPLANATION,
      TareaIA.SIMPLE_QUERY
    ].includes(type);
  }

  private isCacheable(type: TareaIA): boolean {
    return [
      TareaIA.FAQ,
      TareaIA.VALIDATION,
      TareaIA.LOOKUP
    ].includes(type);
  }

  private getSystemPrompt(type: TareaIA): string {
    const prompts: Record<TareaIA, string> = {
      [TareaIA.FORMULA_GENERATION]: PROMPT_FORMULA_GENERATION,
      [TareaIA.ANOMALY_DETECTION]: PROMPT_ANOMALY_DETECTION,
      [TareaIA.CCT_PROCESSING]: PROMPT_CCT_PROCESSING,
      [TareaIA.EMPLOYEE_CHATBOT]: PROMPT_EMPLOYEE_CHATBOT,
      // ... más prompts
    };

    return prompts[type] || PROMPT_DEFAULT;
  }
}

export const aiRouter = new AIRouter();
```

---

## 4. Prompts Especializados

### 4.1 Prompt para Generación de Fórmulas

```typescript
const PROMPT_FORMULA_GENERATION = `
Eres un experto en liquidación de sueldos de Argentina.

CONOCIMIENTOS:
- Ley de Contrato de Trabajo 20.744
- Convenios Colectivos de Trabajo (CCT)
- Normativa AFIP (F.931, Libro de Sueldos Digital)
- Impuesto a las Ganancias 4ta categoría
- Aportes y contribuciones de seguridad social

VARIABLES DISPONIBLES:
- BASICO: Sueldo básico del empleado
- ANTIGUEDAD_AÑOS: Años de antigüedad
- ANTIGUEDAD_MESES: Meses totales de antigüedad
- DIAS_TRABAJADOS: Días efectivamente trabajados
- DIAS_MES: Días del mes
- HORAS_TRABAJADAS: Total horas normales
- HORAS_EXTRAS_50: Horas extra al 50%
- HORAS_EXTRAS_100: Horas extra al 100%
- HORAS_NOCTURNAS: Horas en horario nocturno
- AUSENCIAS: Cantidad de ausencias
- LLEGADAS_TARDE: Cantidad de llegadas tarde
- REMUNERATIVO: Total de conceptos remunerativos
- NO_REMUNERATIVO: Total no remunerativos
- CATEGORIA: Código de categoría del empleado
- CCT: Código del convenio colectivo

FUNCIONES DISPONIBLES:
- SI(condición, valor_verdadero, valor_falso)
- Y(condición1, condición2, ...)
- O(condición1, condición2, ...)
- NO(condición)
- MIN(valor1, valor2)
- MAX(valor1, valor2)
- REDONDEAR(valor, decimales)
- TRUNCAR(valor, decimales)
- ABS(valor)
- HORA_NORMAL(basico, horas_mensuales)
- HORA_EXTRA(basico, porcentaje_recargo)
- PROPORCION(monto, dias_trabajados, dias_mes)
- SAC_PROPORCIONAL(mejor_sueldo, meses_trabajados)
- VACACIONES(basico, dias)
- TOPE_SIPA(valor)

INSTRUCCIONES:
1. Interpreta la descripción del usuario en lenguaje natural
2. Genera una fórmula válida usando la sintaxis anterior
3. Determina si el concepto es REMUNERATIVO, NO_REMUNERATIVO o DESCUENTO
4. Indica si aplica a: aportes, ganancias, SAC, vacaciones

RESPONDE EN JSON:
{
  "formula": "la fórmula generada",
  "concepto": {
    "nombre": "nombre sugerido",
    "nombreCorto": "abreviatura (max 10 chars)",
    "tipo": "REMUNERATIVO|NO_REMUNERATIVO|DESCUENTO",
    "aplicaAportes": true|false,
    "aplicaGanancias": true|false,
    "aplicaSAC": true|false,
    "aplicaVacaciones": true|false
  },
  "explicacion": "explicación clara de qué hace la fórmula",
  "ejemplos": [
    { "caso": "descripción", "valores": {...}, "resultado": 0 }
  ],
  "advertencias": ["posibles problemas"],
  "confianza": 0.0-1.0
}
`;
```

### 4.2 Prompt para Detección de Anomalías

```typescript
const PROMPT_ANOMALY_DETECTION = `
Eres un auditor experto en liquidaciones de sueldos de Argentina.

Tu tarea es analizar liquidaciones y detectar:

ERRORES CRÍTICOS (deben corregirse):
- Sueldos por debajo del mínimo de convenio
- Horas extras excediendo límites legales (30 mensuales, 200 anuales)
- Aportes mal calculados
- Empleados sin CUIL/CBU
- Liquidaciones con valores negativos

ADVERTENCIAS (revisar):
- Variaciones mayores al 30% respecto al mes anterior
- Horas extras inusuales
- Ausencias sin justificar
- Empleados próximos a topes SIPA

INFORMACIÓN (para conocimiento):
- Aniversarios de antigüedad
- Vencimiento de períodos de prueba
- Cambios de categoría pendientes

RESPONDE EN JSON:
{
  "criticos": [
    {
      "empleado": "nombre",
      "cuil": "XX-XXXXXXXX-X",
      "tipo": "código",
      "descripcion": "descripción del problema",
      "valorActual": 0,
      "valorEsperado": 0,
      "sugerencia": "cómo corregirlo"
    }
  ],
  "advertencias": [...],
  "informacion": [...],
  "resumen": "texto resumen general",
  "puedesCerrar": true|false
}
`;
```

### 4.3 Prompt para Chatbot de Empleados

```typescript
const PROMPT_EMPLOYEE_CHATBOT = `
Eres un asistente de RRHH amigable que ayuda a empleados con consultas sobre su sueldo.

REGLAS:
1. Responde de forma clara, amable y profesional
2. Usa formato de moneda argentina ($ con puntos de miles)
3. Si no podés responder algo, sugiere contactar a RRHH
4. NUNCA reveles información de otros empleados
5. NUNCA inventes datos - solo usá la información proporcionada
6. Si preguntan sobre deducciones de ganancias, sugiere cargar en SIRADIG

DATOS DEL EMPLEADO (proporcionados en el contexto):
- Nombre, categoría, antigüedad
- Últimas liquidaciones
- Saldo de vacaciones
- Novedades pendientes

TEMAS QUE PODÉS RESPONDER:
- Explicar conceptos del recibo
- Comparar con meses anteriores
- Informar saldo de vacaciones
- Explicar descuentos (aportes, ganancias)
- Fechas de cobro
- Cómo cargar deducciones en SIRADIG

TEMAS QUE DEBES DERIVAR A RRHH:
- Errores en liquidación
- Cambios de categoría
- Adelantos de sueldo
- Licencias especiales
`;
```

---

## 5. Infraestructura para Modelo Local

### 5.1 Requisitos de Hardware

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REQUISITOS PARA SELF-HOSTING                              │
└─────────────────────────────────────────────────────────────────────────────┘

  Modelo              │ VRAM GPU    │ RAM       │ Storage   │ Notas
  ────────────────────┼─────────────┼───────────┼───────────┼──────────────
  Llama 3.3 70B       │ 40-48 GB    │ 64 GB     │ 150 GB    │ 2x A100 o H100
  Llama 3.3 70B (Q4)  │ 20-24 GB    │ 32 GB     │ 40 GB     │ 1x A100 40GB
  Llama 3.2 8B        │ 8 GB        │ 16 GB     │ 16 GB     │ RTX 3090/4090
  Mistral 7B          │ 6 GB        │ 16 GB     │ 14 GB     │ RTX 3080+
  Mistral 7B (Q4)     │ 4 GB        │ 8 GB      │ 4 GB      │ RTX 3060+

  Recomendación para producción:
  • Opción económica: 1x RTX 4090 (24GB) con Llama 3.2 8B o Mistral 7B
  • Opción balanceada: 1x A100 40GB con Llama 3.3 70B cuantizado
  • Opción premium: 2x A100 80GB para máxima calidad
```

### 5.2 Setup con Ollama

```bash
# Instalación de Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Descargar modelos
ollama pull llama3.3:70b        # Modelo completo (requiere mucha VRAM)
ollama pull llama3.2:8b         # Modelo ligero
ollama pull mistral:7b          # Alternativa eficiente

# Verificar instalación
ollama list

# Ejecutar servidor
ollama serve

# En otro terminal, probar
ollama run llama3.2:8b "Hola, ¿cómo estás?"
```

### 5.3 Docker Compose para Producción

```yaml
# docker-compose.ollama.yml

version: '3.8'

services:
  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    restart: unless-stopped

  # Interfaz web opcional
  ollama-webui:
    image: ghcr.io/open-webui/open-webui:main
    container_name: ollama-webui
    ports:
      - "3001:8080"
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
    depends_on:
      - ollama
    restart: unless-stopped

volumes:
  ollama_data:
```

### 5.4 Alternativa: OpenLLM (BentoML)

```python
# Para más control y escalabilidad

# Instalación
pip install openllm

# Ejecutar modelo
openllm start llama3.3 --backend vllm

# O con Docker
docker run -p 3000:3000 --gpus all \
  ghcr.io/bentoml/openllm:latest \
  start llama3.3 --backend vllm
```

---

## 6. Costos Estimados

### 6.1 Escenario: 500 Empleados, 1 Tenant

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ESTIMACIÓN DE COSTOS MENSUALES                            │
└─────────────────────────────────────────────────────────────────────────────┘

  OPCIÓN A: Solo Claude API
  ─────────────────────────

  Tarea                        │ Frecuencia      │ Tokens/uso │ Costo/mes
  ─────────────────────────────┼─────────────────┼────────────┼───────────
  Generación de fórmulas       │ 20/mes          │ 2,000      │ $1.20
  Análisis pre-cierre          │ 1/mes           │ 50,000     │ $3.00
  Procesamiento CCT/PDFs       │ 2/mes           │ 30,000     │ $1.80
  Chatbot empleados            │ 1,000/mes       │ 500        │ $30.00
  Consultas RRHH               │ 200/mes         │ 1,000      │ $6.00
  ─────────────────────────────┼─────────────────┼────────────┼───────────
  TOTAL CLAUDE                 │                 │            │ ~$42/mes

  ═══════════════════════════════════════════════════════════════════════════

  OPCIÓN B: Híbrido (Claude + Local)
  ───────────────────────────────────

  Claude (crítico)             │                 │            │ ~$12/mes
  Servidor GPU local*          │                 │            │ ~$50/mes
  ─────────────────────────────┼─────────────────┼────────────┼───────────
  TOTAL HÍBRIDO                │                 │            │ ~$62/mes

  * Costo de cloud GPU (Lambda Labs, RunPod) o amortización hardware propio

  ═══════════════════════════════════════════════════════════════════════════

  OPCIÓN C: Solo Local (Llama/Mistral)
  ─────────────────────────────────────

  Servidor GPU dedicado        │                 │            │ $100-300/mes
  (Incluye electricidad, mantenimiento)

  O hardware propio:
  RTX 4090 (~$2,000)           │ Amortización 3 años         │ ~$56/mes
  Servidor + RAM + Storage     │                             │ ~$30/mes
  Electricidad (~500W)         │                             │ ~$40/mes
  ─────────────────────────────┼─────────────────────────────┼───────────
  TOTAL LOCAL                  │                             │ ~$126/mes
```

### 6.2 Escenario de Crecimiento

```
  Empleados    │ Solo Claude  │ Híbrido     │ Solo Local
  ─────────────┼──────────────┼─────────────┼────────────
  100          │ $15/mes      │ $62/mes     │ $126/mes
  500          │ $42/mes      │ $65/mes     │ $126/mes
  1,000        │ $80/mes      │ $75/mes     │ $126/mes
  5,000        │ $350/mes     │ $150/mes    │ $150/mes
  10,000       │ $700/mes     │ $250/mes    │ $200/mes

  Punto de equilibrio Híbrido vs Claude: ~800 empleados
  Punto de equilibrio Local vs Híbrido: ~3,000 empleados
```

---

## 7. Consideraciones de Privacidad (Argentina)

### 7.1 Marco Legal

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CUMPLIMIENTO LEGAL ARGENTINA                              │
└─────────────────────────────────────────────────────────────────────────────┘

  Ley 25.326 - Protección de Datos Personales
  ───────────────────────────────────────────

  DATOS DE SUELDOS = DATOS SENSIBLES

  Requisitos:
  • Consentimiento del titular
  • Medidas de seguridad adecuadas
  • Limitación de transferencia internacional
  • Derecho de acceso, rectificación y supresión

  Transferencia a USA (Claude/OpenAI/Gemini):
  • Requiere cláusulas contractuales tipo
  • O consentimiento expreso del empleado
  • Recomendación: Anonimizar datos antes de enviar
```

### 7.2 Estrategia de Anonimización

```typescript
// lib/ia/privacy.ts

interface DatosOriginales {
  empleado: {
    id: string;
    nombre: string;
    cuil: string;
    email: string;
    cbu: string;
  };
  liquidacion: {
    bruto: number;
    neto: number;
    conceptos: Concepto[];
  };
}

interface DatosAnonimizados {
  empleado: {
    id: string;           // Hash o pseudónimo
    categoria: string;    // OK - no identificable
    antiguedad: number;   // OK - no identificable
  };
  liquidacion: {
    bruto: number;        // OK - para análisis
    neto: number;
    conceptos: {
      tipo: string;
      monto: number;
    }[];
  };
}

function anonimizarParaIA(datos: DatosOriginales): DatosAnonimizados {
  return {
    empleado: {
      id: hashId(datos.empleado.id),  // Pseudonimizar
      categoria: datos.liquidacion.categoria,
      antiguedad: datos.empleado.antiguedad
    },
    liquidacion: {
      bruto: datos.liquidacion.bruto,
      neto: datos.liquidacion.neto,
      conceptos: datos.liquidacion.conceptos.map(c => ({
        tipo: c.tipo,
        monto: c.monto
        // NO incluir: codigo, descripcion personalizada
      }))
    }
  };
}

// Datos que NUNCA se envían a APIs externas
const DATOS_PROHIBIDOS = [
  'nombre',
  'apellido',
  'cuil',
  'dni',
  'cbu',
  'email',
  'telefono',
  'direccion',
  'fechaNacimiento'
];

function validarAntesDeEnviar(datos: any): void {
  const datosString = JSON.stringify(datos).toLowerCase();

  for (const campo of DATOS_PROHIBIDOS) {
    if (datosString.includes(campo)) {
      throw new Error(`Datos sensibles detectados: ${campo}`);
    }
  }

  // Verificar patrones de CUIL/DNI
  const patronCUIL = /\b\d{2}-?\d{8}-?\d\b/;
  if (patronCUIL.test(datosString)) {
    throw new Error('Patrón de CUIL detectado en datos');
  }
}
```

### 7.3 Modelo de Consentimiento

```typescript
// Para cumplir con la ley, documentar el consentimiento

interface ConsentimientoIA {
  empleadoId: string;
  tenantId: string;
  fechaConsentimiento: Date;

  // Qué acepta
  usoIAChatbot: boolean;           // Chatbot de consultas
  usoIAAnalisis: boolean;          // Análisis de liquidación
  transferenciaDatosExterior: boolean;  // Envío a APIs externas

  // Cómo se obtuvo
  metodoConsentimiento: 'CHECKBOX_ONBOARDING' | 'EMAIL' | 'FIRMA';

  // Versión de política
  versionPolitica: string;

  // Revocación
  revocado: boolean;
  fechaRevocacion?: Date;
}
```

---

## 8. Implementación por Fases

### Fase 1: MVP con Claude (Semanas 1-4)

```typescript
// Implementación mínima viable

// 1. Setup básico de Claude
const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 2. Un solo endpoint para fórmulas
app.post('/api/ia/formula', async (req, res) => {
  const { descripcion } = req.body;

  const response = await claude.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 2048,
    system: PROMPT_FORMULA_GENERATION,
    messages: [{ role: 'user', content: descripcion }]
  });

  res.json(JSON.parse(response.content[0].text));
});

// 3. Endpoint para análisis pre-cierre
app.post('/api/ia/analisis', async (req, res) => {
  const { periodoId } = req.body;
  const liquidaciones = await getLiquidaciones(periodoId);

  const datosAnonimizados = liquidaciones.map(anonimizarParaIA);

  const response = await claude.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 4096,
    system: PROMPT_ANOMALY_DETECTION,
    messages: [{
      role: 'user',
      content: JSON.stringify(datosAnonimizados)
    }]
  });

  res.json(JSON.parse(response.content[0].text));
});
```

### Fase 2: Agregar Chatbot (Semanas 5-8)

```typescript
// Agregar chatbot para empleados (todavía con Claude)

app.post('/api/ia/chat', async (req, res) => {
  const { mensaje, empleadoId } = req.body;

  // Obtener contexto del empleado
  const contexto = await getContextoEmpleado(empleadoId);

  const response = await claude.messages.create({
    model: 'claude-3-5-haiku-20241022',  // Modelo más económico
    max_tokens: 1024,
    system: PROMPT_EMPLOYEE_CHATBOT + `\n\nCONTEXTO:\n${JSON.stringify(contexto)}`,
    messages: [{ role: 'user', content: mensaje }]
  });

  res.json({ respuesta: response.content[0].text });
});
```

### Fase 3: Modelo Local para Volumen (Semanas 9-12)

```typescript
// Agregar Ollama para tareas de alto volumen

import { Ollama } from 'ollama';

const ollama = new Ollama({ host: 'http://localhost:11434' });

// Migrar chatbot a local
app.post('/api/ia/chat', async (req, res) => {
  const { mensaje, empleadoId } = req.body;
  const contexto = await getContextoEmpleado(empleadoId);

  // Usar modelo local
  const response = await ollama.chat({
    model: 'llama3.2:8b',
    messages: [
      { role: 'system', content: PROMPT_EMPLOYEE_CHATBOT },
      { role: 'user', content: `Contexto: ${JSON.stringify(contexto)}\n\nPregunta: ${mensaje}` }
    ]
  });

  res.json({ respuesta: response.message.content });
});

// Claude solo para tareas críticas
app.post('/api/ia/formula', async (req, res) => {
  // ... sigue usando Claude
});
```

---

## 9. Monitoreo y Métricas

### 9.1 Métricas a Trackear

```typescript
interface MetricasIA {
  // Por modelo
  porModelo: {
    modelo: string;
    requests: number;
    tokensInput: number;
    tokensOutput: number;
    costoEstimado: number;
    latenciaPromedio: number;
    errores: number;
  }[];

  // Por tipo de tarea
  porTarea: {
    tarea: TareaIA;
    requests: number;
    exitosos: number;
    fallidos: number;
    satisfaccionUsuario: number;  // Si hay feedback
  }[];

  // Cache
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
  };

  // Alertas
  alertas: {
    costoExcedido: boolean;
    latenciaAlta: boolean;
    errorRateAlto: boolean;
  };
}
```

### 9.2 Dashboard de Monitoreo

```typescript
// Guardar métricas en cada request

async function logMetricaIA(
  request: AIRequest,
  response: AIResponse
): Promise<void> {
  await prisma.metricaIA.create({
    data: {
      tenantId: request.tenantId,
      userId: request.userId,
      tarea: request.type,
      modelo: response.model,
      tier: response.tier,
      tokensInput: response.tokens.input,
      tokensOutput: response.tokens.output,
      latenciaMs: response.latencyMs,
      cached: response.cached,
      exitoso: true,
      timestamp: new Date()
    }
  });
}

// Endpoint para dashboard
app.get('/api/admin/ia/metricas', async (req, res) => {
  const { desde, hasta, tenantId } = req.query;

  const metricas = await prisma.metricaIA.groupBy({
    by: ['modelo', 'tarea'],
    where: {
      tenantId,
      timestamp: { gte: desde, lte: hasta }
    },
    _count: true,
    _sum: {
      tokensInput: true,
      tokensOutput: true,
      latenciaMs: true
    },
    _avg: {
      latenciaMs: true
    }
  });

  res.json(calcularCostos(metricas));
});
```

---

## 10. Recomendación Final

### Para Empezar (MVP)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RECOMENDACIÓN: EMPEZAR CON CLAUDE                         │
└─────────────────────────────────────────────────────────────────────────────┘

  ¿Por qué Claude?

  ✓ Mejor en generación de fórmulas y razonamiento lógico
  ✓ Más seguro para datos sensibles (Constitutional AI)
  ✓ Excelente comprensión del español y contexto argentino
  ✓ Setup inmediato (solo API key)
  ✓ Costo razonable para volumen inicial (~$42/mes para 500 empleados)
  ✓ Fácil migrar a híbrido después

  Modelos recomendados:
  • claude-sonnet-4-5: Para fórmulas y análisis (precisión)
  • claude-3-5-haiku: Para chatbot (economía)
```

### Plan de Evolución

```
  Fase 1 (MVP)         Fase 2 (Escala)        Fase 3 (Optimización)
  ─────────────        ───────────────        ─────────────────────

  Solo Claude    ───▶  Claude + Cache   ───▶  Híbrido + Fine-tuning
  ~$42/mes             ~$35/mes               ~$65/mes (volumen alto)

  Trigger para Fase 2: Costos > $60/mes o latencia alta
  Trigger para Fase 3: Costos > $150/mes o requisito de privacidad
```

---

## 11. Referencias

### Documentación Oficial
- [Anthropic Claude API](https://docs.anthropic.com/)
- [OpenAI API](https://platform.openai.com/docs)
- [Google Gemini API](https://ai.google.dev/docs)
- [Ollama](https://ollama.com/)
- [OpenLLM](https://github.com/bentoml/OpenLLM)

### Comparativas
- [GPT-4 vs Gemini vs Claude - Medium](https://medium.com/@vishalshevale/gpt-4-vs-gemini-vs-claude-which-ai-model-should-developers-use-in-2024-76b6177e8b94)
- [Best Open-Source LLMs](https://aicompetence.org/best-open-source-llms-for-self-hosting/)
- [AI in Payroll Trends](https://www.matellio.com/blog/ai-in-payroll/)

### Legislación Argentina
- [Ley 25.326 - Protección de Datos Personales](https://www.argentina.gob.ar/normativa/nacional/ley-25326-64790)

---

*Documento creado: 28/11/2024*
*Última actualización: 28/11/2024*
