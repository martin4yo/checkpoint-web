# 🔐 Biometric API - CheckPoint Backend

## 📚 Documentación de API Biométrica

### Base URL
```
https://checkpoint.axiomacloud.com/api/mobile/biometric
```

---

## 🔑 Autenticación

Todos los endpoints (excepto `/clock` y `/verify`) requieren autenticación JWT:

```http
Authorization: Bearer {token}
```

---

## 📋 Endpoints

### 1. Enrollment (Registro)

#### `POST /enroll/face`
Registra embeddings faciales del usuario.

**Request:**
```json
{
  "images": [
    "data:image/jpeg;base64,...",
    "data:image/jpeg;base64,...",
    "data:image/jpeg;base64,..."
  ],
  "consentSigned": true,
  "replaceExisting": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "clxxx",
    "enrolledAt": "2025-10-25T12:00:00Z",
    "faceCount": 3,
    "averageConfidence": 0.89
  },
  "message": "3 imágenes faciales registradas exitosamente"
}
```

#### `POST /enroll/fingerprint`
Registra hash de huella digital.

**Request:**
```json
{
  "fingerprintHash": "device-hash-unique",
  "consentSigned": true,
  "replaceExisting": false
}
```

#### `POST /enroll/pin`
Registra PIN de 6 dígitos.

**Request:**
```json
{
  "pin": "123456",
  "replaceExisting": false
}
```

#### `GET /enroll/qr`
Genera o recupera código QR del usuario.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "clxxx",
    "userName": "Juan Pérez",
    "qrCode": "BIOMETRIC:tenant:user:uuid",
    "qrImage": "data:image/png;base64,..."
  }
}
```

#### `POST /enroll/qr`
Regenera el código QR (útil si fue comprometido).

---

### 2. Verificación

#### `POST /verify`
Verifica identidad biométrica (uso interno).

**Request:**
```json
{
  "method": "FACE",
  "data": "data:image/jpeg;base64,...",
  "userId": "optional"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "userId": "clxxx",
    "confidence": 0.87,
    "method": "FACE"
  }
}
```

---

### 3. Fichaje

#### `POST /clock`
Registra fichaje de entrada/salida.

**Request:**
```json
{
  "method": "FACE",
  "clockType": "IN",
  "data": "data:image/jpeg;base64,...",
  "latitude": -34.603722,
  "longitude": -58.381592,
  "placeId": "place123",
  "photo": "data:image/jpeg;base64,...",
  "deviceInfo": {
    "model": "Galaxy Tab",
    "androidId": "abc123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clockId": "clock123",
    "userId": "user456",
    "userName": "Juan Pérez",
    "clockType": "IN",
    "method": "FACE",
    "confidence": 0.87,
    "place": "Oficina Central",
    "timestamp": "2025-10-25T08:30:00Z"
  },
  "message": "Fichaje de entrada registrado exitosamente"
}
```

#### `GET /clock?limit=50&offset=0`
Obtiene historial de fichajes del usuario.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clock123",
      "userId": "user456",
      "clockType": "IN",
      "method": "FACE",
      "confidence": 0.87,
      "latitude": -34.603722,
      "longitude": -58.381592,
      "createdAt": "2025-10-25T08:30:00Z",
      "user": {
        "id": "user456",
        "name": "Juan Pérez",
        "email": "juan@empresa.com"
      },
      "place": {
        "id": "place123",
        "name": "Oficina Central",
        "address": "Av. Corrientes 1234"
      }
    }
  ]
}
```

---

### 4. Estado y Configuración

#### `GET /status`
Obtiene estado de enrollment del usuario autenticado.

**Response:**
```json
{
  "success": true,
  "data": {
    "enrolled": true,
    "isActive": true,
    "methods": {
      "face": { "enrolled": true, "enabled": true },
      "fingerprint": { "enrolled": false, "enabled": true },
      "pin": { "enrolled": true, "enabled": true },
      "qr": { "enrolled": true, "enabled": true }
    },
    "consent": {
      "signed": true,
      "date": "2025-10-01T10:00:00Z"
    },
    "enrolledAt": "2025-10-01T10:00:00Z",
    "lastUsedAt": "2025-10-25T08:30:00Z"
  }
}
```

#### `GET /config`
Obtiene configuración biométrica del tenant.

**Response:**
```json
{
  "success": true,
  "data": {
    "faceEnabled": true,
    "fingerprintEnabled": true,
    "pinEnabled": true,
    "qrEnabled": true,
    "faceThreshold": 0.6,
    "faceMinPhotos": 3,
    "pinLength": 6,
    "requirePhotoOnClock": true,
    "maxRetries": 3
  }
}
```

---

## 📊 Modelos de Base de Datos

### `biometric_data`
```sql
CREATE TABLE biometric_data (
  id                UUID PRIMARY KEY,
  user_id           UUID UNIQUE REFERENCES users(id),
  tenant_id         UUID REFERENCES tenants(id),

  -- Datos biométricos encriptados
  face_embeddings   TEXT,
  fingerprint_hash  TEXT,
  pin_hash          TEXT,
  qr_code           TEXT UNIQUE,

  -- Metadata
  consent_signed    BOOLEAN DEFAULT false,
  consent_date      TIMESTAMP,
  enrolled_at       TIMESTAMP DEFAULT NOW(),
  enrolled_by_id    UUID REFERENCES users(id),
  last_used_at      TIMESTAMP,
  is_active         BOOLEAN DEFAULT true,

  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);
```

### `biometric_config`
```sql
CREATE TABLE biometric_config (
  id                      UUID PRIMARY KEY,
  tenant_id               UUID UNIQUE REFERENCES tenants(id),

  -- Métodos habilitados
  face_enabled            BOOLEAN DEFAULT true,
  fingerprint_enabled     BOOLEAN DEFAULT true,
  pin_enabled             BOOLEAN DEFAULT true,
  qr_enabled              BOOLEAN DEFAULT true,

  -- Configuración facial
  face_threshold          FLOAT DEFAULT 0.6,
  face_min_photos         INTEGER DEFAULT 3,

  -- Configuración PIN
  pin_length              INTEGER DEFAULT 6,

  -- Seguridad
  require_photo_on_clock  BOOLEAN DEFAULT true,
  max_retries             INTEGER DEFAULT 3,

  created_at              TIMESTAMP DEFAULT NOW(),
  updated_at              TIMESTAMP DEFAULT NOW()
);
```

### `biometric_clocks`
```sql
CREATE TABLE biometric_clocks (
  id                UUID PRIMARY KEY,
  user_id           UUID REFERENCES users(id),
  tenant_id         UUID REFERENCES tenants(id),
  place_id          UUID REFERENCES places(id),

  clock_type        ENUM('IN', 'OUT'),
  method            ENUM('FACE', 'FINGERPRINT', 'PIN', 'QR'),
  confidence        FLOAT,

  latitude          DECIMAL(10, 8),
  longitude         DECIMAL(11, 8),
  photo_url         TEXT,
  device_info       JSON,
  failed_attempts   INTEGER DEFAULT 0,

  created_at        TIMESTAMP DEFAULT NOW()
);
```

---

## 🔒 Seguridad

### Encriptación
- **Face embeddings:** AES-256-GCM
- **PIN:** bcrypt (10 rounds)
- **Fingerprint hash:** bcrypt (10 rounds)
- **QR code:** UUID v4 (sin datos sensibles)

### Variables de Entorno
```bash
# .env
BIOMETRIC_ENCRYPTION_KEY=<32-byte-hex-key>
DATABASE_URL=postgresql://...
```

### Consentimiento
Según Ley 25.326 (Argentina), todos los métodos biométricos requieren consentimiento firmado excepto PIN y QR.

---

## 🧪 Testing

### cURL Examples

**Registrar PIN:**
```bash
curl -X POST https://checkpoint.axiomacloud.com/api/mobile/biometric/enroll/pin \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pin": "123456",
    "replaceExisting": false
  }'
```

**Fichar entrada:**
```bash
curl -X POST https://checkpoint.axiomacloud.com/api/mobile/biometric/clock \
  -H "Content-Type: application/json" \
  -d '{
    "method": "PIN",
    "clockType": "IN",
    "data": "123456",
    "latitude": -34.603722,
    "longitude": -58.381592
  }'
```

**Ver historial:**
```bash
curl -X GET "https://checkpoint.axiomacloud.com/api/mobile/biometric/clock?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 Logs

### Backend Console
```
✅ Face-API models loaded successfully
🔍 Procesando 3 imágenes faciales para usuario user@example.com
✅ Imagen 1/3 procesada (confidence: 0.89)
✅ Datos faciales guardados para usuario user@example.com
⏰ Fichaje IN con método FACE
✅ Usuario identificado por rostro: user123 (confidence: 0.87)
✅ Fichaje registrado: Juan Pérez - IN - FACE
```

---

## 🚀 Próximos Pasos

1. Configurar `BIOMETRIC_ENCRYPTION_KEY`
2. Descargar modelos de face-api en `/public/models`
3. Crear configuración inicial por tenant
4. Testing de endpoints con Postman
5. Integración con mobile app

---

## 📞 Soporte

Ver documentación completa en:
- [BIOMETRIC_SYSTEM.md](../checkpoint-app/BIOMETRIC_SYSTEM.md)
- [BIOMETRIC_QUICKSTART.md](../checkpoint-app/BIOMETRIC_QUICKSTART.md)

---

**Versión API:** 1.0.0
**Última actualización:** 2025-10-25
