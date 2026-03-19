import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Link, useLocation } from 'react-router'
import { PaperPlaneTilt, ChatCircle, WarningCircle } from 'phosphor-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useSession } from '../../context/SessionContext'
import { aiApi } from '../../lib/api'
import type { ChatMessage } from '../../lib/types'
import { ElaraLogo } from '../components/ui/ElaraLogo'
import { buildAssistantHistory, getElaraPageContext, getElaraScopeCopy, getElaraSuggestions } from '../../lib/elara'

function useTypewriter(text: string, active: boolean) {
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    if (!active) {
      setDisplayed(text)
      return
    }
    setDisplayed('')
    if (!text) return
    const msPerChar = Math.min(1400 / text.length, 22)
    let i = 0
    const iv = setInterval(() => {
      i += 1
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(iv)
    }, msPerChar)

    return () => clearInterval(iv)
  }, [text, active])

  return displayed
}

function Bubble({ msg, isLatest }: { msg: ChatMessage; isLatest: boolean }) {
  const isUser = msg.role === 'user'
  const text = useTypewriter(msg.content, !isUser && isLatest)

  return (
    <div className={`flex items-end gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[#0066FF] flex items-center justify-center flex-shrink-0 mb-1 overflow-hidden p-1.5">
          <ElaraLogo variant="blue" className="w-full h-full" />
        </div>
      )}
      <div
        className={`max-w-[85%] px-4 py-3 text-[15px] leading-relaxed shadow-sm ${isUser
          ? 'bg-[#0066FF] text-white rounded-2xl rounded-br-none'
          : 'bg-[#F0F2F5] dark:bg-[#181818] text-[#0A0A0A] dark:text-[#F5F5F5] rounded-2xl rounded-bl-none border border-[#E5E7EB] dark:border-[#1C1C1C]'
          }`}
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-[#F7F8FA] dark:prose-pre:bg-[#101010] prose-pre:border prose-pre:border-[#E5E7EB] dark:prose-pre:border-[#1C1C1C]">
            {text ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown> : (
              <span className="inline-flex gap-1.5 items-center py-1">
                <span className="w-2 h-2 rounded-full bg-[#9CA3AF] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#9CA3AF] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#9CA3AF] animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function ElaraPage() {
  const { user } = useSession()
  const location = useLocation()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [latestAIId, setLatestAIId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestions = useMemo(() => getElaraSuggestions(user?.role, location.pathname), [location.pathname, user?.role])
  const scopeCopy = useMemo(() => getElaraScopeCopy(user?.role), [user?.role])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    if (!user) {
      setMessages([])
      setInput('')
      setLatestAIId(null)
      setError(null)
    }
  }, [user])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || sending || !user) return

    setError(null)
    const userId = `u-${Date.now()}`
    const aiId = `a-${Date.now()}`
    const nextMessages: ChatMessage[] = [
      ...messages,
      { id: userId, role: 'user', content: text, timestamp: new Date().toISOString() },
      { id: aiId, role: 'assistant', content: '', timestamp: new Date().toISOString() },
    ]

    setMessages(nextMessages)
    setInput('')
    setSending(true)

    const res = await aiApi.assistant(
      text,
      buildAssistantHistory(messages),
      getElaraPageContext(user, location.pathname),
    )

    if (res.success) {
      setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, content: res.data.reply } : m)))
      setLatestAIId(aiId)
    } else {
      const message = res.error || 'Elara could not complete that request. Please try again.'
      setMessages((prev) => prev.filter((m) => m.id !== aiId))
      setError(message)
    }

    setSending(false)
  }, [input, location.pathname, messages, sending, user])

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-[760px] mx-auto px-5 md:px-0">
      <div className="py-6 text-center flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-[#0066FF] flex items-center justify-center mx-auto mb-3 overflow-hidden p-2.5">
          <ElaraLogo variant="blue" className="w-full h-full" />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '24px', letterSpacing: '-0.01em' }} className="text-[#0A0A0A] dark:text-[#F5F5F5]">
          Elara
        </h1>
        <p className="text-[14px] text-[#9CA3AF] mt-1" style={{ fontFamily: 'var(--font-body)' }}>
          Academic project assistant for Inquisia
        </p>
        <div className="mt-4 rounded-2xl border border-[#E5E7EB] dark:border-[#1C1C1C] bg-[#F7F8FA] dark:bg-[#181818] px-4 py-3 text-left">
          <p className="text-[13px] text-[#5C6370] dark:text-[#8B8FA8]" style={{ fontFamily: 'var(--font-body)' }}>
            {scopeCopy}
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <ChatCircle size={48} weight="thin" className="text-[#9CA3AF] mb-4" />
            <p className="text-[16px] text-[#9CA3AF] mb-6" style={{ fontFamily: 'var(--font-body)' }}>
              Ask about submissions, reviews, repository discovery, or this academic platform's workflows.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion)
                    inputRef.current?.focus()
                  }}
                  className="px-4 py-2 rounded-full border border-[#E5E7EB] dark:border-[#1C1C1C] text-[13px] text-[#5C6370] dark:text-[#8B8FA8] hover:border-[#0066FF] hover:text-[#0066FF] transition-colors"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => <Bubble key={msg.id} msg={msg} isLatest={msg.id === latestAIId} />)
        )}
      </div>

      <div className="flex-shrink-0 py-4 space-y-3">
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-left dark:border-red-900/40 dark:bg-red-950/20">
            <WarningCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[13px] font-medium text-red-600 dark:text-red-300" style={{ fontFamily: 'var(--font-display)' }}>
                Elara response failed
              </p>
              <p className="text-[12px] text-red-600/80 dark:text-red-300/80" style={{ fontFamily: 'var(--font-body)' }}>
                {error}
              </p>
            </div>
          </div>
        )}

        {!user ? (
          <div className="text-center p-4 rounded-2xl border border-[#E5E7EB] dark:border-[#1C1C1C] bg-[#F7F8FA] dark:bg-[#181818]">
            <p className="text-[14px] text-[#9CA3AF]" style={{ fontFamily: 'var(--font-body)' }}>
              <Link to="/login?redirect=%2Felara" className="text-[#0066FF] hover:underline">Log in</Link> to start a role-aware Elara chat.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-white dark:bg-[#101010] rounded-full border border-[#E5E7EB] dark:border-[#1C1C1C] px-5 py-3.5 focus-within:border-[#0066FF] focus-within:shadow-[0_0_0_3px_rgba(0,102,255,0.15)] transition-all">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void send()}
              placeholder="Ask about a project, submission, review, or repository task..."
              className="flex-1 bg-transparent outline-none text-[15px] text-[#0A0A0A] dark:text-[#F5F5F5] placeholder-[#9CA3AF]"
              style={{ fontFamily: 'var(--font-body)' }}
              disabled={sending}
            />
            <button onClick={() => void send()} disabled={!input.trim() || sending} className={`transition-colors ${input.trim() ? 'text-[#0066FF]' : 'text-[#D1D5DB]'}`}>
              <PaperPlaneTilt size={20} weight={input.trim() ? 'fill' : 'regular'} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
