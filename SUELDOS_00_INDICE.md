# MÓDULO DE LIQUIDACIÓN DE SUELDOS - ARGENTINA

## Índice Principal de Documentación

> **Fecha de creación:** 28/11/2024
> **Estado:** Análisis y diseño completado, pendiente de desarrollo
> **Aplicación base:** Checkpoint-Web (Next.js 15 + Prisma + PostgreSQL)

---

## 🎯 Resumen Ejecutivo

Este proyecto extiende la aplicación Checkpoint-Web para incluir un módulo completo de **liquidación de sueldos para Argentina**, con las siguientes características principales:

- ✅ **CCT Configurable** por tenant (piloto: CCT 507/07 Vigiladores)
- ✅ **Motor de fórmulas** con lenguaje natural (IA)
- ✅ **Impuesto a las Ganancias** completo con SIRADIG/F.572
- ✅ **Reportes AFIP** (Libro de Sueldos Digital, F.931, Simplificación Registral)
- ✅ **Workflow de aprobación** configurable
- ✅ **Integración con fichadas** (checkpoints existentes)
- ✅ **Auditoría completa** con snapshots
- ✅ **Escala:** Optimizado para 500+ empleados por tenant

---

## 📚 Documentos del Proyecto

| # | Documento | Descripción | Prioridad |
|---|-----------|-------------|-----------|
| 00 | `SUELDOS_00_INDICE.md` | **Este archivo** - Índice y resumen | - |
| 01 | `SUELDOS_01_VISION_GENERAL.md` | Arquitectura, flujos, stack tecnológico | 🔴 Alta |
| 02 | `SUELDOS_02_MODELO_DATOS.md` | Modelos Prisma completos, CCT 507/07 | 🔴 Alta |
| 03 | `SUELDOS_03_MOTOR_FORMULAS.md` | Sintaxis, variables, funciones, UI híbrida | 🔴 Alta |
| 04 | `SUELDOS_04_INTEGRACION_IA.md` | Servicios IA, prompts, flujos de usuario | 🟡 Media |
| 05 | `SUELDOS_05_CALCULOS_ARGENTINA.md` | Aportes, SAC, vacaciones, ganancias, horas extras | 🔴 Alta |
| 06 | `SUELDOS_06_REPORTES_AFIP.md` | Libro Digital, F.931, recibos PDF, bancos | 🟡 Media |
| 07 | `SUELDOS_07_WORKFLOW_APROBACION.md` | Estados, roles, aprobaciones, notificaciones | 🟡 Media |
| 08 | `SUELDOS_08_INTEGRACION_CHECKPOINTS.md` | Fichadas, horas, ausencias, presentismo | 🔴 Alta |
| 09 | `SUELDOS_09_ARQUITECTURA_IA.md` | Comparativa modelos, costos, implementación | 🟡 Media |
| 10 | `SUELDOS_10_ROADMAP.md` | **Plan de trabajo con hitos tildables** | 🔴 Alta |

---

## 🔧 Decisiones Técnicas Tomadas

### Alcance Funcional

| Área | Decisión | Documento |
|------|----------|-----------|
| CCT | Configurable por tenant | 02 |
| Imp. Ganancias | Completo con SIRADIG | 05 |
| Fórmulas | Motor de reglas + IA | 03, 04 |
| Reportes | Suite AFIP completa | 06 |
| Valores legales | Tabla versionada | 02, 05 |
| Períodos | Totalmente flexible | 01, 02 |
| UX Configuración | Modo híbrido (visual + código) | 03 |
| Workflow | Configurable por tenant | 07 |
| Integración fichadas | Completa con checkpoints | 08 |
| Pagos | Solo recibo (sin transferencias) | 06 |
| Auditoría | Full con snapshots | 01, 02 |
| Escala | 500+ empleados | 01 |

### Stack Tecnológico

| Componente | Tecnología | Notas |
|------------|------------|-------|
| Framework | Next.js 15 (App Router) | Existente |
| Base de datos | PostgreSQL 14+ | Existente |
| ORM | Prisma 6 | Existente |
| IA (recomendado) | Claude API (Anthropic) | Nuevo |
| IA (alternativa) | Llama 3.3 / Mistral (self-hosted) | Opcional |
| Colas | Bull/BullMQ + Redis | Nuevo |
| PDF | @react-pdf/renderer | Nuevo |
| Excel | exceljs | Nuevo |

### Motor de IA

| Aspecto | Decisión |
|---------|----------|
| Modelo principal | Claude Sonnet 4.5 |
| Modelo económico | Claude Haiku 3.5 |
| Self-hosted (opcional) | Llama 3.3 70B con Ollama |
| Costo estimado | ~$42/mes para 500 empleados |

---

## 📋 CCT Piloto: 507/07 Vigiladores

**Sindicato:** UPSRA (Unión Personal de Seguridad de la República Argentina)

### Categorías
1. Vigilador General
2. Vigilador Bombero
3. Vigilador Principal
4. Verificador de Eventos
5. Operador de Monitoreo
6. Controlador de Admisión
7. Administrativo
8. Guía Técnico

### Conceptos Específicos
- Presentismo: 8.33% sobre básico (sin ausencias)
- Antigüedad: 1% por año trabajado
- Viáticos: Por día trabajado (no remunerativo)
- Nocturnidad: Adicional por horas nocturnas
- Beneficio Social: Vales de alimentación

---

## 🧮 Cálculos Argentina - Resumen

### Aportes del Empleado (17%)
- Jubilación (SIPA): 11%
- Obra Social: 3%
- PAMI (INSSJP): 3%

### Contribuciones Patronales (~26%)
- SIPA: 10.77%
- PAMI: 1.58%
- Asignaciones Familiares: 4.70%
- FNE: 0.95%
- Obra Social: 6%
- ART: Variable
- Seguro Vida: Variable

### SAC (Aguinaldo)
- 2 cuotas: Junio y Diciembre
- Cálculo: 50% del mejor sueldo del semestre
- Proporcional: (sueldo / 12) × meses trabajados

### Vacaciones
- Hasta 5 años: 14 días
- 5-10 años: 21 días
- 10-20 años: 28 días
- +20 años: 35 días
- Plus vacacional: Sueldo / 25 × días

### Horas Extras
- Días comunes: +50%
- Sábados después 13hs, domingos, feriados: +100%
- Límite: 30 mensuales, 200 anuales

---

## 🚀 Plan de Implementación Sugerido

### Fase 1: Fundamentos (Semanas 1-4)
- [ ] Migración de base de datos (modelos Prisma)
- [ ] CRUD de CCT y categorías
- [ ] CRUD de conceptos de liquidación
- [ ] Motor de fórmulas básico (sin IA)

### Fase 2: Cálculos Core (Semanas 5-8)
- [ ] Cálculo de aportes y contribuciones
- [ ] Integración con checkpoints (horas)
- [ ] SAC y vacaciones
- [ ] Impuesto a las Ganancias básico

### Fase 3: Workflow y Reportes (Semanas 9-12)
- [ ] Estados de liquidación
- [ ] Workflow de aprobación
- [ ] Generación de recibos PDF
- [ ] Libro de Sueldos Digital

### Fase 4: IA y Optimización (Semanas 13-16)
- [ ] Integración Claude API
- [ ] Fórmulas con lenguaje natural
- [ ] Detección de anomalías
- [ ] Chatbot empleados

### Fase 5: Reportes AFIP (Semanas 17-20)
- [ ] F.931 (SUSS)
- [ ] Simplificación Registral
- [ ] Archivos bancarios
- [ ] Ganancias completo (SIRADIG)

---

## 📁 Estructura de Archivos Sugerida

```
src/
├── app/
│   ├── api/
│   │   └── sueldos/
│   │       ├── cct/
│   │       ├── conceptos/
│   │       ├── formulas/
│   │       ├── periodos/
│   │       ├── liquidaciones/
│   │       ├── reportes/
│   │       └── ia/
│   └── sueldos/
│       ├── configuracion/
│       ├── liquidacion/
│       ├── reportes/
│       └── empleados/
├── components/
│   └── sueldos/
│       ├── FormulaEditor/
│       ├── LiquidacionTable/
│       ├── ReciboPreview/
│       └── WorkflowStatus/
├── lib/
│   └── sueldos/
│       ├── calculos/
│       ├── formulas/
│       ├── reportes/
│       └── ia/
└── types/
    └── sueldos.ts
```

---

## 🔗 Referencias Rápidas

### Legislación
- Ley 20.744 (LCT)
- Ley 24.241 (SIPA)
- Ley 20.628 (Ganancias)
- Ley 25.326 (Protección Datos)
- CCT 507/07 (Vigiladores)

### APIs Externas
- [Anthropic Claude](https://docs.anthropic.com/)
- [AFIP Web Services](https://www.afip.gob.ar/ws/)
- [UPSRA Escalas](https://upsra.org.ar/sitio/escalas-salariales/)

### Documentación Técnica
- [Next.js 15](https://nextjs.org/docs)
- [Prisma 6](https://www.prisma.io/docs)
- [React PDF](https://react-pdf.org/)

---

## ✅ Checklist para Retomar el Proyecto

1. [ ] Leer `SUELDOS_01_VISION_GENERAL.md` para contexto general
2. [ ] Revisar `SUELDOS_02_MODELO_DATOS.md` para entender la estructura
3. [ ] Consultar `SUELDOS_05_CALCULOS_ARGENTINA.md` para reglas de negocio
4. [ ] Ver `SUELDOS_09_ARQUITECTURA_IA.md` para decisiones de IA
5. [ ] Comenzar por Fase 1 del plan de implementación

---

## 📝 Notas Adicionales

- **Multi-tenancy:** Todo el sistema está diseñado para soportar múltiples empresas aisladas
- **Auditoría:** Todas las operaciones críticas se registran con snapshots
- **Privacidad:** Estrategia de anonimización documentada para cumplir Ley 25.326
- **Performance:** Diseñado para procesar 500+ empleados con colas async

---

*Última actualización: 28/11/2024*
