# Contexto del Proyecto Checkpoint Web

**Última actualización:** 4 de Diciembre 2025

---

## 📋 Información General

- **Proyecto:** Checkpoint Web - Sistema de gestión de checkpoints y jornadas
- **Framework:** Next.js 14 (App Router)
- **Base de datos:** PostgreSQL con Prisma ORM
- **Hosting:** VPS OVH (vps-5199621-x.vps.ovh.net)
- **Repositorio:** https://github.com/martin4yo/checkpoint-web
- **Rama principal:** master

---

## 🏗️ Arquitectura del Proyecto

### Stack Tecnológico

- **Frontend:**
  - Next.js 14 (App Router)
  - React 18
  - TypeScript
  - Tailwind CSS
  - Lucide React (iconos)

- **Backend:**
  - Next.js API Routes
  - Prisma ORM
  - PostgreSQL
  - JWT para autenticación

- **IA:**
  - Claude 3.5 Sonnet (Anthropic)
  - Chat widget integrado
  - Executor de acciones automatizado

### Estructura de Directorios

```
checkpoint-web/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API Routes
│   │   │   ├── auth/            # Autenticación
│   │   │   ├── chat/            # AI Assistant
│   │   │   ├── tenants/         # Multi-tenancy
│   │   │   ├── users/           # Usuarios
│   │   │   ├── novelties/       # Novedades
│   │   │   ├── legajos/         # Legajos
│   │   │   └── ...
│   │   ├── users/page.tsx       # Gestión de usuarios
│   │   ├── novelties/page.tsx   # Gestión de novedades
│   │   ├── legajos/page.tsx     # Gestión de legajos
│   │   └── ...
│   ├── components/              # Componentes React
│   │   ├── DashboardLayout.tsx  # Layout principal
│   │   ├── Sidebar.tsx          # Menú lateral
│   │   ├── TenantSelector.tsx   # Selector de organizaciones
│   │   ├── chat/                # Chat widget IA
│   │   └── ...
│   ├── contexts/                # React Contexts
│   │   ├── TenantContext.tsx    # Estado global de tenant
│   │   └── SidebarContext.tsx   # Estado del sidebar
│   ├── lib/                     # Utilidades
│   │   ├── auth.ts              # JWT helpers
│   │   ├── prisma.ts            # Cliente Prisma
│   │   ├── actionExecutor.ts    # Executor de acciones IA
│   │   └── chatService.ts       # Servicio de chat
│   └── hooks/                   # Custom hooks
├── prisma/
│   ├── schema.prisma            # Schema de base de datos
│   └── migrations/              # Migraciones
├── docs/                        # Documentación
│   ├── CHANGELOG-2025-12-04.md  # Changelog de hoy
│   └── CONTEXT.md               # Este archivo
└── public/                      # Assets estáticos
```

---

## 🔑 Conceptos Clave

### Multi-tenancy

El sistema soporta múltiples organizaciones (tenants) aisladas:

- **Modelo:** Cada tenant tiene sus propios datos (usuarios, lugares, checkpoints, etc.)
- **Superusers:** Pueden acceder a todos los tenants
- **Usuarios regulares:** Solo ven datos de su tenant
- **Selector:** Barra superior para superusers que permite cambiar de organización

**Implementación:**
- `TenantContext.tsx` → Estado global de tenant actual
- `TenantSelector.tsx` → Componente visual del selector
- Middleware → Filtra automáticamente por tenantId en queries

### Sistema de Novedades

Permite a los empleados solicitar:
- Adelantos de sueldo
- Días libres
- Licencias
- Adjuntar comprobantes

**Características:**
- Tipos configurables con iconos y colores
- Campos condicionales (monto, fecha, rango, adjuntos)
- Sistema de aprobación por supervisores
- Filtrado por tenant

### Sistema de Legajos

Gestión de datos de empleados:
- Campos master configurables
- Información personal
- Datos laborales
- Asignación de puestos
- Relación con usuarios del sistema

### AI Assistant

Chat widget integrado con Claude:
- Responde preguntas sobre el sistema
- Ejecuta acciones automáticamente
- Integrado en todas las páginas
- Base de conocimiento del proyecto

---

## 🗄️ Esquema de Base de Datos

### Tablas Principales

```prisma
model Tenant {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  isActive  Boolean  @default(true)

  // Relaciones
  users     User[]
  places    Place[]
  checkpoints Checkpoint[]
  // ... más relaciones
}

model User {
  id                   String   @id @default(cuid())
  email                String   @unique
  password             String
  firstName            String
  lastName             String
  tenantId             String
  supervisorId         String?
  superuser            Boolean  @default(false)
  authorizesNovelties  Boolean  @default(false)
  isActive             Boolean  @default(true)

  // Relaciones
  tenant               Tenant   @relation(fields: [tenantId], references: [id])
  supervisor           User?    @relation("UserSupervisor", fields: [supervisorId], references: [id])
}

model NoveltyType {
  id                 String   @id @default(cuid())
  name               String
  icon               String
  color              String
  requiresAmount     Boolean  @default(false)
  requiresDate       Boolean  @default(false)
  requiresDateRange  Boolean  @default(false)
  allowsAttachments  Boolean  @default(false)
  tenantId           String

  // Relaciones
  tenant             Tenant   @relation(fields: [tenantId], references: [id])
  novelties          Novelty[]
}

model Novelty {
  id             String   @id @default(cuid())
  userId         String
  noveltyTypeId  String
  status         String   // pending, approved, rejected
  amount         Float?
  startDate      DateTime?
  endDate        DateTime?
  description    String?
  tenantId       String

  // Relaciones
  user           User     @relation(fields: [userId], references: [id])
  noveltyType    NoveltyType @relation(fields: [noveltyTypeId], references: [id])
  tenant         Tenant   @relation(fields: [tenantId], references: [id])
}

// ... más modelos (Legajo, Place, Checkpoint, etc.)
```

---

## 🔌 Endpoints API Principales

### Autenticación

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/auth/login` | POST | Iniciar sesión |
| `/api/auth/logout` | POST | Cerrar sesión |
| `/api/auth/me` | GET | Usuario actual |

### Tenants

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/tenants` | GET | Listar tenants (superuser) |
| `/api/tenants/[id]` | GET | Detalles de tenant |
| `/api/tenants` | POST | Crear tenant (superuser) |
| `/api/tenants/[id]` | PUT | Actualizar tenant |
| `/api/tenants/[id]` | DELETE | Eliminar tenant |

### Usuarios

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/users` | GET | Listar usuarios |
| `/api/users` | POST | Crear usuario |
| `/api/users` | PUT | Actualizar usuario |
| `/api/users` | DELETE | Eliminar usuario |
| `/api/users/toggle` | POST | Activar/desactivar |

### Novedades

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/novelties` | GET | Listar novedades (filtrado por tenant) |
| `/api/novelties` | POST | Crear novedad |
| `/api/novelties` | PUT | Actualizar novedad |
| `/api/novelties/[id]/approve` | POST | Aprobar novedad |
| `/api/novelties/[id]/reject` | POST | Rechazar novedad |
| `/api/novelty-types` | GET | Tipos de novedades |

### Legajos

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/legajos` | GET | Listar legajos |
| `/api/legajos` | POST | Crear legajo |
| `/api/legajo-config` | GET | Configuración de campos |

### AI Chat

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/chat` | GET | Health check |
| `/api/chat` | POST | Enviar mensaje al asistente |

---

## 🌐 Variables de Entorno

### Desarrollo Local (.env.local)

```bash
# Base de datos
DATABASE_URL="postgresql://user:password@host:5432/database"

# JWT
JWT_SECRET="your-secret-key-here"

# Anthropic (Claude)
ANTHROPIC_API_KEY="sk-ant-..."

# Next.js
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### Producción (VPS)

```bash
# Base de datos (PostgreSQL remoto)
DATABASE_URL="postgresql://postgres:Q27G4B98@149.50.148.198:5432/checkpoint_db"

# JWT (usar clave segura en producción)
JWT_SECRET="production-secret-key"

# Anthropic
ANTHROPIC_API_KEY="sk-ant-..."

# Next.js
NEXT_PUBLIC_API_URL="https://checkpoint.tu-dominio.com"
```

---

## 🚀 Comandos Útiles

### Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Iniciar en producción
npm start

# Ejecutar migraciones
npx prisma migrate dev

# Generar cliente Prisma
npx prisma generate

# Abrir Prisma Studio
npx prisma studio
```

### Git

```bash
# Ver estado
git status

# Agregar cambios
git add .

# Commit
git commit -m "mensaje"

# Push a GitHub
git push origin master

# Pull cambios
git pull origin master
```

### Deployment (VPS)

```bash
# SSH al servidor
ssh root@vps-5199621-x.vps.ovh.net

# Navegar al proyecto
cd /var/www/checkpoint-web

# Pull últimos cambios
git pull

# Instalar dependencias
npm install

# Ejecutar migraciones
npx prisma migrate deploy

# Compilar
npm run build

# Reiniciar PM2
pm2 restart checkpoint-web

# Ver logs
pm2 logs checkpoint-web
```

---

## 🔧 Estado Actual del Proyecto

### ✅ Funcionalidades Completadas

- [x] Sistema de autenticación con JWT
- [x] Multi-tenancy completo
- [x] Selector de tenants para superusers
- [x] Gestión de usuarios
- [x] Sistema de novedades con tipos configurables
- [x] Sistema de legajos
- [x] Chat IA integrado
- [x] Executor de acciones automatizado
- [x] Gestión de lugares
- [x] Gestión de checkpoints
- [x] Reportes de jornadas
- [x] Sistema de notificaciones push
- [x] Responsive design

### 🐛 Bugs Conocidos

Ninguno conocido actualmente. Últimos bugs resueltos hoy:
- ✅ Badge "Sin organización seleccionada" aparecía incorrectamente
- ✅ Loop infinito en TenantSelector
- ✅ Estado selectedTenant siempre null

### 🚧 En Desarrollo

Nada actualmente en desarrollo.

### 📝 Backlog

1. **Persistencia de tenant seleccionado**
   - Guardar en localStorage la última organización seleccionada
   - Evitar auto-selección en cada carga

2. **Mejoras UI/UX**
   - Animaciones de transición al cambiar tenant
   - Indicador de carga más visible
   - Optimización de modales

3. **Performance**
   - Lazy loading del dropdown de tenants
   - Optimización de queries
   - Caching de datos frecuentes

4. **Testing**
   - Tests unitarios para componentes críticos
   - Tests de integración para API
   - Tests E2E con Playwright

---

## 👥 Equipo y Roles

### Superusuario del Sistema

**Email:** admin@checkpoint.com
**Rol:** Superuser
**Permisos:**
- Acceso a todos los tenants
- Gestión de usuarios
- Configuración del sistema
- Acceso a todas las funcionalidades

### Tenants Configurados

1. **Axioma**
   - ID: cmgzao77k0002r1xza94v7tzl
   - Slug: axioma

2. **Demo Company**
   - ID: cmgz7ox7t0000r1c4643sg8x4
   - Slug: demo

3. **Test Org**
   - ID: cmgz7o98q0000r1b4dxt0yemg
   - Slug: test

---

## 📚 Documentación Relacionada

- **Changelog de hoy:** `docs/CHANGELOG-2025-12-04.md`
- **Documentación de liquidación de sueldos:** Disponible en el repositorio
- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Tailwind Docs:** https://tailwindcss.com/docs
- **Anthropic Docs:** https://docs.anthropic.com

---

## 🔄 Flujo de Trabajo Recomendado

### Para Continuar Trabajando

1. **Revisar contexto:**
   ```bash
   cat docs/CONTEXT.md
   cat docs/CHANGELOG-2025-12-04.md
   ```

2. **Actualizar código:**
   ```bash
   git pull origin master
   npm install
   ```

3. **Iniciar desarrollo:**
   ```bash
   npm run dev
   ```

4. **Verificar que todo funciona:**
   - Abrir http://localhost:3000
   - Login como admin@checkpoint.com
   - Verificar selector de tenants
   - Probar funcionalidades críticas

### Para Agregar Nueva Funcionalidad

1. **Crear rama (opcional):**
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```

2. **Desarrollar y testear**

3. **Commit frecuentes:**
   ```bash
   git add .
   git commit -m "Descripción clara"
   ```

4. **Push y merge:**
   ```bash
   git push origin master
   # o merge de la rama
   ```

5. **Deploy a producción:**
   ```bash
   ssh root@vps-5199621-x.vps.ovh.net
   cd /var/www/checkpoint-web
   git pull
   npm install
   npm run build
   pm2 restart checkpoint-web
   ```

---

## ⚠️ Notas Importantes

### Seguridad

- **NUNCA** commitear `.env` o `.env.local`
- **SIEMPRE** usar JWT_SECRET fuerte en producción
- **VERIFICAR** que las migraciones se ejecutan correctamente
- **PROBAR** en local antes de desplegar a producción

### Base de Datos

- **Host remoto:** 149.50.148.198:5432
- **Database:** checkpoint_db
- **Usuario:** postgres
- **Password:** Q27G4B98 (cambiar en producción real)

### Performance

- El servidor compila páginas bajo demanda (first load es lento)
- Cache de Next.js se guarda en `.next/`
- Prisma genera cliente en `node_modules/.prisma/client/`

---

## 🆘 Troubleshooting

### Problema: "Port 3000 already in use"

```bash
lsof -ti:3000 | xargs -r kill -9
```

### Problema: "Prisma Client error"

```bash
npx prisma generate
```

### Problema: "Module not found"

```bash
rm -rf node_modules package-lock.json
npm install
```

### Problema: Cambios no se reflejan

```bash
rm -rf .next
npm run dev
```

### Problema: Error de TypeScript

```bash
npx tsc --noEmit
# Ver errores específicos y corregir
```

---

## 📞 Contacto y Soporte

**Repositorio:** https://github.com/martin4yo/checkpoint-web
**Issues:** https://github.com/martin4yo/checkpoint-web/issues

---

**Última actualización:** 4 de Diciembre 2025
**Última sesión:** Corrección de TenantSelector y optimización de modal de usuarios
**Próxima sesión sugerida:** Implementar persistencia de tenant seleccionado en localStorage

---

✅ **Estado del proyecto:** Estable y funcional
✅ **Listo para continuar desarrollo**
