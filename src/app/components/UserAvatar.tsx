import React from 'react'
import { getAvatarColor, getInitials } from '../../lib/utils'

interface UserAvatarProps {
  id: string
  name: string | null | undefined
  size?: number
  className?: string
  border?: boolean
}

export function UserAvatar({ id, name, size = 36, className = '', border = false }: UserAvatarProps) {
  const bg = getAvatarColor(id)
  const initials = getInitials(name)

  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 ${border ? 'border border-white dark:border-[#101010]' : ''} ${className}`}
      style={{ width: size, height: size, backgroundColor: bg }}
    >
      <span
        className="text-white select-none"
        style={{
          fontSize: size * 0.38,
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {initials}
      </span>
    </div>
  )
}
