# Sistema de Legajos - Checkpoint

## Descripción General

El sistema de legajos permite gestionar toda la información de empleados de forma completa y organizada, cumpliendo con los requisitos legales y administrativos de recursos humanos en Argentina.

## Estructura de Datos

### Base de Datos

El sistema utiliza 11 tablas en PostgreSQL:

1. **`legajos`** - Tabla principal (relación 1:1 con usuarios)
2. **`legajo_datos_personales`** - Información personal del empleado
3. **`legajo_datos_familiares`** - Grupo familiar a cargo
4. **`legajo_contactos_emergencia`** - Contactos de emergencia (1:N)
5. **`legajo_datos_laborales`** - Información del contrato y empleo
6. **`legajo_datos_remuneracion`** - Salario y beneficios
7. **`legajo_datos_administrativos`** - Vacaciones, licencias, estado
8. **`legajo_horarios_trabajo`** - Horarios de trabajo detallados (1:N)
9. **`legajo_formacion`** - Educación formal (1:N)
10. **`legajo_capacitaciones`** - Cursos y capacitaciones (1:N)
11. **`legajo_documentos`** - Archivos adjuntos (1:N)

### API Endpoints

#### GET `/api/legajos`
- **Sin parámetros**: Devuelve todos los usuarios con sus legajos (si existen)
- **Con `legajoId`**: Devuelve un legajo completo con todas sus relaciones

**Ejemplo respuesta (lista):**
```json
{
  "users": [
    {
      "id": "user-123",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "isActive": true,
      "legajo": {
        "id": "leg-456",
        "numeroLegajo": "001",
        "datosPersonales": { "dni": "12345678", ... },
        "datosLaborales": { "puesto": "Desarrollador", ... }
      }
    }
  ]
}
```

#### POST `/api/legajos`
Crea un nuevo legajo para un usuario.

**Body:**
```json
{
  "userId": "user-123",
  "numeroLegajo": "001"
}
```

#### PUT `/api/legajos`
Actualiza datos de un legajo existente.

**Body:**
```json
{
  "legajoId": "leg-456",
  "datosPersonales": { ... },
  "datosLaborales": { ... },
  "datosRemuneracion": { ... },
  ...
}
```

#### DELETE `/api/legajos`
Elimina un legajo y todos sus datos relacionados (CASCADE).

**Body:**
```json
{
  "legajoId": "leg-456"
}
```

## Estructura de Formularios

### 1. Tab: Datos Personales 👤

**Campos:**
- DNI, CUIL/CUIT
- Fecha de nacimiento
- Género (Masculino, Femenino, Otro, Prefiero no decir)
- Estado civil (Soltero, Casado, Divorciado, Viudo, Unión convivencial)
- Nacionalidad

**Domicilio:**
- Calle, Número, Piso, Departamento
- Localidad, Provincia, Código Postal

**Contacto:**
- Teléfono fijo
- Teléfono celular
- Email personal
- Email corporativo

### 2. Tab: Datos Familiares y Emergencias 👨‍👩‍👧‍👦

**Grupo Familiar a Cargo:**
Lista dinámica con:
- Nombre
- Relación (cónyuge, hijo/a, etc.)
- Fecha de nacimiento
- DNI
- Botones: Agregar, Eliminar

**Contactos de Emergencia:**
Lista ordenada con:
- Nombre
- Relación
- Teléfono
- Orden de prioridad
- Botones: Agregar, Eliminar, Reordenar

### 3. Tab: Datos Laborales 💼

**Contrato:**
- Fecha de ingreso
- Fecha de egreso (opcional)
- Tipo de contrato (Tiempo indeterminado, Plazo fijo, Pasantía, Eventual, Temporada)

**Puesto:**
- Categoría
- Puesto/Cargo
- Área/Departamento
- Ubicación/Sucursal
- Modalidad (Presencial, Remoto, Híbrido)

**Cobertura Social:**
- Obra Social
- Sindicato
- Convenio Colectivo aplicable
- Número de afiliado sindical

### 4. Tab: Remuneración 💰

**Sueldo:**
- Salario básico
- Tipo de liquidación (Mensual, Quincenal, Semanal)

**Datos Bancarios:**
- Banco
- CBU

**Adicionales:**
Lista dinámica con:
- Concepto
- Monto
- Tipo (fijo, variable, por presentismo, etc.)
- Botones: Agregar, Eliminar

**Beneficios:**
Lista dinámica con:
- Tipo
- Descripción
- Monto (opcional)
- Botones: Agregar, Eliminar

### 5. Tab: Formación y Capacitación 🎓

**Formación Académica:**
Lista dinámica con:
- Nivel educativo (Primario, Secundario, Terciario, Universitario, Posgrado)
- Título obtenido
- Institución
- Fecha de obtención
- Certificaciones
- Botones: Agregar, Editar, Eliminar

**Capacitaciones:**
Lista dinámica con:
- Nombre del curso
- Descripción
- Institución
- Fecha de realización
- Duración en horas
- Certificado (Sí/No)
- Botones: Agregar, Editar, Eliminar

### 6. Tab: Documentos 📄

**Gestión de Documentos:**
Lista de documentos con:
- Tipo de documento (Contrato, Form 2.61, Apto médico, Alta AFIP, etc.)
- Descripción
- Archivo (upload/download)
- Fecha de carga
- Fecha de vencimiento (opcional)
- Estado (vigente/vencido según fecha)
- Botones: Subir, Descargar, Eliminar

**Tipos de documentos predefinidos:**
- Contrato de trabajo
- Formulario 2.61 (Asignaciones Familiares)
- Apto médico preocupacional
- Alta AFIP
- Alta sindical
- Opción de obra social
- Credencial ART
- DNI (frente y dorso)
- CUIL
- Título académico
- Certificados
- Otros

### 7. Tab: Datos Administrativos ⚙️

**Estado del Empleado:**
- Estado (Activo, Licencia, Suspendido, Inactivo)

**Vacaciones:**
- Días de vacaciones anuales que corresponden
- Días disponibles actuales
- Días tomados en el período actual
- Cálculo automático de saldo

**Licencias:**
Campo JSON con tipos de licencias:
- Enfermedad
- Estudio
- Matrimonio
- Nacimiento
- Fallecimiento familiar
- Otras

**Observaciones:**
- Campo de texto libre para notas administrativas

## Funcionalidades Implementadas

### ✅ Completado:

1. **Base de Datos**
   - Schema de Prisma con 11 tablas
   - Migraciones aplicadas
   - Relaciones configuradas

2. **API Endpoints**
   - GET, POST, PUT, DELETE funcionales
   - Autenticación con JWT
   - Validaciones básicas

3. **UI Principal**
   - Grilla con todos los usuarios
   - Modal con tabs y diseño responsive
   - Iconos Lucide React
   - Modal de altura fija (80vh)
   - Sin scroll horizontal

4. **Tipos TypeScript**
   - Interfaces completas en `/src/types/legajo.ts`

### 🚧 Pendiente de Implementación:

1. **Formularios de Cada Tab:**
   - Datos Personales (todos los campos)
   - Datos Familiares (lista dinámica)
   - Datos Laborales (selects y fechas)
   - Remuneración (listas dinámicas)
   - Formación (CRUD completo)
   - Documentos (upload de archivos)
   - Administrativos (cálculos de vacaciones)

2. **Lógica de Guardado:**
   - Función `handleSave()` que:
     - Valida todos los datos
     - Crea legajo si no existe (POST con numeroLegajo)
     - Actualiza legajo si existe (PUT con todos los datos)
     - Maneja errores y muestra mensajes
     - Recarga la lista después de guardar

3. **Validaciones:**
   - DNI/CUIL formato argentino
   - Emails válidos
   - CBU 22 dígitos
   - Fechas coherentes
   - Campos requeridos marcados

4. **Features Adicionales:**
   - Auto-generación de número de legajo
   - Vista previa de documentos
   - Exportación a PDF del legajo completo
   - Historial de cambios
   - Permisos de edición por rol

## Guía de Implementación

### Para continuar el desarrollo:

1. **Crear componentes de formulario por tab:**
   ```
   src/components/legajos/
   ├── DatosPersonalesForm.tsx
   ├── DatosFamiliaresForm.tsx
   ├── DatosLaboralesForm.tsx
   ├── RemuneracionForm.tsx
   ├── FormacionForm.tsx
   ├── DocumentosForm.tsx
   └── DatosAdministrativosForm.tsx
   ```

2. **En cada componente incluir:**
   - Props: `data`, `onChange`, `onSave`
   - State local para el formulario
   - Validaciones inline
   - Botones de acción internos si es necesario

3. **Actualizar `/src/app/legajos/page.tsx`:**
   - Importar tipos de `/src/types/legajo.ts`
   - Agregar states para cada sección
   - Implementar `handleSave()` completo
   - Reemplazar placeholders con componentes

4. **Implementar upload de archivos:**
   - Endpoint `/api/legajos/[id]/documentos`
   - Usar FormData para subir archivos
   - Almacenar en `/public/uploads/legajos/`
   - Generar URLs relativas

5. **Testing:**
   - Crear usuario de prueba
   - Completar todo el legajo
   - Verificar que se guarda correctamente
   - Editar y verificar actualización
   - Probar con múltiples usuarios

## Ejemplos de Código

### Estado completo del formulario:

```typescript
const [formData, setFormData] = useState<LegajoCompleto>({
  userId: selectedUser!.id,
  numeroLegajo: selectedLegajo?.numeroLegajo || '',
  datosPersonales: selectedLegajo?.datosPersonales || {},
  datosFamiliares: selectedLegajo?.datosFamiliares || { grupoFamiliarACargo: [] },
  contactosEmergencia: selectedLegajo?.contactosEmergencia || [],
  datosLaborales: selectedLegajo?.datosLaborales || {},
  datosRemuneracion: selectedLegajo?.datosRemuneracion || { adicionales: [], beneficios: [] },
  formacion: selectedLegajo?.formacion || [],
  capacitaciones: selectedLegajo?.capacitaciones || [],
  documentos: selectedLegajo?.documentos || [],
  datosAdministrativos: selectedLegajo?.datosAdministrativos || {},
})
```

### Función de guardado:

```typescript
const handleSave = async () => {
  try {
    // Si no existe legajo, crear primero
    if (!selectedLegajo) {
      const createResponse = await fetch('/api/legajos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: formData.userId,
          numeroLegajo: formData.numeroLegajo,
        }),
      })

      if (!createResponse.ok) throw new Error('Error al crear legajo')

      const newLegajo = await createResponse.json()
      formData.id = newLegajo.id
    }

    // Actualizar todos los datos
    const updateResponse = await fetch('/api/legajos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        legajoId: formData.id,
        ...formData,
      }),
    })

    if (!updateResponse.ok) throw new Error('Error al actualizar legajo')

    // Recargar lista y cerrar modal
    await fetchUsers()
    closeModal()
    alert('Legajo guardado exitosamente')
  } catch (error) {
    console.error('Error saving legajo:', error)
    alert('Error al guardar legajo')
  }
}
```

## Notas Importantes

- Todos los campos son opcionales excepto `numeroLegajo` y `userId`
- Los datos se guardan en formato JSON para campos complejos (adicionales, beneficios, etc.)
- Las fechas se almacenan como ISO strings
- El sistema permite usuarios sin legajo (perfectamente válido)
- Los legajos se eliminan en CASCADE si se borra el usuario
- Respetar la relación 1:1 entre User y Legajo

## Scripts Útiles

```bash
# Limpiar puerto 3000
./kill-port-3000.sh

# Iniciar desarrollo
npm run dev

# Regenerar Prisma client
npx prisma generate

# Ver base de datos
npx prisma studio
```

## Contacto

Para continuar el desarrollo o hacer preguntas sobre la implementación, referirse a este documento como guía completa del sistema.
