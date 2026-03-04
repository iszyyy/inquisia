import React from 'react'
import { cn } from '../../lib/utils'

interface SkeletonProps {
  className?: string
}

/** Inline text-shaped skeleton — always rounded-full */
export function SkeletonText({ className }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton-shimmer rounded-full bg-[#F0F2F5] dark:bg-[#181818] h-4', className)}
    />
  )
}

/** Block skeleton — rounded-2xl */
export function SkeletonBlock({ className }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton-shimmer rounded-2xl bg-[#F0F2F5] dark:bg-[#181818]', className)}
    />
  )
}

/** Circle skeleton — for avatars */
export function SkeletonCircle({ size = 32, className }: SkeletonProps & { size?: number }) {
  return (
    <div
      className={cn('skeleton-shimmer rounded-full bg-[#F0F2F5] dark:bg-[#181818] flex-shrink-0', className)}
      style={{ width: size, height: size }}
    />
  )
}

/** Full project card skeleton — lean version */
export function SkeletonProjectCard() {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#1C1C1C] bg-white dark:bg-[#101010] p-6">
      {/* Pills row */}
      <div className="flex gap-2 mb-4">
        <SkeletonText className="w-24 h-6" />
        <SkeletonText className="w-20 h-6" />
      </div>
      {/* Title */}
      <SkeletonText className="w-full h-5 mb-2" />
      <SkeletonText className="w-3/4 h-5 mb-4" />
      {/* Divider */}
      <div className="h-px bg-[#E5E7EB] dark:bg-[#1C1C1C] mb-4" />
      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SkeletonCircle size={28} />
          <SkeletonText className="w-28 h-4" />
        </div>
        <div className="flex items-center gap-4">
          <SkeletonText className="w-14 h-4" />
          <SkeletonText className="w-12 h-4" />
        </div>
      </div>
    </div>
  )
}

/** Comment card skeleton */
export function SkeletonComment() {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#1C1C1C] bg-white dark:bg-[#101010] p-4">
      <div className="flex gap-3">
        <SkeletonCircle size={32} />
        <div className="flex-1">
          <SkeletonText className="w-32 h-4 mb-2" />
          <SkeletonText className="w-full h-3.5 mb-1.5" />
          <SkeletonText className="w-5/6 h-3.5 mb-1.5" />
          <SkeletonText className="w-2/3 h-3.5" />
        </div>
      </div>
    </div>
  )
}

/** Dashboard project card skeleton */
export function SkeletonDashboardCard() {
  return (
    <div className="rounded-2xl border border-l-4 border-[#E5E7EB] dark:border-[#1C1C1C] bg-white dark:bg-[#101010] p-5">
      <div className="flex items-start justify-between mb-3">
        <SkeletonText className="w-2/3 h-5" />
        <SkeletonText className="w-20 h-6" />
      </div>
      <SkeletonText className="w-40 h-4 mb-2" />
      <SkeletonText className="w-28 h-4" />
    </div>
  )
}

/** User row skeleton for admin tables */
export function SkeletonTableRow() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-[#E5E7EB] dark:border-[#1C1C1C]">
      <SkeletonCircle size={36} />
      <div className="flex-1">
        <SkeletonText className="w-40 h-4 mb-1.5" />
        <SkeletonText className="w-52 h-3.5" />
      </div>
      <SkeletonText className="w-16 h-6" />
      <SkeletonText className="w-16 h-6" />
      <SkeletonText className="w-24 h-4" />
    </div>
  )
}
