import { useState } from 'react'
import { LegajoDatosFamiliares, FamiliarACargo, ContactoEmergencia } from '@/types/legajo'
import { Plus, Trash2, UserPlus } from 'lucide-react'

interface Props {
  datosFamiliares: LegajoDatosFamiliares
  contactosEmergencia: ContactoEmergencia[]
  onChangeFamiliares: (data: LegajoDatosFamiliares) => void
  onChangeContactos: (contactos: ContactoEmergencia[]) => void
  fieldConfig?: Record<string, unknown>
}

export default function DatosFamiliaresForm({ datosFamiliares, contactosEmergencia, onChangeFamiliares, onChangeContactos, fieldConfig }: Props) {
  const isRequired = (fieldName: string) => {
    return fieldConfig?.datosFamiliares?.[fieldName] === true
  }
  const isContactoRequired = () => {
    return fieldConfig?.contactosEmergencia?.required === true
  }
  const [nuevoFamiliar, setNuevoFamiliar] = useState<FamiliarACargo>({
    nombre: '',
    relacion: '',
    fechaNacimiento: '',
    dni: ''
  })

  const [nuevoContacto, setNuevoContacto] = useState<ContactoEmergencia>({
    nombre: '',
    relacion: '',
    telefono: '',
    orden: contactosEmergencia.length + 1
  })

  const agregarFamiliar = () => {
    if (!nuevoFamiliar.nombre || !nuevoFamiliar.relacion) {
      return
    }

    const familiares = datosFamiliares.grupoFamiliarACargo || []
    onChangeFamiliares({
      ...datosFamiliares,
      grupoFamiliarACargo: [...familiares, nuevoFamiliar]
    })

    setNuevoFamiliar({ nombre: '', relacion: '', fechaNacimiento: '', dni: '' })
  }

  const eliminarFamiliar = (index: number) => {
    const familiares = datosFamiliares.grupoFamiliarACargo || []
    onChangeFamiliares({
      ...datosFamiliares,
      grupoFamiliarACargo: familiares.filter((_, i) => i !== index)
    })
  }

  const agregarContacto = () => {
    if (!nuevoContacto.nombre || !nuevoContacto.telefono) {
      return
    }

    onChangeContactos([...contactosEmergencia, { ...nuevoContacto, orden: contactosEmergencia.length + 1 }])
    setNuevoContacto({ nombre: '', relacion: '', telefono: '', orden: contactosEmergencia.length + 2 })
  }

  const eliminarContacto = (index: number) => {
    const nuevosContactos = contactosEmergencia.filter((_, i) => i !== index)
    // Reordenar
    const reordenados = nuevosContactos.map((c, i) => ({ ...c, orden: i + 1 }))
    onChangeContactos(reordenados)
  }

  return (
    <div className="space-y-6">
      {/* Grupo Familiar */}
      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
          <UserPlus className="h-5 w-5 mr-2" />
          Grupo Familiar a Cargo
        </h4>

        {/* Lista de familiares */}
        {(datosFamiliares.grupoFamiliarACargo || []).length > 0 && (
          <div className="mb-4 space-y-2">
            {datosFamiliares.grupoFamiliarACargo!.map((familiar, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 grid grid-cols-4 gap-4">
                  <div>
                    <span className="text-xs text-gray-500">Nombre</span>
                    <p className="text-sm font-medium">{familiar.nombre}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Relación</span>
                    <p className="text-sm">{familiar.relacion}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">F. Nacimiento</span>
                    <p className="text-sm">{familiar.fechaNacimiento || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">DNI</span>
                    <p className="text-sm">{familiar.dni || '-'}</p>
                  </div>
                </div>
                <button
                  onClick={() => eliminarFamiliar(index)}
                  className="ml-4 text-red-600 hover:text-red-800"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Formulario para agregar */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Nombre completo *"
              value={nuevoFamiliar.nombre}
              onChange={(e) => setNuevoFamiliar({ ...nuevoFamiliar, nombre: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <select
              value={nuevoFamiliar.relacion}
              onChange={(e) => setNuevoFamiliar({ ...nuevoFamiliar, relacion: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="">Relación *</option>
              <option value="Cónyuge">Cónyuge</option>
              <option value="Hijo/a">Hijo/a</option>
              <option value="Padre">Padre</option>
              <option value="Madre">Madre</option>
              <option value="Hermano/a">Hermano/a</option>
              <option value="Otro">Otro</option>
            </select>
            <input
              type="date"
              placeholder="F. Nacimiento"
              value={nuevoFamiliar.fechaNacimiento}
              onChange={(e) => setNuevoFamiliar({ ...nuevoFamiliar, fechaNacimiento: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <input
              type="text"
              placeholder="DNI"
              value={nuevoFamiliar.dni}
              onChange={(e) => setNuevoFamiliar({ ...nuevoFamiliar, dni: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
          <button
            onClick={agregarFamiliar}
            className="mt-3 inline-flex items-center px-4 py-2 bg-secondary text-palette-yellow rounded-md hover:bg-secondary-hover"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Familiar
          </button>
        </div>
      </div>

      {/* Contactos de Emergencia */}
      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-3">Contactos de Emergencia</h4>

        {/* Lista de contactos */}
        {contactosEmergencia.length > 0 && (
          <div className="mb-4 space-y-2">
            {contactosEmergencia.map((contacto, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center space-x-4">
                  <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    {contacto.orden}
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-xs text-gray-500">Nombre</span>
                      <p className="text-sm font-medium">{contacto.nombre}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Relación</span>
                      <p className="text-sm">{contacto.relacion || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Teléfono</span>
                      <p className="text-sm">{contacto.telefono}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => eliminarContacto(index)}
                  className="ml-4 text-red-600 hover:text-red-800"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Formulario para agregar */}
        <div className="border-2 border-dashed border-red-300 rounded-lg p-4 bg-red-50/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Nombre completo *"
              value={nuevoContacto.nombre}
              onChange={(e) => setNuevoContacto({ ...nuevoContacto, nombre: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <input
              type="text"
              placeholder="Relación"
              value={nuevoContacto.relacion}
              onChange={(e) => setNuevoContacto({ ...nuevoContacto, relacion: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <input
              type="tel"
              placeholder="Teléfono *"
              value={nuevoContacto.telefono}
              onChange={(e) => setNuevoContacto({ ...nuevoContacto, telefono: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <button
            onClick={agregarContacto}
            className="mt-3 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Contacto de Emergencia
          </button>
        </div>
      </div>
    </div>
  )
}
