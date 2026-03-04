import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  ArrowClockwise, CloudArrowUp, GitBranch, Terminal,
  CheckCircle, XCircle, WarningCircle, Info,
  FileJs, FileCss, FileCode, Desktop, HardDrive,
  Circle, CaretDown, CaretUp, Key,
} from 'phosphor-react'
import { apiFetch } from '../../../lib/api'
import { toast } from 'sonner'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ServerStatus {
  git: {
    branch: string
    recent_logs: string[]
    dirty_files: string[]
  }
  pm2: {
    status: string
    restarts: number
    uptime: number
    memory_mb: number
    cpu_pct: number
  } | null
  system: {
    uptime: string
    disk: string
    memory: string
    node: string
  }
  backend_root: string
  frontend_root: string
  timestamp: string
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

interface UploadResult {
  state: UploadState
  message: string
  details?: { file: string; status: string; error?: string }[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const BASE_URL = (import.meta as any).env?.VITE_API_URL ?? ''

async function apiCall(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
  })
  return res.json()
}

function StatusDot({ status }: { status?: string }) {
  const color =
    status === 'online'  ? 'bg-emerald-500' :
    status === 'stopped' ? 'bg-red-500' :
    status === 'errored' ? 'bg-red-500' : 'bg-gray-400'
  return <span className={`inline-block w-2 h-2 rounded-full ${color} mr-2`} />
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#101010] rounded-2xl border border-[#E5E7EB] dark:border-[#1C1C1C] overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#E5E7EB] dark:border-[#1C1C1C]">
        <span className="text-[#0066FF]">{icon}</span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '15px' }}
          className="text-[#0A0A0A] dark:text-[#F5F5F5]">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function ResultBanner({ result }: { result: UploadResult | null }) {
  if (!result || result.state === 'idle') return null
  const isOk = result.state === 'success'
  return (
    <div className={`mt-3 rounded-xl p-3.5 text-[13px] flex items-start gap-2.5 ${
      isOk
        ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
        : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
    }`} style={{ fontFamily: 'var(--font-body)' }}>
      {isOk ? <CheckCircle size={16} weight="fill" className="flex-shrink-0 mt-0.5" /> :
               <XCircle    size={16} weight="fill" className="flex-shrink-0 mt-0.5" />}
      <div>
        <p>{result.message}</p>
        {result.details && (
          <ul className="mt-1.5 space-y-0.5 opacity-80">
            {result.details.map((d, i) => (
              <li key={i} className="flex items-center gap-1.5">
                {d.status === 'ok' ? '✓' : '✗'} {d.file}
                {d.error && <span className="opacity-70">— {d.error}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ── Drop Zone ─────────────────────────────────────────────────────────────────

function DropZone({
  accept,
  multiple,
  label,
  hint,
  onFiles,
  uploading,
}: {
  accept: string
  multiple?: boolean
  label: string
  hint: string
  onFiles: (files: File[]) => void
  uploading: boolean
}) {
  const [dragging, setDragging] = useState(false)
  const [selected, setSelected] = useState<File[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handle = (files: FileList | null) => {
    if (!files?.length) return
    const arr = Array.from(files)
    setSelected(arr)
    onFiles(arr)
  }

  return (
    <div>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files) }}
        className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 cursor-pointer transition-all ${
          dragging
            ? 'border-[#0066FF] bg-[#0066FF0D]'
            : uploading
            ? 'border-[#E5E7EB] dark:border-[#1C1C1C] bg-[#F7F8FA] dark:bg-[#181818] cursor-not-allowed opacity-60'
            : 'border-[#E5E7EB] dark:border-[#2A2A2A] hover:border-[#0066FF] hover:bg-[#F7F8FA] dark:hover:bg-[#181818]'
        }`}
      >
        <CloudArrowUp size={32} weight="thin" className={dragging ? 'text-[#0066FF]' : 'text-[#9CA3AF]'} />
        <div className="text-center">
          <p className="text-[14px] font-medium text-[#0A0A0A] dark:text-[#F5F5F5]" style={{ fontFamily: 'var(--font-body)' }}>
            {selected.length > 0
              ? `${selected.length} file${selected.length > 1 ? 's' : ''} selected`
              : label}
          </p>
          <p className="text-[12px] text-[#9CA3AF] mt-0.5" style={{ fontFamily: 'var(--font-body)' }}>{hint}</p>
        </div>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/60 dark:bg-black/60">
            <div className="w-6 h-6 rounded-full border-2 border-[#E5E7EB] border-t-[#0066FF] animate-spin" />
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handle(e.target.files)}
        disabled={uploading}
      />
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function AdminUpdatePage() {
  const [status, setStatus]           = useState<ServerStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [logs, setLogs]               = useState<string[]>([])
  const [logsOpen, setLogsOpen]       = useState(false)
  const [logsLoading, setLogsLoading] = useState(false)

  // Individual file upload
  const [fileResult, setFileResult]   = useState<UploadResult | null>(null)
  const [fileUploading, setFileUploading] = useState(false)
  const [fileTargetDir, setFileTargetDir] = useState('src/routes')

  // Backend zip
  const [backendResult, setBackendResult] = useState<UploadResult | null>(null)
  const [backendUploading, setBackendUploading] = useState(false)

  // Frontend zip
  const [frontendResult, setFrontendResult] = useState<UploadResult | null>(null)
  const [frontendUploading, setFrontendUploading] = useState(false)

  // Git pull
  const [gitLoading, setGitLoading]   = useState(false)
  const [gitResult, setGitResult]     = useState<UploadResult | null>(null)

  // Restart
  const [restarting, setRestarting]   = useState(false)

  // Env update
  const [envKey, setEnvKey]           = useState('')
  const [envValue, setEnvValue]       = useState('')
  const [envLoading, setEnvLoading]   = useState(false)
  const [envResult, setEnvResult]     = useState<UploadResult | null>(null)

  const fetchStatus = useCallback(async () => {
    setStatusLoading(true)
    try {
      const data = await apiCall('/api/update/status')
      if (data.success) setStatus(data.data)
    } catch { /* ignore */ }
    setStatusLoading(false)
  }, [])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  const fetchLogs = async () => {
    setLogsLoading(true)
    try {
      const data = await apiCall('/api/update/logs?lines=80')
      if (data.success) setLogs(data.data.logs)
    } catch { /* ignore */ }
    setLogsLoading(false)
  }

  const toggleLogs = () => {
    if (!logsOpen) fetchLogs()
    setLogsOpen(v => !v)
  }

  // ── Upload individual files ────────────────────────────────────────────────
  const handleFileUpload = async (files: File[]) => {
    if (!files.length) return
    setFileUploading(true)
    setFileResult({ state: 'uploading', message: `Uploading ${files.length} file(s)...` })
    try {
      const fd = new FormData()
      files.forEach(f => fd.append('files', f))
      fd.append('target_dir', fileTargetDir)
      const res = await fetch(`${BASE_URL}/api/update/files`, {
        method: 'POST', body: fd, credentials: 'include',
      })
      const data = await res.json()
      if (data.success && data.data.success) {
        setFileResult({ state: 'success', message: data.data.message, details: data.data.results })
        toast.success('Files deployed successfully')
        fetchStatus()
      } else {
        setFileResult({ state: 'error', message: data.data?.message || data.error || 'Upload failed', details: data.data?.results })
        toast.error('Some files failed to deploy')
      }
    } catch (e: any) {
      setFileResult({ state: 'error', message: e.message || 'Network error' })
    }
    setFileUploading(false)
  }

  // ── Upload backend zip ─────────────────────────────────────────────────────
  const handleBackendZip = async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setBackendUploading(true)
    setBackendResult({ state: 'uploading', message: 'Extracting backend zip...' })
    try {
      const fd = new FormData()
      fd.append('zip', file)
      const res = await fetch(`${BASE_URL}/api/update/zip`, {
        method: 'POST', body: fd, credentials: 'include',
      })
      const data = await res.json()
      if (data.success) {
        setBackendResult({ state: 'success', message: data.data.message, details: data.data.results })
        toast.success('Backend zip deployed')
        fetchStatus()
      } else {
        setBackendResult({ state: 'error', message: data.error || 'Failed to extract zip' })
        toast.error('Backend zip deployment failed')
      }
    } catch (e: any) {
      setBackendResult({ state: 'error', message: e.message || 'Network error' })
    }
    setBackendUploading(false)
  }

  // ── Upload frontend zip ────────────────────────────────────────────────────
  const handleFrontendZip = async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setFrontendUploading(true)
    setFrontendResult({ state: 'uploading', message: 'Deploying frontend...' })
    try {
      const fd = new FormData()
      fd.append('zip', file)
      const res = await fetch(`${BASE_URL}/api/update/frontend-zip`, {
        method: 'POST', body: fd, credentials: 'include',
      })
      const data = await res.json()
      if (data.success) {
        setFrontendResult({ state: 'success', message: data.data.message })
        toast.success('Frontend deployed successfully')
      } else {
        setFrontendResult({ state: 'error', message: data.error || 'Failed to deploy frontend' })
        toast.error('Frontend deployment failed')
      }
    } catch (e: any) {
      setFrontendResult({ state: 'error', message: e.message || 'Network error' })
    }
    setFrontendUploading(false)
  }

  // ── Git pull ───────────────────────────────────────────────────────────────
  const handleGitPull = async () => {
    setGitLoading(true)
    setGitResult({ state: 'uploading', message: 'Running git pull...' })
    try {
      const data = await apiCall('/api/update/git-pull', { method: 'POST' })
      if (data.success) {
        setGitResult({ state: data.data.success ? 'success' : 'error', message: data.data.message + '\n\n' + data.data.pull_output })
        if (data.data.success) { toast.success('Git pull successful'); fetchStatus() }
        else toast.error('Git pull had issues')
      } else {
        setGitResult({ state: 'error', message: data.error || 'Git pull failed' })
      }
    } catch (e: any) {
      setGitResult({ state: 'error', message: e.message })
    }
    setGitLoading(false)
  }

  // ── Restart ────────────────────────────────────────────────────────────────
  const handleRestart = async () => {
    setRestarting(true)
    try {
      await apiCall('/api/update/restart', { method: 'POST' })
      toast.success('Server restart initiated')
      setTimeout(fetchStatus, 3000)
    } catch { toast.error('Restart failed') }
    setRestarting(false)
  }

  // ── Env update ─────────────────────────────────────────────────────────────
  const handleEnvUpdate = async () => {
    if (!envKey.trim() || !envValue.trim()) return
    setEnvLoading(true)
    setEnvResult(null)
    try {
      const res = await fetch(`${BASE_URL}/api/update/env`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: { [envKey.trim()]: envValue.trim() } }),
      })
      const data = await res.json()
      if (data.success) {
        setEnvResult({ state: 'success', message: data.data.message })
        toast.success('Env var updated')
        setEnvKey(''); setEnvValue('')
        fetchStatus()
      } else {
        setEnvResult({ state: 'error', message: data.error || 'Failed to update env' })
        toast.error(data.error || 'Failed to update env')
      }
    } catch (e: any) {
      setEnvResult({ state: 'error', message: e.message })
    }
    setEnvLoading(false)
  }

  const font = { fontFamily: 'var(--font-body)' }
  const inputClass = `w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2A2A] bg-white dark:bg-[#181818] text-[14px] text-[#0A0A0A] dark:text-[#F5F5F5] outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF20] transition-all`

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '22px', letterSpacing: '-0.01em' }}
            className="text-[#0A0A0A] dark:text-[#F5F5F5]">
            Update System
          </h1>
          <p className="text-[13px] text-[#9CA3AF] mt-0.5" style={font}>
            Deploy backend files, update frontend, manage server
          </p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={statusLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#E5E7EB] dark:border-[#2A2A2A] text-[13px] text-[#5C6370] dark:text-[#8B8FA8] hover:text-[#0A0A0A] dark:hover:text-[#F5F5F5] hover:border-[#0066FF] transition-colors"
          style={font}
        >
          <ArrowClockwise size={14} className={statusLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Server Status */}
      <SectionCard title="Server Status" icon={<HardDrive size={16} />}>
        {statusLoading ? (
          <div className="flex items-center gap-2 text-[13px] text-[#9CA3AF]" style={font}>
            <div className="w-4 h-4 rounded-full border-2 border-[#E5E7EB] border-t-[#0066FF] animate-spin" />
            Loading status...
          </div>
        ) : status ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PM2 */}
            <div className="rounded-xl bg-[#F7F8FA] dark:bg-[#181818] p-4 space-y-2">
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider" style={font}>Process</p>
              <div className="flex items-center" style={font}>
                <StatusDot status={status.pm2?.status} />
                <span className="text-[14px] font-medium text-[#0A0A0A] dark:text-[#F5F5F5] capitalize">{status.pm2?.status || 'unknown'}</span>
              </div>
              {status.pm2 && (
                <div className="text-[12px] text-[#5C6370] dark:text-[#8B8FA8] space-y-1" style={font}>
                  <p>Memory: <span className="text-[#0A0A0A] dark:text-[#F5F5F5]">{status.pm2.memory_mb} MB</span></p>
                  <p>CPU: <span className="text-[#0A0A0A] dark:text-[#F5F5F5]">{status.pm2.cpu_pct}%</span></p>
                  <p>Restarts: <span className="text-[#0A0A0A] dark:text-[#F5F5F5]">{status.pm2.restarts}</span></p>
                </div>
              )}
            </div>

            {/* Git */}
            <div className="rounded-xl bg-[#F7F8FA] dark:bg-[#181818] p-4 space-y-2">
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider" style={font}>Git</p>
              <div className="flex items-center gap-1.5" style={font}>
                <GitBranch size={14} className="text-[#0066FF]" />
                <span className="text-[14px] font-medium text-[#0A0A0A] dark:text-[#F5F5F5]">{status.git.branch}</span>
                {status.git.dirty_files.length > 0 && (
                  <span className="text-[11px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                    {status.git.dirty_files.length} uncommitted
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                {status.git.recent_logs.slice(0, 3).map((l, i) => (
                  <p key={i} className="text-[11px] text-[#9CA3AF] font-mono truncate">{l}</p>
                ))}
              </div>
            </div>

            {/* System */}
            <div className="rounded-xl bg-[#F7F8FA] dark:bg-[#181818] p-4 space-y-2 md:col-span-2">
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider" style={font}>System</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]" style={font}>
                <div><span className="text-[#9CA3AF]">Node</span><br /><span className="text-[#0A0A0A] dark:text-[#F5F5F5]">{status.system.node}</span></div>
                <div><span className="text-[#9CA3AF]">Uptime</span><br /><span className="text-[#0A0A0A] dark:text-[#F5F5F5]">{status.system.uptime}</span></div>
                <div className="md:col-span-2"><span className="text-[#9CA3AF]">Disk</span><br /><span className="text-[#0A0A0A] dark:text-[#F5F5F5] font-mono text-[11px]">{status.system.disk}</span></div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-[#9CA3AF]" style={font}>Could not load status. Are you logged in as admin?</p>
        )}
      </SectionCard>

      {/* Deploy Individual Files */}
      <SectionCard title="Deploy Files" icon={<FileJs size={16} />}>
        <p className="text-[13px] text-[#5C6370] dark:text-[#8B8FA8] mb-4" style={font}>
          Upload individual <code className="bg-[#F0F2F5] dark:bg-[#1C1C1C] px-1 rounded text-[12px]">.js</code> files directly into the backend. Server restarts automatically.
        </p>

        <div className="mb-3">
          <label className="block text-[12px] font-medium text-[#5C6370] dark:text-[#8B8FA8] mb-1.5" style={font}>
            Target directory (relative to /opt/inquisia-backend/)
          </label>
          <select
            value={fileTargetDir}
            onChange={e => setFileTargetDir(e.target.value)}
            className={inputClass}
            style={font}
          >
            <option value="src/routes">src/routes</option>
            <option value="src/middleware">src/middleware</option>
            <option value="src/lib">src/lib</option>
            <option value="src">src (root — for index.js)</option>
          </select>
        </div>

        <DropZone
          accept=".js,.cjs,.mjs,.json"
          multiple
          label="Drop .js files or click to browse"
          hint="Multiple files supported — all go to the selected directory"
          onFiles={handleFileUpload}
          uploading={fileUploading}
        />
        <ResultBanner result={fileResult} />
      </SectionCard>

      {/* Backend ZIP */}
      <SectionCard title="Deploy Backend ZIP" icon={<FileCode size={16} />}>
        <p className="text-[13px] text-[#5C6370] dark:text-[#8B8FA8] mb-4" style={font}>
          Upload a <code className="bg-[#F0F2F5] dark:bg-[#1C1C1C] px-1 rounded text-[12px]">.zip</code> of backend source files. 
          Paths inside the zip should be relative to <code className="bg-[#F0F2F5] dark:bg-[#1C1C1C] px-1 rounded text-[12px]">/opt/inquisia-backend/</code> 
          (e.g. <code className="bg-[#F0F2F5] dark:bg-[#1C1C1C] px-1 rounded text-[12px]">src/routes/auth.js</code>). Server restarts automatically.
        </p>
        <DropZone
          accept=".zip"
          label="Drop backend .zip or click to browse"
          hint="Max 100MB — only .js, .json, .sql, .md files extracted"
          onFiles={handleBackendZip}
          uploading={backendUploading}
        />
        <ResultBanner result={backendResult} />
      </SectionCard>

      {/* Frontend ZIP */}
      <SectionCard title="Deploy Frontend" icon={<Desktop size={16} />}>
        <p className="text-[13px] text-[#5C6370] dark:text-[#8B8FA8] mb-4" style={font}>
          Upload a <code className="bg-[#F0F2F5] dark:bg-[#1C1C1C] px-1 rounded text-[12px]">dist.zip</code> built from the frontend. 
          The existing <code className="bg-[#F0F2F5] dark:bg-[#1C1C1C] px-1 rounded text-[12px]">dist/</code> folder will be replaced. No restart needed.
        </p>
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 mb-4 flex items-start gap-2">
          <WarningCircle size={15} weight="fill" className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-amber-700 dark:text-amber-400" style={font}>
            Build your frontend locally first: <code>npm run build</code>, then zip the <code>dist/</code> folder.
          </p>
        </div>
        <DropZone
          accept=".zip"
          label="Drop dist.zip or click to browse"
          hint="Zip the dist/ folder after running npm run build"
          onFiles={handleFrontendZip}
          uploading={frontendUploading}
        />
        <ResultBanner result={frontendResult} />
      </SectionCard>

      {/* Git Pull + Restart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Git Pull" icon={<GitBranch size={16} />}>
          <p className="text-[13px] text-[#5C6370] dark:text-[#8B8FA8] mb-4" style={font}>
            Pull latest changes from <code className="bg-[#F0F2F5] dark:bg-[#1C1C1C] px-1 rounded text-[12px]">origin/main</code> and restart.
          </p>
          <button
            onClick={handleGitPull}
            disabled={gitLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-50 text-white text-[13px] font-medium transition-colors"
            style={font}
          >
            {gitLoading
              ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Pulling...</>
              : <><GitBranch size={15} /> Pull & Restart</>}
          </button>
          <ResultBanner result={gitResult} />
        </SectionCard>

        <SectionCard title="Restart Server" icon={<ArrowClockwise size={16} />}>
          <p className="text-[13px] text-[#5C6370] dark:text-[#8B8FA8] mb-4" style={font}>
            Restart the PM2 process without changing any files. Use after manual edits on the server.
          </p>
          <button
            onClick={handleRestart}
            disabled={restarting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-[#E5E7EB] dark:border-[#2A2A2A] hover:border-[#0066FF] hover:text-[#0066FF] disabled:opacity-50 text-[#5C6370] dark:text-[#8B8FA8] text-[13px] font-medium transition-colors"
            style={font}
          >
            {restarting
              ? <><div className="w-4 h-4 rounded-full border-2 border-current/30 border-t-current animate-spin" /> Restarting...</>
              : <><ArrowClockwise size={15} /> Restart PM2</>}
          </button>
        </SectionCard>
      </div>

      {/* Env Vars */}
      <SectionCard title="Environment Variables" icon={<Key size={16} />}>
        <div className="rounded-xl bg-[#FFF3CD] dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 mb-4 flex items-start gap-2">
          <Info size={15} weight="fill" className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-amber-700 dark:text-amber-400" style={font}>
            <strong>SESSION_SECRET</strong> and <strong>DATABASE_URL</strong> are protected and cannot be changed here.
            Server restarts automatically after update.
          </p>
        </div>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-[12px] font-medium text-[#5C6370] dark:text-[#8B8FA8] mb-1.5" style={font}>Key</label>
            <input
              value={envKey}
              onChange={e => setEnvKey(e.target.value.toUpperCase())}
              placeholder="OPENAI_API_KEY"
              className={inputClass}
              style={font}
            />
          </div>
          <div className="flex-1">
            <label className="block text-[12px] font-medium text-[#5C6370] dark:text-[#8B8FA8] mb-1.5" style={font}>Value</label>
            <input
              value={envValue}
              onChange={e => setEnvValue(e.target.value)}
              placeholder="sk-..."
              type="password"
              className={inputClass}
              style={font}
            />
          </div>
          <button
            onClick={handleEnvUpdate}
            disabled={envLoading || !envKey.trim() || !envValue.trim()}
            className="px-5 py-2.5 rounded-full bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-40 text-white text-[13px] font-medium transition-colors whitespace-nowrap"
            style={font}
          >
            {envLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
        <ResultBanner result={envResult} />
      </SectionCard>

      {/* PM2 Logs */}
      <SectionCard title="Server Logs" icon={<Terminal size={16} />}>
        <button
          onClick={toggleLogs}
          className="flex items-center gap-2 text-[13px] text-[#5C6370] dark:text-[#8B8FA8] hover:text-[#0066FF] transition-colors"
          style={font}
        >
          {logsOpen ? <CaretUp size={13} /> : <CaretDown size={13} />}
          {logsOpen ? 'Hide logs' : 'Show last 80 lines'}
          {logsLoading && <div className="w-3.5 h-3.5 rounded-full border-2 border-[#E5E7EB] border-t-[#0066FF] animate-spin" />}
        </button>
        {logsOpen && (
          <div className="mt-3 rounded-xl bg-[#0A0A0A] p-4 overflow-x-auto max-h-[400px] overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-[#9CA3AF] text-[12px] font-mono">No logs available.</p>
            ) : (
              logs.map((line, i) => {
                const isError = line.includes('ERROR') || line.includes('error') || line.includes('Error')
                const isWarn  = line.includes('WARN') || line.includes('warn')
                return (
                  <p key={i} className={`text-[11px] font-mono leading-relaxed ${
                    isError ? 'text-red-400' :
                    isWarn  ? 'text-amber-400' :
                    line.includes('[Inquisia]') ? 'text-emerald-400' :
                    'text-[#9CA3AF]'
                  }`}>{line}</p>
                )
              })
            )}
          </div>
        )}
      </SectionCard>

    </div>
  )
}
