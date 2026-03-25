'use client'

import { ChevronDown } from 'lucide-react'

export interface FilterOption {
  value: string
  label: string
}

interface AdminSelectFilterProps {
  label: string
  value: string
  options: FilterOption[]
  onChange: (value: string) => void
  className?: string
}

export function AdminSelectFilter({
  label,
  value,
  options,
  onChange,
  className = '',
}: AdminSelectFilterProps) {
  return (
    <div className={`relative ${className}`}>
      <label className="mb-1 block text-xs font-medium text-zinc-400">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-3 pr-8 text-sm text-white focus:border-violet-500 focus:outline-none"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      </div>
    </div>
  )
}

interface AdminFilterBarProps {
  children: React.ReactNode
  className?: string
}

export function AdminFilterBar({ children, className = '' }: AdminFilterBarProps) {
  return (
    <div className={`flex flex-wrap items-end gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 ${className}`}>
      {children}
    </div>
  )
}

interface AdminSortOption {
  value: string
  label: string
}

interface AdminSortSelectProps {
  value: string
  options: AdminSortOption[]
  onChange: (value: string) => void
  className?: string
}

export function AdminSortSelect({
  value,
  options,
  onChange,
  className = '',
}: AdminSortSelectProps) {
  return (
    <div className={`relative ${className}`}>
      <label className="mb-1 block text-xs font-medium text-zinc-400">
        Sort by
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-3 pr-8 text-sm text-white focus:border-violet-500 focus:outline-none"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      </div>
    </div>
  )
}
