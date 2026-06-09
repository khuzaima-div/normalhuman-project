"use client"

import React from 'react'
import dynamic from 'next/dynamic'

// Dynamically imported with clean hydration boundary safety
const Mail = dynamic<{
  defaultLayout?: number[]
  navCollapsedSize?: number
  defaultCollapsed?: boolean
}>(() => import('./mail').then((m) => m.default ?? m), {
    ssr: false,
    loading: () => (
      <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 animate-pulse" />
    )
})

const MailDashboard = () => {
  return (
    <Mail 
      defaultLayout={[20, 32, 48]} 
      defaultCollapsed={false} 
      navCollapsedSize={4} 
    />
  )
}

export default MailDashboard