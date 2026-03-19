import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MIDWAY IDEAS | Buy & Sell Unfinished Projects',
  description: 'The marketplace for unfinished development projects. Buy and sell halfway-done apps, websites, and tools.',
  keywords: ['marketplace', 'projects', 'development', 'buy', 'sell', 'unfinished', 'code'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-white antialiased`}>
        {children}
      </body>
    </html>
  )
}
