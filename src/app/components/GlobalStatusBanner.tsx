/**
 * GlobalStatusBanner
 * Renders a persistent, non-dismissible top-of-page banner when the
 * authenticated user has a 'warned' or 'restricted' account status.
 * Reads directly from SessionContext — no props required.
 */
import React from 'react'
import { WarningCircle, ProhibitInset, Link as LinkIcon } from 'phosphor-react'
import { Link } from 'react-router'
import { useSession } from '../../context/SessionContext'

export function GlobalStatusBanner() {
  const { user } = useSession()

  if (!user || user.account_status === 'active' || user.account_status === 'banned') return null

  const isWarned = user.account_status === 'warned'
  const isRestricted = user.account_status === 'restricted'

  if (!isWarned && !isRestricted) return null

  const config = isWarned
    ? {
        bg: 'bg-[#FFFBEB] dark:bg-[#1C1200]',
        border: 'border-b border-[#FDE68A] dark:border-[#7C5E00]',
        icon: <WarningCircle size={16} weight="fill" className="text-[#D97706] flex-shrink-0" />,
        iconBg: 'bg-[#FEF3C7] dark:bg-[#7C5E0020]',
        pill: 'bg-[#FEF3C7] text-[#D97706] dark:bg-[#7C5E0040] dark:text-[#FCD34D]',
        pillLabel: 'Account Warning',
        headingColor: 'text-[#92400E] dark:text-[#FCD34D]',
        bodyColor: 'text-[#92400E]/80 dark:text-[#FCD34D]/70',
        message: user.status_reason
          ? user.status_reason
          : 'Your account has received a formal warning. You can still browse, submit projects, and post comments. Continued violations of the community guidelines may result in restrictions on your account.',
        blockedActions: null,
      }
    : {
        bg: 'bg-[#FEF2F2] dark:bg-[#1C0000]',
        border: 'border-b border-[#FECACA] dark:border-[#7F1D1D]',
        icon: <ProhibitInset size={16} weight="fill" className="text-[#DC2626] flex-shrink-0" />,
        iconBg: 'bg-[#FEE2E2] dark:bg-[#7F1D1D20]',
        pill: 'bg-[#FEE2E2] text-[#DC2626] dark:bg-[#7F1D1D40] dark:text-[#FCA5A5]',
        pillLabel: 'Account Restricted',
        headingColor: 'text-[#991B1B] dark:text-[#FCA5A5]',
        bodyColor: 'text-[#991B1B]/80 dark:text-[#FCA5A5]/70',
        message: user.status_reason
          ? user.status_reason
          : 'Your account has been restricted. You cannot submit new projects, post comments, request changes, or upload revisions. Read-only access to the repository is still available.',
        blockedActions: ['Submit projects', 'Post comments', 'Request changes', 'Upload revisions'],
      }

  return (
    <div
      role="alert"
      className={`${config.bg} ${config.border} w-full`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3">
        <div className="flex items-start gap-3">
          {/* Icon badge */}
          <div className={`w-7 h-7 rounded-full ${config.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
            {config.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] ${config.pill}`}
                style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
              >
                {config.pillLabel}
              </span>
            </div>

            <p
              className={`text-[13px] leading-relaxed ${config.bodyColor}`}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {config.message}
              {isRestricted && config.blockedActions && (
                <span className="ml-1">
                  Blocked actions:{' '}
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                    {config.blockedActions.join(' · ')}
                  </span>
                  .
                </span>
              )}
              {' '}
              <Link
                to="/settings"
                className="underline underline-offset-2 hover:opacity-70 transition-opacity inline-flex items-center gap-1"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
              >
                Contact support <LinkIcon size={11} />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
