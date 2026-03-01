import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import { House, MagnifyingGlass, SquaresFour, User, UploadSimple, SignIn, BookmarkSimple, List, X } from 'phosphor-react'
import { motion, AnimatePresence } from 'motion/react'
import { useSession } from '../../../context/SessionContext'

interface DockItem {
  icon: React.ReactNode
  activeIcon: React.ReactNode
  label: string
  href: string
}

export function MobileBottomDock() {
  const { user } = useSession()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const getSubItem = (): DockItem => {
    if (!user) {
      return {
        icon: <SignIn size={20} weight="regular" />,
        activeIcon: <SignIn size={20} weight="fill" />,
        label: 'Login',
        href: '/login',
      }
    }
    if (user.role === 'student') {
      return {
        icon: <UploadSimple size={20} weight="regular" />,
        activeIcon: <UploadSimple size={20} weight="fill" />,
        label: 'Upload',
        href: '/upload',
      }
    }
    if (user.role === 'public') {
      return {
        icon: <BookmarkSimple size={20} weight="regular" />,
        activeIcon: <BookmarkSimple size={20} weight="fill" />,
        label: 'Bookmarks',
        href: '/bookmarks',
      }
    }
    return {
      icon: <SquaresFour size={20} weight="regular" />,
      activeIcon: <SquaresFour size={20} weight="fill" />,
      label: 'Dashboard',
      href: '/dashboard',
    }
  }

  const items: DockItem[] = [
    {
      icon: <House size={20} weight="regular" />,
      activeIcon: <House size={20} weight="fill" />,
      label: 'Home',
      href: '/',
    },
    {
      icon: <MagnifyingGlass size={20} weight="regular" />,
      activeIcon: <MagnifyingGlass size={20} weight="fill" />,
      label: 'Browse',
      href: '/projects',
    },
    getSubItem(),
    {
      icon: <User size={20} weight="regular" />,
      activeIcon: <User size={20} weight="fill" />,
      label: 'Profile',
      href: user ? `/profile/${user.id}` : '/login',
    },
  ]

  return (
    <nav className="fixed bottom-6 left-6 z-[60] md:hidden" ref={menuRef}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute bottom-16 left-0 mb-2 flex flex-col gap-1.5 bg-white dark:bg-[#101010] p-2 rounded-2xl border border-[#E5E7EB] dark:border-[#1C1C1C] shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
            style={{ width: '180px' }}
          >
            {items.map((item) => {
              const isActive = item.href === '/' ? location.pathname === '/' : location.pathname.startsWith(item.href)
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-[#0066FF] text-white' : 'text-[#5C6370] dark:text-[#8B8FA8] hover:bg-[#F3F4F6] dark:hover:bg-[#181818]'
                    }`}
                  style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                >
                  <span className={isActive ? 'text-white' : 'text-[#9CA3AF]'}>
                    {isActive ? item.activeIcon : item.icon}
                  </span>
                  <span className="text-[14px] tracking-tight">{item.label}</span>
                </Link>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-[#0A0A0A] dark:bg-white text-white dark:text-[#0A0A0A] shadow-[0_8px_24px_rgba(0,0,0,0.24)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 border border-white/10 dark:border-black/10"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isOpen ? 'close' : 'menu'}
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.15 }}
          >
            {isOpen ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
          </motion.div>
        </AnimatePresence>
      </button>
    </nav>
  )
}