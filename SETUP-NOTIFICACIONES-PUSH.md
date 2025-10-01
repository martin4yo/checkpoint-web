# 📱 Configuración de Notificaciones Push - Sistema Checkpoint

Este documento explica cómo configurar el sistema de notificaciones push que detecta jornadas inactivas y envía alertas a dispositivos administrativos.

## 🎯 ¿Qué hace el sistema?

- **Monitorea jornadas activas** cada 10 minutos automáticamente
- **Detecta problemas**:
  - 🚨 App cerrada/crasheada (>15 min sin heartbeat)
  - 🚶‍♂️ Usuario sin movimiento (>45 min inmóvil)
- **Envía notificaciones push** a dispositivos administrativos configurados
- **Notifica recuperación** cuando la jornada vuelve a funcionar

---

## 📋 PASO 1: Configurar Firebase (15-20 minutos)

### 1.1 Crear proyecto Firebase
1. Ve a https://console.firebase.google.com/
2. Clic en **"Agregar proyecto"**
3. Nombre: `checkpoint-notifications` (o el que prefieras)
4. **Desactiva** Google Analytics (no necesario)
5. Clic **"Crear proyecto"**

### 1.2 Habilitar Cloud Messaging
1. En el proyecto Firebase, ve a **"Compilación"** → **"Cloud Messaging"**
2. Si pide configurar, sigue el wizard básico

### 1.3 Generar credenciales Admin SDK
1. Ve a **"Configuración del proyecto"** (ícono engranaje ⚙️)
2. Pestaña **"Cuentas de servicio"**
3. Clic **"Generar nueva clave privada"**
4. Se descarga un archivo JSON - **¡Guárdalo en lugar seguro!**

### 1.4 Extraer datos del JSON
Abre el archivo descargado y busca estos campos:
```json
{
  "project_id": "tu-project-id",
  "client_email": "firebase-adminsdk-xxxxx@tu-project.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
}
```

---

## 🔧 PASO 2: Configurar Variables de Entorno

Agrega estas líneas al archivo `/checkpoint-web/.env`:

```bash
# Firebase Admin SDK (requerido)
FIREBASE_PROJECT_ID="tu-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@tu-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_PRIVATE_KEY_AQUI\n-----END PRIVATE KEY-----"

# Opcional: para mayor seguridad
ADMIN_SECRET="mi-clave-secreta-123"
```

**⚠️ IMPORTANTE**:
- El `private_key` debe mantener los `\n` para los saltos de línea
- **NO** subas este archivo a Git - ya está en `.gitignore`

---

## 🔄 PASO 3: Reiniciar el Servidor Web

```bash
cd checkpoint-web
pkill -f "npm run dev"  # Detener servidor actual
npm run dev             # Iniciar con nuevas variables
```

Verifica que cargue sin errores en http://localhost:3000

---

## 🖥️ PASO 4: Acceder al Dashboard de Notificaciones

1. Ve a **http://localhost:3000/push-devices**
2. Verás la nueva página **"Dispositivos de Notificación"**
3. Debe mostrar información sobre el sistema de alertas

---

## 📱 PASO 5: Obtener Token FCM de tu Teléfono

Necesitas el token FCM de tu teléfono para recibir notificaciones:

### Opción A: App de prueba FCM (Más fácil)
1. Instala **"FCM Toolbox"** desde Google Play Store
2. Abre la app y copia el **"FCM Token"** que muestra
3. **Guarda este token** - lo necesitarás en el siguiente paso

### Opción B: Navegador web (Alternativa)
1. Ve a https://console.firebase.google.com/project/TU-PROJECT/messaging
2. Clic "Enviar tu primer mensaje"
3. En "Dirigido a" selecciona "Token FCM"
4. Usa herramientas de desarrollador del navegador para obtener token

### Opción C: Agregar a la app React Native (Más adelante)
```javascript
import { messaging } from '@react-native-firebase/messaging';

const getToken = async () => {
  const token = await messaging().getToken();
  console.log('FCM Token:', token);
};
```

---

## ➕ PASO 6: Registrar Dispositivo Administrativo

1. En **http://localhost:3000/push-devices** clic **"Nuevo Dispositivo"**
2. Completa el formulario:
   - **ID del Dispositivo**: `admin-phone-1` (identificador único)
   - **Token FCM/APNS**: (pega el token obtenido en el paso anterior)
   - **Plataforma**: `android` o `ios` según tu teléfono
   - **Descripción**: `Teléfono del Supervisor` (opcional)
   - **Clave Admin**: (la que pusiste en .env, o déjala vacía)
3. Clic **"Registrar"**
4. Debe aparecer en la lista con estado activo ✅

---

## ✅ PASO 7: Probar el Sistema Manualmente

1. En la página de dispositivos, clic **"Probar Monitoreo"**
2. Debe mostrar algo como:
   ```
   Monitoreo ejecutado: 2 jornadas verificadas, 0 alertas enviadas
   ```
3. Si hay errores, verifica:
   - Variables de entorno correctas
   - Token FCM válido
   - Firebase configurado correctamente

---

## ⏰ PASO 8: Configurar Monitoreo Automático

El sistema necesita ejecutarse cada 10 minutos. Elige una opción:

### Opción A: Cron Job del Sistema (Linux/Mac)
```bash
# Editar crontab
crontab -e

# Agregar esta línea (ejecutar cada 10 minutos)
*/10 * * * * curl -X POST http://localhost:3000/api/cron/journey-monitor
```

### Opción B: Servicio de Cron Online (Recomendado para producción)
1. Ve a https://cron-job.org/ o similar
2. Crear nueva tarea:
   - **URL**: `http://tu-dominio.com/api/cron/journey-monitor`
   - **Método**: POST
   - **Frecuencia**: cada 10 minutos
   - **Timeout**: 30 segundos

### Opción C: GitHub Actions (Para hosting automático)
Crear archivo `.github/workflows/cron-monitor.yml`:
```yaml
name: Journey Monitor
on:
  schedule:
    - cron: '*/10 * * * *'  # Cada 10 minutos
jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Call monitoring endpoint
        run: curl -X POST ${{ secrets.APP_URL }}/api/cron/journey-monitor
```

### Opción D: Script local (Para testing)
Crear archivo `monitor.sh`:
```bash
#!/bin/bash
while true; do
    curl -X POST http://localhost:3000/api/cron/journey-monitor
    sleep 600  # 10 minutos
done
```

Ejecutar: `chmod +x monitor.sh && ./monitor.sh &`

---

## 🧪 PASO 9: Probar Escenario Real

### Escenario 1: App cerrada/crasheada
1. **Inicia jornada** en la app móvil
2. **Cierra completamente** la app móvil
3. **Espera 20 minutos**
4. **Verifica** que llegue notificación push: *"Jornada Inactiva Detectada"*

### Escenario 2: Usuario sin movimiento
1. **Inicia jornada** en la app móvil
2. **Deja el teléfono** en un lugar fijo (no mover)
3. **Espera 50 minutos**
4. **Verifica** que llegue notificación push: *"Usuario Sin Movimiento"*

### Escenario 3: Jornada recuperada
1. Después de recibir una alerta
2. **Abre la app** y mueve el teléfono
3. **Espera 5-10 minutos**
4. **Verifica** que llegue notificación push: *"Jornada Recuperada"*

---

## 📊 PASO 10: Monitorear el Sistema

### Ver logs en tiempo real
```bash
cd checkpoint-web
npm run dev
```

Busca estos mensajes en los logs:
- `🔍 Iniciando monitoreo de jornadas...`
- `🚨 Jornada sin heartbeat: Usuario - X minutos`
- `🚶‍♂️ Usuario sin movimiento: Usuario - X minutos`
- `✅ Notificación enviada exitosamente`
- `💓 Heartbeat registrado en monitor de jornada`

### Endpoints útiles para debugging
- **GET** `/api/admin/push-tokens` - Ver dispositivos registrados
- **POST** `/api/cron/journey-monitor` - Ejecutar monitoreo manualmente
- **GET** `/api/cron/journey-monitor` - También funciona para testing

---

## ⚙️ Configuración Avanzada

### Ajustar tiempos de alerta
Editar `/checkpoint-web/src/app/api/cron/journey-monitor/route.ts`:

```javascript
// Configuración actual
const HEARTBEAT_TIMEOUT_MINUTES = 15 // App cerrada/crasheada
const NOT_MOVING_TIMEOUT_MINUTES = 45 // Usuario sin movimiento

// Ejemplo: Alertas más frecuentes
const HEARTBEAT_TIMEOUT_MINUTES = 5  // 5 minutos
const NOT_MOVING_TIMEOUT_MINUTES = 20 // 20 minutos
```

### Personalizar mensajes de notificación
Editar `/checkpoint-web/src/lib/push-notifications.ts` en la clase `JourneyNotifications`.

### Agregar más tipos de dispositivos
- Web browsers (Firebase Web Push)
- Sistemas de email (como backup)
- Integración con Slack/Discord
- Webhooks personalizados

---

## 🔧 Solución de Problemas

### Error: "Firebase Admin SDK no pudo inicializarse"
- Verifica que las variables de entorno estén correctas
- El `FIREBASE_PRIVATE_KEY` debe tener saltos de línea `\n`
- Reinicia el servidor después de cambiar variables

### Error: "Token de push inválido"
- El token FCM expira - obtén uno nuevo
- Verifica que el token sea del proyecto Firebase correcto
- En iOS, tokens son diferentes para desarrollo vs producción

### No llegan notificaciones
- Verifica que el dispositivo tenga permisos de notificaciones
- El token debe estar registrado como `isAdminDevice: true`
- Revisa los logs del servidor para errores

### El monitoreo no encuentra jornadas
- Verifica que haya jornadas iniciadas (`CheckpointType.JOURNEY_START`)
- Debe haber heartbeats recientes en la tabla `journey_monitors`
- El cron job debe ejecutarse correctamente

---

## 📋 Checklist de Configuración

- [ ] Proyecto Firebase creado y configurado
- [ ] Variables de entorno agregadas a `.env`
- [ ] Servidor web reiniciado sin errores
- [ ] Página `/push-devices` accesible
- [ ] Token FCM obtenido del dispositivo
- [ ] Dispositivo administrativo registrado
- [ ] Prueba manual del monitoreo exitosa
- [ ] Cron job configurado y funcionando
- [ ] Escenario real probado con notificación recibida

---

## 📞 Soporte

Si tienes problemas:

1. **Revisa los logs** del servidor para errores específicos
2. **Verifica la configuración** paso a paso
3. **Prueba manualmente** cada endpoint
4. **Consulta la documentación** de Firebase para tu plataforma

**¡El sistema está listo para monitorear automáticamente todas las jornadas y alertarte cuando algo no funcione correctamente!** 🎉