import React from 'react'
import { Link } from 'react-router'
import { MagnifyingGlass } from 'phosphor-react'
import { motion } from 'motion/react'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        <div className="text-[120px] font-bold text-[#0066FF] opacity-10 leading-none select-none"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>
          404
        </div>
        <MagnifyingGlass size={48} weight="thin" className="text-[#9CA3AF] mx-auto -mt-8 mb-6" />
        <h1 className="text-[24px] text-[#0A0A0A] dark:text-[#F5F5F5] mb-3"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '-0.01em' }}>
          Page not found
        </h1>
        <p className="text-[15px] text-[#9CA3AF] mb-8 max-w-sm" style={{ fontFamily: 'var(--font-body)', lineHeight: 1.65 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center gap-3 justify-center">
          <Link to="/"
            className="px-6 py-3 rounded-full text-[14px] text-white bg-[#0066FF] hover:bg-[#0052CC] transition-colors"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>
            Go Home
          </Link>
          <Link to="/projects"
            className="px-6 py-3 rounded-full text-[14px] text-[#5C6370] border border-[#E5E7EB] dark:border-[#1C1C1C] hover:border-[#0066FF] hover:text-[#0066FF] transition-colors"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>
            Browse Projects
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
