import React from 'react'
import { Link } from 'react-router'
import { InquisiaLogo } from '../ui/InquisiaLogo'

export function Footer() {
  return (
    <footer className="bg-[#080808] overflow-hidden relative">
      {/* Main footer content */}
      <div className="max-w-[1200px] mx-auto px-5 md:px-12 pt-16 pb-6 relative z-10">
        {/* Top row */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 md:mb-12 gap-6 md:gap-0">
          <Link to="/" className="flex items-center gap-2 select-none group">
            <InquisiaLogo variant="dark" className="w-7 h-7" />
            <span
              className="text-white text-[17px] leading-none"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '-0.02em' }}
            >
              inquisia.
            </span>
          </Link>

          <div className="flex items-center gap-4 md:gap-6">
            <Link to="/projects" className="text-[#4B5563] hover:text-white text-[14px] transition-colors duration-150">Browse</Link>
            <Link to="/login" className="text-[#4B5563] hover:text-white text-[14px] transition-colors duration-150">Sign In</Link>
            <Link to="/register" className="text-[#4B5563] hover:text-white text-[14px] transition-colors duration-150">Register</Link>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#1C1C1C] mb-4" />

        {/* Bottom strip */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0 text-center md:text-left">
          <span
            className="text-[#4B5563] text-[13px]"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
          >
            inquisia.
          </span>
          <span className="text-[#4B5563] text-[12px]" style={{ fontFamily: 'var(--font-body)' }}>
            Developed by Babcock University CS Department
          </span>
        </div>
      </div>

      {/* Massive background wordmark with dot grid */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none select-none" style={{ height: '140px' }}>
        {/* Dot grid overlay */}
        <DotGrid />

        {/* Large text */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(80px, 14vw, 160px)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: 'rgba(255,255,255,0.05)',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          inquisia.
        </div>
      </div>
    </footer>
  )
}

function DotGrid() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: 0.12 }}
    >
      <defs>
        <pattern id="footer-dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="white" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#footer-dots)" />
    </svg>
  )
}
