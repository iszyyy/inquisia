import React, { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { MagnifyingGlass, X, WarningCircle } from 'phosphor-react'
import { projectsApi, adminApi } from '../../../lib/api'
import type { Project } from '../../../lib/types'
import { getCategoryStyle, relativeTime } from '../../../lib/utils'
import { useTheme } from '../../../context/ThemeContext'
import { SkeletonBlock } from '../../components/SkeletonPrimitives'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: '#EBF2FF', text: '#0066FF', label: 'Pending' },
  approved: { bg: '#EBF2FF', text: '#0066FF', label: 'Approved' },
  changes_requested: { bg: '#EBF2FF', text: '#0066FF', label: 'Changes Requested' },
  rejected: { bg: '#EBF2FF', text: '#0066FF', label: 'Rejected' },
}

export function AdminProjectsPage() {
  const { isDark } = useTheme()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => {
    projectsApi.list({ query: query || undefined, limit: 20 }).then((res) => {
      if (res.success) setProjects(res.data.items)
      setLoading(false)
    })
  }, [query])

  const filtered = statusFilter ? projects.filter((p) => p.status === statusFilter) : projects

  const handleApprove = async (projectId: string) => {
    setActing(projectId)
    const res = await adminApi.updateProjectStatus(projectId, 'approved', 'Force approved by administrator')
    if (res.success) {
      setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, status: 'approved' } : p))
      toast.success('Project approved.')
    } else {
      toast.error(res.error ?? 'Failed to approve project.')
    }
    setActing(null)
  }

  const handleUnpublish = async (projectId: string) => {
    setActing(projectId)
    const res = await adminApi.updateProjectStatus(projectId, 'pending', 'Unpublished by admin')
    if (res.success) {
      setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, status: 'pending' } : p))
      toast.success('Project unpublished.')
    } else {
      toast.error(res.error ?? 'Failed to unpublish project.')
    }
    setActing(null)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[#0A0A0A] dark:text-[#F5F5F5] mb-1"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '22px', letterSpacing: '-0.02em' }}>
          Projects
        </h1>
        <p className="text-[14px] text-[#9CA3AF]" style={{ fontFamily: 'var(--font-body)' }}>{filtered.length} projects</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 flex items-center gap-2 bg-white dark:bg-[#101010] rounded-full border border-[#E5E7EB] dark:border-[#1C1C1C] px-4 py-2.5">
          <MagnifyingGlass size={16} className="text-[#9CA3AF]" />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects..."
            className="flex-1 bg-transparent outline-none text-[14px] text-[#0A0A0A] dark:text-[#F5F5F5] placeholder-[#9CA3AF]"
            style={{ fontFamily: 'var(--font-body)' }} />
          {query && <button onClick={() => setQuery('')}><X size={13} className="text-[#9CA3AF]" /></button>}
        </div>
        <div className="flex gap-1 flex-wrap">
          {['', 'pending', 'approved', 'changes_requested', 'rejected'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-full text-[12px] transition-colors ${statusFilter === s ? 'bg-[#0066FF] text-white' : 'bg-white dark:bg-[#101010] border border-[#E5E7EB] dark:border-[#1C1C1C] text-[#5C6370] hover:border-[#0066FF] hover:text-[#0066FF]'}`}
              style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>
              {s ? STATUS_COLORS[s]?.label ?? s : 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#101010] border border-[#E5E7EB] dark:border-[#1C1C1C] overflow-hidden"
        style={{ boxShadow: 'var(--shadow-card)' }}>
        {loading ? (
          <div className="space-y-px">{[1, 2, 3].map((i) => <SkeletonBlock key={i} className="h-20 rounded-none" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center"><p className="text-[14px] text-[#9CA3AF]">No projects found.</p></div>
        ) : (
          filtered.map((p, i) => {
            const s = STATUS_COLORS[p.status] ?? STATUS_COLORS.pending
            const catStyle = p.ai_category ? getCategoryStyle(p.ai_category, isDark) : null
            return (
              <div key={p.id} className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-5 py-4 hover:bg-[#0066FF08] transition-colors group ${i > 0 ? 'border-t border-[#E5E7EB] dark:border-[#1C1C1C]' : ''}`}>
                <div className="flex-1 min-w-0">
                  <Link to={`/projects/${p.id}`} className="text-[13px] font-semibold text-[#0A0A0A] dark:text-[#F5F5F5] hover:text-[#0066FF] transition-colors truncate block"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    {p.title}
                  </Link>
                  <p className="text-[12px] text-[#9CA3AF] mt-0.5" style={{ fontFamily: 'var(--font-body)' }}>
                    {p.authors.map(a => a.full_name ?? a.display_name).join(', ')} · {p.supervisor_name}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="px-2.5 py-1 rounded-full text-[11px]" style={{ backgroundColor: s.bg, color: s.text, fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                    {s.label}
                  </span>
                  {catStyle && p.ai_category && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] hidden md:block" style={{ backgroundColor: catStyle.bg, color: catStyle.text, fontFamily: 'var(--font-body)' }}>
                      {p.ai_category}
                    </span>
                  )}
                  {p.plagiarism_score !== null && (
                    <span className={`inline-flex items-center gap-1.5 font-medium ${p.plagiarism_score > 30 ? 'text-[#DC2626] dark:text-red-400' : 'text-[#9CA3AF] dark:text-[#5C6370]'}`}>
                      {p.plagiarism_score}%
                      {p.plagiarism_score > 30 && p.similar_project_id && <WarningCircle size={14} weight="fill" />}
                    </span>
                  )}
                  <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex gap-1 mt-2 sm:mt-0">
                    {p.status !== 'approved' && (
                      <button onClick={() => handleApprove(p.id)}
                        className="px-2.5 py-1 rounded-full text-[11px] bg-[#0066FF] text-white hover:bg-[#0052CC] transition-colors"
                        style={{ fontFamily: 'var(--font-body)' }}>Approve</button>
                    )}
                    {p.status === 'approved' && (
                      <button onClick={() => handleUnpublish(p.id)}
                        className="px-2.5 py-1 rounded-full text-[11px] bg-transparent border border-[#0066FF] text-[#0066FF] hover:bg-[#0066FF10] transition-colors"
                        style={{ fontFamily: 'var(--font-body)' }}>Unpublish</button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}