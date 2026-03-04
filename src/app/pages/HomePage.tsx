import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { MagnifyingGlass, CaretDown, ArrowUpRight, DownloadSimple, CalendarBlank } from 'phosphor-react'
import { motion, AnimatePresence } from 'motion/react'
import { useSession } from '../../context/SessionContext'
import { useTheme } from '../../context/ThemeContext'
import { projectsApi, publicApi } from '../../lib/api'
import type { Project, Department, AICategory } from '../../lib/types'
import { getCategoryStyle, getAvatarColor, getInitials, formatNumber, relativeTime } from '../../lib/utils'
import { SkeletonProjectCard } from '../components/SkeletonPrimitives'
import SplitText from '../components/ui/SplitText'
import { InquisiaLogo } from '../components/ui/InquisiaLogo'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"

const PHRASES = [
  'their methodology',
  'their references',
  'their conclusions',
  'what they built',
]

// ─── Search bar ───────────────────────────────────────────────────────────────

interface SearchBarProps {
  departments: Department[]
  categories: AICategory[]
  onSearch: (query: string, department: string, category: string) => void
}

function HeroSearchBar({ departments, categories, onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('')
  const [category, setCategory] = useState('')
  const [focused, setFocused] = useState(false)

  const handleSearch = () => {
    onSearch(query, department, category)
  }

  return (
    <div className="w-full max-w-[680px] mx-auto">
      {/* Main search bar */}
      <motion.div
        animate={focused ? { scale: 1.03 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        className={`flex items-center gap-3 bg-white dark:bg-[#101010] rounded-full border px-5 py-3.5 transition-all duration-200 ${focused
          ? 'border-[#0066FF] shadow-[0_0_0_3px_rgba(0,102,255,0.15),0_4px_20px_rgba(0,102,255,0.1)]'
          : 'border-[#E5E7EB] dark:border-[#1C1C1C] shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
          }`}
      >
        <MagnifyingGlass size={20} weight="regular" className="text-[#9CA3AF] flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search projects, authors, or topics..."
          className="flex-1 bg-transparent outline-none text-[15px] text-[#0A0A0A] dark:text-[#F5F5F5] placeholder-[#9CA3AF]"
          style={{ fontFamily: 'var(--font-body)' }}
        />
        <button
          onClick={handleSearch}
          className="flex-shrink-0 px-4 py-1.5 rounded-full bg-[#0066FF] text-white text-[13px] font-medium hover:bg-[#0052CC] transition-colors duration-150"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Search
        </button>
      </motion.div>

      {/* Filter pills */}
      <div className="flex items-center gap-3 mt-3 justify-center flex-wrap">
        {/* Department */}
        <div className="relative">
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger
              className={`w-[160px] pl-4 pr-3 py-2 rounded-full text-[13px] bg-white dark:bg-[#101010] border outline-none shadow-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-150 ${department
                ? 'border-[#0066FF] bg-[#0066FF1A] text-[#0066FF]'
                : 'border-[#E5E7EB] dark:border-[#1C1C1C] text-[#5C6370] dark:text-[#8B8FA8]'
                }`}
              style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
            >
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-[#E5E7EB] dark:border-[#1C1C1C] shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-w-[200px]">
              <SelectItem value="all-deps" className="rounded-xl cursor-pointer">All Departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id} className="rounded-xl cursor-pointer">{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <div className="relative">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger
              className={`w-[140px] pl-4 pr-3 py-2 rounded-full text-[13px] bg-white dark:bg-[#101010] border outline-none shadow-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-150 ${category
                ? 'border-[#0066FF] bg-[#0066FF1A] text-[#0066FF]'
                : 'border-[#E5E7EB] dark:border-[#1C1C1C] text-[#5C6370] dark:text-[#8B8FA8]'
                }`}
              style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
            >
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-[#E5E7EB] dark:border-[#1C1C1C] shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
              <SelectItem value="all-cats" className="rounded-xl cursor-pointer">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.name} value={c.name} className="rounded-xl cursor-pointer">{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

// ─── Lean project card (homepage grid) ───────────────────────────────────────

function LeanProjectCard({ project, index }: { project: Project; index: number }) {
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
      transition={{ duration: 0.28, ease: 'easeOut', delay: Math.min(index, 7) * 0.04 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => navigate(`/projects/${project.id}`)}
      className="rounded-2xl border border-[#E5E7EB] dark:border-[#1C1C1C] bg-white dark:bg-[#101010] p-6 cursor-pointer transition-all duration-150"
      style={{
        boxShadow: hovered ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
      }}
    >
      {/* Top row: categories + arrow */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex flex-wrap gap-1.5">
          <span
            className="px-2.5 py-1 rounded-full text-[11px] font-medium"
            style={{ backgroundColor: catStyle.bg, color: catStyle.text, fontFamily: 'var(--font-body)' }}
          >
            {topCategory}
          </span>
          {extraTags > 0 && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#F0F2F5] dark:bg-[#181818] text-[#9CA3AF]">
              +{extraTags}
            </span>
          )}
        </div>
        <ArrowUpRight
          size={18}
          className="flex-shrink-0 mt-0.5 transition-colors duration-150"
          style={{ color: hovered ? '#0066FF' : '#9CA3AF' }}
        />
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

      {/* Authors */}
      <p className="text-[13px] text-[#9CA3AF] mb-4" style={{ fontFamily: 'var(--font-body)' }}>
        {project.authors.map((a) => a.display_name ?? a.full_name).join(', ')}
      </p>

      {/* Divider */}
      <div className="h-px bg-[#E5E7EB] dark:bg-[#1C1C1C] mb-3" />

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-[#9CA3AF]">
          <DownloadSimple size={14} />
          <span className="text-[12px]" style={{ fontFamily: 'var(--font-body)' }}>
            {formatNumber(project.download_count)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[#9CA3AF]">
          <CalendarBlank size={14} />
          <span className="text-[12px]" style={{ fontFamily: 'var(--font-body)' }}>
            {project.year}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Hero section ─────────────────────────────────────────────────────────────

function HeroSection() {
  const { user } = useSession()
  const navigate = useNavigate()
  const [departments, setDepartments] = useState<Department[]>([])
  const [categories, setCategories] = useState<AICategory[]>([])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    publicApi.departments().then((r) => { if (r.success) setDepartments(r.data) })
    publicApi.categories().then((r) => { if (r.success) setCategories(r.data) })

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % PHRASES.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  const handleSearch = (q: string, dept: string, cat: string) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (dept) params.set('department', dept)
    if (cat) params.set('category', cat)
    navigate(`/projects?${params.toString()}`)
  }

  return (
    <section className="pt-20 pb-16 px-5 md:px-12 text-center">
      <div className="max-w-[1200px] mx-auto">
        {/* Small wordmark above headline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut', delay: 0.05 }}
          className="flex items-center justify-center gap-2 mb-8"
        >
          <InquisiaLogo className="w-6 h-6" />
          <span className="text-[15px] text-[#5C6370] dark:text-[#8B8FA8]" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
            inquisia.
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: 'easeOut', delay: 0.1 }}
          className="mb-8"
        >
          <h1
            className="mb-0 flex flex-col items-center"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(42px, 7vw, 92px)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}
          >
            <span className="text-[#0A0A0A] dark:text-[#F5F5F5]">Inquire</span>

            <div className="relative h-[1.3em] flex items-center justify-center w-full">
              <SplitText
                key={index}
                text={PHRASES[index]}
                className="absolute text-[#0066FF] py-2"
                delay={50}
                duration={1.25}
                ease="elastic.out(1, 0.3)"
                splitType="chars"
                from={{ opacity: 0, y: 40 }}
                to={{ opacity: 1, y: 0 }}
              />
            </div>

            <span className="text-[#0A0A0A] dark:text-[#F5F5F5]">Before you research.</span>
          </h1>
        </motion.div>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut', delay: 0.18 }}
          className="text-[16px] text-[#5C6370] dark:text-[#8B8FA8] mb-10 max-w-[560px] mx-auto"
          style={{ fontFamily: 'var(--font-body)', lineHeight: 1.65 }}
        >
          Discover, explore, and preserve academic research. Browse thousands of final year projects across all departments.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut', delay: 0.22 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12"
        >
          <a
            href="/projects"
            className="px-6 py-3 rounded-full text-[14px] text-[#5C6370] dark:text-[#8B8FA8] border border-[#E5E7EB] dark:border-[#1C1C1C] hover:border-[#0066FF] hover:text-[#0066FF] transition-colors duration-150"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
          >
            Browse Repositories
          </a>
          {user?.role === 'student' && (
            <a
              href="/upload"
              className="px-6 py-3 rounded-full text-[14px] text-white bg-[#0066FF] hover:bg-[#0052CC] transition-colors duration-150 shadow-sm"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
            >
              Upload a Thesis
            </a>
          )}
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut', delay: 0.28 }}
        >
          <HeroSearchBar
            departments={departments}
            categories={categories}
            onSearch={handleSearch}
          />
        </motion.div>
      </div>
    </section >
  )
}

// ─── Featured projects section ────────────────────────────────────────────────

function FeaturedProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    projectsApi.list({ limit: 6 }).then((res) => {
      if (res.success) {
        setProjects(res.data.items)
      } else {
        setError(res.error)
      }
      setLoading(false)
    })
  }, [])

  return (
    <section ref={sectionRef} className="py-24 px-5 md:px-12 bg-[#F7F8FA] dark:bg-[#101010]">
      <div className="max-w-[1200px] mx-auto">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'clamp(28px, 4vw, 40px)',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
            className="mb-3"
          >
            Recently Featured
          </h2>
          <p
            className="text-[15px] text-[#9CA3AF]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Latest approved research from our academic community
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonProjectCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-[#9CA3AF] text-[14px]">Could not load projects. Please try again.</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <MagnifyingGlass size={48} weight="thin" className="text-[#9CA3AF] mx-auto mb-4" />
            <p className="text-[15px] text-[#9CA3AF]">No projects yet. Be the first to submit!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {projects.map((project, i) => (
              visible && <LeanProjectCard key={project.id} project={project} index={i} />
            ))}
          </div>
        )}

        {/* View all button */}
        {!loading && projects.length > 0 && (
          <div className="text-center mt-10">
            <a
              href="/projects"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] text-[#0066FF] border border-[#0066FF] hover:bg-[#0066FF1A] transition-colors duration-150"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
            >
              View all projects
              <ArrowUpRight size={16} />
            </a>
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function HomePage() {
  return (
    <div>
      <HeroSection />
      <FeaturedProjects />
    </div>
  )
}
