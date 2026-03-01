import React from 'react'
import type { ProjectStatus } from '../../lib/types'

const STATUS_MAP: Record<ProjectStatus, { label: string; bg: string; text: string }> = {
  pending:           { label: 'Pending Review',     bg: '#FFFBEB', text: '#D97706' },
  approved:          { label: 'Approved',           bg: '#F0FDF4', text: '#16A34A' },
  changes_requested: { label: 'Changes Requested',  bg: '#FFF7ED', text: '#EA580C' },
  rejected:          { label: 'Rejected',           bg: '#FEF2F2', text: '#DC2626' },
}

interface StatusBadgeProps {
  status: ProjectStatus
  small?: boolean
  className?: string
}

export function StatusBadge({ status, small = false, className = '' }: StatusBadgeProps) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.pending
  return (
    <span
      className={`rounded-full ${small ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'} font-medium ${className}`}
      style={{ backgroundColor: s.bg, color: s.text, fontFamily: 'var(--font-body)' }}
    >
      {s.label}
    </span>
  )
}
