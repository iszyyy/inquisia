/**
 * RevisionModal
 * Used by students to submit a revision (for changes_requested)
 * or resubmit a rejected project.
 * Builds a FormData payload and calls the appropriate API endpoint.
 */
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, FilePdf, UploadSimple, Check, WarningCircle } from 'phosphor-react'
import { toast } from 'sonner'
import { projectsApi } from '../../lib/api'
import type { Project } from '../../lib/types'

interface RevisionModalProps {
  project: Project
  mode: 'revision' | 'resubmit'
  onClose: () => void
  onSuccess: (updated: Project) => void
}

function DropZone({ file, onFile }: { file: File | null; onFile: (f: File | null) => void }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }

  if (file) {
    return (
      <div className="rounded-2xl border border-[#0066FF] bg-[#0066FF08] p-4 flex items-center gap-3">
        <FilePdf size={24} className="text-[#0066FF] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-[#0A0A0A] dark:text-[#F5F5F5] truncate" style={{ fontFamily: 'var(--font-body)' }}>{file.name}</p>
          <p className="text-[11px] text-[#6B7280]" style={{ fontFamily: 'var(--font-body)' }}>{(file.size / 1024 / 1024).toFixed(1)} MB</p>
        </div>
        <button onClick={() => onFile(null)} className="p-1.5 rounded-full hover:bg-[#F0F2F5] dark:hover:bg-[#181818]">
          <X size={13} className="text-[#6B7280]" />
        </button>
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-150 ${dragging ? 'border-[#0066FF] bg-[#0066FF08]' : 'border-[#C9D0DA] dark:border-[#1C1C1C] hover:border-[#0066FF] hover:bg-[#0066FF08]'
        }`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <UploadSimple size={28} className={`mx-auto mb-2 ${dragging ? 'text-[#0066FF]' : 'text-[#6B7280]'}`} />
      <p className="text-[13px] text-[#374151] dark:text-[#8B8FA8]" style={{ fontFamily: 'var(--font-body)' }}>
        Drop your updated PDF here or click to browse
      </p>
      <p className="text-[11px] text-[#6B7280] mt-1" style={{ fontFamily: 'var(--font-body)' }}>PDF only, max 50MB</p>
      <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
    </div>
  )
}

export function RevisionModal({ project, mode, onClose, onSuccess }: RevisionModalProps) {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const isRevision = mode === 'revision'
  const title = isRevision ? 'Submit Revision' : 'Resubmit Project'
  const desc = isRevision
    ? 'Upload your revised PDF and briefly summarise what you changed.'
    : 'Upload a new PDF to resubmit this project for review.'

  const handleSubmit = async () => {
    if (!pdfFile) {
      toast.error('Please upload your updated PDF before submitting.')
      return
    }
    setSubmitting(true)

    // The API now builds the FormData internally: `file` blob + `metadata` JSON string.
    // We pass the raw file and notes string; the api client handles the rest.
    const res = isRevision
      ? await projectsApi.submitRevision(project.id, pdfFile, notes.trim())
      : await projectsApi.resubmit(project.id, pdfFile, notes.trim())

    if (res.success) {
      setDone(true)
      toast.success(isRevision ? 'Revision submitted successfully!' : 'Project resubmitted!')
      onSuccess(res.data)
    } else {
      toast.error(res.error ?? 'Submission failed. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-[500px] mx-auto bg-white dark:bg-[#101010] z-50 rounded-2xl border border-[#C9D0DA] dark:border-[#1C1C1C] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#C9D0DA] dark:border-[#1C1C1C]">
          <h2 className="text-[16px] text-[#0A0A0A] dark:text-[#F5F5F5]" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
            {title}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#F0F2F5] dark:hover:bg-[#181818] text-[#6B7280]">
            <X size={16} />
          </button>
        </div>

        {done ? (
          /* Success state */
          <div className="px-6 py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-[#EBF2FF] flex items-center justify-center mx-auto mb-4">
              <Check size={24} className="text-[#0066FF]" weight="bold" />
            </div>
            <h3 className="text-[16px] text-[#0A0A0A] dark:text-[#F5F5F5] mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
              {isRevision ? 'Revision Submitted' : 'Project Resubmitted'}
            </h3>
            <p className="text-[13px] text-[#6B7280] mb-6" style={{ fontFamily: 'var(--font-body)', lineHeight: 1.65 }}>
              {isRevision
                ? 'Your supervisor has been notified and will review your changes.'
                : 'Your project is back in the review queue. Your supervisor will be notified.'}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-full text-[13px] text-white bg-[#0066FF] hover:bg-[#0052CC] transition-colors"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
              {/* Project context */}
              <div className="p-3 rounded-2xl bg-[#F4F6F9] dark:bg-[#181818] border border-[#C9D0DA] dark:border-[#1C1C1C]">
                <p className="text-[11px] text-[#6B7280] mb-0.5" style={{ fontFamily: 'var(--font-body)' }}>Project</p>
                <p className="text-[13px] text-[#0A0A0A] dark:text-[#F5F5F5] line-clamp-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                  {project.title}
                </p>
              </div>

              {/* Info */}
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#0066FF0D] border border-[#0066FF26]">
                <WarningCircle size={14} className="text-[#0066FF] flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-[#0066FF]" style={{ fontFamily: 'var(--font-body)' }}>
                  {desc}
                </p>
              </div>

              {/* PDF upload */}
              <div>
                <p className="text-[12px] text-[#374151] dark:text-[#8B8FA8] uppercase tracking-wider mb-2" style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                  Updated PDF <span className="text-red-500">*</span>
                </p>
                <DropZone file={pdfFile} onFile={setPdfFile} />
              </div>

              {/* Notes */}
              <div>
                <label className="text-[12px] text-[#374151] dark:text-[#8B8FA8] uppercase tracking-wider mb-2 block" style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                  {isRevision ? 'What did you change?' : 'Notes (optional)'}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder={isRevision
                    ? 'Briefly describe what you revised and how you addressed the feedback...'
                    : 'Any additional context for your supervisor...'}
                  className="w-full rounded-2xl border border-[#C9D0DA] dark:border-[#1C1C1C] bg-white dark:bg-[#181818] px-4 py-3 text-[13px] text-[#0A0A0A] dark:text-[#F5F5F5] placeholder-[#6B7280] outline-none resize-none focus:border-[#0066FF] focus:shadow-[0_0_0_3px_rgba(0,102,255,0.12)] transition-all"
                  style={{ fontFamily: 'var(--font-body)' }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#C9D0DA] dark:border-[#1C1C1C] flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-full text-[13px] border border-[#C9D0DA] dark:border-[#1C1C1C] text-[#374151] hover:border-[#0066FF] hover:text-[#0066FF] transition-colors"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
              >
                Cancel
              </button>
              <button
                onClick={() => void handleSubmit()}
                disabled={submitting || !pdfFile}
                className="flex-1 py-2.5 rounded-full text-[13px] text-white bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
              >
                {submitting
                  ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Submitting...</>
                  : title}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
