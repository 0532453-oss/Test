import React from 'react'
import { useListContext } from 'ra-core'
import { Icon, toast } from '@/atlantis'
import { cn } from '@/lib/utils'

interface ExportButtonProps {
  label?: string
}

/**
 * Elegant export button with minimal design and smooth interactions.
 */
export function ExportButton({ label = 'Export' }: ExportButtonProps) {
  const { data, resource } = useListContext()

  const handleExport = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!data || data.length === 0) {
      toast.info('No data to export')
      return
    }

    // Create ripple effect
    const button = e.currentTarget
    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2

    const ripple = document.createElement('span')
    ripple.className = 'absolute rounded-full bg-gray-400/30 pointer-events-none'
    ripple.style.width = ripple.style.height = `${size}px`
    ripple.style.left = `${x}px`
    ripple.style.top = `${y}px`
    ripple.style.animation = 'ripple-expand 600ms ease-out'
    button.appendChild(ripple)

    ripple.addEventListener('animationend', () => ripple.remove())

    // Simple CSV export
    const headers = Object.keys(data[0]).filter(
      (key) => typeof data[0][key] !== 'object'
    )
    const csvContent = [
      headers.join(','),
      ...data.map((record) =>
        headers
          .map((header) => {
            const value = record[header]
            // Escape quotes and wrap in quotes if contains comma
            const stringValue = String(value ?? '')
            if (stringValue.includes(',') || stringValue.includes('"')) {
              return `"${stringValue.replace(/"/g, '""')}"`
            }
            return stringValue
          })
          .join(',')
      ),
    ].join('\n')

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${resource || 'export'}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)

    toast.success(`Exported ${data.length} records`)
  }

  return (
    <button
      onClick={handleExport}
      disabled={!data || data.length === 0}
      className={cn(
        'group relative overflow-hidden',
        'inline-flex items-center justify-center gap-1.5',
        'px-4 py-1.5 h-8',
        'font-medium text-xs tracking-normal',
        'rounded-full',
        'bg-white dark:bg-gray-800',
        'text-gray-700 dark:text-gray-200',
        'border border-gray-300 dark:border-gray-600',
        'shadow-sm',
        'transition-all duration-200 ease-out',
        'hover:bg-gray-50 dark:hover:bg-gray-700/50',
        'hover:border-gray-400 dark:hover:border-gray-500',
        'active:bg-gray-100 dark:active:bg-gray-700',
        'focus:outline-none focus:ring-2 focus:ring-gray-400/50 focus:ring-offset-1',
        'disabled:opacity-40 disabled:cursor-not-allowed'
      )}
    >
      <Icon 
        name="export" 
        size="small" 
        className="w-3.5 h-3.5" 
      />
      <span>{label}</span>
    </button>
  )
}
