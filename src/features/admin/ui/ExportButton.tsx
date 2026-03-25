'use client'

import { useState } from 'react'
import { Download, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui'

interface ExportButtonProps {
  onExport: () => Promise<boolean>
  label?: string
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ExportButton({ 
  onExport, 
  label = 'Export CSV',
  variant = 'secondary',
  size = 'sm',
  className = ''
}: ExportButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleExport() {
    setStatus('loading')
    const success = await onExport()
    setStatus(success ? 'success' : 'error')
    
    setTimeout(() => setStatus('idle'), 2000)
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={status === 'loading'}
      className={className}
    >
      {status === 'loading' ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : status === 'success' ? (
        <>
          <Check className="mr-2 h-4 w-4 text-green-400" />
          Downloaded
        </>
      ) : status === 'error' ? (
        <>
          <Download className="mr-2 h-4 w-4 text-red-400" />
          Failed
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  )
}
