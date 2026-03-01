import React, { useState, useEffect } from 'react'
import { Skull, UserPlus, CheckCircle, XCircle, Eye, EyeSlash } from 'phosphor-react'

const PORTAL_PASSWORD = '12345678'
const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || 'http://localhost:3000'

export function DangerZonePage() {
    const [unlocked, setUnlocked] = useState(false)
    const [form, setForm] = useState({ full_name: '', email: '', password: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

    useEffect(() => {
        const entered = window.prompt('🔐 Enter portal password:')
        if (entered === PORTAL_PASSWORD) {
            setUnlocked(true)
        } else {
            window.alert('❌ Wrong password. Access denied.')
            window.location.href = '/'
        }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setResult(null)

        try {
            const res = await fetch(`${API_BASE}/api/danger-zone`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, secret: PORTAL_PASSWORD }),
            })

            const data = await res.json()

            if (data.success) {
                setResult({ success: true, message: `✅ Admin created: ${data.data.email}` })
                setForm({ full_name: '', email: '', password: '' })
            } else {
                setResult({ success: false, message: data.error || 'Failed to create admin.' })
            }
        } catch {
            setResult({ success: false, message: 'Network error — is the backend running?' })
        }

        setLoading(false)
    }

    if (!unlocked) return null

    return (
        <div
            style={{
                minHeight: '100vh',
                background: '#0a0a0a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Inter, sans-serif',
            }}
        >
            <div
                style={{
                    background: '#111',
                    border: '1px solid #2a0000',
                    borderRadius: 16,
                    padding: '40px 36px',
                    width: '100%',
                    maxWidth: 420,
                    boxShadow: '0 0 60px rgba(255,0,0,0.08)',
                }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <Skull size={48} weight="fill" style={{ color: '#ff3b30', marginBottom: 12 }} />
                    <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>
                        Danger Zone
                    </h1>
                    <p style={{ color: '#666', fontSize: 13, marginTop: 8 }}>
                        Secret admin provisioning portal
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ color: '#999', fontSize: 12, display: 'block', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            Full Name
                        </label>
                        <input
                            required
                            placeholder="e.g. Xavier Admin"
                            value={form.full_name}
                            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ color: '#999', fontSize: 12, display: 'block', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            Email
                        </label>
                        <input
                            required
                            type="email"
                            placeholder="admin@inquisia.babcock.edu.ng"
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label style={{ color: '#999', fontSize: 12, display: 'block', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                required
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Min 8 characters"
                                value={form.password}
                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                style={{ ...inputStyle, paddingRight: 44 }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(s => !s)}
                                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#666', display: 'flex' }}
                            >
                                {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '12px 0',
                            background: loading ? '#2a0000' : '#ff3b30',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 10,
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            transition: 'background 0.2s',
                        }}
                    >
                        {loading ? (
                            <span>Creating...</span>
                        ) : (
                            <>
                                <UserPlus size={18} weight="bold" />
                                Create Admin
                            </>
                        )}
                    </button>
                </form>

                {/* Result */}
                {result && (
                    <div
                        style={{
                            marginTop: 20,
                            padding: '12px 16px',
                            borderRadius: 10,
                            background: result.success ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.1)',
                            border: `1px solid ${result.success ? 'rgba(52,199,89,0.3)' : 'rgba(255,59,48,0.3)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        {result.success
                            ? <CheckCircle size={20} weight="fill" style={{ color: '#34c759', flexShrink: 0 }} />
                            : <XCircle size={20} weight="fill" style={{ color: '#ff3b30', flexShrink: 0 }} />}
                        <span style={{ fontSize: 13, color: result.success ? '#34c759' : '#ff6b6b' }}>
                            {result.message}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
}
