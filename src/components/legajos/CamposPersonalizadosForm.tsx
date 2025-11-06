import { useEffect, useState } from 'react'

interface CustomField {
  id: string
  fieldName: string
  fieldType: string
  defaultValue: string | null
  isRequired: boolean
  order: number
  isActive: boolean
}

interface CustomFieldValue {
  customFieldId: string
  value: string
}

interface Props {
  legajoId?: string
  values: Record<string, string>
  onChange: (values: Record<string, string>) => void
}

export default function CamposPersonalizadosForm({ legajoId, values, onChange }: Props) {
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCustomFields()
  }, [])

  const fetchCustomFields = async () => {
    try {
      const response = await fetch('/api/legajos/custom-fields')
      if (response.ok) {
        const data = await response.json()
        setCustomFields(data.customFields?.filter((f: CustomField) => f.isActive) || [])
      }
    } catch (error) {
      console.error('Error fetching custom fields:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (fieldId: string, value: string) => {
    onChange({
      ...values,
      [fieldId]: value
    })
  }

  const renderField = (field: CustomField) => {
    const value = values[field.id] || field.defaultValue || ''

    switch (field.fieldType) {
      case 'TEXT':
      case 'EMAIL':
      case 'PHONE':
        return (
          <input
            type={field.fieldType === 'EMAIL' ? 'email' : field.fieldType === 'PHONE' ? 'tel' : 'text'}
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
            required={field.isRequired}
          />
        )

      case 'TEXTAREA':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
            required={field.isRequired}
          />
        )

      case 'NUMBER':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
            required={field.isRequired}
          />
        )

      case 'DATE':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
            required={field.isRequired}
          />
        )

      case 'SELECT':
        const options = field.defaultValue?.split(',').map(o => o.trim()) || []
        return (
          <select
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
            required={field.isRequired}
          >
            <option value="">Seleccionar...</option>
            {options.map((option, idx) => (
              <option key={idx} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      case 'CHECKBOX':
        return (
          <div className="mt-2">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={value === 'true' || value === '1'}
                onChange={(e) => handleChange(field.id, e.target.checked ? 'true' : 'false')}
                className="h-4 w-4 text-secondary focus:ring-secondary border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Sí</span>
            </label>
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return <div className="text-center py-4 text-gray-500">Cargando campos personalizados...</div>
  }

  if (customFields.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-2">No hay campos personalizados configurados.</p>
        <a
          href="/configuracion/campos-personalizados"
          target="_blank"
          rel="noopener noreferrer"
          className="text-secondary hover:underline text-sm"
        >
          Configurar campos personalizados
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {customFields.map((field) => (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700">
              {field.fieldName}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderField(field)}
          </div>
        ))}
      </div>
    </div>
  )
}
