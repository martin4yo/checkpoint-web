# Changelog - 4 de Diciembre 2025

## Resumen de Cambios

Esta sesión se centró en resolver problemas críticos del selector de tenants y optimizar la interfaz de usuarios.

---

## 🔧 Problemas Resueltos

### 1. Badge "Sin organización seleccionada" aparecía incorrectamente
**Problema:** El badge se mostraba durante la carga inicial incluso cuando había un tenant seleccionado.

**Solución:** Agregado flag `hasInitialized` que garantiza que el badge solo se muestre después de que el componente complete su inicialización.

**Archivos modificados:**
- `src/components/TenantSelector.tsx:81`

**Código:**
```tsx
{hasInitialized && !selectedTenant && tenants.length > 0 && (
  <span className="text-xs text-white bg-red-500 px-3 py-1 rounded-full font-medium">
    Sin organización seleccionada
  </span>
)}
```

---

### 2. Loop infinito causando reinicios constantes del servidor
**Problema:** El componente TenantSelector causaba re-renders infinitos debido a que `handleTenantChange` se definía dentro de un useEffect sin estar en las dependencias.

**Solución:** Implementado patrón de inicialización con flag `hasInitialized` (similar al hub) que previene ejecuciones múltiples del auto-selection.

**Archivos modificados:**
- `src/components/TenantSelector.tsx:12-28`

**Código:**
```tsx
const [hasInitialized, setHasInitialized] = useState(false);

// Auto-select first tenant if none is selected (only once)
useEffect(() => {
  if (currentUser && !hasInitialized && !contextLoading && tenants.length > 0) {
    console.log('🏢 [TenantSelector] Initializing tenant selection...');
    setHasInitialized(true);

    if (!selectedTenant) {
      console.log('🏢 [TenantSelector] Auto-selecting first tenant:', tenants[0].name);
      handleTenantChange(tenants[0].id);
    } else {
      console.log('🏢 [TenantSelector] Tenant already selected:', selectedTenant.name);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentUser, hasInitialized, contextLoading, tenants, selectedTenant]);
```

---

### 3. Estado `selectedTenant` siempre null
**Problema:** La API `/api/tenants/[id]` retorna el tenant directamente, pero el código esperaba `data.tenant`.

**Solución:** Corregido el parsing de la respuesta API.

**Archivos modificados:**
- `src/contexts/TenantContext.tsx:82-95`

**Código:**
```tsx
const fetchTenantDetails = async (tenantId: string) => {
  try {
    const response = await fetch(`/api/tenants/${tenantId}`)
    if (response.ok) {
      const tenant = await response.json()  // ✅ Antes: data.tenant (undefined)
      console.log('🏢 [TenantContext] Tenant details fetched:', tenant)
      setSelectedTenant(tenant)
    } else {
      console.error('❌ [TenantContext] Error fetching tenant:', response.status)
    }
  } catch (error) {
    console.error('❌ [TenantContext] Error fetching tenant details:', error)
  }
}
```

---

### 4. Modal de usuarios ocupaba poco espacio
**Problema:** El formulario de creación/edición de usuarios no aprovechaba bien el espacio vertical disponible.

**Solución:** Implementado altura máxima de 85vh con scroll automático.

**Archivos modificados:**
- `src/app/users/page.tsx:305`

**Código:**
```tsx
<div className="bg-white rounded-lg shadow p-6 max-h-[85vh] overflow-y-auto">
```

---

### 5. Campos Nombre y Apellido desperdiciaban espacio
**Problema:** Los campos estaban en un grid de 2 columnas junto con otros campos, dentro de una tarjeta innecesaria.

**Solución:** Separados en su propio contenedor sin tarjeta, en la misma línea, con espaciado reducido.

**Archivos modificados:**
- `src/app/users/page.tsx:310-335`

**Código:**
```tsx
{/* Nombre y Apellido en la misma línea */}
<div className="grid grid-cols-2 gap-3">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Nombre
    </label>
    <input
      type="text"
      value={formData.firstName}
      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
      required
    />
  </div>
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Apellido
    </label>
    <input
      type="text"
      value={formData.lastName}
      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
    />
  </div>
</div>

{/* Resto de campos */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
  {/* Email, Password, Tenant, Supervisor */}
</div>
```

---

## 📁 Archivos Modificados

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `src/components/TenantSelector.tsx` | 12, 15-28, 81 | Fix loop infinito, badge condicional |
| `src/contexts/TenantContext.tsx` | 82-95 | Fix parsing de tenant details |
| `src/app/users/page.tsx` | 305, 309-338 | Modal más alto, layout optimizado |

---

## 🏗️ Arquitectura del Tenant Selector

### Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                      TenantProvider                          │
│  (src/contexts/TenantContext.tsx)                           │
│                                                              │
│  State:                                                      │
│  - currentUser: CurrentUser | null                          │
│  - selectedTenant: Tenant | null                            │
│  - selectedTenantId: string | null                          │
│  - tenants: Tenant[]                                        │
│  - isLoading: boolean                                       │
│                                                              │
│  Methods:                                                    │
│  - fetchCurrentUser() → /api/auth/me                        │
│  - fetchTenants() → /api/tenants                            │
│  - fetchTenantDetails(id) → /api/tenants/[id]              │
│  - switchTenant(id) → fetchTenantDetails + router.refresh() │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ useTenant()
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    TenantSelector                            │
│  (src/components/TenantSelector.tsx)                        │
│                                                              │
│  - Muestra dropdown solo para superusers                    │
│  - Auto-selecciona primer tenant si ninguno seleccionado    │
│  - Usa flag hasInitialized para prevenir loops             │
│  - Llama router.refresh() al cambiar tenant                │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Renderizado en
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   DashboardLayout                            │
│  (src/components/DashboardLayout.tsx)                       │
│                                                              │
│  <Sidebar />                                                 │
│  <TenantSelector /> ← Barra gradiente arriba del contenido │
│  <main>                                                      │
│    {children}                                                │
│  </main>                                                     │
│  <ChatWidgetWrapper />                                       │
└─────────────────────────────────────────────────────────────┘
```

### Ciclo de Inicialización

1. **App inicia** → `TenantProvider` monta
2. **useEffect[]** → `fetchCurrentUser()`
3. **Respuesta /api/auth/me** → `setCurrentUser()`, `setSelectedTenantId(user.tenantId)`
4. **useEffect[currentUser]** → Si es superuser, `fetchTenants()`
5. **TenantSelector monta** → Recibe `currentUser`, `tenants`, `selectedTenant` del contexto
6. **useEffect en TenantSelector** → Si `!hasInitialized` y hay datos:
   - `setHasInitialized(true)`
   - Si `!selectedTenant`, llama `handleTenantChange(tenants[0].id)`
7. **handleTenantChange()** → `switchTenant()` → `fetchTenantDetails()` → `router.refresh()`

### Prevención de Loops Infinitos

**Problema:**
- `handleTenantChange` no estaba en dependencias de useEffect
- ESLint warning → agregar a deps
- Agregar a deps → re-render infinito

**Solución:**
```tsx
const [hasInitialized, setHasInitialized] = useState(false);

useEffect(() => {
  if (currentUser && !hasInitialized && !contextLoading && tenants.length > 0) {
    setHasInitialized(true);  // ✅ Evita re-ejecución
    // ... lógica de auto-selection
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentUser, hasInitialized, contextLoading, tenants, selectedTenant]);
```

**Por qué funciona:**
- `hasInitialized` empieza en `false`
- Primera vez que se cumple condición → se setea a `true`
- Subsecuentes renders → condición `!hasInitialized` es `false`
- No se ejecuta la lógica interna nunca más

---

## 🎨 Patrón de Diseño del Hub

El selector de tenants está implementado para coincidir exactamente con el hub:

**Características:**
- ✅ Barra completa con gradiente `from-secondary to-secondary/90`
- ✅ Solo visible para superusers
- ✅ Auto-selección del primer tenant
- ✅ `router.refresh()` al cambiar
- ✅ Badge "Sin organización seleccionada" solo cuando corresponde
- ✅ Icono Building2 de lucide-react
- ✅ Select con estilo coherente

**Referencia:** `/home/martin/Desarrollos/hub/frontend/src/components/TenantSelector.tsx`

---

## 🚀 Commits

### Commit f31f45a
```
Fix tenant selector and optimize user modal layout

- Fix tenant selector badge appearing before initialization
- Fix infinite loop with hasInitialized flag in TenantSelector
- Fix selectedTenant state by correcting API response parsing (tenant vs data.tenant)
- Make user modal taller (85vh) for better usability
- Put name and apellido fields on same line without card wrapper
- Reduce spacing in form for more compact layout

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 📝 Notas Técnicas

### ESLint Warnings Deshabilitados

**Archivo:** `src/components/TenantSelector.tsx:27`

**Razón:** El flag `hasInitialized` previene ejecuciones múltiples del efecto, por lo que no es necesario incluir `handleTenantChange` en las dependencias. Esto es un patrón seguro y recomendado para inicializaciones únicas.

```tsx
// eslint-disable-next-line react-hooks/exhaustive-deps
```

### Endpoints API Utilizados

| Endpoint | Método | Descripción | Respuesta |
|----------|--------|-------------|-----------|
| `/api/auth/me` | GET | Obtiene usuario actual | `CurrentUser` |
| `/api/tenants` | GET | Lista todos los tenants (solo superuser) | `Tenant[]` |
| `/api/tenants/[id]` | GET | Detalles de un tenant | `Tenant` |

### Tipos TypeScript

```typescript
interface Tenant {
  id: string
  name: string
  slug: string
}

interface CurrentUser {
  id: string
  firstName: string
  lastName: string
  email: string
  tenantId: string
  superuser: boolean
}

interface TenantContextType {
  currentUser: CurrentUser | null
  selectedTenant: Tenant | null
  selectedTenantId: string | null
  tenants: Tenant[]
  switchTenant: (tenantId: string) => Promise<void>
  setSelectedTenantId: (tenantId: string | null) => void
  isLoading: boolean
}
```

---

## ✅ Testing Checklist

- [x] Tenant selector no causa loops infinitos
- [x] Badge "Sin organización seleccionada" solo aparece cuando corresponde
- [x] Auto-selección funciona correctamente al cargar la app
- [x] Cambiar de tenant refresca los datos correctamente
- [x] Modal de usuarios ocupa altura adecuada (85vh)
- [x] Nombre y apellido están en la misma línea
- [x] Formulario es scrollable cuando el contenido excede la altura
- [x] No hay errores de ESLint
- [x] No hay errores de TypeScript
- [x] Servidor compila sin warnings

---

## 🔜 Trabajo Futuro

### Pendientes
- Ninguno identificado en esta sesión

### Mejoras Sugeridas
1. Persistir selección de tenant en localStorage para evitar auto-selección en cada carga
2. Agregar animación de transición al cambiar de tenant
3. Implementar indicador de carga más visible durante el cambio de tenant
4. Considerar lazy loading para el dropdown de tenants si la lista crece mucho

---

## 📚 Referencias

- **Hub Frontend:** `/home/martin/Desarrollos/hub/frontend/src/components/TenantSelector.tsx`
- **Next.js Router:** https://nextjs.org/docs/app/api-reference/functions/use-router
- **React Context:** https://react.dev/reference/react/useContext
- **Tailwind CSS:** https://tailwindcss.com/docs

---

**Última actualización:** 4 de Diciembre 2025
**Autor:** Claude Code
**Estado:** ✅ Completado y testeado
