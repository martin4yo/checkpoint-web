import { LegajoDatosAdministrativos } from '@/types/legajo'
import { AlertCircle, Calendar, FileText } from 'lucide-react'

interface Props {
  data: LegajoDatosAdministrativos
  onChange: (data: LegajoDatosAdministrativos) => void
  fieldConfig?: any
}

export default function DatosAdministrativosForm({ data, onChange, fieldConfig }: Props) {
  const isRequired = (fieldName: string) => {
    return fieldConfig?.datosAdministrativos?.[fieldName] === true
  }
  const handleChange = (field: keyof LegajoDatosAdministrativos, value: string | number) => {
    onChange({ ...data, [field]: value })
  }

  const handleLicenciaChange = (tipo: string, valor: number) => {
    const licencias = data.licenciasAcumuladas || {}
    onChange({
      ...data,
      licenciasAcumuladas: {
        ...licencias,
        [tipo]: valor
      }
    })
  }

  const calcularSaldoVacaciones = () => {
    const anuales = data.diasVacacionesAnuales || 0
    const tomadas = data.diasVacacionesTomadas || 0
    return anuales - tomadas
  }

  const tiposLicencia = [
    { key: 'enfermedad', label: 'Enfermedad' },
    { key: 'estudio', label: 'Estudio' },
    { key: 'matrimonio', label: 'Matrimonio' },
    { key: 'nacimiento', label: 'Nacimiento' },
    { key: 'fallecimiento', label: 'Fallecimiento Familiar' },
    { key: 'mudanza', label: 'Mudanza' },
    { key: 'donacion_sangre', label: 'Donación de Sangre' },
    { key: 'otras', label: 'Otras' }
  ]

  return (
    <div className="space-y-6">
      {/* Estado del Empleado */}
      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Estado del Empleado
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={data.estadoEmpleado || ''}
              onChange={(e) => handleChange('estadoEmpleado', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="">Seleccionar...</option>
              <option value="ACTIVO">Activo</option>
              <option value="LICENCIA">En Licencia</option>
              <option value="SUSPENDIDO">Suspendido</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vacaciones */}
      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Vacaciones
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Días Anuales que Corresponden
            </label>
            <input
              type="number"
              value={data.diasVacacionesAnuales || ''}
              onChange={(e) => handleChange('diasVacacionesAnuales', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="14"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Días Tomados (Período Actual)
            </label>
            <input
              type="number"
              value={data.diasVacacionesTomadas || ''}
              onChange={(e) => handleChange('diasVacacionesTomadas', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="0"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Saldo Disponible
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              <span className="text-lg font-bold text-secondary">
                {calcularSaldoVacaciones()} días
              </span>
            </div>
          </div>
        </div>
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-800">
              Según la legislación argentina, los días de vacaciones varían según la antigüedad:
              14 días (hasta 5 años), 21 días (5-10 años), 28 días (10-20 años), 35 días (+20 años)
            </p>
          </div>
        </div>
      </div>

      {/* Licencias */}
      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-3">Licencias Acumuladas</h4>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tiposLicencia.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                <label className="text-sm font-medium text-gray-700">{label}</label>
                <input
                  type="number"
                  value={data.licenciasAcumuladas?.[key] || 0}
                  onChange={(e) => handleLicenciaChange(key, parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-right border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                  placeholder="0"
                  min="0"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Observaciones */}
      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-3">Observaciones{isRequired('observaciones') && <span className="text-red-500 ml-1">*</span>}</h4>
        <textarea
          value={data.observaciones || ''}
          onChange={(e) => handleChange('observaciones', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
          rows={6}
          placeholder="Notas administrativas, comentarios internos, observaciones especiales..."
        />
      </div>
    </div>
  )
}
