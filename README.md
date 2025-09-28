# Checkpoint Web - Sistema de Gestión de Checkpoints

Sistema completo de gestión de checkpoints con panel web administrativo y aplicación móvil para registro de ubicaciones.

## 🚀 Características

- **Panel Web Administrativo** - Gestión completa de usuarios, lugares y checkpoints
- **Aplicación Móvil** - Registro de checkpoints con GPS y fotos
- **Autenticación JWT** - Segura y compatible con Edge Runtime
- **Base de Datos PostgreSQL** - Con Prisma ORM
- **Subida de Imágenes** - Desde la app móvil
- **Dashboard en Tiempo Real** - Estadísticas y filtros avanzados

## 🛠️ Stack Tecnológico

### Backend Web
- **Framework**: Next.js 15.5.4 (App Router)
- **Base de Datos**: PostgreSQL 14.19
- **ORM**: Prisma 6.16.2
- **Autenticación**: JWT con `jose` library
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

### Mobile App
- **Framework**: React Native con Expo
- **Navegación**: React Navigation
- **Almacenamiento**: Expo SecureStore
- **Cámara**: Expo ImagePicker
- **GPS**: Expo Location

## 📋 Requisitos Previos

- Node.js 18+
- PostgreSQL 14+
- npm o yarn
- Expo CLI (para app móvil)

## ⚙️ Instalación y Configuración

### 1. Backend Web

```bash
# Clonar e instalar dependencias
cd checkpoint-web
npm install

# Configurar base de datos
# Editar .env con tus credenciales PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/checkpoint?schema=public"
JWT_SECRET="checkpoint-jwt-secret-key-2024"

# Generar cliente Prisma y crear tablas
npx prisma generate
npx prisma db push

# Crear usuario inicial
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function createUser() {
  const hashedPassword = await bcrypt.hash('123456', 10);
  await prisma.user.create({
    data: { name: 'Usuario Test', email: 'test@test.com', password: hashedPassword }
  });
  console.log('Usuario creado: test@test.com / 123456');
  await prisma.\$disconnect();
}
createUser();"

# Iniciar servidor
npm run dev
```

### 2. Aplicación Móvil

```bash
# Navegar a la carpeta de la app móvil
cd ../checkpoint/checkpoint-app

# Instalar dependencias
npm install

# Iniciar Expo
expo start
```

## 🗃️ Esquema de Base de Datos

### Users (Usuarios)
```sql
- id: String (PK, CUID)
- name: String
- email: String (UNIQUE)
- password: String (Hashed)
- isActive: Boolean (default: true)
- createdAt: DateTime
- updatedAt: DateTime
```

### Places (Lugares)
```sql
- id: String (PK, CUID)
- name: String
- address: String
- latitude: Float
- longitude: Float
- isActive: Boolean (default: true)
- createdAt: DateTime
- updatedAt: DateTime
```

### UserPlaceAssignments (Asignaciones)
```sql
- id: String (PK, CUID)
- userId: String (FK → Users.id)
- placeId: String (FK → Places.id)
- createdAt: DateTime
- UNIQUE(userId, placeId)
```

### Checkpoints
```sql
- id: String (PK, CUID)
- userId: String (FK → Users.id)
- placeId: String? (FK → Places.id, opcional)
- placeName: String
- latitude: Float
- longitude: Float
- timestamp: DateTime
- notes: String?
- imageUrl: String?
- createdAt: DateTime
```

## 🔗 API Endpoints

### Panel Web Admin

#### Autenticación
- `POST /api/auth/login` - Login web admin
- `POST /api/auth/logout` - Logout web admin

#### Usuarios
- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `PUT /api/users` - Actualizar usuario
- `DELETE /api/users` - Desactivar usuario
- `POST /api/users/toggle` - Activar/desactivar usuario

#### Lugares
- `GET /api/places` - Listar lugares
- `POST /api/places` - Crear lugar
- `PUT /api/places` - Actualizar lugar
- `DELETE /api/places` - Desactivar lugar

#### Checkpoints
- `GET /api/checkpoints` - Listar checkpoints (con filtros)
- `DELETE /api/checkpoints` - Eliminar checkpoint

#### Asignaciones
- `GET /api/assignments` - Listar asignaciones
- `POST /api/assignments` - Crear asignación
- `DELETE /api/assignments` - Eliminar asignación

#### Dashboard
- `GET /api/dashboard/stats` - Estadísticas del dashboard

### API Móvil

#### Autenticación
```http
POST /api/mobile/auth
Content-Type: application/json

{
  "email": "test@test.com",
  "password": "123456"
}

Response:
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "name": "Usuario Test",
    "email": "test@test.com"
  },
  "places": [
    {
      "id": "place-id",
      "name": "Lugar Name",
      "address": "Dirección",
      "lat": -34.603722,
      "lng": -58.381592
    }
  ]
}
```

#### Lugares Asignados
```http
GET /api/mobile/places
Authorization: Bearer {token}

Response: [
  {
    "id": "place-id",
    "name": "Lugar Name",
    "address": "Dirección",
    "lat": -34.603722,
    "lng": -58.381592
  }
]
```

#### Crear Checkpoint
```http
POST /api/mobile/checkpoints
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData:
- placeId: "place-id" (opcional)
- placeName: "Nombre del lugar" (requerido)
- latitude: "-34.603722" (requerido)
- longitude: "-58.381592" (requerido)
- timestamp: "2024-01-01T12:00:00Z" (requerido)
- notes: "Notas opcionales"
- image: File (opcional - imagen JPEG/PNG)

Response:
{
  "success": true,
  "message": "Ubicación registrada exitosamente",
  "checkpointId": "checkpoint-id"
}
```

#### Historial de Checkpoints
```http
GET /api/mobile/checkpoints?limit=50&offset=0
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "checkpoints": [...],
    "pagination": {
      "total": 100,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

## 🔐 Autenticación y Seguridad

### Web Admin
- **Cookies HTTP-only** para persistencia de sesión
- **Middleware de protección** en todas las rutas privadas
- **Contraseñas hasheadas** con bcrypt (salt rounds: 12)

### Mobile App
- **JWT Tokens** en header Authorization
- **Tokens válidos por 7 días**
- **Verificación en cada request** de API móvil

### JWT Configuration
```javascript
// Librería: jose (compatible con Edge Runtime)
// Secret: JWT_SECRET en .env
// Algoritmo: HS256
// Expiración: 7 días
```

## 📁 Estructura de Archivos

```
checkpoint-web/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/           # Autenticación web
│   │   │   ├── mobile/         # API móvil
│   │   │   ├── users/          # CRUD usuarios
│   │   │   ├── places/         # CRUD lugares
│   │   │   ├── checkpoints/    # Gestión checkpoints
│   │   │   ├── assignments/    # Asignaciones
│   │   │   └── dashboard/      # Estadísticas
│   │   ├── login/              # Página login
│   │   ├── users/              # Gestión usuarios
│   │   ├── places/             # Gestión lugares
│   │   ├── checkpoints/        # Gestión checkpoints
│   │   ├── assignments/        # Gestión asignaciones
│   │   └── page.tsx            # Dashboard principal
│   ├── components/
│   │   ├── DashboardLayout.tsx # Layout principal
│   │   └── Navbar.tsx          # Navegación
│   ├── lib/
│   │   ├── auth.ts             # Utilidades JWT
│   │   └── prisma.ts           # Cliente Prisma
│   └── middleware.ts           # Middleware auth
├── prisma/
│   └── schema.prisma           # Esquema DB
├── public/
│   └── uploads/                # Imágenes subidas
└── .env                        # Variables entorno
```

## 🚀 Despliegue

### Variables de Entorno Requeridas
```env
# Base de datos
DATABASE_URL="postgresql://user:password@host:port/database"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# Google Maps (opcional)
GOOGLE_MAPS_API_KEY="your-google-maps-key"

# Uploads
UPLOAD_DIR="./public/uploads"
```

### Comandos de Producción
```bash
# Build para producción
npm run build

# Iniciar en producción
npm start

# Verificar base de datos
npx prisma db status
npx prisma studio  # Para inspeccionar datos
```

## 📱 Configuración App Móvil

### Configurar URL del Servidor
Editar `src/services/api.js`:
```javascript
// Para desarrollo local
const API_BASE_URL = 'http://localhost:3001/api/mobile';

// Para producción (cambiar por tu dominio)
const API_BASE_URL = 'https://tu-dominio.com/api/mobile';
```

### Permisos Requeridos
- **Ubicación** - Para obtener coordenadas GPS
- **Cámara** - Para tomar fotos de checkpoints
- **Almacenamiento** - Para guardar fotos temporalmente

## 👥 Usuarios de Prueba

### Admin Web
- **Email**: test@test.com
- **Password**: 123456

### Datos Mock (Mobile)
Si el backend no está disponible, la app usa datos mock:
- **Email**: demo@example.com
- **Password**: demo123

## 🧪 Testing

### Probar Endpoints con curl

```bash
# Login
curl -X POST http://localhost:3001/api/mobile/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# Crear checkpoint
curl -X POST http://localhost:3001/api/mobile/checkpoints \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "placeName=Test Location" \
  -F "latitude=-34.603722" \
  -F "longitude=-58.381592" \
  -F "timestamp=2024-01-01T12:00:00Z"
```

## 🐛 Troubleshooting

### Errores Comunes

**1. Error de conexión PostgreSQL**
```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Verificar puerto y credenciales en .env
DATABASE_URL="postgresql://postgres:password@localhost:5433/checkpoint"
```

**2. Token inválido en Edge Runtime**
- Asegúrate de usar `jose` en lugar de `jsonwebtoken`
- Verificar que JWT_SECRET esté configurado

**3. App móvil no conecta**
- Verificar URL en `api.js` (puerto 3001)
- Confirmar que el servidor web esté corriendo
- Revisar red (usar IP local en lugar de localhost)

**4. Imágenes no se suben**
- Verificar permisos en directorio `/public/uploads/`
- Confirmar que el directorio existe

## 📞 Soporte

Para reportar bugs o solicitar features:
1. Revisar logs del servidor con `npm run dev`
2. Verificar conexión a base de datos
3. Comprobar configuración de variables de entorno

---

**Desarrollado con ❤️ usando Next.js, React Native y PostgreSQL**
