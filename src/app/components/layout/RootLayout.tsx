import React from 'react'
import { Outlet, useLocation } from 'react-router'
import { Toaster } from 'sonner'
import { Navbar } from './Navbar'
import { MobileBottomDock } from './MobileBottomDock'
import { Footer } from './Footer'
import { FloatingAssistantWrapper } from '../FloatingAssistantWrapper'
import { GlobalStatusBanner } from '../GlobalStatusBanner'
import { SessionProvider } from '../../../context/SessionContext'
import { ThemeProvider } from '../../../context/ThemeContext'

// Pages that should not show the footer
const NO_FOOTER_PATHS = ['/dashboard', '/upload', '/admin', '/elara', '/settings', '/profile', '/bookmarks']
// Pages that should not show the AI widget
const NO_WIDGET_PATHS = ['/elara']

function Layout() {
  const location = useLocation()
  const showFooter = !NO_FOOTER_PATHS.some((p) => location.pathname.startsWith(p))
  const showWidget = !NO_WIDGET_PATHS.some((p) => location.pathname.startsWith(p))

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFFFF] dark:bg-[#080808]">
      {/* Fixed top navbar */}
      <Navbar />

      {/* Main content — padded top to clear fixed navbar */}
      <main className="flex-1 pt-16">
        {/* Global account status banner (warned / restricted) */}
        <GlobalStatusBanner />
        <Outlet />
      </main>

      {/* Footer */}
      {showFooter && <Footer />}

      {/* Mobile bottom dock */}
      <MobileBottomDock />

      {/* Floating AI widget */}
      {showWidget && <FloatingAssistantWrapper />}

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            borderRadius: '1rem',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
          },
        }}
      />
    </div>
  )
}

export function RootLayout() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <Layout />
      </SessionProvider>
    </ThemeProvider>
  )
}