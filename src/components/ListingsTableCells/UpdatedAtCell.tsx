'use client'

import React from 'react'
import { Calendar } from 'lucide-react'

/**
 * Custom Cell Component for Updated At
 * Shows formatted date with relative time
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const UpdatedAtCell = ({ cellData }: any) => {
  if (!cellData) {
    return <span className="text-muted-foreground text-sm">—</span>
  }

  const formatDate = (date: string | Date) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    }

    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex flex-col">
        <span className="text-sm">{formatDate(cellData)}</span>
        <span className="text-xs text-muted-foreground">
          {new Date(cellData).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  )
}
