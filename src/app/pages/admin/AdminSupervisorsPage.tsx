import React, { useEffect, useState } from 'react'
import { adminApi } from '../../../lib/api'
import type { AdminUserRow } from '../../../lib/types'
import { getAvatarColor, getInitials, relativeTime } from '../../../lib/utils'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'motion/react'
import { X, WarningCircle } from 'phosphor-react'
import { SkeletonTableRow } from '../../components/SkeletonPrimitives'

// ─── Reject-reason modal ──────────────────────────────────────────────────────

function RejectModal({
  supervisor,
  onClose,
  onConfirm,
}: {
  supervisor: AdminUserRow
  onClose: () => void
  onConfirm: (id: string, reason: string) => Promise<void>
}) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (!reason.trim() || reason.trim().length < 10) {
      toast.error('Please provide a rejection reason (min. 10 characters).')
      return
    }
    setLoading(true)
    await onConfirm(supervisor.id, reason.trim())
    setLoading(false)
  }

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-50"
        onClick={onClose}
      />
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto bg-white dark:bg-[#101010] rounded-2xl border border-[#E5E7EB] dark:border-[#1C1C1C] shadow-2xl z-50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
              <WarningCircle size={18} className="text-red-500" />
            </div>
            <div>
              <h2
                className="text-[15px] text-[#0A0A0A] dark:text-[#F5F5F5] mb-0.5"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
              >
                Reject Supervisor Account
              </h2>
              <p
                className="text-[12px] text-[#9CA3AF]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {supervisor.full_name ?? supervisor.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#F0F2F5] dark:hover:bg-[#181818] text-[#9CA3AF] flex-shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-2">
          <p
            className="text-[13px] text-[#5C6370] dark:text-[#8B8FA8] mb-3"
            style={{ fontFamily: 'var(--font-body)', lineHeight: 1.65 }}
          >
            This will mark the account as <strong>restricted</strong> and prevent the supervisor from
            accessing the platform. Please provide a reason that will be logged against the account.
          </p>
          <label
            className="text-[11px] uppercase tracking-wider text-[#9CA3AF] block mb-1.5"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
          >
            Rejection reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. Staff ID could not be verified with the registry..."
            className="w-full rounded-2xl border border-[#E5E7EB] dark:border-[#1C1C1C] bg-[#F7F8FA] dark:bg-[#181818] px-3 py-2.5 text-[13px] text-[#0A0A0A] dark:text-[#F5F5F5] placeholder-[#9CA3AF] outline-none resize-none focus:border-[#0066FF] focus:shadow-[0_0_0_2px_rgba(0,102,255,0.12)] transition-all"
            style={{ fontFamily: 'var(--font-body)' }}
          />
          <span
            className={`block text-right text-[11px] mt-0.5 ${reason.length < 10 ? 'text-[#9CA3AF]' : 'text-[#0066FF]'}`}
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {reason.length}/10 min
          </span>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full text-[13px] border border-[#E5E7EB] dark:border-[#1C1C1C] text-[#5C6370] hover:border-[#0066FF] hover:text-[#0066FF] transition-colors"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
          >
            Cancel
          </button>
          <button
            onClick={() => void handleConfirm()}
            disabled={loading}
            className="flex-1 py-2.5 rounded-full text-[13px] text-white bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              'Reject Account'
            )}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AdminSupervisorsPage() {
  const [supervisors, setSupervisors] = useState<AdminUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectTarget, setRejectTarget] = useState<AdminUserRow | null>(null)

  useEffect(() => {
    adminApi.users({ role: 'supervisor' }).then((res) => {
      if (res.success) setSupervisors(res.data)
      setLoading(false)
    })
  }, [])

  const pending = supervisors.filter((s) => !s.is_verified)
  const verified = supervisors.filter((s) => s.is_verified)

  const handleVerify = async (id: string) => {
    const res = await adminApi.verifyUser(id)
    if (res.success) {
      setSupervisors((prev) => prev.map((s) => (s.id === id ? { ...s, is_verified: true } : s)))
      toast.success('Supervisor verified successfully!')
    } else {
      toast.error(res.error ?? 'Verification failed.')
    }
  }

  const handleReject = async (id: string, reason: string) => {
    const res = await adminApi.updateUserStatus(id, 'restricted', reason)
    if (res.success) {
      setSupervisors((prev) => prev.filter((s) => s.id !== id))
      setRejectTarget(null)
      toast.success('Supervisor account rejected and restricted.')
    } else {
      toast.error(res.error ?? 'Rejection failed.')
    }
  }

  const Section = ({
    title,
    items,
    showActions,
  }: {
    title: string
    items: AdminUserRow[]
    showActions: boolean
  }) => (
    <div className="mb-8">
      <h2
        className="text-[16px] text-[#0A0A0A] dark:text-[#F5F5F5] mb-4"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
      >
        {title} ({items.length})
      </h2>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E5E7EB] dark:border-[#1C1C1C] py-10 text-center">
          <p className="text-[14px] text-[#9CA3AF]" style={{ fontFamily: 'var(--font-body)' }}>
            None
          </p>
        </div>
      ) : (
        <div
          className="rounded-2xl bg-white dark:bg-[#101010] border border-[#E5E7EB] dark:border-[#1C1C1C] overflow-hidden"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          {items.map((s, i) => {
            const bg = getAvatarColor(s.id)
            const initials = getInitials(s.full_name ?? s.display_name)
            return (
              <div
                key={s.id}
                className={`flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 ${i > 0 ? 'border-t border-[#E5E7EB] dark:border-[#1C1C1C]' : ''}`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] flex-shrink-0"
                    style={{ backgroundColor: bg, fontFamily: 'var(--font-display)', fontWeight: 700 }}
                  >
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[13px] font-semibold text-[#0A0A0A] dark:text-[#F5F5F5]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {s.full_name ?? s.display_name ?? '—'}
                    </p>
                    <p className="text-[12px] text-[#9CA3AF]" style={{ fontFamily: 'var(--font-body)' }}>
                      {s.email}
                    </p>
                    {s.degrees && (
                      <p
                        className="text-[11px] text-[#9CA3AF] mt-0.5 truncate"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        {s.degrees}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Date */}
                  <span
                    className="text-[12px] text-[#9CA3AF] hidden md:block flex-shrink-0"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {relativeTime(s.created_at)}
                  </span>

                  {/* Actions */}
                  {showActions ? (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => void handleVerify(s.id)}
                        className="px-3 py-1.5 rounded-full text-[12px] bg-[#0066FF] text-white hover:bg-[#0052CC] transition-colors"
                        style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectTarget(s)}
                        className="px-3 py-1.5 rounded-full text-[12px] bg-transparent border border-[#0066FF] text-[#0066FF] hover:bg-[#0066FF10] transition-colors"
                        style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span
                      className="px-2.5 py-1 rounded-full text-[11px] bg-[#0066FF1A] text-[#0066FF] flex-shrink-0"
                      style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
                    >
                      Verified
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <div>
      <div className="mb-6">
        <h1
          className="text-[#0A0A0A] dark:text-[#F5F5F5] mb-1"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '22px',
            letterSpacing: '-0.02em',
          }}
        >
          Supervisors
        </h1>
        <p className="text-[14px] text-[#9CA3AF]" style={{ fontFamily: 'var(--font-body)' }}>
          {pending.length} pending verification · {verified.length} verified
        </p>
      </div>

      {loading ? (
        <div>
          {[1, 2, 3].map((i) => (
            <SkeletonTableRow key={i} />
          ))}
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <Section title="Pending Verification" items={pending} showActions={true} />
          )}
          <Section title="Verified Supervisors" items={verified} showActions={false} />
        </>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          supervisor={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleReject}
        />
      )}
    </div>
  )
}
