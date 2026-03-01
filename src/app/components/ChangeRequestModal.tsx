/**
 * ChangeRequestModal
 * Allows a student to submit a change request for their approved project.
 * Collects the new proposed values per field + an optional new PDF + reason,
 * then POSTs a FormData payload to POST /api/projects/[id]/change-request.
 */
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, GitDiff, WarningCircle, Check, FilePdf, UploadSimple } from 'phosphor-react'
import { toast } from 'sonner'
import { projectsApi } from '../../lib/api'
import type { Project } from '../../lib/types'

interface ChangeRequestModalProps {
  project: Project
  onClose: () => void
  onSuccess?: () => void
}

const CHANGEABLE_FIELDS = [
  { key: 'title', label: 'Project Title', type: 'text', placeholder: 'Enter the corrected title', description: 'Fix a typo or clarify the title' },
  { key: 'abstract', label: 'Abstract', type: 'textarea', placeholder: 'Enter the updated abstract text...', description: 'Update or clarify the abstract' },
  { key: 'student_tags', label: 'Tags / Keywords', type: 'text', placeholder: 'tag1, tag2, tag3 (comma-separated)', description: 'Add, remove, or update research tags' },
  { key: 'github_url', label: 'GitHub URL', type: 'url', placeholder: 'https://github.com/your-repo', description: 'Update or add a GitHub repository link' },
  { key: 'live_url', label: 'Live Demo URL', type: 'url', placeholder: 'https://your-demo.com', description: 'Update or add a live demo link' },
] as const

type FieldKey = typeof CHANGEABLE_FIELDS[number]['key']

function getCurrentValue(project: Project, key: FieldKey): string {
  switch (key) {
    case 'title': return project.title ?? ''
    case 'abstract': return project.abstract ?? ''
    case 'student_tags': return (project.student_tags || []).join(', ')
    case 'github_url': return project.github_url ?? ''
    case 'live_url': return project.live_url ?? ''
  }
}

function PdfDropZone({ file, onFile }: { file: File | null; onFile: (f: File | null) => void }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]; if (f) onFile(f)
  }

  if (file) {
    return (
      <div className="rounded-2xl border border-[#0066FF] bg-[#0066FF08] p-3 flex items-center gap-3">
        <FilePdf size={20} className="text-[#0066FF] flex-shrink-0" />
        <p className="text-[12px] text-[#0A0A0A] dark:text-[#F5F5F5] flex-1 truncate" style={{ fontFamily: 'var(--font-body)' }}>{file.name}</p>
        <button onClick={() => onFile(null)} className="p-1 rounded-full hover:bg-[#F0F2F5] dark:hover:bg-[#181818]"><X size={12} className="text-[#6B7280]" /></button>
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl border-2 border-dashed p-5 text-center cursor-pointer transition-all duration-150 ${dragging ? 'border-[#0066FF] bg-[#0066FF08]' : 'border-[#C9D0DA] dark:border-[#1C1C1C] hover:border-[#0066FF]'}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <UploadSimple size={22} className={`mx-auto mb-1 ${dragging ? 'text-[#0066FF]' : 'text-[#6B7280]'}`} />
      <p className="text-[12px] text-[#374151] dark:text-[#8B8FA8]" style={{ fontFamily: 'var(--font-body)' }}>Drop updated PDF or click to browse</p>
      <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
    </div>
  )
}

export function ChangeRequestModal({ project, onClose, onSuccess }: ChangeRequestModalProps) {
  const [selectedFields, setSelectedFields] = useState<FieldKey[]>([])
  const [proposedValues, setProposedValues] = useState<Partial<Record<FieldKey, string>>>({})
  const [newPdf, setNewPdf] = useState<File | null>(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const toggleField = (key: FieldKey) => {
    setSelectedFields((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    )
  }

  const setProposed = (key: FieldKey, value: string) => {
    setProposedValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    if (selectedFields.length === 0) {
      toast.error('Select at least one field to change.')
      return
    }
    if (!reason.trim() || reason.trim().length < 20) {
      toast.error('Please provide a reason (min. 20 characters).')
      return
    }
    for (const key of selectedFields) {
      if (!proposedValues[key]?.trim()) {
        toast.error(`Please enter the new value for "${CHANGEABLE_FIELDS.find(f => f.key === key)?.label}".`)
        return
      }
    }

    setSubmitting(true)

    // Build the proposed_data object from selected fields
    const proposedData: Record<string, unknown> = {}
    for (const key of selectedFields) {
      const val = proposedValues[key]?.trim() ?? ''
      if (key === 'student_tags') {
        proposedData[key] = val.split(',').map((t) => t.trim()).filter(Boolean)
      } else {
        proposedData[key] = val
      }
    }

    const formData = new FormData()
    formData.append('fields', JSON.stringify(selectedFields))
    formData.append('reason', reason.trim())
    formData.append('proposedData', JSON.stringify(proposedData))
    if (newPdf) formData.append('reportFile', newPdf)

    const res = await projectsApi.requestChange(project.id, formData)
    if (res.success) {
      setSubmitted(true)
      toast.success('Change request submitted. Your supervisor will review it.')
      onSuccess?.()
    } else {
      toast.error(res.error ?? 'Failed to submit change request.')
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto bg-white dark:bg-[#101010] z-50 rounded-2xl shadow-2xl border border-[#C9D0DA] dark:border-[#1C1C1C] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#C9D0DA] dark:border-[#1C1C1C]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0066FF1A] flex items-center justify-center">
              <GitDiff size={16} className="text-[#0066FF]" />
            </div>
            <h2 className="text-[16px] text-[#0A0A0A] dark:text-[#F5F5F5]" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
              Request Changes
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#F0F2F5] dark:hover:bg-[#181818] text-[#6B7280]">
            <X size={16} />
          </button>
        </div>

        {submitted ? (
          <div className="px-6 py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-[#EBF2FF] flex items-center justify-center mx-auto mb-4">
              <Check size={24} className="text-[#0066FF]" weight="bold" />
            </div>
            <h3 className="text-[16px] text-[#0A0A0A] dark:text-[#F5F5F5] mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
              Request Submitted
            </h3>
            <p className="text-[13px] text-[#6B7280] mb-6" style={{ fontFamily: 'var(--font-body)', lineHeight: 1.65 }}>
              Your supervisor will review and approve or deny the request. You'll be notified once a decision is made.
            </p>
            <button onClick={onClose} className="px-6 py-2.5 rounded-full text-[13px] text-white bg-[#0066FF] hover:bg-[#0052CC] transition-colors" style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
              {/* Project context */}
              <div className="p-3 rounded-2xl bg-[#F4F6F9] dark:bg-[#181818] border border-[#C9D0DA] dark:border-[#1C1C1C]">
                <p className="text-[11px] text-[#6B7280] mb-0.5" style={{ fontFamily: 'var(--font-body)' }}>Project</p>
                <p className="text-[13px] text-[#0A0A0A] dark:text-[#F5F5F5] line-clamp-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{project.title}</p>
              </div>

              {/* Info banner */}
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#0066FF0D] border border-[#0066FF26]">
                <WarningCircle size={14} className="text-[#0066FF] flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-[#0066FF]" style={{ fontFamily: 'var(--font-body)' }}>
                  Select each field you want to change, then provide the new value below it. PDF replacement is optional.
                </p>
              </div>

              {/* Field selection + inline new-value inputs */}
              <div>
                <p className="text-[12px] text-[#374151] dark:text-[#8B8FA8] uppercase tracking-wider mb-3" style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                  What needs to change?
                </p>
                <div className="space-y-2">
                  {CHANGEABLE_FIELDS.map((field) => {
                    const isSelected = selectedFields.includes(field.key)
                    const currentVal = getCurrentValue(project, field.key)
                    return (
                      <div key={field.key} className={`rounded-2xl border transition-all duration-150 overflow-hidden ${isSelected ? 'border-[#0066FF]' : 'border-[#C9D0DA] dark:border-[#1C1C1C]'}`}>
                        {/* Toggle row */}
                        <button
                          onClick={() => toggleField(field.key)}
                          className={`w-full flex items-start gap-3 p-3 text-left ${isSelected ? 'bg-[#0066FF08]' : 'hover:bg-[#F4F6F9] dark:hover:bg-[#181818]'}`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${isSelected ? 'border-[#0066FF] bg-[#0066FF]' : 'border-[#C9D0DA] dark:border-[#1C1C1C]'}`}>
                            {isSelected && <Check size={10} weight="bold" className="text-white" />}
                          </div>
                          <div>
                            <p className={`text-[13px] ${isSelected ? 'text-[#0066FF]' : 'text-[#0A0A0A] dark:text-[#F5F5F5]'}`} style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                              {field.label}
                            </p>
                            <p className="text-[11px] text-[#6B7280]" style={{ fontFamily: 'var(--font-body)' }}>{field.description}</p>
                          </div>
                        </button>

                        {/* Expanded: current → new value */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.18 }}
                              className="overflow-hidden"
                            >
                              <div className="px-3 pb-3 space-y-2">
                                {/* Current value (read-only context) */}
                                {currentVal && (
                                  <div className="rounded-xl bg-[#F4F6F9] dark:bg-[#181818] px-3 py-2">
                                    <p className="text-[10px] text-[#6B7280] mb-0.5 uppercase tracking-wide" style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}>Current</p>
                                    <p className="text-[12px] text-[#374151] dark:text-[#8B8FA8] line-clamp-2" style={{ fontFamily: 'var(--font-body)' }}>{currentVal}</p>
                                  </div>
                                )}
                                {/* New value input */}
                                <div className="rounded-xl border border-[#C9D0DA] dark:border-[#1C1C1C] focus-within:border-[#0066FF] transition-colors bg-white dark:bg-[#101010]">
                                  <p className="px-3 pt-2 text-[10px] text-[#6B7280] uppercase tracking-wide" style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}>New value</p>
                                  {field.type === 'textarea' ? (
                                    <textarea
                                      rows={3}
                                      value={proposedValues[field.key] ?? ''}
                                      onChange={(e) => setProposed(field.key, e.target.value)}
                                      placeholder={field.placeholder}
                                      className="w-full bg-transparent outline-none px-3 pb-2 pt-1 text-[12px] text-[#0A0A0A] dark:text-[#F5F5F5] placeholder-[#6B7280] resize-none"
                                      style={{ fontFamily: 'var(--font-body)' }}
                                    />
                                  ) : (
                                    <input
                                      type={field.type}
                                      value={proposedValues[field.key] ?? ''}
                                      onChange={(e) => setProposed(field.key, e.target.value)}
                                      placeholder={field.placeholder}
                                      className="w-full bg-transparent outline-none px-3 pb-2 pt-1 text-[12px] text-[#0A0A0A] dark:text-[#F5F5F5] placeholder-[#6B7280]"
                                      style={{ fontFamily: 'var(--font-body)' }}
                                    />
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Optional PDF replacement */}
              <div>
                <p className="text-[12px] text-[#374151] dark:text-[#8B8FA8] uppercase tracking-wider mb-2" style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                  Replace PDF Report (optional)
                </p>
                <PdfDropZone file={newPdf} onFile={setNewPdf} />
              </div>

              {/* Reason */}
              <div>
                <label className="text-[12px] text-[#374151] dark:text-[#8B8FA8] uppercase tracking-wider mb-2 block" style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                  Reason for Request <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-2xl border border-[#C9D0DA] dark:border-[#1C1C1C] bg-white dark:bg-[#101010] focus-within:border-[#0066FF] transition-colors">
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder="Explain clearly what needs to change and why (min. 20 characters)..."
                    className="w-full bg-transparent outline-none px-4 py-3 text-[13px] text-[#0A0A0A] dark:text-[#F5F5F5] placeholder-[#6B7280] resize-none"
                    style={{ fontFamily: 'var(--font-body)' }}
                  />
                  <span className={`absolute bottom-2.5 right-3 text-[11px] ${reason.length < 20 ? 'text-[#6B7280]' : 'text-[#0066FF]'}`} style={{ fontFamily: 'var(--font-body)' }}>
                    {reason.length}/20 min
                  </span>
                </div>
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
                disabled={submitting || selectedFields.length === 0}
                className="flex-1 py-2.5 rounded-full text-[13px] text-white bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
              >
                {submitting ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : 'Submit Request'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
