# MÓDULO DE LIQUIDACIÓN DE SUELDOS - ARGENTINA

## Visión General

Este documento describe la arquitectura y funcionalidades del módulo de liquidación de sueldos para Argentina, integrado con el sistema Checkpoint-Web.

---

## 1. Resumen Ejecutivo

### Objetivo
Extender la aplicación Checkpoint-Web para incluir un módulo completo de liquidación de sueldos argentino, con:
- Configuración flexible de convenios colectivos (CCT)
- Motor de fórmulas con lenguaje natural (IA)
- Cálculo automático de aportes, contribuciones e impuesto a las ganancias
- Integración con el sistema de fichadas existente
- Generación de reportes para AFIP (Libro de Sueldos Digital, F.931, etc.)

### Alcance Definido

| Área | Decisión | Complejidad |
|------|----------|-------------|
| CCT | Configurable por tenant | Alta |
| Imp. Ganancias | Completo con SIRADIG/F.572 | Alta |
| Fórmulas | Motor de reglas completo | Alta |
| Reportes | Suite AFIP completa | Alta |
| Valores legales | Tabla versionada con vigencias | Media |
| Períodos | Totalmente flexible | Media |
| UX Configuración | Modo híbrido (visual + fórmulas) | Alta |
| Workflow | Configurable por tenant | Media |
| Integración fichadas | Completa con checkpoints | Media |
| Pagos | Solo recibo (sin transferencias bancarias) | Baja |
| Auditoría | Full con snapshots | Alta |
| Escala | 500+ empleados por tenant | Alta |

---

## 2. Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CHECKPOINT-WEB                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    MÓDULO DE SUELDOS                                │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │   │
│  │  │   CONFIG    │  │  CÁLCULO    │  │       REPORTES              │ │   │
│  │  ├─────────────┤  ├─────────────┤  ├─────────────────────────────┤ │   │
│  │  │ • CCT       │  │ • Motor     │  │ • Recibos PDF               │ │   │
│  │  │ • Conceptos │  │   Fórmulas  │  │ • Libro Sueldos Digital     │ │   │
│  │  │ • Fórmulas  │  │ • Aportes   │  │ • F.931 (SUSS)              │ │   │
│  │  │ • Valores   │  │ • Ganancias │  │ • Simplif. Registral        │ │   │
│  │  │   Legales   │  │ • SAC/Vac   │  │ • Archivo Bancario          │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────────┘ │   │
│  │                                                                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │   │
│  │  │  WORKFLOW   │  │ INTEGRACIÓN │  │      AUDITORÍA              │ │   │
│  │  ├─────────────┤  ├─────────────┤  ├─────────────────────────────┤ │   │
│  │  │ • Estados   │  │ • Fichadas  │  │ • Log cambios               │ │   │
│  │  │ • Aprob.    │  │ • Horas     │  │ • Snapshots config          │ │   │
│  │  │ • Roles     │  │ • Extras    │  │ • Versiones liquidación     │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────────┘ │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    INTEGRACIÓN IA                           │   │   │
│  │  ├─────────────────────────────────────────────────────────────┤   │   │
│  │  │ • Fórmulas con lenguaje natural                             │   │   │
│  │  │ • Procesamiento de documentos (CCT, paritarias)             │   │   │
│  │  │ • Detección de anomalías                                    │   │   │
│  │  │ • Consultas en lenguaje natural                             │   │   │
│  │  │ • Asistente de configuración                                │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐     │
│  │ MÓDULO USUARIOS │  │ MÓDULO FICHADAS │  │ MÓDULO NOVEDADES        │     │
│  │ (existente)     │  │ (existente)     │  │ (existente)             │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Componentes Principales

### 3.1 Configuración
- **Convenios Colectivos (CCT)**: Definición de convenios con categorías y escalas salariales
- **Conceptos de Liquidación**: Remunerativos, no remunerativos, descuentos
- **Fórmulas**: Motor de cálculo con editor visual y modo fórmulas
- **Valores Legales**: Tabla versionada con vigencias (topes, alícuotas, MNI)

### 3.2 Motor de Cálculo
- **Cálculo de haberes**: Aplicación de conceptos y fórmulas
- **Aportes del empleado**: Jubilación (11%), Obra Social (3%), PAMI (3%)
- **Contribuciones patronales**: SIPA, PAMI, Asig. Familiares, FNE, OS, ART
- **Impuesto a las Ganancias**: Escala progresiva con deducciones SIRADIG
- **SAC y Vacaciones**: Cálculo automático con sugerencia

### 3.3 Reportes y Cumplimiento
- **Recibos de sueldo**: PDF según Art. 140 LCT
- **Libro de Sueldos Digital**: Formato AFIP
- **F.931 (SUSS)**: Declaración jurada de aportes y contribuciones
- **Simplificación Registral**: Altas, bajas, modificaciones
- **Archivos bancarios**: Para carga en homebanking

### 3.4 Workflow
- **Estados de liquidación**: Abierto, En Revisión, Aprobado, Cerrado
- **Pasos configurables**: Por tenant (ej: RRHH → Contabilidad → Gerencia)
- **Aprobaciones**: Con registro de quién y cuándo

### 3.5 Integración
- **Fichadas (Checkpoints)**: Importación automática de horas trabajadas
- **Horas extras**: Cálculo automático al 50% y 100%
- **Ausencias**: Detección de días sin fichaje
- **Novedades**: Licencias, permisos, etc.

### 3.6 Auditoría
- **Log de cambios**: Quién modificó qué, cuándo
- **Snapshots de configuración**: Estado de fórmulas/valores al momento del cierre
- **Versiones de liquidación**: Historial completo
- **Comparación de períodos**: Análisis de variaciones

---

## 4. Flujo Principal de Liquidación

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUJO DE LIQUIDACIÓN                                  │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │ 1. APERTURA  │
    │   DE PERÍODO │
    └──────┬───────┘
           │
           ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │ 2. PREPARACIÓN                                                        │
    │    ├─ Importar fichadas del período (automático desde checkpoints)   │
    │    ├─ Calcular horas normales, extras, ausencias                     │
    │    ├─ Verificar novedades (licencias, etc.)                          │
    │    └─ Cargar novedades manuales                                      │
    └──────────────────────────────────────────────────────────────────────┘
           │
           ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │ 3. CÁLCULO                                                            │
    │    Para cada empleado:                                                │
    │    ├─ Aplicar conceptos remunerativos (básico, adicionales, horas)   │
    │    ├─ Calcular aportes del empleado (Jub, OS, PAMI, Sindicato)       │
    │    ├─ Calcular Impuesto Ganancias (con deducciones SIRADIG)          │
    │    ├─ Aplicar conceptos no remunerativos                             │
    │    └─ Calcular neto a pagar                                          │
    └──────────────────────────────────────────────────────────────────────┘
           │
           ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │ 4. REVISIÓN (con IA)                                                  │
    │    ├─ Detección automática de anomalías                              │
    │    ├─ Alertas de valores fuera de rango                              │
    │    ├─ Comparación con período anterior                               │
    │    └─ Workflow de aprobación (configurable)                          │
    └──────────────────────────────────────────────────────────────────────┘
           │
           ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │ 5. CIERRE                                                             │
    │    ├─ Generar recibos PDF                                            │
    │    ├─ Generar Libro Sueldos Digital                                  │
    │    ├─ Generar F.931 / Simplificación Registral                       │
    │    ├─ Generar archivo bancario                                       │
    │    └─ Snapshot de configuración (auditoría)                          │
    └──────────────────────────────────────────────────────────────────────┘
           │
           ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │ 6. POST-CIERRE                                                        │
    │    ├─ Cálculo de contribuciones patronales                           │
    │    ├─ Provisión SAC/Vacaciones                                       │
    │    └─ Generación de asientos contables (futuro)                      │
    └──────────────────────────────────────────────────────────────────────┘
```

---

## 5. Consideraciones Técnicas

### 5.1 Performance (500+ empleados)
- **Procesamiento en lotes**: Liquidar en chunks de 50-100 empleados
- **Colas de trabajo**: Bull/BullMQ para procesamiento async
- **Caché de fórmulas**: Pre-compilar expresiones
- **Índices optimizados**: Por tenant, período, estado
- **Materialized views**: Para reportes pesados

### 5.2 Multi-tenancy
- Todas las entidades tienen `tenantId`
- Aislamiento completo de datos entre tenants
- Configuraciones independientes por tenant

### 5.3 Versionado de Valores Legales
- Tabla de valores con `vigenciaDesde` y `vigenciaHasta`
- Sistema aplica automáticamente según fecha de liquidación
- Alertas de vencimiento próximo

### 5.4 Seguridad y Auditoría
- Log de todas las operaciones
- Snapshots de configuración al cerrar período
- Roles específicos: Liquidador, Revisor, Aprobador, Admin

---

## 6. Documentos Relacionados

| Documento | Descripción |
|-----------|-------------|
| `SUELDOS_02_MODELO_DATOS.md` | Modelo de datos completo (entidades Prisma) |
| `SUELDOS_03_MOTOR_FORMULAS.md` | Motor de fórmulas y sintaxis |
| `SUELDOS_04_INTEGRACION_IA.md` | Integración con IA (lenguaje natural) |
| `SUELDOS_05_CALCULOS_ARGENTINA.md` | Cálculos específicos Argentina (aportes, SAC, etc.) |
| `SUELDOS_06_REPORTES_AFIP.md` | Formatos de reportes AFIP |
| `SUELDOS_07_WORKFLOW_APROBACION.md` | Sistema de workflow y aprobaciones |
| `SUELDOS_08_INTEGRACION_CHECKPOINTS.md` | Integración con sistema de fichadas |

---

## 7. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Cambios frecuentes en legislación | Alta | Alto | Tabla de valores versionada + alertas de vencimiento |
| Errores en fórmulas del usuario | Media | Alto | Sandbox de prueba, validación, casos de test |
| Complejidad del Imp. Ganancias | Alta | Alto | Calculadora independiente con tests exhaustivos |
| Performance con volumen | Media | Medio | Procesamiento async, optimización de queries |
| Integración AFIP | Media | Alto | Formatos estándar, validación previa |

---

## 8. Stack Tecnológico

### Existente (Checkpoint-Web)
- **Framework**: Next.js 15 (App Router) + React 19
- **Base de Datos**: PostgreSQL 14+
- **ORM**: Prisma 6
- **Autenticación**: JWT
- **UI**: Tailwind CSS

### A Agregar
- **Procesamiento async**: Bull/BullMQ + Redis
- **Generación PDF**: @react-pdf/renderer o puppeteer
- **Motor de fórmulas**: Librería custom o math.js adaptado
- **IA**: API de Claude (Anthropic) para procesamiento NL
- **Exportación Excel**: exceljs o xlsx

---

## 9. Referencias Legales

- **Ley de Contrato de Trabajo**: N° 20.744
- **Sistema Integrado Previsional Argentino (SIPA)**: Ley 24.241
- **Impuesto a las Ganancias**: Ley 20.628
- **Asignaciones Familiares**: Ley 24.714
- **Fondo Nacional de Empleo**: Ley 24.013
- **Obras Sociales**: Ley 23.660
- **PAMI (INSSJP)**: Ley 19.032
- **ART**: Ley 24.557

---

*Documento creado: 28/11/2024*
*Última actualización: 28/11/2024*
