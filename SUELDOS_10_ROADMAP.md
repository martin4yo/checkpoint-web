# ROADMAP DE DESARROLLO - MÓDULO DE SUELDOS

## Control de Progreso

> **Inicio del proyecto:** ___/___/____
> **Última actualización:** ___/___/____

---

# ETAPA 1: MVP (Producto Mínimo Viable)

> **Objetivo:** Sistema funcional para liquidar sueldos básicos con CCT 507/07, generar recibos PDF y mostrar a stakeholders.

## Progreso MVP: 0/78 tareas (0%)

---

## 1.1 Base de Datos - Modelos Esenciales
- [ ] Migración Prisma con modelos core
- [ ] Modelo `ConvenioCCT` (convenios colectivos)
- [ ] Modelo `CategoriaCCT` (categorías del convenio)
- [ ] Modelo `EscalaSalarialCCT` (escalas con vigencia)
- [ ] Modelo `ConceptoLiquidacion` (conceptos)
- [ ] Modelo `Formula` (fórmulas de cálculo)
- [ ] Modelo `PeriodoLiquidacion` (períodos)
- [ ] Modelo `Liquidacion` (liquidación por empleado)
- [ ] Modelo `LiquidacionConcepto` (detalle conceptos)
- [ ] Ejecutar migración y verificar

**Hito:** ✅ Base de datos MVP operativa

---

## 1.2 Seed CCT 507/07 Vigiladores
- [ ] ConvenioCCT 507/07
- [ ] Categorías principales (Vigilador General, Bombero, Principal)
- [ ] Escalas salariales vigentes
- [ ] Concepto: Sueldo Básico
- [ ] Concepto: Presentismo (8.33%)
- [ ] Concepto: Antigüedad (1% por año)
- [ ] Concepto: Horas Extras 50%
- [ ] Concepto: Horas Extras 100%
- [ ] Descuento: Jubilación (11%)
- [ ] Descuento: Obra Social (3%)
- [ ] Descuento: PAMI (3%)

**Hito:** ✅ CCT 507/07 cargado con conceptos básicos

---

## 1.3 Motor de Fórmulas Básico
- [ ] Clase `FormulaEngine` con operaciones básicas (+, -, *, /)
- [ ] Función SI(condición, valor_si, valor_no)
- [ ] Función MIN(), MAX(), REDONDEAR()
- [ ] Variables: BASICO, ANTIGUEDAD_AÑOS, REMUNERATIVO_TOTAL
- [ ] Variables: HORAS_EXTRAS_50, HORAS_EXTRAS_100
- [ ] Evaluador de fórmulas con contexto
- [ ] Validador de sintaxis

**Hito:** ✅ Motor de fórmulas funcional

---

## 1.4 API Core
- [ ] `GET /api/sueldos/cct` - Listar convenios
- [ ] `GET /api/sueldos/cct/[id]` - Convenio con categorías
- [ ] `POST /api/sueldos/cct` - Crear convenio
- [ ] `GET /api/sueldos/conceptos` - Listar conceptos
- [ ] `POST /api/sueldos/conceptos` - Crear concepto
- [ ] `PUT /api/sueldos/conceptos/[id]` - Editar concepto
- [ ] `GET /api/sueldos/periodos` - Listar períodos
- [ ] `POST /api/sueldos/periodos` - Crear período
- [ ] `GET /api/sueldos/periodos/[id]` - Detalle período
- [ ] `POST /api/sueldos/periodos/[id]/calcular` - Ejecutar liquidación
- [ ] `GET /api/sueldos/liquidaciones` - Listar liquidaciones
- [ ] `GET /api/sueldos/liquidaciones/[id]` - Detalle liquidación
- [ ] `GET /api/sueldos/liquidaciones/[id]/recibo` - Generar PDF

**Hito:** ✅ APIs básicas operativas

---

## 1.5 Cálculos Argentina - Básicos
- [ ] Función `calcularAportesEmpleado()` (Jub 11%, OS 3%, PAMI 3%)
- [ ] Aplicación de topes SIPA
- [ ] Cálculo de horas extras 50% y 100%
- [ ] Cálculo de presentismo
- [ ] Cálculo de antigüedad
- [ ] Tests unitarios de cálculos

**Hito:** ✅ Cálculos básicos funcionando

---

## 1.6 Generación de Recibo PDF
- [ ] Instalar @react-pdf/renderer
- [ ] Componente `ReciboPDF` - Layout básico
- [ ] Encabezado: empresa, período, datos empleado
- [ ] Tabla de haberes (conceptos remunerativos)
- [ ] Tabla de descuentos
- [ ] Total bruto, descuentos, neto
- [ ] Endpoint para generar y descargar PDF

**Hito:** ✅ Recibos PDF generados

---

## 1.7 UI - Configuración Básica
- [ ] Página `/sueldos/configuracion` - Dashboard config
- [ ] Página `/sueldos/configuracion/cct` - Lista de CCT
- [ ] Componente `CCTForm` - Crear/editar convenio
- [ ] Página `/sueldos/configuracion/conceptos` - Lista conceptos
- [ ] Componente `ConceptoForm` - Crear/editar concepto
- [ ] Editor de fórmula básico (modo código)
- [ ] Selector de variables disponibles

**Hito:** ✅ UI de configuración básica

---

## 1.8 UI - Liquidación
- [ ] Página `/sueldos` - Dashboard principal
- [ ] Página `/sueldos/liquidacion` - Gestión de períodos
- [ ] Componente `PeriodoSelector` - Seleccionar período
- [ ] Componente `NuevoPeriodoForm` - Crear período
- [ ] Página `/sueldos/liquidacion/[periodoId]` - Liquidar período
- [ ] Componente `EmpleadosLiquidacion` - Lista empleados a liquidar
- [ ] Botón "Calcular Liquidación" (individual y masivo)
- [ ] Componente `LiquidacionDetalle` - Ver detalle de un empleado
- [ ] Tabla de conceptos aplicados con montos
- [ ] Botón "Descargar Recibo PDF"
- [ ] Estados visuales: Pendiente, Calculado, Cerrado

**Hito:** ✅ UI de liquidación funcional

---

## 1.9 Integración con Empleados Existentes
- [ ] Relacionar liquidación con modelo User/Legajo existente
- [ ] Obtener básico desde LegajoDatosRemuneracion
- [ ] Obtener antigüedad desde fecha de ingreso
- [ ] Filtrar empleados activos del tenant

**Hito:** ✅ Integración con sistema existente

---

## 1.10 Demo y Ajustes
- [ ] Crear tenant de prueba con datos demo
- [ ] Cargar 10-20 empleados de ejemplo
- [ ] Ejecutar liquidación completa de prueba
- [ ] Verificar recibos generados
- [ ] Corregir bugs encontrados
- [ ] Preparar demo para stakeholders

**Hito:** ✅ MVP COMPLETADO Y DEMOSTRABLE

---

## Resumen MVP

| Sección | Tareas | Completadas |
|---------|--------|-------------|
| 1.1 Base de Datos | 10 | 0 |
| 1.2 Seed CCT | 11 | 0 |
| 1.3 Motor Fórmulas | 7 | 0 |
| 1.4 API Core | 13 | 0 |
| 1.5 Cálculos Básicos | 6 | 0 |
| 1.6 Recibo PDF | 7 | 0 |
| 1.7 UI Configuración | 7 | 0 |
| 1.8 UI Liquidación | 11 | 0 |
| 1.9 Integración | 4 | 0 |
| 1.10 Demo | 6 | 0 |
| **TOTAL MVP** | **78** | **0** |

---

# ETAPA 2: VERSIÓN FULL

> **Objetivo:** Sistema completo con todas las funcionalidades: workflow, IA, reportes AFIP, ganancias, fichadas, optimización.

## Progreso FULL: 0/135 tareas (0%)

---

## 2.1 Modelos Adicionales
- [ ] Modelo `ValorLegalVersion` (valores legales versionados)
- [ ] Modelo `VariableFormula` (variables customizadas)
- [ ] Modelo `WorkflowConfig` (configuración workflow)
- [ ] Modelo `WorkflowPaso` (pasos del workflow)
- [ ] Modelo `LiquidacionAprobacion` (registro aprobaciones)
- [ ] Modelo `LiquidacionSnapshot` (snapshots auditoría)
- [ ] Modelo `ResumenFichadas` (horas del período)
- [ ] Modelo `GananciasEmpleado` (acumulados ganancias)
- [ ] Modelo `DeduccionGanancias` (deducciones SIRADIG)
- [ ] Migración y verificación

**Hito:** ✅ Modelos completos

---

## 2.2 Motor de Fórmulas Avanzado
- [ ] Funciones adicionales: TRUNCAR, ABS, PORCENTAJE
- [ ] Función DIAS_TRABAJADOS, DIAS_HABILES
- [ ] Función TOPE_SIPA, MNI_GANANCIAS
- [ ] Variables de fichadas: HORAS_NORMALES, AUSENCIAS
- [ ] Variables de período: MES, ANIO, ES_SAC
- [ ] Sandbox de prueba con datos de ejemplo
- [ ] Historial de versiones de fórmulas
- [ ] Documentación completa de sintaxis

**Hito:** ✅ Motor de fórmulas completo

---

## 2.3 Integración con Fichadas (Checkpoints)
- [ ] Servicio `FichadasService`
- [ ] Obtener fichadas del período desde checkpoints
- [ ] Cálculo de horas normales trabajadas
- [ ] Detección de ausencias
- [ ] Cálculo automático horas extras 50%
- [ ] Cálculo automático horas extras 100%
- [ ] Cálculo de horas nocturnas
- [ ] Configuración de tolerancias
- [ ] API `POST /api/sueldos/periodos/[id]/importar-fichadas`
- [ ] UI para ver resumen de fichadas
- [ ] UI para corrección manual
- [ ] Recálculo de liquidación al modificar

**Hito:** ✅ Fichadas integradas

---

## 2.4 SAC (Aguinaldo)
- [ ] Función `calcularSAC()` completa
- [ ] Mejor sueldo del semestre
- [ ] SAC proporcional por meses trabajados
- [ ] Detección automática junio/diciembre
- [ ] Concepto SAC primera cuota
- [ ] Concepto SAC segunda cuota
- [ ] UI para confirmar/ajustar SAC sugerido

**Hito:** ✅ SAC implementado

---

## 2.5 Vacaciones
- [ ] Función `calcularVacaciones()`
- [ ] Días por antigüedad (14/21/28/35)
- [ ] Plus vacacional (sueldo/25 * días)
- [ ] Registro de días gozados
- [ ] API para registrar período vacacional
- [ ] UI para gestión de vacaciones

**Hito:** ✅ Vacaciones implementadas

---

## 2.6 Contribuciones Patronales
- [ ] Función `calcularContribucionesPatronales()`
- [ ] SIPA patronal (10.77%)
- [ ] PAMI patronal (1.58%)
- [ ] Asignaciones Familiares (4.70%)
- [ ] Fondo Nacional de Empleo (0.95%)
- [ ] Obra Social patronal (6%)
- [ ] ART (configurable)
- [ ] Seguro de Vida (configurable)
- [ ] Reporte de costos laborales totales

**Hito:** ✅ Contribuciones patronales

---

## 2.7 Impuesto a las Ganancias Completo
- [ ] Servicio `GananciasService`
- [ ] Escala progresiva actualizable
- [ ] Mínimo No Imponible (MNI)
- [ ] Deducción especial incrementada
- [ ] Deducción por cónyuge
- [ ] Deducción por hijos
- [ ] Acumulado anual para progresividad
- [ ] Integración SIRADIG (F.572)
- [ ] Deducciones: alquiler, servicio doméstico
- [ ] Deducciones: seguros, gastos médicos
- [ ] Percepciones moneda extranjera
- [ ] Liquidación anual
- [ ] UI para ver situación de ganancias

**Hito:** ✅ Ganancias 4ta categoría completo

---

## 2.8 Sistema de Workflow
- [ ] API `GET/PUT /api/sueldos/workflow/config`
- [ ] API para gestión de pasos
- [ ] Estados: ABIERTO → EN_CALCULO → EN_REVISION → APROBADO → CERRADO
- [ ] API `POST /api/sueldos/liquidaciones/[id]/aprobar`
- [ ] API `POST /api/sueldos/liquidaciones/[id]/rechazar`
- [ ] Validación de permisos por rol
- [ ] Historial de aprobaciones
- [ ] UI `WorkflowEditor` - configurar pasos
- [ ] UI `WorkflowStatus` - estado actual
- [ ] UI `AprobacionDialog` - aprobar/rechazar
- [ ] Notificaciones de pendientes

**Hito:** ✅ Workflow completo

---

## 2.9 Integración IA - Claude API
- [ ] Instalar SDK Anthropic
- [ ] Configurar API Key
- [ ] Servicio `AIService` base
- [ ] Rate limiting y retry
- [ ] Logging de uso/costos

**Hito:** ✅ Claude API conectada

---

## 2.10 IA - Fórmulas con Lenguaje Natural
- [ ] Servicio `FormulaIAService`
- [ ] Prompt especializado NL → Fórmula
- [ ] Función `convertirLenguajeNatural()`
- [ ] UI: Campo de texto para descripción
- [ ] UI: Preview de fórmula generada
- [ ] UI: Explicación de la fórmula
- [ ] Validación antes de aceptar

**Hito:** ✅ Fórmulas por lenguaje natural

---

## 2.11 IA - Detección de Anomalías
- [ ] Servicio `AnomaliaService`
- [ ] Variación vs período anterior
- [ ] Valores fuera de rango
- [ ] Conceptos faltantes/duplicados
- [ ] Resumen pre-cierre con IA
- [ ] UI: Panel de alertas
- [ ] Clasificación por severidad

**Hito:** ✅ Detección de anomalías

---

## 2.12 IA - Chatbot Empleados
- [ ] Componente `ChatbotEmpleado`
- [ ] Prompt para consultas de recibo
- [ ] Explicación de conceptos
- [ ] Cálculo explicado de deducciones
- [ ] Límites de uso
- [ ] Anonimización de datos

**Hito:** ✅ Chatbot empleados

---

## 2.13 Libro de Sueldos Digital
- [ ] Estructura según formato AFIP
- [ ] Mapeo conceptos → códigos AFIP
- [ ] Función `generarLibroSueldos()`
- [ ] Generación archivo TXT
- [ ] Validación de datos
- [ ] API endpoint
- [ ] UI para configurar mapeo
- [ ] Preview antes de descargar

**Hito:** ✅ Libro Sueldos Digital

---

## 2.14 F.931 (SUSS)
- [ ] Estructura de datos F.931
- [ ] Mapeo de campos obligatorios
- [ ] Cálculo de totales por aporte
- [ ] Función `generarF931()`
- [ ] Validación AFIP
- [ ] Generación archivo
- [ ] API endpoint

**Hito:** ✅ F.931 generado

---

## 2.15 Simplificación Registral
- [ ] Estructura Altas
- [ ] Estructura Bajas
- [ ] Estructura Modificaciones
- [ ] Función `generarSimplificacion()`
- [ ] Validación CUIL
- [ ] API endpoint
- [ ] UI para seleccionar movimientos

**Hito:** ✅ Simplificación Registral

---

## 2.16 Archivos Bancarios
- [ ] Estructura genérica
- [ ] Formato Banco Galicia
- [ ] Formato Banco Santander
- [ ] Formato BBVA
- [ ] Formato Banco Macro
- [ ] Configuración por tenant
- [ ] API endpoint
- [ ] Validación CBU

**Hito:** ✅ Archivos bancarios

---

## 2.17 Reportes Avanzados
- [ ] Reporte comparativo entre períodos
- [ ] Reporte de costos laborales
- [ ] Reporte de asientos contables
- [ ] Exportación Excel (exceljs)
- [ ] Exportación CSV
- [ ] Gráficos de evolución

**Hito:** ✅ Reportes avanzados

---

## 2.18 UI Avanzada
- [ ] Editor visual de fórmulas (drag & drop)
- [ ] Dashboard con métricas y gráficos
- [ ] Bulk actions mejoradas
- [ ] Filtros avanzados
- [ ] Exportación masiva de recibos (ZIP)
- [ ] Temas claro/oscuro

**Hito:** ✅ UI pulida

---

## 2.19 Auditoría y Seguridad
- [ ] Snapshots de configuración al cerrar
- [ ] Log completo de operaciones
- [ ] Permisos granulares por rol
- [ ] Encriptación datos sensibles
- [ ] Cumplimiento Ley 25.326

**Hito:** ✅ Auditoría completa

---

## 2.20 Performance y Optimización
- [ ] Bull/BullMQ para colas
- [ ] Configurar Redis
- [ ] Procesamiento en chunks
- [ ] Caché de fórmulas
- [ ] Índices optimizados
- [ ] Tests de carga (500+ empleados)

**Hito:** ✅ Sistema optimizado

---

## 2.21 Testing
- [ ] Tests unitarios de cálculos
- [ ] Tests de integración APIs
- [ ] Tests E2E flujos principales
- [ ] Coverage mínimo 80%
- [ ] CI/CD con tests

**Hito:** ✅ Suite de tests

---

## 2.22 Documentación y Deploy
- [ ] Manual de usuario
- [ ] Guía de configuración CCT
- [ ] Referencia de fórmulas
- [ ] API documentation
- [ ] Deploy a producción
- [ ] Monitoreo y alertas

**Hito:** ✅ VERSIÓN FULL COMPLETADA

---

## Resumen Versión Full

| Sección | Tareas | Completadas |
|---------|--------|-------------|
| 2.1 Modelos Adicionales | 10 | 0 |
| 2.2 Motor Fórmulas Avanzado | 8 | 0 |
| 2.3 Integración Fichadas | 12 | 0 |
| 2.4 SAC | 7 | 0 |
| 2.5 Vacaciones | 6 | 0 |
| 2.6 Contribuciones Patronales | 8 | 0 |
| 2.7 Ganancias Completo | 13 | 0 |
| 2.8 Workflow | 11 | 0 |
| 2.9 IA Base | 5 | 0 |
| 2.10 IA Fórmulas NL | 7 | 0 |
| 2.11 IA Anomalías | 7 | 0 |
| 2.12 IA Chatbot | 6 | 0 |
| 2.13 Libro Sueldos | 8 | 0 |
| 2.14 F.931 | 7 | 0 |
| 2.15 Simplificación | 7 | 0 |
| 2.16 Archivos Bancarios | 8 | 0 |
| 2.17 Reportes Avanzados | 6 | 0 |
| 2.18 UI Avanzada | 6 | 0 |
| 2.19 Auditoría | 5 | 0 |
| 2.20 Performance | 6 | 0 |
| 2.21 Testing | 5 | 0 |
| 2.22 Docs y Deploy | 6 | 0 |
| **TOTAL FULL** | **135** | **0** |

---

# Resumen General

| Etapa | Descripción | Tareas | Progreso |
|-------|-------------|--------|----------|
| **MVP** | Sistema básico demostrable | 78 | 0% |
| **FULL** | Sistema completo producción | 135 | 0% |
| **TOTAL** | | **213** | **0%** |

---

## Qué incluye cada etapa

### MVP (Mostrable)
- ✅ Liquidación básica funcionando
- ✅ CCT 507/07 Vigiladores configurado
- ✅ Conceptos básicos: básico, presentismo, antigüedad, horas extras
- ✅ Descuentos: jubilación, obra social, PAMI
- ✅ Generación de recibos PDF
- ✅ UI para configurar y liquidar
- ❌ Sin workflow de aprobación
- ❌ Sin integración con fichadas automática
- ❌ Sin IA
- ❌ Sin reportes AFIP
- ❌ Sin ganancias 4ta categoría

### Versión Full
- ✅ Todo lo del MVP
- ✅ Workflow de aprobación configurable
- ✅ Integración automática con fichadas
- ✅ SAC y vacaciones completos
- ✅ Impuesto a las Ganancias con SIRADIG
- ✅ Contribuciones patronales
- ✅ IA: fórmulas naturales, anomalías, chatbot
- ✅ Reportes AFIP: Libro Sueldos, F.931, Simplificación
- ✅ Archivos bancarios
- ✅ Auditoría completa
- ✅ Optimizado para 500+ empleados

---

## Notas de Seguimiento

| Fecha | Etapa | Tareas Completadas | Notas |
|-------|-------|-------------------|-------|
| | | | |

---

*Documento creado: 29/11/2024*
