import React from 'react'
import { useNavigate } from 'react-router'
import { Icon } from '@/atlantis'
import { cn } from '@/lib/utils'

interface CreateButtonProps {
  label?: string
  to?: string
  resource?: string
}

/**
 * Premium button that navigates to the create page for a resource.
 * Modern design with gradient, elevation, and smooth animations.
 */
export function CreateButton({
  label = 'Create',
  to,
  resource = 'clients',
}: CreateButtonProps) {
  const navigate = useNavigate()
  const path = to || `/${resource}/create`

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Create ripple effect
    const button = e.currentTarget
    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2

    const ripple = document.createElement('span')
    ripple.className = 'absolute rounded-full bg-white/40 pointer-events-none'
    ripple.style.width = ripple.style.height = `${size}px`
    ripple.style.left = `${x}px`
    ripple.style.top = `${y}px`
    ripple.style.animation = 'ripple-expand 600ms ease-out'
    button.appendChild(ripple)

    ripple.addEventListener('animationend', () => ripple.remove())
    navigate(path)
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'group relative overflow-hidden',
        'inline-flex items-center justify-center gap-1.5',
        'px-4 py-1.5 h-8',
        'font-medium text-xs tracking-normal',
        'rounded-full',
        'bg-slate-700',
        'text-white',
        'shadow-sm',
        'transition-all duration-200 ease-out',
        'hover:bg-slate-600',
        'hover:shadow-md',
        'active:bg-slate-800',
        'focus:outline-none focus:ring-2 focus:ring-slate-500/50 focus:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
    >
      <Icon name="add" size="small" className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  )
}
