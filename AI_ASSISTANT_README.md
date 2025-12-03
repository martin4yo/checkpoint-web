# 🤖 Asistente IA para Checkpoint

## 📋 Resumen

Se ha implementado un **asistente de IA con Claude (Anthropic)** que permite gestionar empleados, novedades y consultar información usando lenguaje natural.

**Características:**
- ✅ Widget flotante estilo Intercom/WhatsApp
- ✅ Integración con Claude 4 Sonnet (último modelo)
- ✅ Crear empleados con datos básicos
- ✅ Cargar novedades (vacaciones, licencias, rendiciones)
- ✅ Consultar horas trabajadas y horas extras
- ✅ Buscar información de empleados
- ✅ Multi-tenant (aislado por empresa)
- ✅ Autenticación integrada

---

## 🛠️ Configuración (Primera Vez)

### 1. Obtener API Key de Anthropic

1. Ir a https://console.anthropic.com/
2. Crear una cuenta (si no tienes)
3. Ir a **API Keys** → **Create Key**
4. Copiar la key (empieza con `sk-ant-...`)

### 2. Configurar Backend

Editar `.env` y agregar/descomentar la API key:

```bash
# AI Assistant (Anthropic Claude)
# Obtener key en: https://console.anthropic.com/
ANTHROPIC_API_KEY="sk-ant-api03-tu-key-aqui"
```

### 3. Reiniciar Servidor

```bash
npm run dev
```

Deberías ver en la consola:
```
✅ AI Assistant Service inicializado
```

### 4. Verificar Salud del Servicio

```bash
curl http://localhost:3000/api/chat
```

Debería responder:
```json
{
  "available": true,
  "service": "AI Chat Assistant",
  "model": "claude-sonnet-4-20250514"
}
```

---

## 💬 Uso del Asistente

### En la Aplicación Web

1. **Iniciar sesión** en Checkpoint
2. Verás un **botón flotante púrpura con ✨** en la esquina inferior derecha
3. Hacer clic para abrir el chat
4. Escribir comandos en lenguaje natural

### Comandos Disponibles

#### ✅ Gestión de Empleados

**Crear Empleados:**

```
Crear un empleado Juan Pérez, email juan.perez@empresa.com, DNI 30123456
```

```
Nuevo empleado María García, email maria@empresa.com, puesto Desarrolladora, supervisor admin@empresa.com
```

El sistema:
- Crea el usuario con contraseña temporal
- Genera número de legajo automático
- Vincula con supervisor si se especifica
- Te devuelve la contraseña temporal para compartir

**Editar Empleados:**

```
Cambiar el puesto de Juan Pérez a Gerente
```

```
Actualizar el área de maria@empresa.com a Ventas
```

```
Cambiar el supervisor de Pedro a admin@empresa.com
```

**Desactivar Empleados:**

```
Dar de baja a juan@empresa.com por renuncia
```

```
Desactivar empleado maria@empresa.com
```

**Asignar Supervisores:**

```
Hacer que admin@empresa.com supervise a juan@empresa.com
```

```
Asignar a Pedro como supervisor de María
```

#### ✅ Gestión de Novedades

**Crear Novedades:**

**Vacaciones:**
```
Necesito cargar vacaciones del 15 al 20 de diciembre
```

**Licencia:**
```
Quiero registrar una licencia médica del 1 al 5 de enero
```

**Rendiciones:**
```
Tengo una rendición de $5000 por gastos de viaje del 10 de diciembre
```

El sistema:
- Busca el tipo de novedad en tu tenant
- Crea la novedad pendiente de aprobación
- Te lista los tipos disponibles si no encuentra el que pediste

**Aprobar/Rechazar Novedades:**

```
Aprobar la novedad de Juan Pérez
```

```
Rechazar las vacaciones de María García porque se superponen con otro proyecto
```

```
Aprobar la rendición de pedro@empresa.com
```

**Listar Novedades Pendientes:**

```
Qué novedades tengo pendientes de aprobar?
```

```
Mostrame las novedades que requieren aprobación
```

El sistema:
- Muestra solo las novedades que podés aprobar
- Si sos supervisor, ves las de tus subordinados
- Si tenés el permiso "authorizesNovelties", ves todas

#### ✅ Consultar Horas Trabajadas

**De un empleado específico:**
```
Cuántas horas trabajó Juan Pérez este mes?
```

**De todos:**
```
Dame las horas trabajadas de diciembre 2025
```

El sistema:
- Consulta los checkpoints de jornadas
- Calcula las horas totales
- Muestra resumen por empleado

#### ✅ Consultar Horas Extras

```
Dame un resumen de horas extras a pagar de diciembre
```

```
Cuántas horas extras se trabajaron este mes?
```

El sistema:
- Calcula horas extras (> 8 horas por día)
- Muestra total por empleado
- Listo para liquidar

#### ✅ Buscar Información de Empleados

```
Mostrame la información de juan@empresa.com
```

```
Buscar empleado Juan Pérez
```

El sistema:
- Muestra datos básicos
- Número de legajo
- Datos personales (DNI, CUIL, etc.)
- Datos laborales (puesto, área, fecha ingreso)
- Supervisor

---

## 🎯 Ejemplos Completos

### Ejemplo 1: Alta de Empleado Completo

**Usuario:**
```
Crear empleado Pedro Martínez, email pedro.martinez@empresa.com, DNI 28456789, CUIL 20-28456789-5, puesto Contador, supervisor admin@empresa.com
```

**Asistente:**
```
✅ Empleado creado exitosamente

👤 Datos:
• Nombre: Pedro Martínez
• Email: pedro.martinez@empresa.com
• Estado: Activo
• Supervisor: Admin User

🔑 Contraseña temporal: abc123xy

💡 Próximos pasos:
1. Completar el legajo del empleado
2. Asignar lugares de trabajo
3. El empleado debe cambiar su contraseña en el primer login
```

### Ejemplo 2: Solicitud de Vacaciones

**Usuario:**
```
Necesito pedir vacaciones del 20 al 31 de diciembre porque me voy de viaje
```

**Asistente:**
```
✅ Novedad creada exitosamente

📋 Tipo: Vacaciones
• Desde: 20/12/2025
• Hasta: 31/12/2025
• Estado: Pendiente de aprobación

📝 Notas: Necesito pedir vacaciones del 20 al 31 de diciembre porque me voy de viaje

💡 Próximos pasos:
1. Agregar archivos adjuntos si es necesario
2. Esperar la aprobación del supervisor
```

### Ejemplo 3: Reporte de Horas Extras

**Usuario:**
```
Necesito saber cuántas horas extras tengo que pagar de diciembre
```

**Asistente:**
```
⏰ Horas extras a pagar - 12/2025

• Juan Pérez: 15 horas extras
• María García: 8 horas extras
• Pedro Martínez: 12 horas extras

Total: 35 horas extras

💡 Nota: El cálculo considera extras toda jornada > 8 horas
```

---

## 🗂️ Estructura de Archivos

### Backend

```
src/lib/
  ├── aiAssistant.ts         ← Servicio de integración con Claude
  └── actionExecutor.ts      ← Ejecutor de acciones (crear usuarios, novedades, etc.)

src/app/api/chat/
  └── route.ts               ← Endpoints GET /api/chat y POST /api/chat
```

### Frontend

```
src/components/chat/
  ├── ChatWidget.tsx         ← Widget flotante principal
  ├── ChatMessage.tsx        ← Componente de mensaje individual
  ├── ChatWidgetWrapper.tsx  ← Wrapper con autenticación
  └── index.ts               ← Exports

src/lib/
  └── chatService.ts         ← Servicio HTTP para llamar al backend

src/components/
  └── DashboardLayout.tsx    ← Layout con ChatWidgetWrapper integrado
```

---

## 🔧 API Endpoints

### POST /api/chat

Procesa un comando de lenguaje natural.

**Headers:**
```
Cookie: token=<jwt-token>
Content-Type: application/json
```

**Body:**
```json
{
  "message": "Crear empleado Juan Pérez, email juan@empresa.com",
  "tenantId": "cm..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "✅ Empleado creado exitosamente...",
  "data": {
    "id": "cm...",
    "email": "juan@empresa.com",
    "tempPassword": "abc123xy"
  }
}
```

### GET /api/chat

Verifica disponibilidad del servicio (health check).

**Response:**
```json
{
  "available": true,
  "service": "AI Chat Assistant",
  "model": "claude-sonnet-4-20250514"
}
```

---

## 💰 Costos de API

**Claude 4 Sonnet:**
- Input: $3 / millón tokens
- Output: $15 / millón tokens

**Por consulta:**
- ~500 tokens input (~$0.0015)
- ~200 tokens output (~$0.003)
- **Total: ~$0.005 por consulta** (medio centavo USD)

**Estimación mensual:**
- 1000 consultas/mes = **~$5 USD**
- 5000 consultas/mes = **~$25 USD**
- 10000 consultas/mes = **~$50 USD**

---

## 🐛 Troubleshooting

### ❌ "AI Assistant no disponible"

**Causa:** ANTHROPIC_API_KEY no configurada o inválida

**Solución:**
1. Verificar `.env`: `ANTHROPIC_API_KEY="sk-ant-..."`
2. Reiniciar servidor: `npm run dev`
3. Verificar health: `curl http://localhost:3000/api/chat`

### ❌ Widget no aparece

**Causa:** Usuario no autenticado o servicio deshabilitado

**Solución:**
1. Verificar que estás logueado
2. Revisar consola del navegador (F12)
3. Verificar que ANTHROPIC_API_KEY esté configurada

### ❌ "No encontré el tipo de novedad..."

**Causa:** El tipo de novedad no existe en tu tenant

**Solución:**
1. Ir a Configuración → Tipos de Novedades
2. Crear el tipo necesario (ej: "Vacaciones", "Licencia", etc.)
3. Activarlo
4. Reintentar el comando

### ❌ Error de conexión

**Causa:** Backend no está corriendo o problemas de red

**Solución:**
```bash
npm run dev
```

---

## 🎯 Nuevas Funcionalidades (Diciembre 2025)

### ✅ Gestión Completa de Empleados
- Crear empleados con datos completos
- **Editar** nombre, puesto, área, supervisor
- **Desactivar** empleados con motivo
- **Asignar supervisores** dinámicamente

### ✅ Gestión Completa de Novedades
- Crear novedades (vacaciones, licencias, rendiciones)
- **Aprobar** novedades pendientes
- **Rechazar** novedades con comentarios
- **Listar** todas las novedades que requieren tu aprobación

### ✅ Consultas Avanzadas
- Horas trabajadas por empleado o general
- Horas extras a liquidar
- Información completa de legajos
- Novedades pendientes filtradas por permisos

---

## 🚀 Próximas Mejoras (Roadmap)

- [ ] Conversaciones contextuales (recordar mensajes anteriores)
- [ ] Historial de conversaciones persistente
- [ ] Sugerencias inteligentes mientras escribes
- [ ] Exportar reportes (Excel, PDF)
- [ ] Comandos de voz
- [ ] Integración con WhatsApp
- [ ] Analytics de uso del asistente
- [ ] Crear/editar legajos completos desde el chat
- [ ] Configurar horarios y turnos

---

## 📚 Referencias

- **Anthropic Claude Docs:** https://docs.anthropic.com/
- **API Reference:** https://docs.anthropic.com/claude/reference
- **Checkpoint Web:** Sistema de gestión de personal

---

**Documento creado:** Diciembre 2025
**Versión:** 1.0
**Integrado por:** Claude Code
