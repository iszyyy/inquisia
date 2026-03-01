import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, WarningCircle } from 'phosphor-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [open, onCancel])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto bg-white dark:bg-[#101010] rounded-2xl border border-[#E5E7EB] dark:border-[#1C1C1C] shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex items-start justify-between p-6 pb-4">
              <div className="flex items-start gap-3">
                {variant === 'danger' && (
                  <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <WarningCircle size={18} className="text-red-500" />
                  </div>
                )}
                <div>
                  <h2
                    className="text-[16px] text-[#0A0A0A] dark:text-[#F5F5F5] mb-1"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
                  >
                    {title}
                  </h2>
                  <p
                    className="text-[13px] text-[#5C6370] dark:text-[#8B8FA8] leading-relaxed"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {description}
                  </p>
                </div>
              </div>
              <button
                onClick={onCancel}
                className="p-1.5 rounded-full hover:bg-[#F0F2F5] dark:hover:bg-[#181818] text-[#9CA3AF] flex-shrink-0"
              >
                <X size={15} />
              </button>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-full text-[13px] border border-[#E5E7EB] dark:border-[#1C1C1C] text-[#5C6370] hover:border-[#0066FF] hover:text-[#0066FF] transition-colors"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 py-2.5 rounded-full text-[13px] text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2 ${variant === 'danger'
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-[#0066FF] hover:bg-[#0052CC]'
                  }`}
                style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
              >
                {loading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
