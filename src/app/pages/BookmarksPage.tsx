/**
 * BookmarksPage
 * Persists bookmarks in localStorage — swap to API when backend is ready.
 */
import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router'
import {
  BookmarkSimple, ArrowUpRight, DownloadSimple, CalendarBlank,
  Trash, MagnifyingGlass,
} from 'phosphor-react'
import { motion, AnimatePresence } from 'motion/react'
import { projectsApi, bookmarksApi } from '../../lib/api'
import type { Project } from '../../lib/types'
import { getCategoryStyle, formatNumber, getInitials, getAvatarColor } from '../../lib/utils'
import { useTheme } from '../../context/ThemeContext'
import { useSession } from '../../context/SessionContext'
import { SkeletonProjectCard } from '../components/SkeletonPrimitives'
import { EmptyState } from '../components/EmptyState'
import { toast } from 'sonner'
import { DashboardLayout } from '../components/layout/DashboardLayout'

// ─── Bookmark card ────────────────────────────────────────────────────────────

function BookmarkCard({ project, onRemove }: { project: Project; onRemove: (id: string) => void }) {
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  const allTags = [...(project.student_tags || []), ...(project.ai_tags || [])]
  const topCategory = project.ai_category ?? allTags[0] ?? 'Research'
  const catStyle = getCategoryStyle(topCategory, isDark)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, height: 0 }}
      transition={{ duration: 0.22 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative rounded-2xl border border-[#E5E7EB] dark:border-[#1C1C1C] bg-white dark:bg-[#101010] p-6 cursor-pointer"
      style={{
        boxShadow: hovered ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'box-shadow 150ms, transform 150ms',
      }}
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove(project.id)
        }}
        className="absolute top-4 right-4 p-1.5 rounded-full bg-[#F0F2F5] dark:bg-[#181818] text-[#9CA3AF] hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
        style={{ opacity: hovered ? 1 : 0 }}
        aria-label="Remove bookmark"
      >
        <Trash size={14} />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Category */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span
              className="px-2.5 py-1 rounded-full text-[11px] font-medium"
              style={{ backgroundColor: catStyle.bg, color: catStyle.text, fontFamily: 'var(--font-body)' }}
            >
              {topCategory}
            </span>
          </div>

          {/* Title */}
          <h3
            className="leading-snug mb-2 line-clamp-2 transition-colors duration-150"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '16px',
              color: hovered ? '#0066FF' : undefined,
            }}
          >
            {project.title}
          </h3>

          {/* Abstract snippet */}
          <p
            className="text-[13px] text-[#5C6370] dark:text-[#8B8FA8] line-clamp-2 mb-4"
            style={{ fontFamily: 'var(--font-body)', lineHeight: 1.6 }}
          >
            {project.abstract}
          </p>

          {/* Authors */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {project.authors.slice(0, 3).map((a, i) => (
                <div
                  key={a.id}
                  className="w-6 h-6 rounded-full border-2 border-white dark:border-[#101010] flex items-center justify-center text-white text-[9px]"
                  style={{
                    backgroundColor: getAvatarColor(a.id),
                    marginLeft: i > 0 ? -6 : 0,
                    zIndex: project.authors.length - i,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                  }}
                >
                  {getInitials(a.full_name)}
                </div>
              ))}
            </div>
            <span className="text-[12px] text-[#9CA3AF]" style={{ fontFamily: 'var(--font-body)' }}>
              {project.authors[0]?.display_name ?? project.authors[0]?.full_name}
              {project.authors.length > 1 && ` +${project.authors.length - 1}`}
            </span>
          </div>

          {/* Stats */}
          <div className="h-px bg-[#E5E7EB] dark:bg-[#1C1C1C] mb-3" />
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[12px] text-[#9CA3AF]">
              <DownloadSimple size={13} />{formatNumber(project.download_count)}
            </span>
            <span className="flex items-center gap-1 text-[12px] text-[#9CA3AF]">
              <CalendarBlank size={13} />{project.year}
            </span>
            <span className="text-[12px] text-[#9CA3AF]" style={{ fontFamily: 'var(--font-body)' }}>
              {project.department_name}
            </span>
          </div>
        </div>

        <ArrowUpRight
          size={18}
          className="flex-shrink-0 mt-0.5 transition-colors duration-150"
          style={{ color: hovered ? '#0066FF' : '#9CA3AF' }}
        />
      </div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function BookmarksPage() {
  const { user, isLoading: sessionLoading } = useSession()
  const navigate = useNavigate()
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!sessionLoading && !user) navigate('/login?return=/bookmarks')
  }, [user, sessionLoading, navigate])

  useEffect(() => {
    if (!user) return
    setLoading(true)

    bookmarksApi.list().then((res) => {
      if (res.success) {
        setProjects(res.data)
      } else {
        toast.error('Failed to load bookmarks')
      }
      setLoading(false)
    })
  }, [user])

  const handleRemove = useCallback(async (id: string) => {
    const res = await bookmarksApi.remove(id)
    if (res.success) {
      setProjects((prev) => prev.filter((p) => p.id !== id))
      toast.success('Removed from bookmarks')
    } else {
      toast.error('Failed to remove bookmark')
    }
  }, [])

  const handleClearAll = async () => {
    // Clear all one by one (or add a backend endpoint for clearAll)
    // For now, let's just toast that this is coming soon or just clear state if it's too much
    // Actually, let's just remove from state and tell user
    toast.info('Feature coming soon: Bulk delete')
  }

  const filtered = projects.filter((p) =>
    !query ||
    p.title.toLowerCase().includes(query.toLowerCase()) ||
    p.authors.some((a) => a.full_name?.toLowerCase().includes(query.toLowerCase()))
  )

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[#E5E7EB] border-t-[#0066FF] animate-spin" />
      </div>
    )
  }

  return (
    <DashboardLayout activeSection="bookmarks">
      <div className="max-w-[1000px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-[#0066FF1A] flex items-center justify-center">
                <BookmarkSimple size={20} className="text-[#0066FF]" weight="fill" />
              </div>
              <h1
                className="text-[#0A0A0A] dark:text-[#F5F5F5]"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '26px', letterSpacing: '-0.02em' }}
              >
                Saved Projects
              </h1>
            </div>
            <p className="text-[14px] text-[#9CA3AF]" style={{ fontFamily: 'var(--font-body)' }}>
              {projects.length} project{projects.length !== 1 ? 's' : ''} bookmarked
            </p>
          </div>

          {projects.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] border border-red-200 dark:border-red-800/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
            >
              <Trash size={14} />
              Clear All
            </button>
          )}
        </div>

        {/* Search (when there are bookmarks) */}
        {bookmarkedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-white dark:bg-[#101010] rounded-full border border-[#E5E7EB] dark:border-[#1C1C1C] px-4 py-2.5 mb-6 max-w-md">
            <MagnifyingGlass size={16} className="text-[#9CA3AF] flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter saved projects..."
              className="flex-1 bg-transparent outline-none text-[14px] text-[#0A0A0A] dark:text-[#F5F5F5] placeholder-[#9CA3AF]"
              style={{ fontFamily: 'var(--font-body)' }}
            />
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => <SkeletonProjectCard key={i} />)}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={<BookmarkSimple size={52} weight="thin" />}
            title="No saved projects yet"
            description="Bookmark projects you want to revisit later. Hit the bookmark icon on any project page to save it here."
            action={
              <Link
                to="/projects"
                className="px-6 py-3 rounded-full text-[14px] text-white bg-[#0066FF] hover:bg-[#0052CC] transition-colors inline-block"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
              >
                Browse Projects
              </Link>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<MagnifyingGlass size={40} weight="thin" />}
            title="No bookmarks match that search"
            description="Try a different keyword."
            compact
          />
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <AnimatePresence mode="popLayout">
              {filtered.map((p) => (
                <BookmarkCard key={p.id} project={p} onRemove={handleRemove} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}
