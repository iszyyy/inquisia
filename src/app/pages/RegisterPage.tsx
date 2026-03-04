import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Eye, EyeSlash, WarningCircle } from 'phosphor-react'
import { motion, AnimatePresence } from 'motion/react'
import { useSession } from '../../context/SessionContext'
import { authApi, publicApi } from '../../lib/api'
import type { Department } from '../../lib/types'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { InquisiaLogo } from '../components/ui/InquisiaLogo'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"

type DetectedRole = 'student' | 'supervisor' | 'public' | null

function detectRole(email: string): DetectedRole {
  if (email.includes('@student.babcock.edu.ng')) return 'student'
  if (email.includes('@babcock.edu.ng')) return 'supervisor'
  if (email.includes('@')) return 'public'
  return null
}

function DotGrid() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.12 }}>
      <defs>
        <pattern id="auth-dots-reg" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="white" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#auth-dots-reg)" />
    </svg>
  )
}

function RightPanel() {
  return (
    <div className="hidden lg:flex relative flex-1 bg-[#0066FF] flex-col items-center justify-center p-12 overflow-hidden">
      <DotGrid />
      <div className="relative z-10 text-center max-w-sm">
        <h2 className="text-white text-[36px] leading-tight mb-4" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Your research deserves to be found.
        </h2>
        <p className="text-white/70 text-[15px]" style={{ fontFamily: 'var(--font-body)', lineHeight: 1.65 }}>
          Join thousands of Babcock students and faculty sharing knowledge that inspires the next generation of researchers.
        </p>
        <div className="mt-10 flex flex-col gap-3 items-center">
          {['1,247+ Projects', '3,891 Students', '68 Supervisors', '48k+ Downloads'].map((stat) => (
            <div key={stat} className="px-4 py-2 rounded-full bg-white/15 text-white text-[13px]" style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>
              {stat}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FloatingInput({
  id, label, type = 'text', value, onChange, error, autoComplete,
}: {
  id: string; label: string; type?: string; value: string
  onChange: (v: string) => void; error?: string; autoComplete?: string
}) {
  const [focused, setFocused] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const raised = focused || value.length > 0
  const inputType = type === 'password' ? (showPwd ? 'text' : 'password') : type

  return (
    <div className="relative">
      <div className={`relative rounded-full border transition-all duration-150 ${error ? 'border-red-500' : focused ? 'border-[#0066FF] shadow-[0_0_0_3px_rgba(0,102,255,0.15)]' : 'border-[#E5E7EB] dark:border-[#1C1C1C]'
        } bg-white dark:bg-[#101010]`}>
        <label htmlFor={id} className={`absolute left-4 transition-all duration-150 pointer-events-none ${raised ? 'top-1.5 text-[11px] text-[#9CA3AF]' : 'top-1/2 -translate-y-1/2 text-[14px] text-[#9CA3AF]'
          }`} style={{ fontFamily: 'var(--font-body)', fontWeight: raised ? 500 : 400 }}>
          {label}
        </label>
        <input id={id} type={inputType} value={value} autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className={`w-full bg-transparent outline-none px-4 rounded-full text-[14px] text-[#0A0A0A] dark:text-[#F5F5F5] ${raised ? 'pt-5 pb-2' : 'py-3.5'}`}
          style={{ fontFamily: 'var(--font-body)' }}
        />
        {type === 'password' && (
          <button type="button" tabIndex={-1} onClick={() => setShowPwd((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#5C6370]">
            {showPwd ? <EyeSlash size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1 mt-1.5 ml-4 text-[12px] text-red-500">
          <WarningCircle size={12} />{error}
        </p>
      )}
    </div>
  )
}

function FloatingSelect({
  id, label, value, onChange, options,
}: {
  id: string; label: string; value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  const [focused, setFocused] = useState(false)
  const raised = focused || value.length > 0

  return (
    <div className={`relative rounded-full border transition-all duration-150 h-[52px] ${focused ? 'border-[#0066FF] shadow-[0_0_0_3px_rgba(0,102,255,0.15)]' : 'border-[#E5E7EB] dark:border-[#1C1C1C]'
      } bg-white dark:bg-[#101010]`}>
      <label htmlFor={id} className={`absolute left-4 z-10 transition-all duration-150 pointer-events-none ${raised ? 'top-1.5 text-[11px] text-[#9CA3AF]' : 'top-1/2 -translate-y-1/2 text-[14px] text-[#9CA3AF]'
        }`} style={{ fontFamily: 'var(--font-body)', fontWeight: raised ? 500 : 400 }}>
        {label}
      </label>
      <Select value={value} onValueChange={onChange} onOpenChange={(open) => setFocused(open)}>
        <SelectTrigger
          id={id}
          className={`w-full h-full bg-transparent border-0 ring-0 focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 px-4 rounded-full text-[14px] text-[#0A0A0A] dark:text-[#F5F5F5] shadow-none ${raised ? 'pt-4' : ''}`}
          style={{ fontFamily: 'var(--font-body)' }}
        >
          <SelectValue placeholder="" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-[#E5E7EB] dark:border-[#1C1C1C] shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="rounded-xl cursor-pointer">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function RegisterPage() {
  const { login } = useSession()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [detectedRole, setDetectedRole] = useState<DetectedRole>(null)
  const [departments, setDepartments] = useState<Department[]>([])

  // Student fields
  const [matricNo, setMatricNo] = useState('')
  const [fullName, setFullName] = useState('')
  const [level, setLevel] = useState('')
  const [departmentId, setDepartmentId] = useState('')

  // Supervisor fields
  const [staffId, setStaffId] = useState('')
  const [degrees, setDegrees] = useState('')

  // Public fields
  const [displayName, setDisplayName] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    publicApi.departments().then((r) => { if (r.success) setDepartments(r.data) })
  }, [])

  const handleEmailBlur = () => {
    setDetectedRole(detectRole(email))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const role = detectedRole ?? 'public'
    const baseData = { email, password, role }

    let data: Record<string, unknown>
    if (role === 'student') {
      // `level` comes from an HTML <select> as a string.
      data = { ...baseData, matric_no: matricNo, full_name: fullName, display_name: displayName, level, department_id: departmentId }
    } else if (role === 'supervisor') {
      data = { ...baseData, staff_id: staffId, degrees, full_name: fullName, display_name: displayName, department_id: departmentId }
    } else {
      data = { ...baseData, display_name: displayName, full_name: fullName }
    }

    const res = await authApi.register(data)
    if (res.success) {
      login(res.data)
      toast.success('Account created! Welcome to Inquisia.')
      navigate('/dashboard')
    } else {
      setError(res.error)
    }
    setLoading(false)
  }

  const levelOptions = ['100', '200', '300', '400', '500'].map((l) => ({ value: l, label: `${l} Level` }))
  const deptOptions = departments.map((d) => ({ value: d.id, label: d.name }))

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Left */}
      <div className="flex-1 flex flex-col px-8 py-12 max-w-lg mx-auto lg:mx-0 overflow-y-auto">
        <Link to="/" className="flex items-center gap-2 mb-12">
          <InquisiaLogo className="w-7 h-7" />
          <span className="text-[17px]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '-0.02em' }}>inquisia.</span>
        </Link>

        <div className="mb-8">
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.02em' }} className="mb-2 text-[#0A0A0A] dark:text-[#F5F5F5]">
            Join Inquisia
          </h1>
          <p className="text-[15px] text-[#5C6370] dark:text-[#8B8FA8]" style={{ fontFamily: 'var(--font-body)' }}>Create your account</p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
              <p className="text-[13px] text-red-600 dark:text-red-400 flex items-center gap-2">
                <WarningCircle size={14} />{error}
              </p>
            </div>
          )}

          {/* Email */}
          <FloatingInput id="reg-email" label="Email address" type="email" value={email}
            onChange={(v) => { setEmail(v); setDetectedRole(detectRole(v)) }}
            autoComplete="email"
          />

          {/* Role detection note */}
          {email.includes('@') && (
            <div className="relative ml-4">
              <div className="h-4 w-px bg-[#E5E7EB] dark:bg-[#1C1C1C] absolute left-0 top-0" />
            </div>
          )}
          <p className="text-[12px] text-[#9CA3AF] ml-4 italic" style={{ fontFamily: 'var(--font-body)' }}>
            Your role is assigned automatically based on your email.
          </p>

          {/* Dynamic fields */}
          <AnimatePresence>
            {detectedRole === 'student' && (
              <motion.div key="student-fields" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="space-y-4">
                <div className="p-3 rounded-2xl bg-[#0066FF0D] border border-[#0066FF26]">
                  <p className="text-[12px] text-[#0066FF]" style={{ fontFamily: 'var(--font-body)' }}>Detected: Student account</p>
                </div>
                <FloatingInput id="display-name-stu" label="Display name" value={displayName} onChange={setDisplayName} />
                <FloatingInput id="full-name" label="Full name" value={fullName} onChange={setFullName} />
                <FloatingInput id="matric-no" label="Matric number (e.g. 19/0811/CS)" value={matricNo} onChange={setMatricNo} />
                <FloatingSelect id="department" label="Department" value={departmentId} onChange={setDepartmentId} options={deptOptions} />
                <FloatingSelect id="level" label="Level" value={level} onChange={setLevel} options={levelOptions} />
              </motion.div>
            )}

            {detectedRole === 'supervisor' && (
              <motion.div key="supervisor-fields" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="space-y-4">
                <div className="p-3 rounded-2xl bg-[#0066FF0D] border border-[#0066FF26]">
                  <p className="text-[12px] text-[#0066FF]" style={{ fontFamily: 'var(--font-body)' }}>Detected: Supervisor account — pending admin verification</p>
                </div>
                <FloatingInput id="display-name-sup" label="Display name" value={displayName} onChange={setDisplayName} />
                <FloatingInput id="full-name-sup" label="Full name" value={fullName} onChange={setFullName} />
                <FloatingInput id="staff-id" label="Staff ID" value={staffId} onChange={setStaffId} />
                <FloatingInput id="degrees" label="Degrees (e.g. Ph.D. Computer Science)" value={degrees} onChange={setDegrees} />
                <FloatingSelect id="dept-sup" label="Department" value={departmentId} onChange={setDepartmentId} options={deptOptions} />
              </motion.div>
            )}

            {detectedRole === 'public' && (
              <motion.div key="public-fields" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="space-y-4">
                <div className="p-3 rounded-2xl bg-[#F0F2F5] dark:bg-[#181818]">
                  <p className="text-[12px] text-[#9CA3AF]" style={{ fontFamily: 'var(--font-body)' }}>Detected: Public account (read-only access)</p>
                </div>
                <FloatingInput id="display-name" label="Display name" value={displayName} onChange={setDisplayName} />
                <FloatingInput id="full-name-pub" label="Full name (optional)" value={fullName} onChange={setFullName} />
              </motion.div>
            )}

            {email.length > 5 && !detectedRole && (
              <motion.div key="no-role" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <FloatingInput id="dn" label="Display name" value={displayName} onChange={setDisplayName} />
                <FloatingInput id="fn" label="Full name (optional)" value={fullName} onChange={setFullName} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Password */}
          <FloatingInput id="reg-password" label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />

          <button
            type="submit"
            onClick={() => { if (!detectedRole) setDetectedRole(detectRole(email)) }}
            disabled={loading}
            className="w-full py-3.5 rounded-full text-[14px] text-white bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-60 transition-all duration-150 flex items-center justify-center"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
          >
            {loading ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-[14px] text-[#5C6370] dark:text-[#8B8FA8]" style={{ fontFamily: 'var(--font-body)' }}>
          Already have an account?{' '}
          <Link to="/login" className="text-[#0066FF] hover:underline font-medium">Log in</Link>
        </p>
      </div>

      <RightPanel />
    </div >
  )
}