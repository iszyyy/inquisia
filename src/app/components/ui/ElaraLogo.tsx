import React from 'react'
import { useTheme } from '../../../context/ThemeContext'

type LogoVariant = 'light' | 'dark' | 'blue' | 'auto'

interface LogoProps {
    className?: string
    variant?: LogoVariant
}

export function ElaraLogo({ className = 'w-4 h-4', variant = 'auto' }: LogoProps) {
    const { theme } = useTheme()

    let source = '/elara-light.svg'

    if (variant === 'blue') {
        source = '/elara-blue.svg'
    } else if (variant === 'dark' || (variant === 'auto' && theme === 'dark')) {
        source = '/elara-dark.svg'
    } else {
        source = '/elara-light.svg'
    }

    return <img src={source} alt="Elara Logo" className={className} />
}
