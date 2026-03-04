import React, { useEffect, useState } from 'react'
import { PencilSimple, Trash, Check, X, Plus } from 'phosphor-react'
import { adminApi } from '../../../lib/api'
import type { AICategory } from '../../../lib/types'
import { getCategoryStyle } from '../../../lib/utils'
import { useTheme } from '../../../context/ThemeContext'
import { toast } from 'sonner'

export function AdminCategoriesPage() {
  const { isDark } = useTheme()
  const [categories, setCategories] = useState<AICategory[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editName, setEditName] = useState('')
  const [editKey, setEditKey] = useState<string | null>(null)

  useEffect(() => {
    adminApi.aiCategories().then((res) => {
      if (res.success) setCategories(res.data)
      setLoading(false)
    })
  }, [])

  const handleAdd = async () => {
    if (!newName.trim()) return
    setAdding(true)
    const categoryName = newName.trim()
    const res = await adminApi.createCategory(categoryName)
    if (res.success) {
      // Backend does not return the object, so we optimistically add it locally
      setCategories((prev) => [...prev, { name: categoryName }])
      setNewName('')
      toast.success('Category added!')
    } else {
      toast.error(res.error || 'Failed to add category')
    }
    setAdding(false)
  }

  const handleDelete = async (name: string) => {
    const res = await adminApi.deleteCategory(name)
    if (res.success) {
      setCategories((prev) => prev.filter((c) => c.name !== name))
      toast.success('Category deleted.')
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[#0A0A0A] dark:text-[#F5F5F5] mb-1"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '22px', letterSpacing: '-0.02em' }}>
          AI Categories
        </h1>
        <p className="text-[14px] text-[#9CA3AF]" style={{ fontFamily: 'var(--font-body)' }}>{categories.length} categories</p>
      </div>

      <div className="flex gap-2 mb-6">
        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void handleAdd()}
          placeholder="New category name..."
          className="flex-1 bg-white dark:bg-[#101010] rounded-full border border-[#E5E7EB] dark:border-[#1C1C1C] px-4 py-2.5 text-[14px] text-[#0A0A0A] dark:text-[#F5F5F5] placeholder-[#9CA3AF] outline-none focus:border-[#0066FF] transition-colors"
          style={{ fontFamily: 'var(--font-body)' }} />
        <button onClick={() => void handleAdd()} disabled={!newName.trim() || adding}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] text-white bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-50 transition-colors"
          style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>
          <Plus size={14} />Add
        </button>
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#101010] border border-[#E5E7EB] dark:border-[#1C1C1C] overflow-hidden"
        style={{ boxShadow: 'var(--shadow-card)' }}>
        {loading ? (
          <div className="py-10 text-center"><div className="w-6 h-6 rounded-full border-2 border-[#E5E7EB] border-t-[#0066FF] animate-spin mx-auto" /></div>
        ) : categories.length === 0 ? (
          <div className="py-10 text-center"><p className="text-[14px] text-[#9CA3AF]">No categories yet.</p></div>
        ) : categories.map((c, i) => {
          const style = getCategoryStyle(c.name, isDark)
          return (
            <div key={c.name} className={`flex items-center gap-4 px-5 py-4 group hover:bg-[#0066FF08] transition-colors ${i > 0 ? 'border-t border-[#E5E7EB] dark:border-[#1C1C1C]' : ''}`}>
              {editKey === c.name ? (
                <>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-[14px] text-[#0A0A0A] dark:text-[#F5F5F5] border-b border-[#0066FF]"
                    style={{ fontFamily: 'var(--font-body)' }} autoFocus />
                  <button onClick={() => { setEditKey(null) }} className="p-1.5 rounded-full hover:bg-green-100 text-[#16A34A]"><Check size={14} /></button>
                  <button onClick={() => setEditKey(null)} className="p-1.5 rounded-full hover:bg-[#F0F2F5] text-[#9CA3AF]"><X size={14} /></button>
                </>
              ) : (
                <>
                  <span className="px-3 py-1.5 rounded-full text-[12px] font-medium flex-shrink-0"
                    style={{ backgroundColor: style.bg, color: style.text, fontFamily: 'var(--font-body)' }}>
                    {c.name}
                  </span>
                  <div className="flex-1" />
                  <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditKey(c.name); setEditName(c.name) }}
                      className="p-1.5 rounded-full hover:bg-[#F0F2F5] dark:hover:bg-[#181818] text-[#9CA3AF] hover:text-[#0066FF] transition-colors">
                      <PencilSimple size={14} />
                    </button>
                    <button onClick={() => void handleDelete(c.name)}
                      className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/10 text-[#9CA3AF] hover:text-red-500 transition-colors">
                      <Trash size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
