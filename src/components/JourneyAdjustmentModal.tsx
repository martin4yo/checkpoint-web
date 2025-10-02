'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Clock, Coffee, FileText } from 'lucide-react'

interface JourneyReport {
  id: string
  placeName: string
  userName: string
  userEmail: string
  startDate: string
  startTime: string
  endDate?: string
  endTime?: string
  duration: string
  adjustments?: {
    id?: string
    manualStartTime?: string
    manualEndTime?: string
    lunchStartTime?: string
    lunchEndTime?: string
    notes?: string
  }
}

interface JourneyAdjustmentEdit {
  checkpointId: string
  manualStartTime: string
  manualEndTime: string
  lunchStartTime: string
  lunchEndTime: string
  notes: string
}

interface JourneyAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: JourneyAdjustmentEdit) => Promise<void>
  journey: JourneyReport | null
}

export default function JourneyAdjustmentModal({
  isOpen,
  onClose,
  onSave,
  journey
}: JourneyAdjustmentModalProps) {
  const [editData, setEditData] = useState<JourneyAdjustmentEdit | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen && journey) {
      setEditData({
        checkpointId: journey.id,
        manualStartTime: journey.adjustments?.manualStartTime || '',
        manualEndTime: journey.adjustments?.manualEndTime || '',
        lunchStartTime: journey.adjustments?.lunchStartTime || '',
        lunchEndTime: journey.adjustments?.lunchEndTime || '',
        notes: journey.adjustments?.notes || ''
      })
    }
  }, [isOpen, journey])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleSave = async () => {
    if (!editData) return

    setSaving(true)
    try {
      await onSave(editData)
      onClose()
    } catch (error) {
      console.error('Error saving adjustments:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen || !journey || !editData) return null

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">Cerrar</span>
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                Ajustar Jornada
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {journey.userName} - {journey.placeName}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {/* Horarios de trabajo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Hora de inicio manual
                </label>
                <input
                  type="datetime-local"
                  value={editData.manualStartTime}
                  onChange={(e) => setEditData(prev => prev ? { ...prev, manualStartTime: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Original: {journey.startDate === journey.endDate ? '' : `${journey.startDate} `}{journey.startTime}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Hora de fin manual
                </label>
                <input
                  type="datetime-local"
                  value={editData.manualEndTime}
                  onChange={(e) => setEditData(prev => prev ? { ...prev, manualEndTime: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Original: {journey.endDate && journey.endTime ?
                    `${journey.startDate === journey.endDate ? '' : `${journey.endDate} `}${journey.endTime}` :
                    'En curso'
                  }
                </p>
              </div>
            </div>

            {/* Horarios de almuerzo */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                <Coffee className="inline h-4 w-4 mr-1" />
                Horario de Almuerzo
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Inicio del almuerzo
                  </label>
                  <input
                    type="time"
                    value={editData.lunchStartTime}
                    onChange={(e) => setEditData(prev => prev ? { ...prev, lunchStartTime: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Fin del almuerzo
                  </label>
                  <input
                    type="time"
                    value={editData.lunchEndTime}
                    onChange={(e) => setEditData(prev => prev ? { ...prev, lunchEndTime: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline h-4 w-4 mr-1" />
                Notas del ajuste
              </label>
              <textarea
                value={editData.notes}
                onChange={(e) => setEditData(prev => prev ? { ...prev, notes: e.target.value } : null)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Escribe cualquier observación sobre el ajuste..."
              />
            </div>
          </div>

          <div className="mt-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </>
              )}
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}