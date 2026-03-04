import React from 'react'
import { motion } from 'motion/react'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  compact?: boolean
}

export function EmptyState({ icon, title, description, action, compact = false }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className={`flex flex-col items-center justify-center text-center ${compact ? 'py-10' : 'py-20'}`}
    >
      <div className="mb-4 text-[#9CA3AF]">{icon}</div>
      <h3
        className="text-[17px] text-[#0A0A0A] dark:text-[#F5F5F5] mb-2"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="text-[14px] text-[#9CA3AF] max-w-sm mb-6"
          style={{ fontFamily: 'var(--font-body)', lineHeight: 1.65 }}
        >
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </motion.div>
  )
}
