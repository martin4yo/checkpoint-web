import { useState } from 'react'
import { Formacion, Capacitacion } from '@/types/legajo'
import { Plus, Trash2, GraduationCap, BookOpen } from 'lucide-react'

interface Props {
  formacion: Formacion[]
  capacitaciones: Capacitacion[]
  onChangeFormacion: (formacion: Formacion[]) => void
  onChangeCapacitaciones: (capacitaciones: Capacitacion[]) => void
}

export default function FormacionForm({ formacion, capacitaciones, onChangeFormacion, onChangeCapacitaciones }: Props) {
  const [nuevaFormacion, setNuevaFormacion] = useState<Formacion>({
    nivelEducativo: '',
    titulo: '',
    institucion: '',
    fechaObtencion: '',
    certificaciones: ''
  })

  const [nuevaCapacitacion, setNuevaCapacitacion] = useState<Capacitacion>({
    nombre: '',
    descripcion: '',
    institucion: '',
    fechaRealizacion: '',
    duracionHoras: 0,
    certificado: false
  })

  const agregarFormacion = () => {
    if (!nuevaFormacion.nivelEducativo || !nuevaFormacion.titulo) {
      alert('Nivel educativo y título son requeridos')
      return
    }

    onChangeFormacion([...formacion, nuevaFormacion])
    setNuevaFormacion({
      nivelEducativo: '',
      titulo: '',
      institucion: '',
      fechaObtencion: '',
      certificaciones: ''
    })
  }

  const eliminarFormacion = (index: number) => {
    onChangeFormacion(formacion.filter((_, i) => i !== index))
  }

  const agregarCapacitacion = () => {
    if (!nuevaCapacitacion.nombre) {
      alert('Nombre del curso es requerido')
      return
    }

    onChangeCapacitaciones([...capacitaciones, nuevaCapacitacion])
    setNuevaCapacitacion({
      nombre: '',
      descripcion: '',
      institucion: '',
      fechaRealizacion: '',
      duracionHoras: 0,
      certificado: false
    })
  }

  const eliminarCapacitacion = (index: number) => {
    onChangeCapacitaciones(capacitaciones.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      {/* Formación Académica */}
      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
          <GraduationCap className="h-5 w-5 mr-2" />
          Formación Académica
        </h4>

        {/* Lista de formación */}
        {formacion.length > 0 && (
          <div className="mb-4 space-y-2">
            {formacion.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex-1 grid grid-cols-4 gap-4">
                  <div>
                    <span className="text-xs text-gray-500">Nivel</span>
                    <p className="text-sm font-medium">{item.nivelEducativo}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Título</span>
                    <p className="text-sm">{item.titulo}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Institución</span>
                    <p className="text-sm">{item.institucion || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Fecha</span>
                    <p className="text-sm">{item.fechaObtencion || '-'}</p>
                  </div>
                </div>
                <button
                  onClick={() => eliminarFormacion(index)}
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
        <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 bg-purple-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select
              value={nuevaFormacion.nivelEducativo || ''}
              onChange={(e) => setNuevaFormacion({ ...nuevaFormacion, nivelEducativo: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="">Nivel Educativo *</option>
              <option value="PRIMARIO">Primario</option>
              <option value="SECUNDARIO">Secundario</option>
              <option value="TERCIARIO">Terciario</option>
              <option value="UNIVERSITARIO">Universitario</option>
              <option value="POSGRADO">Posgrado</option>
            </select>
            <input
              type="text"
              placeholder="Título obtenido *"
              value={nuevaFormacion.titulo || ''}
              onChange={(e) => setNuevaFormacion({ ...nuevaFormacion, titulo: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <input
              type="text"
              placeholder="Institución"
              value={nuevaFormacion.institucion || ''}
              onChange={(e) => setNuevaFormacion({ ...nuevaFormacion, institucion: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <input
              type="date"
              placeholder="Fecha de obtención"
              value={nuevaFormacion.fechaObtencion || ''}
              onChange={(e) => setNuevaFormacion({ ...nuevaFormacion, fechaObtencion: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <input
              type="text"
              placeholder="Certificaciones adicionales"
              value={nuevaFormacion.certificaciones || ''}
              onChange={(e) => setNuevaFormacion({ ...nuevaFormacion, certificaciones: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary col-span-2"
            />
          </div>
          <button
            onClick={agregarFormacion}
            className="mt-3 inline-flex items-center px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary-hover"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Formación
          </button>
        </div>
      </div>

      {/* Capacitaciones */}
      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
          <BookOpen className="h-5 w-5 mr-2" />
          Capacitaciones y Cursos
        </h4>

        {/* Lista de capacitaciones */}
        {capacitaciones.length > 0 && (
          <div className="mb-4 space-y-2">
            {capacitaciones.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex-1 grid grid-cols-5 gap-4">
                  <div>
                    <span className="text-xs text-gray-500">Curso</span>
                    <p className="text-sm font-medium">{item.nombre}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Institución</span>
                    <p className="text-sm">{item.institucion || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Fecha</span>
                    <p className="text-sm">{item.fechaRealizacion || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Duración</span>
                    <p className="text-sm">{item.duracionHoras ? `${item.duracionHoras}hs` : '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Certificado</span>
                    <p className="text-sm">
                      {item.certificado ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-success/10 text-success">
                          Sí
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                          No
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => eliminarCapacitacion(index)}
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
        <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Nombre del curso *"
              value={nuevaCapacitacion.nombre}
              onChange={(e) => setNuevaCapacitacion({ ...nuevaCapacitacion, nombre: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <input
              type="text"
              placeholder="Institución"
              value={nuevaCapacitacion.institucion || ''}
              onChange={(e) => setNuevaCapacitacion({ ...nuevaCapacitacion, institucion: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <input
              type="date"
              placeholder="Fecha de realización"
              value={nuevaCapacitacion.fechaRealizacion || ''}
              onChange={(e) => setNuevaCapacitacion({ ...nuevaCapacitacion, fechaRealizacion: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <input
              type="number"
              placeholder="Duración (horas)"
              value={nuevaCapacitacion.duracionHoras || ''}
              onChange={(e) => setNuevaCapacitacion({ ...nuevaCapacitacion, duracionHoras: parseInt(e.target.value) || 0 })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <div className="col-span-2">
              <textarea
                placeholder="Descripción"
                value={nuevaCapacitacion.descripcion || ''}
                onChange={(e) => setNuevaCapacitacion({ ...nuevaCapacitacion, descripcion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                rows={1}
              />
            </div>
            <div className="flex items-center col-span-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={nuevaCapacitacion.certificado}
                  onChange={(e) => setNuevaCapacitacion({ ...nuevaCapacitacion, certificado: e.target.checked })}
                  className="rounded border-gray-300 text-secondary focus:ring-secondary"
                />
                <span className="text-sm text-gray-700">Cuenta con certificado</span>
              </label>
            </div>
          </div>
          <button
            onClick={agregarCapacitacion}
            className="mt-3 inline-flex items-center px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary-hover"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Capacitación
          </button>
        </div>
      </div>
    </div>
  )
}
