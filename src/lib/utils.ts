import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ─── Tailwind utility ─────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// ─── Deterministic color from string ─────────────────────────────────────────

const AVATAR_COLORS = [
  '#0066FF', '#1A75FF', '#3385FF', '#0052CC', '#0047B3',
  '#0066FF', '#1A75FF', '#3385FF', '#0052CC', '#0047B3',
]

export function getAvatarColor(id?: string | null): string {
  if (!id) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// ─── Category pill colors — single accent, all blue ───────────────────────────

interface CategoryStyle {
  bg: string
  text: string
  darkBg: string
  darkText: string
}

const BLUE_STYLE: CategoryStyle = {
  bg: '#EBF2FF',
  text: '#0052CC',
  darkBg: '#0A1628',
  darkText: '#3385FF',
}

export function getCategoryStyle(_category: string, isDark = false): { bg: string; text: string } {
  return isDark
    ? { bg: BLUE_STYLE.darkBg, text: BLUE_STYLE.darkText }
    : { bg: BLUE_STYLE.bg, text: BLUE_STYLE.text }
}

// ─── Initials ─────────────────────────────────────────────────────────────────

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0 || !parts[0]) return '?'
  if (parts.length === 1) {
    const p = parts[0]
    if (p.length === 1) return p[0].toUpperCase()
    return p[0].toUpperCase() + p[1].toLowerCase()
  }
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

// ─── Relative Time ────────────────────────────────────────────────────────────

export function relativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  if (weeks < 5) return `${weeks}w ago`
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

// ─── Format number ────────────────────────────────────────────────────────────

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

// ─── Truncate ────────────────────────────────────────────────────────────────

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 3) + '...'
}

// ─── Citation generators ──────────────────────────────────────────────────────

interface CitationProject {
  title: string
  authors: { full_name: string | null }[]
  year: number
  department_name: string | null
  supervisor_name: string | null
}

export function generateCitation(project: CitationProject, format: 'APA' | 'IEEE' | 'MLA' | 'CHICAGO'): string {
  const authors = project.authors.map((a) => a.full_name ?? 'Unknown').filter(Boolean)
  const year = project.year
  const title = project.title
  const institution = 'Babcock University'
  const dept = project.department_name ?? 'Department of Computer Science'

  switch (format) {
    case 'APA': {
      const authorStr = authors.length === 1
        ? formatAPAAuthor(authors[0])
        : authors.slice(0, -1).map(formatAPAAuthor).join(', ') + ', & ' + formatAPAAuthor(authors[authors.length - 1])
      return `${authorStr} (${year}). ${title} [Final Year Project]. ${dept}, ${institution}.`
    }
    case 'IEEE': {
      const authorStr = authors.map(formatIEEEAuthor).join(', ')
      return `${authorStr}, "${title}," Final Year Project, ${dept}, ${institution}, ${year}.`
    }
    case 'MLA': {
      const first = authors[0] ? formatMLAFirstAuthor(authors[0]) : 'Unknown'
      const rest = authors.slice(1).join(', ')
      const authorStr = rest ? `${first}, and ${rest}` : first
      return `${authorStr}. "${title}." Final Year Project, ${institution}, ${year}.`
    }
    case 'CHICAGO': {
      const authorStr = authors.map(formatAPAAuthor).join(', ')
      return `${authorStr}. "${title}." Final Year Project, ${dept}, ${institution}, ${year}.`
    }
  }
}

function formatAPAAuthor(name: string): string {
  const parts = name.trim().split(/\s+/)
  const last = parts[parts.length - 1]
  const initials = parts.slice(0, -1).map((p) => p[0] + '.').join(' ')
  return `${last}, ${initials}`
}

function formatIEEEAuthor(name: string): string {
  const parts = name.trim().split(/\s+/)
  const last = parts[parts.length - 1]
  const initials = parts.slice(0, -1).map((p) => p[0] + '.').join('. ')
  return `${initials}. ${last}`
}

function formatMLAFirstAuthor(name: string): string {
  const parts = name.trim().split(/\s+/)
  const last = parts[parts.length - 1]
  const first = parts.slice(0, -1).join(' ')
  return `${last}, ${first}`
}