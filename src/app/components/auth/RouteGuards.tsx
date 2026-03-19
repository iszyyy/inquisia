import React from 'react'
import { Navigate, useLocation } from 'react-router'
import { useSession } from '../../../context/SessionContext'
import { getDefaultRouteForUser, getLoginRedirect } from '../../../lib/auth'
import type { UserRole } from '../../../lib/types'

function FullPageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-2 border-[#E5E7EB] border-t-[#0066FF] animate-spin" />
    </div>
  )
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}) {
  const { user, isLoading } = useSession()
  const location = useLocation()

  if (isLoading) return <FullPageLoader />

  if (!user) {
    return <Navigate to={getLoginRedirect(`${location.pathname}${location.search}`)} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultRouteForUser(user)} replace />
  }

  return <>{children}</>
}

export function GuestOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useSession()

  if (isLoading) return <FullPageLoader />
  if (user) return <Navigate to={getDefaultRouteForUser(user)} replace />

  return <>{children}</>
}
