/**
 * ChangeRequestReviewPanel
 * Allows a supervisor to review a student's pending change request.
 * Shows a side-by-side "Current vs Proposed" diff for every requested field,
 * then provides Approve / Deny controls with a mandatory feedback textarea
 * for denials.
 */
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  GitDiff,
  CheckCircle,
  XCircle,
  CaretDown,
  CaretUp,
  User,
  CalendarBlank,
  ArrowRight,
  Tag,
} from 'phosphor-react'
import { toast } from 'sonner'
import { supervisorApi } from '../../lib/api'
import type { ChangeRequest, Project } from '../../lib/types'
import { relativeTime } from '../../lib/utils'

// ─── Field meta ───────────────────────────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  title: 'Project Title',
  abstract: 'Abstract',
  student_tags: 'Tags / Keywords',
  github_url: 'GitHub URL',
  live_url: 'Live Demo URL',
}

function getCurrentValue(project: Project, field: string): string {
  switch (field) {
    case 'title': return project.title ?? ''
    case 'abstract': return project.abstract ?? ''
    case 'student_tags': return (project.student_tags || []).join(', ')
    case 'github_url': return project.github_url ?? '—'
    case 'live_url': return project.live_url ?? '—'
    default: return '—'
  }
}

function getProposedValue(cr: ChangeRequest, field: string): string {
  const val = cr.proposed_data[field]
  if (Array.isArray(val)) return val.join(', ')
  if (typeof val === 'string') return val
  return '—'
}

// ─── Single field diff row ────────────────────────────────────────────────────

function FieldDiffRow({ field, current, proposed }: { field: string; current: string; proposed: string }) {
  const label = FIELD_LABELS[field] ?? field
  const isLong = current.length > 120 || proposed.length > 120
  const isTag = field === 'student_tags'

  const TagPills = ({ value }: { value: string }) => (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {value.split(',').map((t) => t.trim()).filter(Boolean).map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-[#EBF2FF] text-[#0052CC] dark:bg-[#0066FF20] dark:text-[#60A5FA]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          <Tag size={9} /> {tag}
        </span>
      ))}
    </div>
  )

  return (
    <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#1C1C1C] overflow-hidden">
      {/* Field header */}
      <div className="px-4 py-2.5 bg-[#F7F8FA] dark:bg-[#181818] border-b border-[#E5E7EB] dark:border-[#1C1C1C] flex items-center gap-2">
        <GitDiff size={13} className="text-[#0066FF]" />
        <span
          className="text-[12px] text-[#374151] dark:text-[#8B8FA8]"
          style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
        >
          {label}
        </span>
      </div>

      {/* Diff columns */}
      <div className={`grid ${isLong ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-[1fr_auto_1fr]'} gap-0`}>
        {/* Current */}
        <div className="p-3 bg-[#FFFBF0] dark:bg-[#1A1600] border-b sm:border-b-0 sm:border-r border-[#E5E7EB] dark:border-[#1C1C1C]">
          <p
            className="text-[10px] uppercase tracking-wider text-[#D97706] mb-1"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
          >
            Current
          </p>
          {isTag ? (
            <TagPills value={current} />
          ) : (
            <p
              className={`text-[12px] text-[#5C6370] dark:text-[#8B8FA8] leading-relaxed ${isLong ? 'line-clamp-4' : ''}`}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {current || '—'}
            </p>
          )}
        </div>

        {/* Arrow (horizontal layout only) */}
        {!isLong && (
          <div className="hidden sm:flex items-center justify-center px-2 bg-[#F7F8FA] dark:bg-[#181818]">
            <ArrowRight size={14} className="text-[#9CA3AF]" />
          </div>
        )}

        {/* Proposed */}
        <div className="p-3 bg-[#F0FDF4] dark:bg-[#001A0A] sm:border-l border-[#E5E7EB] dark:border-[#1C1C1C]">
          <p
            className="text-[10px] uppercase tracking-wider text-[#16A34A] mb-1"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
          >
            Proposed
          </p>
          {isTag ? (
            <TagPills value={proposed} />
          ) : (
            <p
              className={`text-[12px] text-[#0A0A0A] dark:text-[#F5F5F5] leading-relaxed ${isLong ? 'line-clamp-6' : ''}`}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {proposed || '—'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ChangeRequestReviewPanelProps {
  changeRequest: ChangeRequest
  project: Project | undefined
  /** Called after a successful approve or deny so the parent can remove from queue */
  onResolved: (id: string) => void
}

export function ChangeRequestReviewPanel({
  changeRequest: cr,
  project,
  onResolved,
}: ChangeRequestReviewPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [action, setAction] = useState<'approve' | 'deny' | null>(null)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)

  const studentName =
    project?.authors.find((a) => a.id === cr.student_id)?.full_name ??
    project?.authors.find((a) => a.id === cr.student_id)?.display_name ??
    'Student'

  const handleResolve = async () => {
    if (!action) return
    if (action === 'deny' && !feedback.trim()) {
      toast.error('Please provide feedback explaining why the request is being denied.')
      return
    }
    setLoading(true)
    const res =
      action === 'approve'
        ? await supervisorApi.approveChangeRequest(cr.id, feedback.trim() || 'Approved.')
        : await supervisorApi.denyChangeRequest(cr.id, feedback.trim())

    if (res.success) {
      toast.success(action === 'approve' ? 'Change request approved!' : 'Change request denied.')
      onResolved(cr.id)
    } else {
      toast.error(res.error ?? 'Action failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div
      className="rounded-2xl bg-white dark:bg-[#101010] border border-[#E5E7EB] dark:border-[#1C1C1C] overflow-hidden"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* ── Header ── */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-[#F7F8FA] dark:hover:bg-[#181818] transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-[#0066FF1A] flex items-center justify-center flex-shrink-0 mt-0.5">
          <GitDiff size={16} className="text-[#0066FF]" />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-[14px] text-[#0A0A0A] dark:text-[#F5F5F5] truncate"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
          >
            {project?.title ?? `Project ${cr.project_id}`}
          </p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-[12px] text-[#9CA3AF]" style={{ fontFamily: 'var(--font-body)' }}>
              <User size={11} /> {studentName}
            </span>
            <span className="flex items-center gap-1 text-[12px] text-[#9CA3AF]" style={{ fontFamily: 'var(--font-body)' }}>
              <CalendarBlank size={11} /> {relativeTime(cr.created_at)}
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] bg-[#FEF3C7] dark:bg-[#7C5E0030] text-[#D97706] dark:text-[#FCD34D]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
            >
              {cr.fields.length} field{cr.fields.length !== 1 ? 's' : ''} requested
            </span>
          </div>
        </div>
        <div className="text-[#9CA3AF] flex-shrink-0 mt-1">
          {expanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
        </div>
      </button>

      {/* ── Expanded body ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#E5E7EB] dark:border-[#1C1C1C] px-5 pt-5 pb-5 space-y-5">

              {/* Reason */}
              <div className="rounded-2xl bg-[#0066FF08] dark:bg-[#0066FF0D] border border-[#0066FF26] p-4">
                <p
                  className="text-[11px] text-[#0066FF] uppercase tracking-wider mb-1.5"
                  style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                >
                  Student's reason
                </p>
                <p
                  className="text-[13px] text-[#374151] dark:text-[#D1D5DB] leading-relaxed"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {cr.reason}
                </p>
              </div>

              {/* Field diffs */}
              <div>
                <p
                  className="text-[11px] text-[#9CA3AF] uppercase tracking-wider mb-3"
                  style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                >
                  Proposed changes
                </p>
                <div className="space-y-3">
                  {cr.fields.map((field) => (
                    <FieldDiffRow
                      key={field}
                      field={field}
                      current={project ? getCurrentValue(project, field) : '—'}
                      proposed={getProposedValue(cr, field)}
                    />
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              {action === null && (
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button
                    onClick={() => setAction('approve')}
                    className="flex items-center gap-2 flex-1 justify-center py-2.5 rounded-full text-[13px] text-white bg-[#0066FF] hover:bg-[#0052CC] transition-colors"
                    style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
                  >
                    <CheckCircle size={15} weight="bold" />
                    Approve Changes
                  </button>
                  <button
                    onClick={() => setAction('deny')}
                    className="flex items-center gap-2 flex-1 justify-center py-2.5 rounded-full text-[13px] border border-[#E5E7EB] dark:border-[#1C1C1C] text-[#DC2626] hover:border-[#DC2626] transition-colors"
                    style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
                  >
                    <XCircle size={15} weight="bold" />
                    Deny Changes
                  </button>
                </div>
              )}

              {/* Confirm panel */}
              <AnimatePresence>
                {action !== null && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-1 space-y-3">
                      <div
                        className={`rounded-2xl p-3 text-[12px] flex items-center gap-2 ${action === 'approve'
                          ? 'bg-[#F0FDF4] dark:bg-[#001A0A] border border-[#BBF7D0] dark:border-[#166534] text-[#16A34A]'
                          : 'bg-[#FEF2F2] dark:bg-[#1C0000] border border-[#FECACA] dark:border-[#7F1D1D] text-[#DC2626]'
                          }`}
                        style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
                      >
                        {action === 'approve' ? (
                          <CheckCircle size={14} weight="bold" />
                        ) : (
                          <XCircle size={14} weight="bold" />
                        )}
                        {action === 'approve'
                          ? 'Approving will apply all proposed changes to the published project.'
                          : 'Denying will notify the student. Please provide a clear explanation.'}
                      </div>

                      {/* Feedback textarea */}
                      <div>
                        <label
                          className="text-[11px] uppercase tracking-wider text-[#9CA3AF] block mb-1.5"
                          style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                        >
                          {action === 'deny' ? 'Reason for denial *' : 'Optional message to student'}
                        </label>
                        <textarea
                          rows={3}
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder={
                            action === 'deny'
                              ? 'Explain why the changes cannot be approved...'
                              : 'Add a note for the student (optional)...'
                          }
                          className="w-full rounded-2xl border border-[#E5E7EB] dark:border-[#1C1C1C] bg-[#F7F8FA] dark:bg-[#181818] px-3 py-2.5 text-[13px] text-[#0A0A0A] dark:text-[#F5F5F5] placeholder-[#9CA3AF] outline-none resize-none focus:border-[#0066FF] focus:shadow-[0_0_0_2px_rgba(0,102,255,0.12)] transition-all"
                          style={{ fontFamily: 'var(--font-body)' }}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => { setAction(null); setFeedback('') }}
                          className="flex-1 py-2.5 rounded-full text-[13px] border border-[#E5E7EB] dark:border-[#1C1C1C] text-[#5C6370] hover:border-[#0066FF] hover:text-[#0066FF] transition-colors"
                          style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
                          disabled={loading}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => void handleResolve()}
                          disabled={loading}
                          className={`flex-1 py-2.5 rounded-full text-[13px] text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2 ${action === 'approve'
                            ? 'bg-[#0066FF] hover:bg-[#0052CC]'
                            : 'bg-[#DC2626] hover:bg-[#B91C1C]'
                            }`}
                          style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
                        >
                          {loading ? (
                            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          ) : action === 'approve' ? (
                            <><CheckCircle size={14} weight="bold" /> Confirm Approval</>
                          ) : (
                            <><XCircle size={14} weight="bold" /> Confirm Denial</>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
