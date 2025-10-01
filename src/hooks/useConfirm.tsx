'use client'

import { useState, useCallback, ReactNode } from 'react'
import ConfirmModal from '@/components/ConfirmModal'

interface ConfirmOptions {
  title: string
  message: string | ReactNode
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  icon?: ReactNode
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null)

  const confirm = useCallback((confirmOptions: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(confirmOptions)
      setResolvePromise(() => resolve)
      setIsOpen(true)
    })
  }, [])

  const handleConfirm = useCallback(() => {
    setIsOpen(false)
    if (resolvePromise) {
      resolvePromise(true)
      setResolvePromise(null)
    }
  }, [resolvePromise])

  const handleCancel = useCallback(() => {
    setIsOpen(false)
    if (resolvePromise) {
      resolvePromise(false)
      setResolvePromise(null)
    }
  }, [resolvePromise])

  const ConfirmDialog = useCallback(() => {
    if (!options) return null

    return (
      <ConfirmModal
        isOpen={isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        type={options.type}
        icon={options.icon}
      />
    )
  }, [isOpen, options, handleCancel, handleConfirm])

  return {
    confirm,
    ConfirmDialog
  }
}