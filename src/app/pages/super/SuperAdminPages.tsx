import React, { useEffect, useState, useCallback } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import {
  ShieldStar, Users, Flag, Sliders, ClipboardText,
  ChartBar, Activity, ArrowLeft, MagnifyingGlass, X,
  ToggleLeft, ToggleRight, CheckCircle, XCircle, Warning,
  Database, ArrowClockwise, Crown
} from 'phosphor-react'
import { useSession } from '../../../context/SessionContext'
import { apiFetch } from '../../../lib/api'
import { toast } from 'sonner'
import { getAvatarColor, getInitials, relativeTime } from '../../../lib/utils'

// ─── API helpers ──────────────────────────────────────────────────────────────

const superApi = {
  users: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiFetch<any>(`/api/super/users${qs}`)
  },
  updateRole: (id: string, role: string) =>
    apiFetch<any>(`/api/super/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  updateSuper: (id: string, is_super_admin: boolean) =>
    apiFetch<any>(`/api/super/users/${id}/super`, { method: 'PATCH', body: JSON.stringify({ is_super_admin }) }),
  deleteUser: (id: string) =>
    apiFetch<any>(`/api/super/users/${id}`, { method: 'DELETE' }),
  userActivity: (id: string) =>
    apiFetch<any>(`/api/super/users/${id}/activity`),
  flags: () => apiFetch<any>('/api/super/flags'),
  updateFlag: (key: string, enabled: boolean) =>
    apiFetch<any>(`/api/super/flags/${key}`, { method: 'PATCH', body: JSON.stringify({ enabled }) }),
  settings: () => apiFetch<any>('/api/super/settings'),
  updateSetting: (key: string, value: any) =>
    apiFetch<any>(`/api/super/settings/${key}`, { method: 'PATCH', body: JSON.stringify({ value }) }),
  auditLog: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiFetch<any>(`/api/super/audit/log${qs}`)
  },
  purgeSessions: () =>
    apiFetch<any>('/api/super/audit/purge-sessions', { method: 'POST' }),
  analyticsOverview: () => apiFetch<any>('/api/super/analytics/overview'),
  analyticsDepartments: () => apiFetch<any>('/api/super/analytics/departments'),
  health: () => apiFetch<any>('/api/super/monitor/health'),
}

// ─── Shared UI components ─────────────────────────────────────────────────────

const font = { fontFamily: 'var(--font-body)' }
const displayFont = { fontFamily: 'var(--font-display)' }

function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-[#0A0A0A] dark:text-[#F5F5F5] mb-1"
        style={{ ...displayFont, fontWeight: 700, fontSize: '22px', letterSpacing: '-0.02em' }}>
        {title}
      </h1>
      {subtitle && <p className="text-[14px] text-[#9CA3AF]" style={font}>{subtitle}</p>}
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white dark:bg-[#101010] border border-[#E5E7EB] dark:border-[#1C1C1C] ${className}`}
      style={{ boxShadow: 'var(--shadow-card)' }}>
      {children}
    </div>
  )
}

function Badge({ label, color = '#0066FF' }: { label: string; color?: string }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ backgroundColor: color + '1A', color, fontFamily: 'var(--font-body)', fontWeight: 600 }}>
      {label}
    </span>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: color + '1A' }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <span className="text-[12px] text-[#9CA3AF]" style={font}>{label}</span>
      </div>
      <p className="text-[28px] font-bold text-[#0A0A0A] dark:text-[#F5F5F5]"
        style={{ ...displayFont, letterSpacing: '-0.02em' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </Card>
  )
}

// ─── Super Admin Layout ───────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: <ChartBar size={18} />,     label: 'Analytics',     href: '/super' },
  { icon: <Users size={18} />,        label: 'All Users',     href: '/super/users' },
  { icon: <Flag size={18} />,         label: 'Feature Flags', href: '/super/flags' },
  { icon: <Sliders size={18} />,      label: 'Settings',      href: '/super/settings' },
  { icon: <ClipboardText size={18} />,label: 'Audit Log',     href: '/super/audit' },
  { icon: <Activity size={18} />,     label: 'Monitoring',    href: '/super/monitor' },
]

export function SuperAdminLayout() {
  const { user, isLoading } = useSession()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isLoading && (!user || !(user as any).is_super_admin)) {
      navigate('/admin')
    }
  }, [user, isLoading, navigate])

  if (isLoading || !user) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-2 border-[#E5E7EB] border-t-[#7C3AED] animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
      <aside className="w-56 flex-shrink-0 hidden md:flex flex-col border-r border-[#E5E7EB] dark:border-[#1C1C1C] bg-white dark:bg-[#101010]">
        <div className="p-4 sticky top-16">
          {/* Header */}
          <div className="flex items-center gap-2 px-3 mb-4">
            <div className="w-6 h-6 rounded-full bg-[#7C3AED] flex items-center justify-center">
              <ShieldStar size={12} weight="fill" className="text-white" />
            </div>
            <p className="text-[11px] font-semibold text-[#7C3AED] uppercase tracking-wider" style={font}>
              Super Admin
            </p>
          </div>

          <nav className="space-y-0.5 mb-4">
            {NAV_ITEMS.map((item) => {
              const isActive = item.href === '/super'
                ? location.pathname === '/super'
                : location.pathname.startsWith(item.href)
              return (
                <Link key={item.href} to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-full text-[13px] transition-colors ${isActive
                    ? 'bg-[#7C3AED1A] text-[#7C3AED]'
                    : 'text-[#5C6370] dark:text-[#8B8FA8] hover:bg-[#F0F2F5] dark:hover:bg-[#181818]'}`}
                  style={{ ...font, fontWeight: isActive ? 600 : 400 }}>
                  <span style={{ color: isActive ? '#7C3AED' : undefined }}>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-[#E5E7EB] dark:border-[#1C1C1C] pt-3">
            <Link to="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-full text-[12px] text-[#9CA3AF] hover:text-[#5C6370] transition-colors"
              style={font}>
              <ArrowLeft size={13} /> Back to Admin
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile nav */}
      <nav className="md:hidden flex overflow-x-auto gap-2 border-b border-[#E5E7EB] dark:border-[#1C1C1C] bg-white dark:bg-[#101010] p-3 scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/super'
            ? location.pathname === '/super'
            : location.pathname.startsWith(item.href)
          return (
            <Link key={item.href} to={item.href}
              className={`flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-full text-[13px] transition-colors ${isActive
                ? 'bg-[#7C3AED1A] text-[#7C3AED]'
                : 'text-[#5C6370] dark:text-[#8B8FA8]'}`}
              style={{ ...font, fontWeight: isActive ? 600 : 400 }}>
              {item.icon}{item.label}
            </Link>
          )
        })}
      </nav>

      <main className="flex-1 overflow-auto p-4 md:p-8 bg-[#F7F8FA] dark:bg-[#080808]">
        <Outlet />
      </main>
    </div>
  )
}

// ─── Analytics Page ───────────────────────────────────────────────────────────

export function SuperAnalyticsPage() {
  const [overview, setOverview] = useState<any>(null)
  const [depts, setDepts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([superApi.analyticsOverview(), superApi.analyticsDepartments()]).then(([o, d]) => {
      if (o.success) setOverview(o.data)
      if (d.success) setDepts(d.data)
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-[#E5E7EB] border-t-[#7C3AED] animate-spin" />
    </div>
  )

  const u = overview?.users
  const p = overview?.projects

  return (
    <div className="space-y-6">
      <PageHeader title="Platform Analytics" subtitle="Real-time platform metrics" />

      {/* User stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users size={18} />}    label="Total Users"    value={u?.total ?? 0}       color="#7C3AED" />
        <StatCard icon={<Users size={18} />}    label="Students"       value={u?.students ?? 0}     color="#0066FF" />
        <StatCard icon={<Users size={18} />}    label="Supervisors"    value={u?.supervisors ?? 0}  color="#0891B2" />
        <StatCard icon={<Warning size={18} />}  label="Banned"         value={u?.banned ?? 0}       color="#EF4444" />
      </div>

      {/* Project stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<ChartBar size={18} />} label="Total Projects"  value={p?.total ?? 0}             color="#7C3AED" />
        <StatCard icon={<CheckCircle size={18} />} label="Approved"     value={p?.approved ?? 0}          color="#22C55E" />
        <StatCard icon={<ArrowClockwise size={18} />} label="Pending"   value={p?.pending ?? 0}           color="#F59E0B" />
        <StatCard icon={<XCircle size={18} />}  label="Rejected"        value={p?.rejected ?? 0}          color="#EF4444" />
      </div>

      {/* Departments table */}
      <Card>
        <div className="px-5 py-4 border-b border-[#E5E7EB] dark:border-[#1C1C1C]">
          <h2 className="text-[15px] font-semibold text-[#0A0A0A] dark:text-[#F5F5F5]" style={displayFont}>
            Department Breakdown
          </h2>
        </div>
        <div className="divide-y divide-[#E5E7EB] dark:divide-[#1C1C1C]">
          {depts.map((d) => (
            <div key={d.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-[13px] font-medium text-[#0A0A0A] dark:text-[#F5F5F5]" style={font}>{d.name}</p>
                <p className="text-[12px] text-[#9CA3AF]" style={font}>{d.total_students} students</p>
              </div>
              <div className="flex items-center gap-4 text-[12px] text-[#9CA3AF]" style={font}>
                <span>{d.approved_projects} approved</span>
                <span>{d.total_downloads} downloads</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── Users Page ───────────────────────────────────────────────────────────────

export function SuperUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    superApi.users({ ...(query && { query }), ...(roleFilter && { role: roleFilter }) }).then((res) => {
      if (res.success) setUsers(res.data.items ?? res.data)
      setLoading(false)
    })
  }, [query, roleFilter])

  useEffect(() => { load() }, [load])

  const handleRoleChange = async (userId: string, role: string) => {
    const res = await superApi.updateRole(userId, role)
    if (res.success) { toast.success('Role updated'); load() }
    else toast.error(res.error)
  }

  const handleSuperToggle = async (userId: string, current: boolean) => {
    const res = await superApi.updateSuper(userId, !current)
    if (res.success) { toast.success(`Super admin ${!current ? 'granted' : 'revoked'}`); load() }
    else toast.error(res.error)
  }

  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`Hard delete ${email}? This cannot be undone.`)) return
    const res = await superApi.deleteUser(userId)
    if (res.success) { toast.success('User deleted'); load() }
    else toast.error(res.error)
  }

  return (
    <div className="space-y-5">
      <PageHeader title="All Users" subtitle="Full user management including admins" />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white dark:bg-[#101010] rounded-full border border-[#E5E7EB] dark:border-[#1C1C1C] px-4 py-2.5">
          <MagnifyingGlass size={16} className="text-[#9CA3AF]" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, email or matric..."
            className="flex-1 bg-transparent outline-none text-[14px] text-[#0A0A0A] dark:text-[#F5F5F5] placeholder-[#9CA3AF]"
            style={font} />
          {query && <button onClick={() => setQuery('')}><X size={13} className="text-[#9CA3AF]" /></button>}
        </div>
        <div className="flex flex-wrap gap-1">
          {['', 'student', 'supervisor', 'admin', 'public'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-full text-[12px] transition-colors ${roleFilter === r
                ? 'bg-[#7C3AED] text-white'
                : 'bg-white dark:bg-[#101010] border border-[#E5E7EB] dark:border-[#1C1C1C] text-[#5C6370] hover:border-[#7C3AED] hover:text-[#7C3AED]'}`}
              style={{ ...font, fontWeight: 500 }}>
              {r ? r.charAt(0).toUpperCase() + r.slice(1) : 'All'}
            </button>
          ))}
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-[#E5E7EB] border-t-[#7C3AED] animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[14px] text-[#9CA3AF]" style={font}>No users found.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB] dark:divide-[#1C1C1C]">
            {users.map((user) => {
              const bg = getAvatarColor(user.id)
              const initials = getInitials(user.full_name ?? user.email)
              return (
                <div key={user.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-[#7C3AED08] transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] flex-shrink-0 relative"
                      style={{ backgroundColor: bg, ...displayFont, fontWeight: 700 }}>
                      {initials}
                      {user.is_super_admin && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#7C3AED] rounded-full flex items-center justify-center">
                          <Crown size={8} weight="fill" className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-[#0A0A0A] dark:text-[#F5F5F5] truncate" style={font}>
                        {user.full_name ?? user.email}
                      </p>
                      <p className="text-[12px] text-[#9CA3AF] truncate" style={font}>{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge label={user.role} color={user.role === 'admin' ? '#7C3AED' : '#0066FF'} />
                    {user.is_super_admin && <Badge label="Super Admin" color="#7C3AED" />}
                    <Badge
                      label={user.account_status}
                      color={user.account_status === 'active' ? '#22C55E' : user.account_status === 'banned' ? '#EF4444' : '#F59E0B'}
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Role selector */}
                    {!user.is_super_admin && (
                      <select
                        value={user.role}
                        onChange={e => handleRoleChange(user.id, e.target.value)}
                        className="text-[12px] px-2 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#2A2A2A] bg-white dark:bg-[#181818] text-[#5C6370] dark:text-[#8B8FA8] outline-none"
                        style={font}>
                        <option value="student">Student</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="admin">Admin</option>
                        <option value="public">Public</option>
                      </select>
                    )}

                    {/* Super admin toggle */}
                    <button
                      onClick={() => handleSuperToggle(user.id, user.is_super_admin)}
                      title={user.is_super_admin ? 'Revoke super admin' : 'Grant super admin'}
                      className={`p-1.5 rounded-lg transition-colors ${user.is_super_admin
                        ? 'bg-[#7C3AED1A] text-[#7C3AED] hover:bg-[#7C3AED30]'
                        : 'text-[#9CA3AF] hover:text-[#7C3AED] hover:bg-[#7C3AED1A]'}`}>
                      <Crown size={14} weight={user.is_super_admin ? 'fill' : 'regular'} />
                    </button>

                    {/* Delete */}
                    {!user.is_super_admin && (
                      <button
                        onClick={() => handleDelete(user.id, user.email)}
                        className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#EF44441A] transition-colors">
                        <XCircle size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Feature Flags Page ───────────────────────────────────────────────────────

export function SuperFlagsPage() {
  const [flags, setFlags] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    superApi.flags().then(res => {
      if (res.success) setFlags(res.data)
      setLoading(false)
    })
  }, [])

  const handleToggle = async (key: string, current: boolean) => {
    setToggling(key)
    const res = await superApi.updateFlag(key, !current)
    if (res.success) {
      setFlags(prev => prev.map(f => f.key === key ? { ...f, enabled: !current } : f))
      toast.success(`${key} ${!current ? 'enabled' : 'disabled'}`)
    } else toast.error(res.error)
    setToggling(null)
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Feature Flags" subtitle="Toggle platform features without deploying" />
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-[#E5E7EB] border-t-[#7C3AED] animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB] dark:divide-[#1C1C1C]">
            {flags.map(flag => (
              <div key={flag.key} className="flex items-center justify-between px-5 py-4 hover:bg-[#F7F8FA] dark:hover:bg-[#181818] transition-colors">
                <div>
                  <p className="text-[13px] font-medium text-[#0A0A0A] dark:text-[#F5F5F5]" style={font}>
                    {flag.key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </p>
                  {flag.description && (
                    <p className="text-[12px] text-[#9CA3AF] mt-0.5" style={font}>{flag.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleToggle(flag.key, flag.enabled)}
                  disabled={toggling === flag.key}
                  className="flex items-center gap-2 transition-opacity disabled:opacity-50">
                  {flag.enabled
                    ? <ToggleRight size={28} weight="fill" className="text-[#7C3AED]" />
                    : <ToggleLeft size={28} className="text-[#9CA3AF]" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Settings Page ────────────────────────────────────────────────────────────

export function SuperSettingsPage() {
  const [settings, setSettings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    superApi.settings().then(res => {
      if (res.success) setSettings(res.data)
      setLoading(false)
    })
  }, [])

  const startEdit = (key: string, value: any) => {
    setEditing(key)
    setEditValue(typeof value === 'string' ? value.replace(/^"|"$/g, '') : String(value))
  }

  const handleSave = async (key: string) => {
    setSaving(true)
    const res = await superApi.updateSetting(key, editValue)
    if (res.success) {
      setSettings(prev => prev.map(s => s.key === key ? { ...s, value: JSON.stringify(editValue) } : s))
      toast.success(`${key} updated`)
      setEditing(null)
    } else toast.error(res.error)
    setSaving(false)
  }

  return (
    <div className="space-y-5">
      <PageHeader title="System Settings" subtitle="Platform-wide configuration" />
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-[#E5E7EB] border-t-[#7C3AED] animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB] dark:divide-[#1C1C1C]">
            {settings.map(setting => (
              <div key={setting.key} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#0A0A0A] dark:text-[#F5F5F5] font-mono" style={font}>
                      {setting.key}
                    </p>
                    {setting.description && (
                      <p className="text-[12px] text-[#9CA3AF] mt-0.5" style={font}>{setting.description}</p>
                    )}
                  </div>

                  {editing === setting.key ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-[#7C3AED] bg-white dark:bg-[#181818] text-[13px] text-[#0A0A0A] dark:text-[#F5F5F5] outline-none w-40"
                        style={font}
                        autoFocus
                      />
                      <button onClick={() => handleSave(setting.key)} disabled={saving}
                        className="px-3 py-1.5 rounded-lg bg-[#7C3AED] text-white text-[12px] font-medium disabled:opacity-50"
                        style={font}>Save</button>
                      <button onClick={() => setEditing(null)}
                        className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#2A2A2A] text-[12px] text-[#5C6370]"
                        style={font}>Cancel</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-mono text-[#5C6370] dark:text-[#8B8FA8] bg-[#F7F8FA] dark:bg-[#181818] px-2 py-1 rounded-lg">
                        {String(setting.value).replace(/^"|"$/g, '')}
                      </span>
                      <button onClick={() => startEdit(setting.key, setting.value)}
                        className="text-[12px] text-[#9CA3AF] hover:text-[#7C3AED] px-2 py-1 rounded-lg hover:bg-[#7C3AED1A] transition-colors"
                        style={font}>Edit</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Audit Log Page ───────────────────────────────────────────────────────────

export function SuperAuditPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('')
  const [purging, setPurging] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    superApi.auditLog({ ...(actionFilter && { action: actionFilter }) }).then(res => {
      if (res.success) setLogs(res.data)
      setLoading(false)
    })
  }, [actionFilter])

  useEffect(() => { load() }, [load])

  const handlePurge = async () => {
    if (!confirm('This will log out ALL users immediately. Continue?')) return
    setPurging(true)
    const res = await superApi.purgeSessions()
    if (res.success) toast.success('All sessions purged')
    else toast.error(res.error)
    setPurging(false)
  }

  const ACTION_COLORS: Record<string, string> = {
    'user.role_changed':         '#F59E0B',
    'user.super_admin_granted':  '#7C3AED',
    'user.super_admin_revoked':  '#EF4444',
    'user.hard_deleted':         '#EF4444',
    'project.hard_deleted':      '#EF4444',
    'project.status_forced':     '#F59E0B',
    'flag.enabled':              '#22C55E',
    'flag.disabled':             '#EF4444',
    'setting.updated':           '#0066FF',
    'security.all_sessions_purged': '#EF4444',
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <PageHeader title="Audit Log" subtitle="All super admin actions" />
        <button onClick={handlePurge} disabled={purging}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#EF44441A] text-[#EF4444] text-[13px] font-medium hover:bg-[#EF444430] transition-colors disabled:opacity-50"
          style={font}>
          {purging ? <div className="w-4 h-4 rounded-full border-2 border-[#EF4444]/30 border-t-[#EF4444] animate-spin" /> : <Warning size={15} />}
          Purge All Sessions
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'user', 'project', 'flag', 'setting', 'security'].map(t => (
          <button key={t} onClick={() => setActionFilter(t)}
            className={`px-3 py-1.5 rounded-full text-[12px] transition-colors ${actionFilter === t
              ? 'bg-[#7C3AED] text-white'
              : 'bg-white dark:bg-[#101010] border border-[#E5E7EB] dark:border-[#1C1C1C] text-[#5C6370] hover:border-[#7C3AED]'}`}
            style={{ ...font, fontWeight: 500 }}>
            {t ? t.charAt(0).toUpperCase() + t.slice(1) : 'All'}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-[#E5E7EB] border-t-[#7C3AED] animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[14px] text-[#9CA3AF]" style={font}>No audit entries yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB] dark:divide-[#1C1C1C]">
            {logs.map((log) => {
              const color = ACTION_COLORS[log.action] ?? '#9CA3AF'
              return (
                <div key={log.id} className="px-5 py-3 hover:bg-[#F7F8FA] dark:hover:bg-[#181818] transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
                      <div>
                        <p className="text-[13px] font-mono font-medium text-[#0A0A0A] dark:text-[#F5F5F5]">{log.action}</p>
                        <p className="text-[12px] text-[#9CA3AF] mt-0.5" style={font}>
                          by {log.actor_name ?? log.actor_email ?? 'unknown'}
                          {log.target_id && <> · target: <span className="font-mono">{log.target_id.slice(0, 8)}…</span></>}
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#9CA3AF] flex-shrink-0" style={font}>
                      {relativeTime(log.created_at)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Monitoring Page ──────────────────────────────────────────────────────────

export function SuperMonitorPage() {
  const [health, setHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    superApi.health().then(res => {
      if (res.success) setHealth(res.data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  const StatusDot = ({ ok }: { ok: boolean }) => (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <PageHeader title="System Monitoring" subtitle="Live health checks" />
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#E5E7EB] dark:border-[#2A2A2A] text-[13px] text-[#5C6370] hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors"
          style={font}>
          <ArrowClockwise size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-[#E5E7EB] border-t-[#7C3AED] animate-spin" />
        </div>
      ) : health ? (
        <div className="space-y-4">
          {/* Overall status */}
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${health.status === 'healthy' ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
                <Activity size={20} className={health.status === 'healthy' ? 'text-emerald-500' : 'text-red-500'} />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-[#0A0A0A] dark:text-[#F5F5F5] capitalize" style={displayFont}>
                  {health.status}
                </p>
                <p className="text-[12px] text-[#9CA3AF]" style={font}>
                  Last checked {new Date(health.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DB */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <StatusDot ok={health.database?.ok} />
                <h3 className="text-[14px] font-semibold text-[#0A0A0A] dark:text-[#F5F5F5]" style={displayFont}>Database</h3>
              </div>
              <p className="text-[12px] text-[#9CA3AF]" style={font}>
                Latency: <span className="text-[#0A0A0A] dark:text-[#F5F5F5]">{health.database?.latency_ms ?? '—'}ms</span>
              </p>
            </Card>

            {/* Redis */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <StatusDot ok={health.redis?.ok} />
                <h3 className="text-[14px] font-semibold text-[#0A0A0A] dark:text-[#F5F5F5]" style={displayFont}>Redis</h3>
              </div>
              <p className="text-[12px] text-[#9CA3AF]" style={font}>
                {health.redis?.ok ? 'Connected and responding' : 'Not responding'}
              </p>
            </Card>

            {/* System */}
            <Card className="p-5 md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <Database size={14} className="text-[#7C3AED]" />
                <h3 className="text-[14px] font-semibold text-[#0A0A0A] dark:text-[#F5F5F5]" style={displayFont}>System</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]" style={font}>
                <div><span className="text-[#9CA3AF]">Uptime</span><br /><span className="text-[#0A0A0A] dark:text-[#F5F5F5]">{health.system?.uptime}</span></div>
                <div><span className="text-[#9CA3AF]">Load</span><br /><span className="text-[#0A0A0A] dark:text-[#F5F5F5] font-mono text-[11px]">{health.system?.load}</span></div>
                <div className="md:col-span-2"><span className="text-[#9CA3AF]">Disk</span><br /><span className="text-[#0A0A0A] dark:text-[#F5F5F5] font-mono text-[11px]">{health.system?.disk}</span></div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-[14px] text-[#9CA3AF]" style={font}>Failed to load health data.</p>
        </Card>
      )}
    </div>
  )
}
