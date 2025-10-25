import { LegajoDatosLaborales } from '@/types/legajo'

interface Props {
  data: LegajoDatosLaborales
  onChange: (data: LegajoDatosLaborales) => void
}

export default function DatosLaboralesForm({ data, onChange }: Props) {
  const handleChange = (field: keyof LegajoDatosLaborales, value: string) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-6">
      {/* Contrato */}
      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-3">Contrato</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Ingreso
            </label>
            <input
              type="date"
              value={data.fechaIngreso || ''}
              onChange={(e) => handleChange('fechaIngreso', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Egreso
            </label>
            <input
              type="date"
              value={data.fechaEgreso || ''}
              onChange={(e) => handleChange('fechaEgreso', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Contrato
            </label>
            <select
              value={data.tipoContrato || ''}
              onChange={(e) => handleChange('tipoContrato', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="">Seleccionar...</option>
              <option value="TIEMPO_INDETERMINADO">Tiempo Indeterminado</option>
              <option value="PLAZO_FIJO">Plazo Fijo</option>
              <option value="PASANTIA">Pasantía</option>
              <option value="EVENTUAL">Eventual</option>
              <option value="TEMPORADA">Temporada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Puesto */}
      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-3">Puesto de Trabajo</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <input
              type="text"
              value={data.categoria || ''}
              onChange={(e) => handleChange('categoria', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="Ej: Jefe, Empleado, Gerente"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Puesto/Cargo
            </label>
            <input
              type="text"
              value={data.puesto || ''}
              onChange={(e) => handleChange('puesto', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="Ej: Desarrollador, Analista"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Área/Departamento
            </label>
            <input
              type="text"
              value={data.area || ''}
              onChange={(e) => handleChange('area', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="Ej: IT, RRHH, Administración"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ubicación/Sucursal
            </label>
            <input
              type="text"
              value={data.ubicacion || ''}
              onChange={(e) => handleChange('ubicacion', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="Ej: Casa Central, Sucursal Norte"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modalidad de Trabajo
            </label>
            <select
              value={data.modalidadTrabajo || ''}
              onChange={(e) => handleChange('modalidadTrabajo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="">Seleccionar...</option>
              <option value="PRESENCIAL">Presencial</option>
              <option value="REMOTO">Remoto</option>
              <option value="HIBRIDO">Híbrido</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cobertura Social */}
      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-3">Cobertura Social</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Obra Social
            </label>
            <input
              type="text"
              value={data.obraSocial || ''}
              onChange={(e) => handleChange('obraSocial', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="Ej: OSDE, Swiss Medical, OSECAC"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sindicato
            </label>
            <input
              type="text"
              value={data.sindicato || ''}
              onChange={(e) => handleChange('sindicato', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="Ej: UOCRA, Comercio"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Convenio Colectivo
            </label>
            <input
              type="text"
              value={data.convenioColectivo || ''}
              onChange={(e) => handleChange('convenioColectivo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="Ej: CCT 130/75"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Afiliado Sindical
            </label>
            <input
              type="text"
              value={data.numeroAfiliado || ''}
              onChange={(e) => handleChange('numeroAfiliado', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
