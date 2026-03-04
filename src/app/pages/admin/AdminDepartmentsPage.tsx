import React, { useEffect, useState } from 'react'
import { PencilSimple, Trash, Check, X, Plus } from 'phosphor-react'
import { adminApi } from '../../../lib/api'
import type { Department } from '../../../lib/types'
import { toast } from 'sonner'

export function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    adminApi.departments().then((res) => {
      if (res.success) setDepartments(res.data)
      setLoading(false)
    })
  }, [])

  const handleAdd = async () => {
    if (!newName.trim()) return
    setAdding(true)
    const res = await adminApi.createDepartment(newName.trim())
    if (res.success) {
      const fetchRes = await adminApi.departments()
      if (fetchRes.success) setDepartments(fetchRes.data)
      setNewName('')
      toast.success('Department added!')
    }
    setAdding(false)
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return
    const res = await adminApi.updateDepartment(id, editName.trim())
    if (res.success) {
      setDepartments((prev) => prev.map((d) => d.id === id ? { ...d, name: editName.trim() } : d))
      setEditId(null)
      toast.success('Department updated!')
    }
  }

  const handleDelete = async (id: string) => {
    const res = await adminApi.deleteDepartment(id)
    if (res.success) {
      setDepartments((prev) => prev.filter((d) => d.id !== id))
      toast.success('Department deleted.')
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[#0A0A0A] dark:text-[#F5F5F5] mb-1"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '22px', letterSpacing: '-0.02em' }}>
          Departments
        </h1>
        <p className="text-[14px] text-[#9CA3AF]" style={{ fontFamily: 'var(--font-body)' }}>{departments.length} departments</p>
      </div>

      {/* Add new */}
      <div className="flex gap-2 mb-6">
        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void handleAdd()}
          placeholder="New department name..."
          className="flex-1 bg-white dark:bg-[#101010] rounded-full border border-[#E5E7EB] dark:border-[#1C1C1C] px-4 py-2.5 text-[14px] text-[#0A0A0A] dark:text-[#F5F5F5] placeholder-[#9CA3AF] outline-none focus:border-[#0066FF] transition-colors"
          style={{ fontFamily: 'var(--font-body)' }} />
        <button onClick={() => void handleAdd()} disabled={!newName.trim() || adding}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] text-white bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-50 transition-colors"
          style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>
          <Plus size={14} />Add
        </button>
      </div>

      {/* List */}
      <div className="rounded-2xl bg-white dark:bg-[#101010] border border-[#E5E7EB] dark:border-[#1C1C1C] overflow-hidden"
        style={{ boxShadow: 'var(--shadow-card)' }}>
        {loading ? (
          <div className="py-10 text-center"><div className="w-6 h-6 rounded-full border-2 border-[#E5E7EB] border-t-[#0066FF] animate-spin mx-auto" /></div>
        ) : departments.length === 0 ? (
          <div className="py-10 text-center"><p className="text-[14px] text-[#9CA3AF]">No departments yet.</p></div>
        ) : departments.map((d, i) => (
          <div key={d.id} className={`flex items-center gap-4 px-5 py-4 group hover:bg-[#0066FF08] transition-colors ${i > 0 ? 'border-t border-[#E5E7EB] dark:border-[#1C1C1C]' : ''}`}>
            {editId === d.id ? (
              <>
                <input value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-[14px] text-[#0A0A0A] dark:text-[#F5F5F5] border-b border-[#0066FF]"
                  style={{ fontFamily: 'var(--font-body)' }} autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && void handleUpdate(d.id)} />
                <button onClick={() => void handleUpdate(d.id)} className="p-1.5 rounded-full hover:bg-green-100 text-[#16A34A]"><Check size={14} /></button>
                <button onClick={() => setEditId(null)} className="p-1.5 rounded-full hover:bg-[#F0F2F5] dark:hover:bg-[#181818] text-[#9CA3AF]"><X size={14} /></button>
              </>
            ) : (
              <>
                <span className="flex-1 text-[14px] text-[#0A0A0A] dark:text-[#F5F5F5]" style={{ fontFamily: 'var(--font-body)' }}>{d.name}</span>
                <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditId(d.id); setEditName(d.name) }}
                    className="p-1.5 rounded-full hover:bg-[#F0F2F5] dark:hover:bg-[#181818] text-[#9CA3AF] hover:text-[#0066FF] transition-colors">
                    <PencilSimple size={14} />
                  </button>
                  <button onClick={() => void handleDelete(d.id)}
                    className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/10 text-[#9CA3AF] hover:text-red-500 transition-colors">
                    <Trash size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
