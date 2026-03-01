import React from 'react'
import { useTheme } from '../../../context/ThemeContext'

type LogoVariant = 'light' | 'dark' | 'blue' | 'auto'

interface LogoProps {
    className?: string
    variant?: LogoVariant
}

export function InquisiaLogo({ className = 'w-8 h-8', variant = 'auto' }: LogoProps) {
    const { theme } = useTheme()

    let source = '/inquisia-light.svg'

    if (variant === 'blue') {
        source = '/inquisia-blue.svg'
    } else if (variant === 'dark' || (variant === 'auto' && theme === 'dark')) {
        source = '/inquisia-dark.svg'
    } else {
        source = '/inquisia-light.svg'
    }

    return <img src={source} alt="Inquisia Logo" className={className} />
}
