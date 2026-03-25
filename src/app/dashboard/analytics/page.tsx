'use client'

import { Navbar } from '@/components/Navbar'
import { AnalyticsDashboard } from '@/features/analytics'

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AnalyticsDashboard />
      </main>
    </div>
  )
}
