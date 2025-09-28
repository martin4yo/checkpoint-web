# API Reference - Checkpoint System

Documentación completa de todos los endpoints del sistema de checkpoints.

## 🔐 Autenticación

Todos los endpoints (excepto login público) requieren autenticación:

### Web Admin
- **Cookies HTTP-only**: `token=jwt-token`
- **Middleware**: Protege rutas automáticamente

### Mobile API
- **Header**: `Authorization: Bearer jwt-token`
- **Verificación**: En cada request

---

## 📱 Mobile API Endpoints

Base URL: `/api/mobile`

### POST /api/mobile/auth
**Descripción**: Autenticación para app móvil

**Request**:
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response 200**:
```json
{
  "token": "jwt-token-string",
  "user": {
    "id": "user-id",
    "name": "User Name",
    "email": "user@email.com"
  },
  "places": [
    {
      "id": "place-id",
      "name": "Place Name",
      "address": "Place Address",
      "lat": -34.603722,
      "lng": -58.381592
    }
  ]
}
```

**Response 401**:
```json
{
  "error": "Credenciales inválidas"
}
```

---

### GET /api/mobile/places
**Descripción**: Obtiene lugares asignados al usuario autenticado

**Headers**:
```
Authorization: Bearer jwt-token
```

**Response 200**:
```json
[
  {
    "id": "place-id",
    "name": "Place Name",
    "address": "Place Address",
    "lat": -34.603722,
    "lng": -58.381592
  }
]
```

**Response 401**:
```json
{
  "error": "Token requerido"
}
```

---

### POST /api/mobile/checkpoints
**Descripción**: Crea un nuevo checkpoint

**Headers**:
```
Authorization: Bearer jwt-token
Content-Type: multipart/form-data
```

**FormData**:
- `placeId` (string, opcional): ID del lugar
- `placeName` (string, required): Nombre del lugar
- `latitude` (string, required): Coordenada GPS
- `longitude` (string, required): Coordenada GPS
- `timestamp` (string, required): ISO 8601 timestamp
- `notes` (string, opcional): Notas adicionales
- `image` (File, opcional): Imagen JPEG/PNG

**Response 200**:
```json
{
  "success": true,
  "message": "Ubicación registrada exitosamente",
  "checkpointId": "checkpoint-id"
}
```

**Response 401**:
```json
{
  "error": "Token requerido"
}
```

---

### GET /api/mobile/checkpoints
**Descripción**: Obtiene historial de checkpoints del usuario

**Headers**:
```
Authorization: Bearer jwt-token
```

**Query Parameters**:
- `limit` (number, opcional): Límite de resultados (default: 50)
- `offset` (number, opcional): Offset para paginación (default: 0)

**Response 200**:
```json
{
  "success": true,
  "data": {
    "checkpoints": [
      {
        "id": "checkpoint-id",
        "placeName": "Place Name",
        "latitude": -34.603722,
        "longitude": -58.381592,
        "timestamp": "2024-01-01T12:00:00Z",
        "notes": "Notes text",
        "imageUrl": "/uploads/image.jpg",
        "createdAt": "2024-01-01T12:00:00Z",
        "place": {
          "name": "Place Name",
          "address": "Place Address"
        }
      }
    ],
    "pagination": {
      "total": 100,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

---

## 🌐 Web Admin API Endpoints

Base URL: `/api`

### Autenticación Web

#### POST /api/auth/login
**Descripción**: Login para panel web admin

**Request**:
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response 200**:
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "name": "User Name",
    "email": "user@email.com"
  },
  "token": "jwt-token"
}
```

**Cookies Set**: `token=jwt-token; HttpOnly; SameSite=Lax`

#### POST /api/auth/logout
**Descripción**: Logout del panel web

**Response 200**:
```json
{
  "success": true
}
```

**Cookies Cleared**: `token`

---

### Usuarios

#### GET /api/users
**Descripción**: Lista todos los usuarios

**Response 200**:
```json
[
  {
    "id": "user-id",
    "name": "User Name",
    "email": "user@email.com",
    "isActive": true,
    "createdAt": "2024-01-01T12:00:00Z",
    "_count": {
      "assignments": 5,
      "checkpoints": 23
    }
  }
]
```

#### POST /api/users
**Descripción**: Crea un nuevo usuario

**Request**:
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response 201**:
```json
{
  "id": "user-id",
  "name": "User Name",
  "email": "user@email.com",
  "isActive": true,
  "createdAt": "2024-01-01T12:00:00Z"
}
```

#### PUT /api/users
**Descripción**: Actualiza un usuario existente

**Request**:
```json
{
  "id": "string (required)",
  "name": "string (required)",
  "email": "string (required)",
  "password": "string (opcional)"
}
```

#### DELETE /api/users
**Descripción**: Desactiva un usuario (soft delete)

**Request**:
```json
{
  "id": "string (required)"
}
```

#### POST /api/users/toggle
**Descripción**: Activa/desactiva un usuario

**Request**:
```json
{
  "id": "string (required)",
  "isActive": "boolean (required)"
}
```

---

### Lugares

#### GET /api/places
**Descripción**: Lista todos los lugares

**Response 200**:
```json
[
  {
    "id": "place-id",
    "name": "Place Name",
    "address": "Place Address",
    "latitude": -34.603722,
    "longitude": -58.381592,
    "isActive": true,
    "createdAt": "2024-01-01T12:00:00Z",
    "_count": {
      "assignments": 3,
      "checkpoints": 15
    }
  }
]
```

#### POST /api/places
**Descripción**: Crea un nuevo lugar

**Request**:
```json
{
  "name": "string (required)",
  "address": "string (required)",
  "latitude": "number (required)",
  "longitude": "number (required)"
}
```

#### PUT /api/places
**Descripción**: Actualiza un lugar existente

**Request**:
```json
{
  "id": "string (required)",
  "name": "string (required)",
  "address": "string (required)",
  "latitude": "number (required)",
  "longitude": "number (required)"
}
```

#### DELETE /api/places
**Descripción**: Desactiva un lugar (soft delete)

**Request**:
```json
{
  "id": "string (required)"
}
```

---

### Checkpoints

#### GET /api/checkpoints
**Descripción**: Lista checkpoints con filtros opcionales

**Query Parameters**:
- `search` (string): Buscar por nombre de lugar
- `dateFrom` (string): Fecha desde (YYYY-MM-DD)
- `dateTo` (string): Fecha hasta (YYYY-MM-DD)
- `userId` (string): Filtrar por usuario
- `placeId` (string): Filtrar por lugar

**Response 200**:
```json
[
  {
    "id": "checkpoint-id",
    "placeName": "Place Name",
    "latitude": -34.603722,
    "longitude": -58.381592,
    "timestamp": "2024-01-01T12:00:00Z",
    "notes": "Notes text",
    "imageUrl": "/uploads/image.jpg",
    "createdAt": "2024-01-01T12:00:00Z",
    "user": {
      "id": "user-id",
      "name": "User Name",
      "email": "user@email.com"
    },
    "place": {
      "id": "place-id",
      "name": "Place Name",
      "address": "Place Address"
    }
  }
]
```

#### DELETE /api/checkpoints
**Descripción**: Elimina un checkpoint

**Request**:
```json
{
  "id": "string (required)"
}
```

---

### Asignaciones

#### GET /api/assignments
**Descripción**: Lista todas las asignaciones usuario-lugar

**Response 200**:
```json
[
  {
    "id": "assignment-id",
    "userId": "user-id",
    "placeId": "place-id",
    "createdAt": "2024-01-01T12:00:00Z",
    "user": {
      "id": "user-id",
      "name": "User Name",
      "email": "user@email.com"
    },
    "place": {
      "id": "place-id",
      "name": "Place Name",
      "address": "Place Address"
    }
  }
]
```

#### POST /api/assignments
**Descripción**: Crea una nueva asignación usuario-lugar

**Request**:
```json
{
  "userId": "string (required)",
  "placeId": "string (required)"
}
```

**Response 201**: Igual que GET, pero solo el objeto creado

**Response 400**:
```json
{
  "error": "Esta asignación ya existe"
}
```

#### DELETE /api/assignments
**Descripción**: Elimina una asignación

**Request**:
```json
{
  "id": "string (required)"
}
```

---

### Dashboard

#### GET /api/dashboard/stats
**Descripción**: Obtiene estadísticas del dashboard

**Response 200**:
```json
{
  "totalUsers": 25,
  "totalPlaces": 8,
  "totalCheckpoints": 147,
  "todayCheckpoints": 12
}
```

---

## 📝 Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK - Operación exitosa |
| 201 | Created - Recurso creado exitosamente |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - Token inválido o faltante |
| 403 | Forbidden - Acceso denegado |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |

---

## 🔒 Seguridad

### Headers de Seguridad
```http
Authorization: Bearer jwt-token
Content-Type: application/json
```

### Validaciones
- **JWT Tokens**: Expiran en 7 días
- **Contraseñas**: Hasheadas con bcrypt (12 rounds)
- **Emails**: Únicos en la base de datos
- **CORS**: Configurado para dominios permitidos

### Rate Limiting
- **Login**: Máximo 5 intentos por minuto por IP
- **API Calls**: Máximo 100 requests por minuto por token

---

## 📊 Formatos de Fecha

Todas las fechas siguen el formato ISO 8601:
```
2024-01-01T12:00:00.000Z
```

### Timestamps
- `createdAt`: Fecha de creación (automática)
- `updatedAt`: Fecha de última actualización (automática)
- `timestamp`: Fecha/hora del checkpoint (proporcionada por mobile)

---

## 📁 Subida de Archivos

### Endpoint: POST /api/mobile/checkpoints
**Formato**: `multipart/form-data`

**Formatos Permitidos**:
- JPEG (.jpg, .jpeg)
- PNG (.png)

**Límites**:
- Tamaño máximo: 10MB por imagen
- Resolución máxima: 4096x4096px

**Almacenamiento**:
- Directorio: `/public/uploads/`
- Naming: `timestamp-originalname.ext`
- URL pública: `/uploads/filename.ext`

---

## 🧪 Testing con cURL

### Login Mobile
```bash
curl -X POST http://localhost:3001/api/mobile/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

### Crear Checkpoint
```bash
curl -X POST http://localhost:3001/api/mobile/checkpoints \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "placeName=Test Location" \
  -F "latitude=-34.603722" \
  -F "longitude=-58.381592" \
  -F "timestamp=2024-01-01T12:00:00Z" \
  -F "notes=Test checkpoint"
```

### Login Web Admin
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}' \
  -c cookies.txt
```

### Listar Usuarios (con cookies)
```bash
curl -X GET http://localhost:3001/api/users \
  -b cookies.txt
```

---

**Documentación generada automáticamente - Última actualización: 2024**