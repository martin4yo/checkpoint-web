# Configuración de Notificaciones por Email

## Descripción

El sistema envía notificaciones por email en los siguientes casos:

1. **Creación de Novedad**: Cuando un usuario crea una nueva novedad, se envía un email a todos los usuarios que tienen permiso para autorizar novedades (`authorizesNovelties = true`)

2. **Aprobación/Rechazo de Novedad**: Cuando se aprueba o rechaza una novedad, se envía un email al usuario que la creó informándole del estado

## Configuración SMTP

### 1. Variables de Entorno

Agregar las siguientes variables al archivo `.env`:

```bash
# Email Configuration (SMTP)
SMTP_HOST="smtp.gmail.com"          # Servidor SMTP
SMTP_PORT="587"                      # Puerto SMTP
SMTP_SECURE="false"                  # true para puerto 465, false para otros
SMTP_USER="your-email@gmail.com"    # Tu email
SMTP_PASS="your-app-password"       # Contraseña de aplicación

# App URL (for email links)
NEXT_PUBLIC_APP_URL="https://tudominio.com"  # URL de tu aplicación
```

### 2. Configuración para Gmail

Si usas Gmail, necesitas crear una **Contraseña de Aplicación**:

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Seguridad → Verificación en dos pasos (debe estar activada)
3. Seguridad → Contraseñas de aplicaciones
4. Genera una nueva contraseña de aplicación
5. Copia la contraseña generada y úsala en `SMTP_PASS`

### 3. Otros proveedores SMTP

#### Outlook/Office 365
```bash
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT="587"
SMTP_SECURE="false"
```

#### Yahoo
```bash
SMTP_HOST="smtp.mail.yahoo.com"
SMTP_PORT="587"
SMTP_SECURE="false"
```

#### Servicios de Email Transaccional

Para producción, se recomienda usar servicios especializados:

- **SendGrid**: smtp.sendgrid.net (puerto 587)
- **Mailgun**: smtp.mailgun.org (puerto 587)
- **AWS SES**: Configuración específica por región
- **Postmark**: smtp.postmarkapp.com (puerto 587)

## Formato de los Emails

### Email de Nueva Novedad
- **Asunto**: "Nueva Novedad Pendiente: [Tipo de Novedad]"
- **Destinatarios**: Usuarios con `authorizesNovelties = true` en el mismo tenant
- **Contenido**:
  - Tipo de novedad
  - Solicitante (nombre y email)
  - Importe (si aplica)
  - Fecha/Período (si aplica)
  - Notas
  - Botón para ver novedades pendientes

### Email de Estado de Novedad
- **Asunto**: "Novedad Aprobada/Rechazada: [Tipo de Novedad]"
- **Destinatario**: Usuario que creó la novedad
- **Contenido**:
  - Tipo de novedad
  - Estado (Aprobada/Rechazada)
  - Autorizado por (nombre del autorizador)
  - Botón para ver mis novedades

## Solución de Problemas

### Los emails no se envían

1. Verificar que las variables de entorno estén configuradas correctamente
2. Revisar los logs del servidor para ver errores específicos
3. Verificar que el usuario/contraseña SMTP sean correctos
4. Si usas Gmail, asegúrate de usar contraseña de aplicación (no tu contraseña normal)
5. Verificar que el puerto y configuración SSL/TLS sean correctos

### Los emails van a spam

1. Configurar SPF, DKIM y DMARC en tu dominio
2. Usar un servicio de email transaccional (SendGrid, Mailgun, etc.)
3. Verificar que el dominio del remitente esté verificado

## Desactivar Notificaciones por Email

Si no quieres usar notificaciones por email, simplemente **no configures** las variables `SMTP_USER` y `SMTP_PASS`. El sistema detectará que no están configuradas y no intentará enviar emails, pero la aplicación seguirá funcionando normalmente.

## Personalización

Los templates de email se encuentran en:
- `/src/lib/email.ts`

Puedes modificar:
- Diseño HTML de los emails
- Textos y mensajes
- Colores y estilos
- Información incluida en los emails
