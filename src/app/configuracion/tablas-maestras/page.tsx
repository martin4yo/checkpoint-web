'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Database, Plus, Edit3, Trash2, X, Save } from 'lucide-react'

interface MasterDataRecord {
  id: string
  table: string
  code: string
  description: string
  isActive: boolean
  order: number
}

interface JobPosition {
  id: string
  code: string
  name: string
  description: string | null
  workDays: string[]
  scheduleType: string
  startTime: string | null
  endTime: string | null
  hoursPerDay: number | null
  hoursPerWeek: number | null
  overtimeAllowed: boolean
  overtimeRate: number | null
  breakMinutes: number | null
  isActive: boolean
}

const TABLES = [
  { value: 'categoria', label: 'Categorías' },
  { value: 'area', label: 'Áreas' },
  { value: 'sector', label: 'Sectores' },
  { value: 'sucursal', label: 'Sucursales' },
  { value: 'obra_social', label: 'Obras Sociales' },
  { value: 'sindicato', label: 'Sindicatos' },
  { value: 'banco', label: 'Bancos' },
]

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export default function TablasMaestrasPage() {
  const [activeTab, setActiveTab] = useState<'simple' | 'puestos'>('simple')
  const [selectedTable, setSelectedTable] = useState('categoria')
  const [records, setRecords] = useState<MasterDataRecord[]>([])
  const [positions, setPositions] = useState<JobPosition[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<MasterDataRecord | null>(null)
  const [editingPosition, setEditingPosition] = useState<JobPosition | null>(null)

  // Form data para tablas simples
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    order: 0
  })

  // Form data para puestos
  const [positionForm, setPositionForm] = useState({
    code: '',
    name: '',
    description: '',
    workDays: [] as string[],
    scheduleType: 'fijo',
    startTime: '',
    endTime: '',
    hoursPerDay: '',
    hoursPerWeek: '',
    overtimeAllowed: false,
    overtimeRate: '',
    breakMinutes: ''
  })

  useEffect(() => {
    if (activeTab === 'simple') {
      fetchRecords()
    } else {
      fetchPositions()
    }
  }, [selectedTable, activeTab])

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/master-data?table=${selectedTable}`)
      if (response.ok) {
        const data = await response.json()
        setRecords(data.records || [])
      }
    } catch (error) {
      console.error('Error fetching records:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPositions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/job-positions')
      if (response.ok) {
        const data = await response.json()
        setPositions(data.positions || [])
      }
    } catch (error) {
      console.error('Error fetching positions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    if (activeTab === 'simple') {
      setEditingRecord(null)
      setFormData({ code: '', description: '', order: records.length })
      setShowModal(true)
    } else {
      setEditingPosition(null)
      setPositionForm({
        code: '',
        name: '',
        description: '',
        workDays: [],
        scheduleType: 'fijo',
        startTime: '09:00',
        endTime: '18:00',
        hoursPerDay: '8',
        hoursPerWeek: '40',
        overtimeAllowed: false,
        overtimeRate: '1.5',
        breakMinutes: '60'
      })
      setShowModal(true)
    }
  }

  const handleEdit = (item: MasterDataRecord | JobPosition) => {
    if (activeTab === 'simple') {
      const record = item as MasterDataRecord
      setEditingRecord(record)
      setFormData({
        code: record.code,
        description: record.description,
        order: record.order
      })
      setShowModal(true)
    } else {
      const position = item as JobPosition
      setEditingPosition(position)
      setPositionForm({
        code: position.code,
        name: position.name,
        description: position.description || '',
        workDays: position.workDays,
        scheduleType: position.scheduleType,
        startTime: position.startTime || '',
        endTime: position.endTime || '',
        hoursPerDay: position.hoursPerDay?.toString() || '',
        hoursPerWeek: position.hoursPerWeek?.toString() || '',
        overtimeAllowed: position.overtimeAllowed,
        overtimeRate: position.overtimeRate?.toString() || '',
        breakMinutes: position.breakMinutes?.toString() || ''
      })
      setShowModal(true)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este registro?')) return

    try {
      const endpoint = activeTab === 'simple' ? '/api/master-data' : '/api/job-positions'
      const response = await fetch(`${endpoint}?id=${id}`, { method: 'DELETE' })

      if (response.ok) {
        if (activeTab === 'simple') {
          fetchRecords()
        } else {
          fetchPositions()
        }
      } else {
        alert('Error al eliminar')
      }
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Error al eliminar')
    }
  }

  const handleSave = async () => {
    if (activeTab === 'simple') {
      if (!formData.code.trim() || !formData.description.trim()) {
        alert('Código y descripción son requeridos')
        return
      }

      try {
        const method = editingRecord ? 'PUT' : 'POST'
        const body = editingRecord
          ? { id: editingRecord.id, ...formData }
          : { table: selectedTable, ...formData }

        const response = await fetch('/api/master-data', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })

        if (response.ok) {
          fetchRecords()
          setShowModal(false)
        } else {
          const error = await response.json()
          alert(error.error || 'Error al guardar')
        }
      } catch (error) {
        console.error('Error saving:', error)
        alert('Error al guardar')
      }
    } else {
      // Guardar puesto de trabajo
      if (!positionForm.code.trim() || !positionForm.name.trim() || positionForm.workDays.length === 0) {
        alert('Código, nombre y días de trabajo son requeridos')
        return
      }

      try {
        const method = editingPosition ? 'PUT' : 'POST'
        const body = editingPosition
          ? { id: editingPosition.id, ...positionForm, hoursPerDay: parseFloat(positionForm.hoursPerDay) || null, hoursPerWeek: parseFloat(positionForm.hoursPerWeek) || null, overtimeRate: parseFloat(positionForm.overtimeRate) || null, breakMinutes: parseInt(positionForm.breakMinutes) || null }
          : { ...positionForm, hoursPerDay: parseFloat(positionForm.hoursPerDay) || null, hoursPerWeek: parseFloat(positionForm.hoursPerWeek) || null, overtimeRate: parseFloat(positionForm.overtimeRate) || null, breakMinutes: parseInt(positionForm.breakMinutes) || null }

        const response = await fetch('/api/job-positions', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })

        if (response.ok) {
          fetchPositions()
          setShowModal(false)
        } else {
          const error = await response.json()
          alert(error.error || 'Error al guardar')
        }
      } catch (error) {
        console.error('Error saving position:', error)
        alert('Error al guardar puesto')
      }
    }
  }

  const toggleWorkDay = (day: string) => {
    setPositionForm(prev => ({
      ...prev,
      workDays: prev.workDays.includes(day)
        ? prev.workDays.filter(d => d !== day)
        : [...prev.workDays, day]
    }))
  }

  return (
    <DashboardLayout title="Tablas Maestras" titleIcon={<Database className="h-8 w-8 text-gray-600" />}>
      <div className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('simple')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'simple'
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tablas Simples
            </button>
            <button
              onClick={() => setActiveTab('puestos')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'puestos'
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Puestos de Trabajo
            </button>
          </nav>
        </div>

        {/* Selector de tabla (solo para tablas simples) */}
        {activeTab === 'simple' && (
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Tabla:</label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              {TABLES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Botón crear */}
        <div className="flex justify-end">
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-palette-yellow bg-secondary hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo {activeTab === 'simple' ? 'Registro' : 'Puesto'}
          </button>
        </div>

        {/* Tabla de registros */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Cargando...</div>
          ) : activeTab === 'simple' ? (
            records.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No hay registros</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orden</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map(record => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.order}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${record.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {record.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button onClick={() => handleEdit(record)} className="text-blue-600 hover:text-blue-900 mr-3"><Edit3 className="h-4 w-4 inline" /></button>
                        <button onClick={() => handleDelete(record.id)} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4 inline" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            positions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No hay puestos de trabajo</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo Horario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Días</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {positions.map(position => (
                    <tr key={position.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{position.code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{position.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{position.scheduleType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {position.startTime && position.endTime ? `${position.startTime} - ${position.endTime}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{position.workDays.length} días</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${position.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {position.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button onClick={() => handleEdit(position)} className="text-blue-600 hover:text-blue-900 mr-3"><Edit3 className="h-4 w-4 inline" /></button>
                        <button onClick={() => handleDelete(position.id)} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4 inline" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 backdrop-blur-sm bg-black/10" onClick={() => setShowModal(false)} />
              <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full z-50 max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-medium">{activeTab === 'simple' ? (editingRecord ? 'Editar Registro' : 'Nuevo Registro') : (editingPosition ? 'Editar Puesto' : 'Nuevo Puesto')}</h3>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
                </div>

                <div className="px-6 py-4 space-y-4">
                  {activeTab === 'simple' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                        <input
                          type="text"
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                          placeholder="Ej: CAT001"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
                        <input
                          type="text"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                          placeholder="Ej: Gerente"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                        <input
                          type="number"
                          value={formData.order}
                          onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                          <input
                            type="text"
                            value={positionForm.code}
                            onChange={(e) => setPositionForm({ ...positionForm, code: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                          <input
                            type="text"
                            value={positionForm.name}
                            onChange={(e) => setPositionForm({ ...positionForm, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <textarea
                          value={positionForm.description}
                          onChange={(e) => setPositionForm({ ...positionForm, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                          rows={2}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Días de Trabajo *</label>
                        <div className="grid grid-cols-4 gap-2">
                          {DIAS_SEMANA.map(day => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => toggleWorkDay(day)}
                              className={`px-3 py-2 text-sm rounded-md border ${
                                positionForm.workDays.includes(day)
                                  ? 'bg-secondary text-palette-yellow border-secondary'
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {day.substring(0, 3)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Horario *</label>
                        <select
                          value={positionForm.scheduleType}
                          onChange={(e) => setPositionForm({ ...positionForm, scheduleType: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                        >
                          <option value="fijo">Fijo</option>
                          <option value="rotativo">Rotativo</option>
                          <option value="flexible">Flexible</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Hora Inicio</label>
                          <input
                            type="time"
                            value={positionForm.startTime}
                            onChange={(e) => setPositionForm({ ...positionForm, startTime: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Hora Fin</label>
                          <input
                            type="time"
                            value={positionForm.endTime}
                            onChange={(e) => setPositionForm({ ...positionForm, endTime: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Horas/Día</label>
                          <input
                            type="number"
                            step="0.5"
                            value={positionForm.hoursPerDay}
                            onChange={(e) => setPositionForm({ ...positionForm, hoursPerDay: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Horas/Semana</label>
                          <input
                            type="number"
                            step="0.5"
                            value={positionForm.hoursPerWeek}
                            onChange={(e) => setPositionForm({ ...positionForm, hoursPerWeek: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Descanso (min)</label>
                          <input
                            type="number"
                            value={positionForm.breakMinutes}
                            onChange={(e) => setPositionForm({ ...positionForm, breakMinutes: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={positionForm.overtimeAllowed}
                            onChange={(e) => setPositionForm({ ...positionForm, overtimeAllowed: e.target.checked })}
                            className="h-4 w-4 text-secondary focus:ring-secondary border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Permite horas extras</span>
                        </label>
                        {positionForm.overtimeAllowed && (
                          <div className="flex-1">
                            <input
                              type="number"
                              step="0.1"
                              value={positionForm.overtimeRate}
                              onChange={(e) => setPositionForm({ ...positionForm, overtimeRate: e.target.value })}
                              placeholder="Multiplicador (ej: 1.5)"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 text-sm font-medium text-palette-yellow bg-secondary rounded-md hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary inline-flex items-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
