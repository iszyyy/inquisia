import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Eye, EyeSlash, WarningCircle } from 'phosphor-react'
import { motion } from 'motion/react'
import { useSession } from '../../context/SessionContext'
import { authApi } from '../../lib/api'
import { toast } from 'sonner'
import { InquisiaLogo } from '../components/ui/InquisiaLogo'

// ─── Auth split layout ────────────────────────────────────────────────────────

function DotGrid() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.12 }}>
      <defs>
        <pattern id="auth-dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="white" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#auth-dots)" />
    </svg>
  )
}

function FloatingCard() {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
      className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-5 w-72"
    >
      <div className="flex gap-2 mb-3">
        <span className="px-2.5 py-1 rounded-full text-[11px] bg-white/20 text-white/90">Computer Science</span>
        <span className="px-2.5 py-1 rounded-full text-[11px] bg-white/20 text-white/90">Research</span>
      </div>
      <h3 className="text-white text-[15px] mb-2 leading-snug" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
        Enhancing Digital Knowledge Preservation Systems
      </h3>
      <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
        <span className="text-white/60 text-[12px]">↓ 128 downloads</span>
        <span className="text-white/60 text-[12px]">2026</span>
      </div>
    </motion.div>
  )
}

function RightPanel() {
  return (
    <div className="hidden lg:flex relative flex-1 bg-[#0066FF] flex-col items-center justify-center p-12 overflow-hidden">
      <DotGrid />
      <div className="relative z-10 text-center max-w-sm">
        <h2 className="text-white text-[36px] leading-tight mb-4" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.02em' }}>
          The academic research platform Babcock deserves.
        </h2>
        <p className="text-white/70 text-[15px] mb-10" style={{ fontFamily: 'var(--font-body)', lineHeight: 1.65 }}>
          Browse, discover, and preserve thousands of final year projects from Nigeria's leading university.
        </p>
        <FloatingCard />
      </div>
    </div>
  )
}

// ─── Floating label input ─────────────────────────────────────────────────────

interface FloatingInputProps {
  id: string
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  error?: string
  autoComplete?: string
}

function FloatingInput({ id, label, type = 'text', value, onChange, error, autoComplete }: FloatingInputProps) {
  const [focused, setFocused] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const raised = focused || value.length > 0
  const inputType = type === 'password' ? (showPwd ? 'text' : 'password') : type

  return (
    <div className="relative">
      <div
        className={`relative rounded-full border transition-all duration-150 ${error
          ? 'border-red-500'
          : focused
            ? 'border-[#0066FF] shadow-[0_0_0_3px_rgba(0,102,255,0.15)]'
            : 'border-[#E5E7EB] dark:border-[#1C1C1C]'
          } bg-white dark:bg-[#101010]`}
      >
        <label
          htmlFor={id}
          className={`absolute left-4 transition-all duration-150 pointer-events-none ${raised
            ? 'top-1.5 text-[11px] text-[#9CA3AF]'
            : 'top-1/2 -translate-y-1/2 text-[14px] text-[#9CA3AF]'
            }`}
          style={{ fontFamily: 'var(--font-body)', fontWeight: raised ? 500 : 400 }}
        >
          {label}
        </label>
        <input
          id={id}
          type={inputType}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full bg-transparent outline-none px-4 rounded-full text-[14px] text-[#0A0A0A] dark:text-[#F5F5F5] ${raised ? 'pt-5 pb-2' : 'py-3.5'}`}
          style={{ fontFamily: 'var(--font-body)' }}
        />
        {type === 'password' && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#5C6370]"
          >
            {showPwd ? <EyeSlash size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1 mt-1.5 ml-4 text-[12px] text-red-500" style={{ fontFamily: 'var(--font-body)' }}>
          <WarningCircle size={12} />
          {error}
        </p>
      )}
    </div>
  )
}

// ─── Login form ───────────────────────────────────────────────────────────────

export function LoginPage() {
  const { login, user, isLoading } = useSession()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnUrl = searchParams.get('redirect') || '/'

  useEffect(() => {
    if (!isLoading && user) navigate(returnUrl, { replace: true })
  }, [user, isLoading, navigate, returnUrl])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    setError(null)

    const res = await authApi.login(email, password)
    if (res.success) {
      login(res.data)
      toast.success('Welcome back!')
      navigate(returnUrl, { replace: true })
    } else {
      setError(res.error || 'Invalid email or password. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Left — Form */}
      <div className="flex-1 flex flex-col px-8 py-12 max-w-lg mx-auto lg:mx-0">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mb-12">
          <InquisiaLogo className="w-7 h-7" />
          <span className="text-[17px]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '-0.02em' }}>
            inquisia.
          </span>
        </Link>

        {/* Heading */}
        <div className="mb-8">
          <h1
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.02em' }}
            className="mb-2 text-[#0A0A0A] dark:text-[#F5F5F5]"
          >
            Welcome Back
          </h1>
          <p className="text-[15px] text-[#5C6370] dark:text-[#8B8FA8]" style={{ fontFamily: 'var(--font-body)' }}>
            Sign in to your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800"
            >
              <p className="text-[13px] text-red-600 dark:text-red-400 flex items-center gap-2" style={{ fontFamily: 'var(--font-body)' }}>
                <WarningCircle size={14} />
                {error}
              </p>
            </motion.div>
          )}

          <FloatingInput
            id="email"
            label="Email address"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />

          <FloatingInput
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-[13px] text-[#5C6370] hover:text-[#0066FF] transition-colors" style={{ fontFamily: 'var(--font-body)' }}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full text-[14px] text-white bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              'Log In'
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-[#E5E7EB] dark:bg-[#1C1C1C]" />
          <span className="text-[12px] text-[#9CA3AF]">or</span>
          <div className="flex-1 h-px bg-[#E5E7EB] dark:bg-[#1C1C1C]" />
        </div>

        <p className="mt-6 text-center text-[14px] text-[#5C6370] dark:text-[#8B8FA8]" style={{ fontFamily: 'var(--font-body)' }}>
          Don't have an account?{' '}
          <Link to="/register" className="text-[#0066FF] hover:underline font-medium">
            Register
          </Link>
        </p>
      </div>

      {/* Right — Decorative */}
      <RightPanel />
    </div>
  )
}
