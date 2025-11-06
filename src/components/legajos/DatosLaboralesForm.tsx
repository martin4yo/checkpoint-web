import { useState, useEffect } from 'react'
import { LegajoDatosLaborales } from '@/types/legajo'

interface MasterDataRecord {
  id: string
  code: string
  description: string
}

interface JobPosition {
  id: string
  code: string
  name: string
}

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface Props {
  data: LegajoDatosLaborales
  onChange: (data: LegajoDatosLaborales) => void
  fieldConfig?: Record<string, unknown>
}

export default function DatosLaboralesForm({ data, onChange, fieldConfig }: Props) {
  const [categorias, setCategorias] = useState<MasterDataRecord[]>([])
  const [puestos, setPuestos] = useState<JobPosition[]>([])
  const [areas, setAreas] = useState<MasterDataRecord[]>([])
  const [sectores, setSectores] = useState<MasterDataRecord[]>([])
  const [sucursales, setSucursales] = useState<MasterDataRecord[]>([])
  const [empleados, setEmpleados] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMasterData()
    fetchEmpleados()
  }, [])

  const fetchMasterData = async () => {
    try {
      const [catRes, puesRes, areaRes, sectRes, sucRes] = await Promise.all([
        fetch('/api/master-data?table=categoria'),
        fetch('/api/job-positions'),
        fetch('/api/master-data?table=area'),
        fetch('/api/master-data?table=sector'),
        fetch('/api/master-data?table=sucursal')
      ])

      if (catRes.ok) {
        const data = await catRes.json()
        setCategorias(data.records || [])
      }

      if (puesRes.ok) {
        const data = await puesRes.json()
        setPuestos(data.positions || [])
      }

      if (areaRes.ok) {
        const data = await areaRes.json()
        setAreas(data.records || [])
      }

      if (sectRes.ok) {
        const data = await sectRes.json()
        setSectores(data.records || [])
      }

      if (sucRes.ok) {
        const data = await sucRes.json()
        setSucursales(data.records || [])
      }
    } catch (error) {
      console.error('Error fetching master data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmpleados = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setEmpleados(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const isRequired = (fieldName: string) => {
    return fieldConfig?.datosLaborales?.[fieldName] === true
  }

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
              Fecha de Ingreso{isRequired('fechaIngreso') && <span className="text-red-500 ml-1">*</span>}
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
              Fecha de Egreso{isRequired('fechaEgreso') && <span className="text-red-500 ml-1">*</span>}
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
              Tipo de Contrato{isRequired('tipoContrato') && <span className="text-red-500 ml-1">*</span>}
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
            <select
              value={data.categoria || ''}
              onChange={(e) => handleChange('categoria', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              disabled={loading}
            >
              <option value="">Seleccionar...</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.description}>
                  {cat.code} - {cat.description}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Puesto/Cargo{isRequired('puesto') && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={data.puesto || ''}
              onChange={(e) => handleChange('puesto', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              disabled={loading}
            >
              <option value="">Seleccionar...</option>
              {puestos.map(puesto => (
                <option key={puesto.id} value={puesto.name}>
                  {puesto.code} - {puesto.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Área/Departamento{isRequired('area') && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={data.area || ''}
              onChange={(e) => handleChange('area', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              disabled={loading}
            >
              <option value="">Seleccionar...</option>
              {areas.map(area => (
                <option key={area.id} value={area.description}>
                  {area.code} - {area.description}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sector{isRequired('sector') && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={data.sector || ''}
              onChange={(e) => handleChange('sector', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              disabled={loading}
            >
              <option value="">Seleccionar...</option>
              {sectores.map(sector => (
                <option key={sector.id} value={sector.description}>
                  {sector.code} - {sector.description}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supervisor{isRequired('supervisor') && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={data.supervisor || ''}
              onChange={(e) => handleChange('supervisor', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              disabled={loading}
            >
              <option value="">Seleccionar...</option>
              {empleados.map(emp => (
                <option key={emp.id} value={`${emp.firstName} ${emp.lastName}`}>
                  {emp.firstName} {emp.lastName} ({emp.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ubicación/Sucursal{isRequired('ubicacion') && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={data.ubicacion || ''}
              onChange={(e) => handleChange('ubicacion', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              disabled={loading}
            >
              <option value="">Seleccionar...</option>
              {sucursales.map(suc => (
                <option key={suc.id} value={suc.description}>
                  {suc.code} - {suc.description}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jornada{isRequired('jornada') && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={data.jornada || ''}
              onChange={(e) => handleChange('jornada', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="">Seleccionar...</option>
              <option value="COMPLETA">Completa</option>
              <option value="PARCIAL">Parcial</option>
              <option value="REDUCIDA">Reducida</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modalidad{isRequired('modalidad') && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={data.modalidad || ''}
              onChange={(e) => handleChange('modalidad', e.target.value)}
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
