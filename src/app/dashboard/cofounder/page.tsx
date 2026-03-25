'use client'

import { Navbar } from '@/components/Navbar'
import { CofounderRequestCard } from '@/features/cofounder'

export default function CofounderPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <CofounderRequestCard />
      </main>
    </div>
  )
}
