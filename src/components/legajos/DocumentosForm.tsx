import { useState } from 'react'
import { Documento } from '@/types/legajo'
import { Trash2, Download, FileText, Upload, AlertCircle, CheckCircle } from 'lucide-react'

interface Props {
  documentos: Documento[]
  onChange: (documentos: Documento[]) => void
}

export default function DocumentosForm({ documentos, onChange }: Props) {
  const [nuevoDocumento, setNuevoDocumento] = useState<Documento>({
    tipoDocumento: '',
    descripcion: '',
    archivoUrl: '',
    fechaCarga: new Date().toISOString().split('T')[0],
    fechaVencimiento: ''
  })

  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null)

  const tiposDocumento = [
    'Contrato de trabajo',
    'Formulario 2.61 (Asignaciones Familiares)',
    'Apto médico preocupacional',
    'Alta AFIP',
    'Alta sindical',
    'Opción de obra social',
    'Credencial ART',
    'DNI (frente)',
    'DNI (dorso)',
    'CUIL',
    'Título académico',
    'Certificado',
    'Otro'
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivoSeleccionado(e.target.files[0])
    }
  }

  const agregarDocumento = () => {
    if (!nuevoDocumento.tipoDocumento) {
      return
    }

    // TODO: Implement file upload logic here
    // For now, we'll just add the document metadata
    const documentoToAdd = {
      ...nuevoDocumento,
      fechaCarga: new Date().toISOString().split('T')[0],
      // archivoUrl will be set after upload
      archivoUrl: archivoSeleccionado ? `placeholder-${archivoSeleccionado.name}` : ''
    }

    onChange([...documentos, documentoToAdd])

    // Reset form
    setNuevoDocumento({
      tipoDocumento: '',
      descripcion: '',
      archivoUrl: '',
      fechaCarga: new Date().toISOString().split('T')[0],
      fechaVencimiento: ''
    })
    setArchivoSeleccionado(null)
  }

  const eliminarDocumento = (index: number) => {
    onChange(documentos.filter((_, i) => i !== index))
  }

  const getEstadoDocumento = (fechaVencimiento?: string) => {
    if (!fechaVencimiento) return null

    const hoy = new Date()
    const vencimiento = new Date(fechaVencimiento)

    if (vencimiento < hoy) {
      return { estado: 'vencido', color: 'red' }
    } else {
      const diasRestantes = Math.floor((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
      if (diasRestantes <= 30) {
        return { estado: 'por vencer', color: 'yellow' }
      }
      return { estado: 'vigente', color: 'green' }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Documentos del Legajo
        </h4>

        {/* Lista de documentos */}
        {documentos.length > 0 && (
          <div className="mb-4 space-y-2">
            {documentos.map((doc, index) => {
              const estadoDoc = getEstadoDocumento(doc.fechaVencimiento)
              return (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1 grid grid-cols-5 gap-4">
                    <div>
                      <span className="text-xs text-gray-500">Tipo</span>
                      <p className="text-sm font-medium">{doc.tipoDocumento}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Descripción</span>
                      <p className="text-sm">{doc.descripcion || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Fecha Carga</span>
                      <p className="text-sm">{doc.fechaCarga || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Vencimiento</span>
                      <p className="text-sm">{doc.fechaVencimiento || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Estado</span>
                      {estadoDoc ? (
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                          estadoDoc.color === 'green' ? 'bg-success/10 text-success' :
                          estadoDoc.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {estadoDoc.color === 'green' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <AlertCircle className="h-3 w-3 mr-1" />
                          )}
                          {estadoDoc.estado}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {doc.archivoUrl && (
                      <a
                        href={doc.archivoUrl}
                        download
                        className="text-secondary hover:text-secondary-hover"
                        title="Descargar"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      onClick={() => eliminarDocumento(index)}
                      className="text-red-600 hover:text-red-800"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Formulario para agregar */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Documento *
              </label>
              <select
                value={nuevoDocumento.tipoDocumento}
                onChange={(e) => setNuevoDocumento({ ...nuevoDocumento, tipoDocumento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              >
                <option value="">Seleccionar...</option>
                {tiposDocumento.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <input
                type="text"
                placeholder="Descripción del documento"
                value={nuevoDocumento.descripcion || ''}
                onChange={(e) => setNuevoDocumento({ ...nuevoDocumento, descripcion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Archivo
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-secondary file:text-white
                    hover:file:bg-secondary-hover
                    file:cursor-pointer cursor-pointer"
                />
              </div>
              {archivoSeleccionado && (
                <p className="mt-1 text-xs text-gray-500">
                  Seleccionado: {archivoSeleccionado.name}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Vencimiento (opcional)
              </label>
              <input
                type="date"
                value={nuevoDocumento.fechaVencimiento || ''}
                onChange={(e) => setNuevoDocumento({ ...nuevoDocumento, fechaVencimiento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
          </div>
          <button
            onClick={agregarDocumento}
            className="mt-4 inline-flex items-center px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary-hover"
          >
            <Upload className="h-4 w-4 mr-2" />
            Agregar Documento
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Notas sobre documentos:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Los documentos se guardarán cuando presiones &quot;Guardar Cambios&quot;</li>
              <li>Los documentos con fecha de vencimiento mostrarán su estado automáticamente</li>
              <li>Tamaño máximo por archivo: 10MB</li>
              <li>Formatos aceptados: PDF, JPG, PNG, DOCX</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
