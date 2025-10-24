import { useState } from 'react'
import { LegajoDatosRemuneracion, Adicional, Beneficio } from '@/types/legajo'
import { Plus, Trash2, DollarSign, Gift } from 'lucide-react'

interface Props {
  data: LegajoDatosRemuneracion
  onChange: (data: LegajoDatosRemuneracion) => void
}

export default function RemuneracionForm({ data, onChange }: Props) {
  const [nuevoAdicional, setNuevoAdicional] = useState<Adicional>({
    concepto: '',
    monto: 0,
    tipo: ''
  })

  const [nuevoBeneficio, setNuevoBeneficio] = useState<Beneficio>({
    tipo: '',
    descripcion: '',
    monto: undefined
  })

  const handleChange = (field: keyof LegajoDatosRemuneracion, value: string | number) => {
    onChange({ ...data, [field]: value })
  }

  const agregarAdicional = () => {
    if (!nuevoAdicional.concepto || !nuevoAdicional.monto) {
      alert('Concepto y monto son requeridos')
      return
    }

    const adicionales = data.adicionales || []
    onChange({
      ...data,
      adicionales: [...adicionales, nuevoAdicional]
    })

    setNuevoAdicional({ concepto: '', monto: 0, tipo: '' })
  }

  const eliminarAdicional = (index: number) => {
    const adicionales = data.adicionales || []
    onChange({
      ...data,
      adicionales: adicionales.filter((_, i) => i !== index)
    })
  }

  const agregarBeneficio = () => {
    if (!nuevoBeneficio.tipo || !nuevoBeneficio.descripcion) {
      alert('Tipo y descripción son requeridos')
      return
    }

    const beneficios = data.beneficios || []
    onChange({
      ...data,
      beneficios: [...beneficios, nuevoBeneficio]
    })

    setNuevoBeneficio({ tipo: '', descripcion: '', monto: undefined })
  }

  const eliminarBeneficio = (index: number) => {
    const beneficios = data.beneficios || []
    onChange({
      ...data,
      beneficios: beneficios.filter((_, i) => i !== index)
    })
  }

  return (
    <div className="space-y-6">
      {/* Sueldo */}
      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Sueldo Base
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Salario Básico
            </label>
            <input
              type="number"
              value={data.salarioBasico || ''}
              onChange={(e) => handleChange('salarioBasico', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="0.00"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Liquidación
            </label>
            <select
              value={data.tipoLiquidacion || ''}
              onChange={(e) => handleChange('tipoLiquidacion', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="">Seleccionar...</option>
              <option value="MENSUAL">Mensual</option>
              <option value="QUINCENAL">Quincenal</option>
              <option value="SEMANAL">Semanal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Datos Bancarios */}
      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-3">Datos Bancarios</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Banco
            </label>
            <input
              type="text"
              value={data.banco || ''}
              onChange={(e) => handleChange('banco', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="Ej: Banco Nación, Santander"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CBU (22 dígitos)
            </label>
            <input
              type="text"
              value={data.cbu || ''}
              onChange={(e) => handleChange('cbu', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="0000000000000000000000"
              maxLength={22}
            />
          </div>
        </div>
      </div>

      {/* Adicionales */}
      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-3">Adicionales</h4>

        {/* Lista de adicionales */}
        {(data.adicionales || []).length > 0 && (
          <div className="mb-4 space-y-2">
            {data.adicionales!.map((adicional, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs text-gray-500">Concepto</span>
                    <p className="text-sm font-medium">{adicional.concepto}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Monto</span>
                    <p className="text-sm">${adicional.monto.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Tipo</span>
                    <p className="text-sm">{adicional.tipo || '-'}</p>
                  </div>
                </div>
                <button
                  onClick={() => eliminarAdicional(index)}
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
        <div className="border-2 border-dashed border-green-300 rounded-lg p-4 bg-green-50/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Concepto *"
              value={nuevoAdicional.concepto}
              onChange={(e) => setNuevoAdicional({ ...nuevoAdicional, concepto: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <input
              type="number"
              placeholder="Monto *"
              value={nuevoAdicional.monto || ''}
              onChange={(e) => setNuevoAdicional({ ...nuevoAdicional, monto: parseFloat(e.target.value) })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              step="0.01"
            />
            <select
              value={nuevoAdicional.tipo}
              onChange={(e) => setNuevoAdicional({ ...nuevoAdicional, tipo: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="">Tipo</option>
              <option value="FIJO">Fijo</option>
              <option value="VARIABLE">Variable</option>
              <option value="PRESENTISMO">Por Presentismo</option>
              <option value="PRODUCTIVIDAD">Por Productividad</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
          <button
            onClick={agregarAdicional}
            className="mt-3 inline-flex items-center px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary-hover"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Adicional
          </button>
        </div>
      </div>

      {/* Beneficios */}
      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
          <Gift className="h-5 w-5 mr-2" />
          Beneficios
        </h4>

        {/* Lista de beneficios */}
        {(data.beneficios || []).length > 0 && (
          <div className="mb-4 space-y-2">
            {data.beneficios!.map((beneficio, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs text-gray-500">Tipo</span>
                    <p className="text-sm font-medium">{beneficio.tipo}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Descripción</span>
                    <p className="text-sm">{beneficio.descripcion}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Monto</span>
                    <p className="text-sm">{beneficio.monto ? `$${beneficio.monto.toFixed(2)}` : '-'}</p>
                  </div>
                </div>
                <button
                  onClick={() => eliminarBeneficio(index)}
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
              placeholder="Tipo *"
              value={nuevoBeneficio.tipo}
              onChange={(e) => setNuevoBeneficio({ ...nuevoBeneficio, tipo: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <input
              type="text"
              placeholder="Descripción *"
              value={nuevoBeneficio.descripcion}
              onChange={(e) => setNuevoBeneficio({ ...nuevoBeneficio, descripcion: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <input
              type="number"
              placeholder="Monto (opcional)"
              value={nuevoBeneficio.monto || ''}
              onChange={(e) => setNuevoBeneficio({ ...nuevoBeneficio, monto: e.target.value ? parseFloat(e.target.value) : undefined })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              step="0.01"
            />
          </div>
          <button
            onClick={agregarBeneficio}
            className="mt-3 inline-flex items-center px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary-hover"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Beneficio
          </button>
        </div>
      </div>
    </div>
  )
}
