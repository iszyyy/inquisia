import React, { useEffect, useState } from 'react'
import { MagnifyingGlass, X } from 'phosphor-react'
import { adminApi } from '../../../lib/api'
import type { AdminUserRow } from '../../../lib/types'
import { getAvatarColor, getInitials, relativeTime } from '../../../lib/utils'
import { SkeletonTableRow } from '../../components/SkeletonPrimitives'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: '#EBF2FF', text: '#0066FF' },
  warned: { bg: '#EBF2FF', text: '#0066FF' },
  restricted: { bg: '#EBF2FF', text: '#0066FF' },
  banned: { bg: '#EBF2FF', text: '#0066FF' },
}

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  student: { bg: '#EBF2FF', text: '#0066FF' },
  supervisor: { bg: '#EBF2FF', text: '#0066FF' },
  admin: { bg: '#EBF2FF', text: '#0066FF' },
  public: { bg: '#EBF2FF', text: '#0066FF' },
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  useEffect(() => {
    adminApi.users({ query: query || undefined, role: roleFilter || undefined }).then((res) => {
      if (res.success) setUsers(res.data)
      else toast.error(`Failed to load users: ${res.error}`)
      setLoading(false)
    })
  }, [query, roleFilter])

  const handleAction = async (userId: string, action: string) => {
    const statusMap: Record<string, string> = { warn: 'warned', restrict: 'restricted', ban: 'banned' }
    const status = statusMap[action] ?? 'warned'
    const res = await adminApi.updateUserStatus(userId, status, `Action: ${action}`)
    if (res.success) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, account_status: status as AdminUserRow['account_status'] } : u))
      toast.success(`User ${action}ned successfully`)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[#0A0A0A] dark:text-[#F5F5F5] mb-1"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '22px', letterSpacing: '-0.02em' }}>
          Users
        </h1>
        <p className="text-[14px] text-[#9CA3AF]" style={{ fontFamily: 'var(--font-body)' }}>{users.length} users total</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 flex items-center gap-2 bg-white dark:bg-[#101010] rounded-full border border-[#E5E7EB] dark:border-[#1C1C1C] px-4 py-2.5">
          <MagnifyingGlass size={16} className="text-[#9CA3AF]" />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="flex-1 bg-transparent outline-none text-[14px] text-[#0A0A0A] dark:text-[#F5F5F5] placeholder-[#9CA3AF]"
            style={{ fontFamily: 'var(--font-body)' }} />
          {query && <button onClick={() => setQuery('')}><X size={13} className="text-[#9CA3AF]" /></button>}
        </div>
        <div className="flex flex-wrap gap-1">
          {['', 'student', 'supervisor', 'admin'].map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-full text-[12px] transition-colors ${roleFilter === r ? 'bg-[#0066FF] text-white' : 'bg-white dark:bg-[#101010] border border-[#E5E7EB] dark:border-[#1C1C1C] text-[#5C6370] hover:border-[#0066FF] hover:text-[#0066FF]'}`}
              style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>
              {r ? r.charAt(0).toUpperCase() + r.slice(1) : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-[#101010] border border-[#E5E7EB] dark:border-[#1C1C1C] overflow-hidden"
        style={{ boxShadow: 'var(--shadow-card)' }}>
        {loading ? (
          <div>{[1, 2, 3, 4].map((i) => <SkeletonTableRow key={i} />)}</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[14px] text-[#9CA3AF]" style={{ fontFamily: 'var(--font-body)' }}>No users found.</p>
          </div>
        ) : (
          <div>
            {users.map((user, i) => {
              const roleStyle = ROLE_COLORS[user.role] ?? ROLE_COLORS.public
              const statusStyle = STATUS_COLORS[user.account_status] ?? STATUS_COLORS.active
              const bg = getAvatarColor(user.id)
              const initials = getInitials(user.full_name ?? user.display_name)
              return (
                <div key={user.id}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-[#0066FF08] transition-colors group ${i > 0 ? 'border-t border-[#E5E7EB] dark:border-[#1C1C1C]' : ''}`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] flex-shrink-0"
                      style={{ backgroundColor: bg, fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#0A0A0A] dark:text-[#F5F5F5] truncate" style={{ fontFamily: 'var(--font-display)' }}>
                        {user.display_name ?? user.full_name ?? '—'}
                      </p>
                      <p className="text-[12px] text-[#9CA3AF] truncate" style={{ fontFamily: 'var(--font-body)' }}>{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ backgroundColor: roleStyle.bg, color: roleStyle.text, fontFamily: 'var(--font-body)' }}>
                      {user.role}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ backgroundColor: statusStyle.bg, color: statusStyle.text, fontFamily: 'var(--font-body)' }}>
                      {user.account_status}
                    </span>
                    <span className="text-[12px] text-[#9CA3AF] hidden md:block flex-shrink-0" style={{ fontFamily: 'var(--font-body)' }}>
                      {relativeTime(user.created_at)}
                    </span>
                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      {user.account_status === 'active' && (
                        <>
                          <button onClick={() => void handleAction(user.id, 'warn')}
                            className="px-2.5 py-1 rounded-full text-[11px] border border-[#0066FF] text-[#0066FF] hover:bg-[#0066FF10] transition-colors"
                            style={{ fontFamily: 'var(--font-body)' }}>Warn</button>
                          <button onClick={() => void handleAction(user.id, 'ban')}
                            className="px-2.5 py-1 rounded-full text-[11px] border border-[#0066FF] text-[#0066FF] hover:bg-[#0066FF10] transition-colors"
                            style={{ fontFamily: 'var(--font-body)' }}>Ban</button>
                        </>
                      )}
                      {user.account_status !== 'active' && (
                        <button onClick={async () => {
                          const res = await adminApi.updateUserStatus(user.id, 'active', 'Reinstated')
                          if (res.success) setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, account_status: 'active' } : u))
                        }}
                          className="px-2.5 py-1 rounded-full text-[11px] bg-[#0066FF] text-white hover:bg-[#0052CC] transition-colors"
                          style={{ fontFamily: 'var(--font-body)' }}>Reinstate</button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
