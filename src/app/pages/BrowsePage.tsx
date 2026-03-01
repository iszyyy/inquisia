import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import {
  MagnifyingGlass, CaretDown, ArrowUpRight, DownloadSimple, CalendarBlank,
  Funnel, X, SlidersHorizontal,
} from 'phosphor-react'
import { motion, AnimatePresence } from 'motion/react'
import { projectsApi, publicApi } from '../../lib/api'
import { aiApi } from '../../lib/api'
import type { Project, Department, AICategory } from '../../lib/types'
import { getCategoryStyle, getInitials, getAvatarColor, formatNumber } from '../../lib/utils'
import { useTheme } from '../../context/ThemeContext'
import { SkeletonProjectCard } from '../components/SkeletonPrimitives'

// ─── Author avatars stack ─────────────────────────────────────────────────────

function AuthorStack({ authors }: { authors: Project['authors'] }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {authors.slice(0, 3).map((a, i) => (
          <div
            key={a.id}
            className="w-7 h-7 rounded-full border border-white dark:border-[#101010] flex items-center justify-center text-white text-[10px]"
            style={{ backgroundColor: getAvatarColor(a.id), marginLeft: i > 0 ? -8 : 0, fontFamily: 'var(--font-display)', fontWeight: 700, zIndex: authors.length - i }}
          >
            {getInitials(a.full_name)}
          </div>
        ))}
      </div>
      <span className="text-[12px] text-[#9CA3AF]" style={{ fontFamily: 'var(--font-body)' }}>
        {authors[0]?.display_name ?? authors[0]?.full_name}
        {authors.length > 1 && ` +${authors.length - 1} more`}
      </span>
    </div>
  )
}

// ─── Full project card (with abstract) ────────────────────────────────────────

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  const allTags = [...(project.student_tags || []), ...(project.ai_tags || [])]
  const topCategory = project.ai_category ?? allTags[0] ?? 'Research'
  const extraTags = allTags.length > 1 ? allTags.length - 1 : 0
  const catStyle = getCategoryStyle(topCategory, isDark)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut', delay: Math.min(index, 7) * 0.04 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => navigate(`/projects/${project.id}`)}
      className="rounded-2xl border border-[#E5E7EB] dark:border-[#1C1C1C] bg-white dark:bg-[#101010] p-6 cursor-pointer transition-all duration-150"
      style={{
        boxShadow: hovered ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
      }}
    >
      {/* Pills */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ backgroundColor: catStyle.bg, color: catStyle.text, fontFamily: 'var(--font-body)' }}>
          {topCategory}
        </span>
        {extraTags > 0 && (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#F0F2F5] dark:bg-[#181818] text-[#9CA3AF]">+{extraTags}</span>
        )}
      </div>

      {/* Title */}
      <h3
        className="leading-snug mb-2 line-clamp-2 transition-colors duration-150"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '17px', color: hovered ? '#0066FF' : undefined }}
      >
        {project.title}
      </h3>

      {/* Abstract */}
      <p className="text-[13px] text-[#5C6370] dark:text-[#8B8FA8] mb-4 line-clamp-3" style={{ fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
        {project.abstract}
      </p>

      {/* Divider */}
      <div className="h-px bg-[#E5E7EB] dark:bg-[#1C1C1C] mb-4" />

      {/* Footer */}
      <div className="flex items-center justify-between">
        <AuthorStack authors={project.authors} />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[#9CA3AF]">
            <DownloadSimple size={14} />
            <span className="text-[12px]">{formatNumber(project.download_count)}</span>
          </div>
          <div className="flex items-center gap-1 text-[#9CA3AF]">
            <CalendarBlank size={14} />
            <span className="text-[12px]">{project.year}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ query, onSuggestion }: { query: string; onSuggestion: (s: string) => void }) {
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    if (query) {
      aiApi.suggestCategories(query).then((r) => {
        if (r.success) setSuggestions(r.data.suggestions)
      })
    }
  }, [query])

  return (
    <div className="text-center py-20">
      <MagnifyingGlass size={48} weight="thin" className="text-[#9CA3AF] mx-auto mb-4" />
      <h3 className="text-[18px] text-[#0A0A0A] dark:text-[#F5F5F5] mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
        Nothing matched that search.
      </h3>
      <p className="text-[14px] text-[#9CA3AF] mb-6" style={{ fontFamily: 'var(--font-body)' }}>
        Try different keywords or browse by category.
      </p>
      {suggestions.length > 0 && (
        <div>
          <p className="text-[13px] text-[#5C6370] mb-3" style={{ fontFamily: 'var(--font-body)' }}>Did you mean:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => onSuggestion(s)}
                className="px-4 py-2 rounded-full text-[13px] border border-[#E5E7EB] dark:border-[#1C1C1C] text-[#5C6370] dark:text-[#8B8FA8] hover:border-[#0066FF] hover:text-[#0066FF] transition-colors"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  departments: Department[]
  categories: AICategory[]
  filters: { department: string; category: string; year: string }
  onFilter: (k: string, v: string) => void
  onClear: () => void
}

function Sidebar({ departments, categories, filters, onFilter, onClear }: SidebarProps) {
  const { isDark } = useTheme()
  const activeCount = Object.values(filters).filter(Boolean).length
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i))

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-[#0A0A0A] dark:text-[#F5F5F5]" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
          Filters
          {activeCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-[#0066FF] text-white" style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}>
              {activeCount}
            </span>
          )}
        </span>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="text-[12px] text-[#0066FF] hover:underline"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Department */}
      <div>
        <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3" style={{ fontFamily: 'var(--font-body)' }}>Department</p>
        <div className="flex flex-wrap gap-1.5">
          {departments.map((d) => {
            const isActive = filters.department === d.id
            return (
              <button
                key={d.id}
                onClick={() => onFilter('department', isActive ? '' : d.id)}
                className={`px-3 py-1.5 rounded-full text-[12px] transition-all duration-150 ${isActive
                  ? 'bg-[#0066FF] text-white'
                  : 'bg-[#F0F2F5] dark:bg-[#181818] text-[#5C6370] dark:text-[#8B8FA8] hover:bg-[#E5E7EB] dark:hover:bg-[#1C1C1C] hover:text-[#0A0A0A] dark:hover:text-[#F5F5F5]'
                  }`}
                style={{ fontFamily: 'var(--font-body)', fontWeight: isActive ? 600 : 400 }}
              >
                {d.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Year */}
      <div>
        <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3" style={{ fontFamily: 'var(--font-body)' }}>Year</p>
        <div className="flex flex-wrap gap-1.5">
          {years.map((y) => {
            const isActive = filters.year === y
            return (
              <button
                key={y}
                onClick={() => onFilter('year', isActive ? '' : y)}
                className={`px-3 py-1.5 rounded-full text-[12px] transition-all duration-150 ${isActive
                  ? 'bg-[#0066FF] text-white'
                  : 'bg-[#F0F2F5] dark:bg-[#181818] text-[#5C6370] dark:text-[#8B8FA8] hover:bg-[#E5E7EB] dark:hover:bg-[#1C1C1C] hover:text-[#0A0A0A] dark:hover:text-[#F5F5F5]'
                  }`}
                style={{ fontFamily: 'var(--font-body)', fontWeight: isActive ? 600 : 400 }}
              >
                {y}
              </button>
            )
          })}
        </div>
      </div>

      {/* Category */}
      <div>
        <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3" style={{ fontFamily: 'var(--font-body)' }}>Category</p>
        <div className="flex flex-wrap gap-1.5">
          {categories.slice(0, 12).map((c) => {
            const style = getCategoryStyle(c.name, isDark)
            const isActive = filters.category === c.name
            return (
              <button
                key={c.name}
                onClick={() => onFilter('category', isActive ? '' : c.name)}
                className={`px-3 py-1.5 rounded-full text-[12px] transition-all duration-150 ${isActive ? 'ring-2 ring-offset-1 ring-[#0066FF]' : 'opacity-80 hover:opacity-100'
                  }`}
                style={{
                  backgroundColor: isActive ? style.bg : style.bg,
                  color: style.text,
                  fontFamily: 'var(--font-body)',
                  fontWeight: isActive ? 600 : 400,
                  outline: isActive ? `2px solid ${style.text}40` : 'none',
                  outlineOffset: '1px',
                }}
              >
                {c.name}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Browse page ──────────────────────────────────────────────────────────────

export function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [filters, setFilters] = useState({
    department: searchParams.get('department') ?? '',
    category: searchParams.get('category') ?? '',
    year: searchParams.get('year') ?? '',
  })
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [projects, setProjects] = useState<Project[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [departments, setDepartments] = useState<Department[]>([])
  const [categories, setCategories] = useState<AICategory[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    publicApi.departments().then((r) => { if (r.success) setDepartments(r.data) })
    publicApi.categories().then((r) => { if (r.success) setCategories(r.data) })
  }, [])

  const fetchProjects = useCallback(async (ignore: boolean) => {
    setLoading(true)

    let finalQuery: string | undefined = query || undefined
    let finalAuthor: string | undefined = undefined
    let finalCategory: string | undefined = filters.category || undefined

    if (query) {
      if (query.startsWith('@')) {
        finalAuthor = query.slice(1).trim()
        finalQuery = undefined
      } else if (query.startsWith('#')) {
        finalCategory = query.slice(1).trim()
        finalQuery = undefined
      }
    }

    const res = await projectsApi.list({
      query: finalQuery,
      author: finalAuthor,
      department_id: filters.department || undefined,
      ai_category: finalCategory,
      year: filters.year || undefined,
      sort: sort || undefined,
      page,
      limit: 8,
    })

    if (!ignore) {
      if (res.success) {
        setProjects(res.data.items)
        setTotal(res.data.total)
        setTotalPages(res.data.total_pages)
      } else {
        setProjects([])
        setTotal(0)
        setTotalPages(1)
      }
      setLoading(false)
    }
  }, [query, filters, sort, page])

  useEffect(() => {
    let ignore = false
    void fetchProjects(ignore)
    return () => { ignore = true }
  }, [fetchProjects])

  const handleFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const handleClear = () => {
    setFilters({ department: '', category: '', year: '' })
    setPage(1)
  }

  const handleSuggestion = (s: string) => {
    setFilters((prev) => ({ ...prev, category: s }))
  }

  const sortButtons = [
    { key: 'newest', label: 'Newest' },
    { key: 'oldest', label: 'Oldest' },
    { key: 'a-z', label: 'A-Z' },
    { key: 'z-a', label: 'Z-A' },
  ]

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#080808]">
      <div className="max-w-[1200px] mx-auto px-5 md:px-12 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-[#0A0A0A] dark:text-[#F5F5F5]"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '28px', letterSpacing: '-0.02em' }}>
            Browse Projects
          </h1>
          <p className="text-[14px] text-[#9CA3AF]" style={{ fontFamily: 'var(--font-body)' }}>
            {total > 0 ? `${total} project${total !== 1 ? 's' : ''} found` : 'Searching...'}
          </p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar — desktop */}
          <aside className="w-64 flex-shrink-0 hidden md:block">
            <div className="sticky top-24 bg-white dark:bg-[#101010] rounded-2xl border border-[#E5E7EB] dark:border-[#1C1C1C] p-5"
              style={{ boxShadow: 'var(--shadow-card)' }}>
              <Sidebar departments={departments} categories={categories} filters={filters} onFilter={handleFilter} onClear={handleClear} />
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Search + sort controls */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              {/* Search */}
              <div className="flex-1 flex items-center gap-2 bg-white dark:bg-[#101010] rounded-full border border-[#E5E7EB] dark:border-[#1C1C1C] px-4 py-2.5">
                <MagnifyingGlass size={16} className="text-[#9CA3AF] flex-shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setPage(1) }}
                  placeholder="Search projects..."
                  className="flex-1 bg-transparent outline-none text-[14px] text-[#0A0A0A] dark:text-[#F5F5F5] placeholder-[#9CA3AF]"
                  style={{ fontFamily: 'var(--font-body)' }}
                />
                {query && (
                  <button onClick={() => { setQuery(''); setPage(1) }}>
                    <X size={14} className="text-[#9CA3AF] hover:text-[#5C6370]" />
                  </button>
                )}
              </div>

              {/* Mobile filters button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#E5E7EB] dark:border-[#1C1C1C] bg-white dark:bg-[#101010] text-[13px] text-[#5C6370]"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
              >
                <SlidersHorizontal size={16} />
                Filters
              </button>

              {/* Sort */}
              <div className="flex flex-wrap gap-1 mt-2 sm:mt-0">
                {sortButtons.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSort(s.key)}
                    className={`px-3 py-2 rounded-full text-[12px] transition-colors duration-150 ${sort === s.key
                      ? 'bg-[#0066FF] text-white'
                      : 'bg-white dark:bg-[#101010] border border-[#E5E7EB] dark:border-[#1C1C1C] text-[#5C6370] dark:text-[#8B8FA8] hover:border-[#0066FF] hover:text-[#0066FF]'
                      }`}
                    style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonProjectCard key={i} />)}
              </div>
            ) : projects.length === 0 ? (
              <EmptyState query={query} onSuggestion={handleSuggestion} />
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
                  {projects.map((p, i) => <ProjectCard key={p.id} project={p} index={i} />)}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 rounded-full text-[13px] border border-[#E5E7EB] dark:border-[#1C1C1C] text-[#5C6370] disabled:opacity-40 hover:border-[#0066FF] hover:text-[#0066FF] transition-colors"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      Previous
                    </button>
                    {(() => {
                      const start = Math.max(1, Math.min(page - 3, totalPages - 6))
                      const end = Math.min(totalPages, start + 6)
                      return Array.from({ length: end - start + 1 }, (_, i) => start + i).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-9 h-9 rounded-full text-[13px] transition-colors duration-150 ${p === page
                            ? 'bg-[#0066FF] text-white'
                            : 'border border-[#E5E7EB] dark:border-[#1C1C1C] text-[#5C6370] hover:border-[#0066FF] hover:text-[#0066FF]'
                            }`}
                          style={{ fontFamily: 'var(--font-body)' }}
                        >
                          {p}
                        </button>
                      ))
                    })()}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 rounded-full text-[13px] border border-[#E5E7EB] dark:border-[#1C1C1C] text-[#5C6370] disabled:opacity-40 hover:border-[#0066FF] hover:text-[#0066FF] transition-colors"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sidebar sheet */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 35 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-[#101010] z-50 p-6 overflow-y-auto rounded-r-2xl shadow-[4px_0_24px_rgba(0,0,0,0.1)]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[16px] font-semibold text-[#0A0A0A] dark:text-[#F5F5F5]" style={{ fontFamily: 'var(--font-display)' }}>Filters</h2>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-full hover:bg-[#F0F2F5] dark:hover:bg-[#181818]">
                  <X size={16} className="text-[#9CA3AF]" />
                </button>
              </div>
              <Sidebar departments={departments} categories={categories} filters={filters} onFilter={(k, v) => { handleFilter(k, v); setSidebarOpen(false) }} onClear={handleClear} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}