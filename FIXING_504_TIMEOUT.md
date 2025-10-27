# Guía para Resolver Error 504 Gateway Timeout en Registro Facial

## Problema
El procesamiento de imágenes faciales con face-api.js está tardando más de 60 segundos, causando timeout en nginx.

---

## Solución 1: Aumentar Timeouts de Nginx ⚡ (RÁPIDO - 5 minutos)

### Paso 1: Ubicar tu configuración de nginx

Tu sitio probablemente usa uno de estos archivos:
```bash
cd /home/martin/Desarrollos/checkpoint/checkpoint-app
ls -la *.conf
```

### Paso 2: Editar configuración del sitio

Busca tu archivo de configuración del sitio (ej: `checkpoint-site.conf`) y agrega estos timeouts dentro del bloque `location /`:

```nginx
server {
    listen 443 ssl http2;
    server_name checkpoint.axiomacloud.com;

    # ... otras configuraciones SSL ...

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # ⭐ AGREGAR ESTOS TIMEOUTS PARA BIOMETRÍA ⭐
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }

    # ⭐ RUTA ESPECÍFICA PARA ENDPOINTS BIOMÉTRICOS CON TIMEOUT MAYOR ⭐
    location /api/mobile/biometric/enroll/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Timeouts específicos para procesamiento facial (180 segundos = 3 minutos)
        proxy_connect_timeout 180s;
        proxy_send_timeout 180s;
        proxy_read_timeout 180s;

        # Tamaño de cuerpo mayor para imágenes
        client_max_body_size 10M;
    }
}
```

### Paso 3: Aplicar cambios

```bash
# Copiar configuración al directorio de nginx
sudo cp checkpoint-site.conf /etc/nginx/sites-available/checkpoint

# Verificar sintaxis
sudo nginx -t

# Si todo está OK, recargar nginx
sudo systemctl reload nginx

# Ver logs en tiempo real
sudo tail -f /var/log/nginx/error.log
```

---

## Solución 2: Optimizar Procesamiento Facial 🚀 (MEDIO - 30 minutos)

### Opción 2A: Procesamiento Paralelo

Edita `/home/martin/Desarrollos/checkpoint/checkpoint-web/src/app/api/mobile/biometric/enroll/face/route.ts`:

```typescript
// ANTES (líneas 87-97) - Procesamiento secuencial
for (let i = 0; i < images.length; i++) {
  try {
    const embedding = await extractFaceEmbedding(images[i])
    embeddings.push(embedding)
  } catch (error) {
    // ...
  }
}

// DESPUÉS - Procesamiento paralelo
const embeddingPromises = images.map(async (image, i) => {
  try {
    const embedding = await extractFaceEmbedding(image)
    console.log(`✅ Imagen ${i + 1}/${images.length} procesada`)
    return { success: true, embedding, index: i }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ Error procesando imagen ${i + 1}:`, message)
    return { success: false, error: message, index: i }
  }
})

const results = await Promise.all(embeddingPromises)

// Filtrar exitosos y errores
const embeddings: FaceEmbedding[] = []
const errors: string[] = []

results.forEach((result) => {
  if (result.success) {
    embeddings.push(result.embedding)
  } else {
    errors.push(`Imagen ${result.index + 1}: ${result.error}`)
  }
})
```

**Ventaja**: Reduce el tiempo de procesamiento a ~30% del original (3-5 imágenes en paralelo)

### Opción 2B: Reducir Resolución de Imágenes

Edita `/home/martin/Desarrollos/checkpoint/checkpoint-web/src/lib/biometric.ts`:

```typescript
import sharp from 'sharp' // Agregar: npm install sharp

export async function extractFaceEmbedding(imageBase64: string): Promise<FaceEmbedding> {
  if (!faceApiInitialized) {
    await initializeFaceApi()
  }

  try {
    // Convertir base64 a buffer
    let imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64')

    // ⭐ OPTIMIZACIÓN: Redimensionar imagen a máximo 640x480 ⭐
    imageBuffer = await sharp(imageBuffer)
      .resize(640, 480, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toBuffer()

    // Detectar rostro y extraer descriptor
    const detection = await faceapi
      .detectSingleFace(imageBuffer as unknown as HTMLCanvasElement)
      .withFaceLandmarks()
      .withFaceDescriptor()

    // ... resto del código
  }
}
```

**Instalación**:
```bash
cd /home/martin/Desarrollos/checkpoint/checkpoint-web
npm install sharp
```

**Ventaja**: Reduce tiempo de procesamiento ~40-50%

---

## Solución 3: Procesamiento Asíncrono con Cola ⚙️ (AVANZADO - 2-3 horas)

Esta es la solución más robusta para producción.

### Paso 1: Instalar dependencias

```bash
cd /home/martin/Desarrollos/checkpoint/checkpoint-web
npm install bull ioredis
npm install --save-dev @types/bull
```

### Paso 2: Crear servicio de cola

Crea el archivo `src/lib/queues/biometric-queue.ts`:

```typescript
import Queue from 'bull'
import { extractFaceEmbedding, encryptFaceEmbeddings, FaceEmbedding } from '@/lib/biometric'
import { prisma } from '@/lib/prisma'

// Crear cola de procesamiento biométrico
export const biometricQueue = new Queue('biometric-processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  }
})

// Definir tipos de trabajos
interface FaceEnrollJob {
  userId: string
  tenantId: string
  images: string[]
  consentSigned: boolean
}

// Procesar trabajos
biometricQueue.process('face-enroll', async (job) => {
  const { userId, tenantId, images, consentSigned } = job.data as FaceEnrollJob

  console.log(`🔄 Procesando enrollment facial para usuario ${userId}`)
  job.progress(10)

  try {
    // Procesar imágenes en paralelo
    const embeddingPromises = images.map(async (image, i) => {
      try {
        const embedding = await extractFaceEmbedding(image)
        job.progress(10 + (80 * (i + 1) / images.length))
        return { success: true, embedding }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return { success: false, error: message }
      }
    })

    const results = await Promise.all(embeddingPromises)
    const embeddings: FaceEmbedding[] = results
      .filter(r => r.success)
      .map(r => r.embedding!)

    if (embeddings.length < 3) {
      throw new Error('No se pudieron procesar suficientes imágenes')
    }

    // Encriptar y guardar
    const encryptedEmbeddings = encryptFaceEmbeddings(embeddings)

    await prisma.biometricData.upsert({
      where: { userId },
      update: {
        faceEmbeddings: encryptedEmbeddings,
        consentSigned,
        consentDate: new Date(),
        updatedAt: new Date()
      },
      create: {
        userId,
        tenantId,
        faceEmbeddings: encryptedEmbeddings,
        enrolledById: userId,
        consentSigned,
        consentDate: new Date(),
        isActive: true
      }
    })

    job.progress(100)
    console.log(`✅ Enrollment facial completado para usuario ${userId}`)

    return { success: true, embeddingCount: embeddings.length }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ Error en enrollment facial:`, message)
    throw error
  }
})

// Monitor de eventos
biometricQueue.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completado`)
})

biometricQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} falló:`, err.message)
})
```

### Paso 3: Modificar ruta de enrollment

Edita `src/app/api/mobile/biometric/enroll/face/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { biometricQueue } from '@/lib/queues/biometric-queue'

export async function POST(req: NextRequest) {
  try {
    // ... validaciones de autenticación (líneas 18-35) ...

    const { images, consentSigned, replaceExisting } = await req.json()

    // ... validaciones de imágenes (líneas 40-66) ...

    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, tenantId: true, email: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // ⭐ AGREGAR A LA COLA EN LUGAR DE PROCESAR SÍNCRONAMENTE ⭐
    const job = await biometricQueue.add('face-enroll', {
      userId: user.id,
      tenantId: user.tenantId,
      images,
      consentSigned
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      timeout: 180000 // 3 minutos máximo
    })

    console.log(`📤 Job de enrollment facial creado: ${job.id}`)

    // Responder inmediatamente
    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
        status: 'processing',
        message: 'El procesamiento facial ha comenzado. Esto puede tardar 1-2 minutos.'
      }
    }, { status: 202 }) // 202 Accepted

  } catch (error: unknown) {
    console.error('Error en enroll/face:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al iniciar registro facial',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
```

### Paso 4: Crear endpoint de estado

Crea `src/app/api/mobile/biometric/enroll/status/[jobId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { biometricQueue } from '@/lib/queues/biometric-queue'

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const job = await biometricQueue.getJob(params.jobId)

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job no encontrado' },
        { status: 404 }
      )
    }

    const state = await job.getState()
    const progress = job.progress()

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
        state,
        progress,
        result: state === 'completed' ? job.returnvalue : null
      }
    })

  } catch (error: unknown) {
    console.error('Error consultando estado:', error)
    return NextResponse.json(
      { success: false, error: 'Error consultando estado' },
      { status: 500 }
    )
  }
}
```

### Paso 5: Instalar y configurar Redis

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server -y
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verificar
redis-cli ping
# Debe responder: PONG
```

### Paso 6: Actualizar variables de entorno

Edita `.env`:
```bash
# Redis para cola de procesamiento biométrico
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=tu_password_si_tienes
```

### Paso 7: Modificar app móvil para polling

Edita `checkpoint-app/src/screens/BiometricEnrollmentScreen.js`:

```javascript
const performEnrollFace = async () => {
  try {
    setEnrolling(true);

    // Enviar para procesamiento
    const response = await ApiService.enrollFace(faceImages, consentSigned);

    if (response.data.status === 'processing') {
      // Polling del estado
      const jobId = response.data.jobId;
      await pollEnrollmentStatus(jobId);
    }

  } catch (error) {
    console.error('Error enrolling face:', error);
    alert.error('Error', error.message);
  } finally {
    setEnrolling(false);
  }
};

const pollEnrollmentStatus = async (jobId, maxAttempts = 60) => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const statusResponse = await fetch(
        `${ApiService.getBaseUrl()}/mobile/biometric/enroll/status/${jobId}`,
        {
          headers: {
            'Authorization': `Bearer ${ApiService.token}`
          }
        }
      );

      const status = await statusResponse.json();

      if (status.data.state === 'completed') {
        alert.success('¡Registrado!', 'Imágenes faciales registradas exitosamente');
        await loadBiometricData();
        setSelectedMethod(null);
        setFaceImages([]);
        return;
      }

      if (status.data.state === 'failed') {
        throw new Error('El procesamiento facial falló');
      }

      // Esperar 2 segundos antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error('Error polling status:', error);
      throw error;
    }
  }

  throw new Error('Timeout esperando resultado del procesamiento');
};
```

---

## Recomendación

**Para resolver INMEDIATAMENTE**: Usa **Solución 1** (5 minutos)

**Para mejor rendimiento**: Combina **Solución 1 + Solución 2A** (35 minutos)

**Para producción escalable**: Implementa **Solución 3** (2-3 horas)

---

## Verificación

Después de aplicar los cambios, prueba con:

```bash
# Ver logs de nginx en tiempo real
sudo tail -f /var/log/nginx/error.log

# Ver logs de la app Next.js
cd /home/martin/Desarrollos/checkpoint/checkpoint-web
pm2 logs checkpoint-web

# Ver estado de Redis (si usas Solución 3)
redis-cli info stats
```

---

## Troubleshooting

### Si sigue dando 504:
1. Verifica que nginx se recargó correctamente: `sudo nginx -t && sudo systemctl status nginx`
2. Revisa los logs: `sudo tail -100 /var/log/nginx/error.log`
3. Aumenta aún más los timeouts (ej: 300s)

### Si da error de memoria:
- El procesamiento facial consume mucha RAM
- Considera reducir resolución de imágenes (Solución 2B)
- Monitorea memoria: `free -h`

### Si Redis no funciona:
```bash
sudo systemctl status redis-server
sudo journalctl -u redis-server -n 50
```
