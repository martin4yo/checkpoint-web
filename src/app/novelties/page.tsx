'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Plus, Edit2, Trash2, FileText, Check, X, Paperclip, Download, Upload, Building2 } from 'lucide-react'
import { useConfirm } from '@/hooks/useConfirm'
import { DynamicIcon } from '@/lib/lucide-icons'

interface NoveltyType {
  id: string
  name: string
  color: string
  icon: string
  requiresAmount: boolean
  requiresDate: boolean
  requiresDateRange: boolean
  allowsAttachments: boolean
}

interface Tenant {
  id: string
  name: string
  slug: string
}

interface User {
  id: string
  name: string
  email: string
  tenant?: Tenant
}

interface CurrentUser {
  id: string
  tenantId: string
  superuser: boolean
}

interface Novelty {
  id: string
  userId: string
  noveltyTypeId: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  amount: number | null
  date: string | null
  startDate: string | null
  endDate: string | null
  notes: string | null
  approvedById: string | null
  approvedAt: string | null
  createdAt: string
  user: User
  noveltyType: NoveltyType
  approvedBy: User | null
  _count: {
    attachments: number
  }
}

interface Attachment {
  id: string
  fileName: string
  fileUrl: string
  fileSize: number
  uploadedAt: string
}

export default function NoveltiesPage() {
  const [novelties, setNovelties] = useState<Novelty[]>([])
  const [noveltyTypes, setNoveltyTypes] = useState<NoveltyType[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [filterTenantId, setFilterTenantId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingNovelty, setEditingNovelty] = useState<Novelty | null>(null)
  const [selectedType, setSelectedType] = useState<NoveltyType | null>(null)
  const [formData, setFormData] = useState({
    noveltyTypeId: '',
    amount: '',
    date: '',
    startDate: '',
    endDate: '',
    notes: ''
  })
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const [viewingAttachments, setViewingAttachments] = useState<Novelty | null>(null)
  const [viewAttachments, setViewAttachments] = useState<Attachment[]>([])
  const { confirm, ConfirmDialog } = useConfirm()

  useEffect(() => {
    fetchNovelties()
    fetchNoveltyTypes()
  }, [filterTenantId])

  const fetchNovelties = async () => {
    try {
      const url = filterTenantId
        ? `/api/novelties?tenantId=${filterTenantId}`
        : '/api/novelties'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setNovelties(data.novelties)
        setCurrentUser(data.currentUser)

        // Fetch tenants if user is superuser (only on first load)
        if (data.currentUser.superuser && tenants.length === 0) {
          fetchTenants()
        }
      }
    } catch (error) {
      console.error('Error fetching novelties:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchNoveltyTypes = async () => {
    try {
      const response = await fetch('/api/novelty-types')
      if (response.ok) {
        const data = await response.json()
        const activeTypes = data.noveltyTypes.filter((t: NoveltyType & { isActive: boolean }) => t.isActive)
        setNoveltyTypes(activeTypes)
      }
    } catch (error) {
      console.error('Error fetching novelty types:', error)
    }
  }

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/tenants')
      if (response.ok) {
        const data = await response.json()
        setTenants(data)
      }
    } catch (error) {
      console.error('Error fetching tenants:', error)
    }
  }

  const fetchAttachments = async (noveltyId: string) => {
    try {
      const response = await fetch(`/api/novelties/${noveltyId}/attachments`)
      if (response.ok) {
        const data = await response.json()
        setAttachments(data)
      }
    } catch (error) {
      console.error('Error fetching attachments:', error)
    }
  }

  const handleTypeChange = (typeId: string) => {
    const type = noveltyTypes.find(t => t.id === typeId)
    setSelectedType(type || null)
    setFormData({ ...formData, noveltyTypeId: typeId })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const payload: Record<string, unknown> = {
        noveltyTypeId: formData.noveltyTypeId,
        notes: formData.notes
      }

      if (selectedType?.requiresAmount && formData.amount) {
        payload.amount = parseFloat(formData.amount)
      }
      if (selectedType?.requiresDate && formData.date) {
        payload.date = formData.date
      }
      if (selectedType?.requiresDateRange) {
        if (formData.startDate) payload.startDate = formData.startDate
        if (formData.endDate) payload.endDate = formData.endDate
      }

      const url = '/api/novelties'
      const method = editingNovelty ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingNovelty ? { ...payload, id: editingNovelty.id } : payload),
      })

      if (response.ok) {
        const savedNovelty = await response.json()

        // If creating new novelty and there are pending files, upload them
        if (!editingNovelty && pendingFiles.length > 0) {
          await uploadPendingFiles(savedNovelty.id)
        }

        await fetchNovelties()
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al guardar novedad')
      }
    } catch (error) {
      console.error('Error saving novelty:', error)
      alert('Error al guardar novedad')
    }
  }

  const uploadPendingFiles = async (noveltyId: string) => {
    for (const file of pendingFiles) {
      try {
        const formData = new FormData()
        formData.append('file', file)

        await fetch(`/api/novelties/${noveltyId}/attachments`, {
          method: 'POST',
          body: formData
        })
      } catch (error) {
        console.error('Error uploading pending file:', error)
      }
    }
  }

  const handleEdit = (novelty: Novelty) => {
    // Prevent editing approved or rejected novelties
    if (novelty.status !== 'PENDING') {
      alert('No se pueden editar novedades aprobadas o rechazadas')
      return
    }

    setEditingNovelty(novelty)
    setSelectedType(novelty.noveltyType)
    setFormData({
      noveltyTypeId: novelty.noveltyTypeId,
      amount: novelty.amount?.toString() || '',
      date: novelty.date ? novelty.date.substring(0, 10) : '',
      startDate: novelty.startDate ? novelty.startDate.substring(0, 10) : '',
      endDate: novelty.endDate ? novelty.endDate.substring(0, 10) : '',
      notes: novelty.notes || ''
    })

    // Fetch attachments if type allows them
    if (novelty.noveltyType.allowsAttachments) {
      fetchAttachments(novelty.id)
    }

    setShowForm(true)
  }

  const handleDelete = async (id: string, status: string) => {
    // Prevent deleting approved or rejected novelties
    if (status !== 'PENDING') {
      alert('No se pueden eliminar novedades aprobadas o rechazadas')
      return
    }

    const confirmed = await confirm({
      title: 'Eliminar Novedad',
      message: '¿Estás seguro de que quieres eliminar esta novedad?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    })

    if (confirmed) {
      try {
        const response = await fetch('/api/novelties', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })

        if (response.ok) {
          await fetchNovelties()
        } else {
          const error = await response.json()
          alert(error.error || 'Error al eliminar novedad')
        }
      } catch (error) {
        console.error('Error deleting novelty:', error)
        alert('Error al eliminar novedad')
      }
    }
  }

  const handleApprove = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const action = status === 'APPROVED' ? 'aprobar' : 'rechazar'
    const confirmed = await confirm({
      title: status === 'APPROVED' ? 'Aprobar Novedad' : 'Rechazar Novedad',
      message: `¿Estás seguro de que quieres ${action} esta novedad?`,
      confirmText: action === 'aprobar' ? 'Aprobar' : 'Rechazar',
      cancelText: 'Cancelar',
      type: status === 'APPROVED' ? 'info' : 'danger'
    })

    if (confirmed) {
      try {
        const response = await fetch(`/api/novelties/${id}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })

        if (response.ok) {
          await fetchNovelties()
        } else {
          const error = await response.json()
          alert(error.error || `Error al ${action} novedad`)
        }
      } catch (error) {
        console.error(`Error ${action}ing novelty:`, error)
        alert(`Error al ${action} novedad`)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]

    // If editing existing novelty, upload immediately
    if (editingNovelty) {
      uploadFileImmediately(file)
    } else {
      // If creating new novelty, add to pending files
      setPendingFiles(prev => [...prev, file])
    }

    // Clear the input
    e.target.value = ''
  }

  const uploadFileImmediately = async (file: File) => {
    if (!editingNovelty) return

    setUploadingFile(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/novelties/${editingNovelty.id}/attachments`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        await fetchAttachments(editingNovelty.id)
      } else {
        const error = await response.json()
        alert(error.error || 'Error al subir archivo')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Error al subir archivo')
    } finally {
      setUploadingFile(false)
    }
  }

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!editingNovelty) return

    const confirmed = await confirm({
      title: 'Eliminar Archivo',
      message: '¿Estás seguro de que quieres eliminar este archivo?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    })

    if (confirmed) {
      try {
        const response = await fetch(`/api/novelties/${editingNovelty.id}/attachments`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attachmentId })
        })

        if (response.ok) {
          await fetchAttachments(editingNovelty.id)
        }
      } catch (error) {
        console.error('Error deleting attachment:', error)
        alert('Error al eliminar archivo')
      }
    }
  }

  const handleViewAttachments = async (novelty: Novelty) => {
    try {
      const response = await fetch(`/api/novelties/${novelty.id}/attachments`)
      if (response.ok) {
        const data = await response.json()
        setViewAttachments(data)
        setViewingAttachments(novelty)
      }
    } catch (error) {
      console.error('Error fetching attachments:', error)
      alert('Error al cargar archivos adjuntos')
    }
  }

  const resetForm = () => {
    setFormData({
      noveltyTypeId: '',
      amount: '',
      date: '',
      startDate: '',
      endDate: '',
      notes: ''
    })
    setSelectedType(null)
    setEditingNovelty(null)
    setAttachments([])
    setPendingFiles([])
    setShowForm(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Aprobado</span>
      case 'REJECTED':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Rechazado</span>
      default:
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pendiente</span>
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  if (loading) {
    return (
      <DashboardLayout title="Novedades" titleIcon={<FileText className="h-8 w-8 text-gray-600" />}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Novedades" titleIcon={<FileText className="h-8 w-8 text-gray-600" />}>
      <ConfirmDialog />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {currentUser?.superuser ? 'Novedades' : 'Mis Novedades'} ({novelties.length})
          </h2>
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="inline-flex items-center bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nueva Novedad
          </button>
        </div>

        {/* Tenant Filter - Only for Superusers */}
        {currentUser?.superuser && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center space-x-3">
              <Building2 className="h-5 w-5 text-gray-400" />
              <select
                value={filterTenantId}
                onChange={(e) => setFilterTenantId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="">Mi tenant ({currentUser?.tenantId ? tenants.find(t => t.id === currentUser.tenantId)?.name || 'Actual' : 'Actual'})</option>
                {tenants.filter(t => t.id !== currentUser?.tenantId).map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8 mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                {editingNovelty ? 'Editar Novedad' : 'Nueva Novedad'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Novedad
                  </label>
                  <select
                    value={formData.noveltyTypeId}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    required
                    disabled={!!editingNovelty}
                  >
                    <option value="">Seleccionar tipo...</option>
                    {noveltyTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedType?.requiresAmount && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Importe
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="0.00"
                    />
                  </div>
                )}

                {selectedType?.requiresDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                )}

                {selectedType?.requiresDateRange && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha Inicio
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha Fin
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas / Descripción
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    rows={3}
                    placeholder="Descripción o notas adicionales..."
                  />
                </div>

                {/* Attachments Section - Show when type allows attachments */}
                {selectedType?.allowsAttachments && (
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Archivos Adjuntos ({editingNovelty ? attachments.length : pendingFiles.length})
                      </label>
                      <label className="cursor-pointer inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm">
                        <Upload className="h-4 w-4 mr-1" />
                        {uploadingFile ? 'Subiendo...' : 'Seleccionar Archivo'}
                        <input
                          type="file"
                          onChange={handleFileSelect}
                          className="hidden"
                          disabled={uploadingFile}
                        />
                      </label>
                    </div>

                    {/* Show existing attachments (when editing) */}
                    {editingNovelty && attachments.length > 0 && (
                      <div className="space-y-2 mb-3">
                        <div className="text-xs font-medium text-gray-500 uppercase">Archivos Guardados</div>
                        {attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center flex-1 min-w-0">
                              <Paperclip className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm text-gray-900 truncate">{attachment.fileName}</div>
                                <div className="text-xs text-gray-500">{formatFileSize(attachment.fileSize)}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-2">
                              <a
                                href={`/api/files${attachment.fileUrl}`}
                                download
                                className="text-blue-600 hover:text-blue-800"
                                title="Descargar"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleDeleteAttachment(attachment.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Show pending files (when creating) */}
                    {!editingNovelty && pendingFiles.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-gray-500 uppercase">Archivos Seleccionados</div>
                        {pendingFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                            <div className="flex items-center flex-1 min-w-0">
                              <Paperclip className="h-4 w-4 text-blue-400 mr-2 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm text-gray-900 truncate">{file.name}</div>
                                <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removePendingFile(index)}
                              className="text-red-600 hover:text-red-800 ml-2"
                              title="Quitar"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <div className="text-xs text-blue-600 mt-2">
                          Los archivos se subirán al crear la novedad
                        </div>
                      </div>
                    )}

                    {editingNovelty && attachments.length === 0 && (
                      <div className="text-xs text-gray-500 text-center py-2">
                        No hay archivos adjuntos
                      </div>
                    )}

                    {!editingNovelty && pendingFiles.length === 0 && (
                      <div className="text-xs text-gray-500 text-center py-2">
                        No hay archivos seleccionados
                      </div>
                    )}
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
                  >
                    {editingNovelty ? 'Actualizar' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Attachments Modal */}
        {viewingAttachments && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Archivos Adjuntos - {viewingAttachments.noveltyType.name}
                </h3>
                <button
                  onClick={() => {
                    setViewingAttachments(null)
                    setViewAttachments([])
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {viewAttachments.length > 0 ? (
                <div className="space-y-2">
                  {viewAttachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center flex-1 min-w-0">
                        <Paperclip className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">{attachment.fileName}</div>
                          <div className="text-xs text-gray-500">
                            {formatFileSize(attachment.fileSize)} • {new Date(attachment.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <a
                        href={`/api/files${attachment.fileUrl}`}
                        download
                        className="ml-3 inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                        title="Descargar archivo"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Descargar
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay archivos adjuntos
                </div>
              )}
            </div>
          </div>
        )}

        {/* Novelties Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo / Usuario
                </th>
                {currentUser?.superuser && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detalles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {novelties.map((novelty) => (
                <tr key={novelty.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: novelty.noveltyType.color }}
                      >
                        <DynamicIcon name={novelty.noveltyType.icon} className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{novelty.noveltyType.name}</div>
                        <div className="text-xs text-gray-500">{novelty.user.name}</div>
                      </div>
                    </div>
                  </td>
                  {currentUser?.superuser && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{novelty.user.tenant?.name}</div>
                      <div className="text-xs text-gray-500">{novelty.user.tenant?.slug}</div>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {novelty.amount && <div>Importe: ${novelty.amount}</div>}
                      {novelty.date && <div>Fecha: {new Date(novelty.date).toLocaleDateString()}</div>}
                      {novelty.startDate && novelty.endDate && (
                        <div>
                          Desde: {new Date(novelty.startDate).toLocaleDateString()} -
                          Hasta: {new Date(novelty.endDate).toLocaleDateString()}
                        </div>
                      )}
                      {novelty.notes && <div className="text-xs text-gray-500 mt-1">{novelty.notes}</div>}
                      {novelty._count.attachments > 0 && (
                        <button
                          onClick={() => handleViewAttachments(novelty)}
                          className="text-xs text-blue-600 hover:text-blue-800 mt-1 flex items-center"
                          title="Ver archivos adjuntos"
                        >
                          <Paperclip className="h-3 w-3 inline mr-1" />
                          {novelty._count.attachments} archivo(s)
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(novelty.status)}
                    {novelty.approvedBy && (
                      <div className="text-xs text-gray-500 mt-1">
                        Por: {novelty.approvedBy.name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(novelty.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    {novelty.status === 'PENDING' ? (
                      <>
                        <button
                          onClick={() => handleEdit(novelty)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4 inline" />
                        </button>
                        <button
                          onClick={() => handleApprove(novelty.id, 'APPROVED')}
                          className="text-green-600 hover:text-green-900"
                          title="Aprobar"
                        >
                          <Check className="h-4 w-4 inline" />
                        </button>
                        <button
                          onClick={() => handleApprove(novelty.id, 'REJECTED')}
                          className="text-red-600 hover:text-red-900"
                          title="Rechazar"
                        >
                          <X className="h-4 w-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(novelty.id, novelty.status)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        {novelty.status === 'APPROVED' ? 'Aprobada' : 'Rechazada'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {novelties.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No hay novedades registradas
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
