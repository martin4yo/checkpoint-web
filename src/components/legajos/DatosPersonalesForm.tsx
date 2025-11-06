import { LegajoDatosPersonales } from '@/types/legajo'

interface Props {
  data: LegajoDatosPersonales
  onChange: (data: LegajoDatosPersonales) => void
  fieldConfig?: Record<string, unknown>
}

export default function DatosPersonalesForm({ data, onChange, fieldConfig }: Props) {
  const isRequired = (fieldName: string) => {
    return fieldConfig?.datosPersonales?.[fieldName] === true
  }
  const handleChange = (field: keyof LegajoDatosPersonales, value: string) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-6">
      {/* Datos de Identificación */}
      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-3">Identificación</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DNI{isRequired('dni') && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={data.dni || ''}
              onChange={(e) => handleChange('dni', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="12345678"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CUIL/CUIT{isRequired('cuil') && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={data.cuil || ''}
              onChange={(e) => handleChange('cuil', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="20-12345678-9"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Nacimiento{isRequired('fechaNacimiento') && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="date"
              value={data.fechaNacimiento || ''}
              onChange={(e) => handleChange('fechaNacimiento', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
        </div>
      </div>

      {/* Datos Personales */}
      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-3">Datos Personales</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Género{isRequired('genero') && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={data.genero || ''}
              onChange={(e) => handleChange('genero', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="">Seleccionar...</option>
              <option value="MASCULINO">Masculino</option>
              <option value="FEMENINO">Femenino</option>
              <option value="OTRO">Otro</option>
              <option value="PREFIERO_NO_DECIR">Prefiero no decir</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado Civil{isRequired('estadoCivil') && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={data.estadoCivil || ''}
              onChange={(e) => handleChange('estadoCivil', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="">Seleccionar...</option>
              <option value="SOLTERO">Soltero/a</option>
              <option value="CASADO">Casado/a</option>
              <option value="DIVORCIADO">Divorciado/a</option>
              <option value="VIUDO">Viudo/a</option>
              <option value="UNION_CONVIVENCIAL">Unión Convivencial</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nacionalidad{isRequired('nacionalidad') && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={data.nacionalidad || ''}
              onChange={(e) => handleChange('nacionalidad', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="Argentina"
            />
          </div>
        </div>
      </div>

      {/* Domicilio */}
      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-3">Domicilio</h4>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Calle{isRequired('domicilioCalle') && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={data.domicilioCalle || ''}
              onChange={(e) => handleChange('domicilioCalle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número{isRequired('domicilioNumero') && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={data.domicilioNumero || ''}
              onChange={(e) => handleChange('domicilioNumero', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Piso
            </label>
            <input
              type="text"
              value={data.domicilioPiso || ''}
              onChange={(e) => handleChange('domicilioPiso', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Depto
            </label>
            <input
              type="text"
              value={data.domicilioDepto || ''}
              onChange={(e) => handleChange('domicilioDepto', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Localidad{isRequired('domicilioLocalidad') && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={data.domicilioLocalidad || ''}
              onChange={(e) => handleChange('domicilioLocalidad', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provincia{isRequired('domicilioProvincia') && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={data.domicilioProvincia || ''}
              onChange={(e) => handleChange('domicilioProvincia', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código Postal{isRequired('domicilioCP') && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={data.domicilioCP || ''}
              onChange={(e) => handleChange('domicilioCP', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
        </div>
      </div>

      {/* Contacto */}
      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-3">Contacto</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono Fijo{isRequired('telefonoFijo') && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="tel"
              value={data.telefonoFijo || ''}
              onChange={(e) => handleChange('telefonoFijo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="011-1234-5678"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono Celular{isRequired('telefonoCelular') && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="tel"
              value={data.telefonoCelular || ''}
              onChange={(e) => handleChange('telefonoCelular', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="11-2345-6789"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Personal{isRequired('emailPersonal') && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="email"
              value={data.emailPersonal || ''}
              onChange={(e) => handleChange('emailPersonal', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="personal@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Corporativo{isRequired('emailCorporativo') && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="email"
              value={data.emailCorporativo || ''}
              onChange={(e) => handleChange('emailCorporativo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="empleado@empresa.com"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
