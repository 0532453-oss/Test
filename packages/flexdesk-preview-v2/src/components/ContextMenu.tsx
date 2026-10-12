import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Icon, type IconNames } from '@/atlantis'

/**
 * Dark-themed context menu (right-click menu)
 * Styled based on uiverse.io/Na3ar-17/terrible-gecko-91
 */

export interface ContextMenuItem<T = unknown> {
  icon: IconNames
  label: string
  onClick?: (targetData?: T, position?: { top: number; left: number }) => void
  destructive?: boolean
  disabled?: boolean | ((targetData?: T) => boolean)
}

export interface ContextMenuGroup<T = unknown> {
  items: ContextMenuItem<T>[]
}

interface ContextMenuProps<T = unknown> {
  children: React.ReactNode
  items?: ContextMenuItem<T>[]
  groups?: ContextMenuGroup<T>[]
  onItemClick?: (label: string, targetData?: T) => void
  /** Function to extract target data from the right-clicked element */
  getTargetData?: (element: HTMLElement) => T | undefined
  /** Data attribute name to look for on clicked elements (e.g., "row-id") */
  targetDataAttribute?: string
}

export function ContextMenu<T = unknown>({
  children,
  items,
  groups,
  onItemClick,
  getTargetData,
  targetDataAttribute = 'row-id',
}: ContextMenuProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [targetData, setTargetData] = useState<T | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Try to extract target data from the clicked element
    let extractedData: T | undefined = undefined

    if (getTargetData) {
      extractedData = getTargetData(e.target as HTMLElement)
    } else if (targetDataAttribute) {
      // Walk up the DOM tree to find an element with the data attribute
      let element = e.target as HTMLElement | null
      while (element && element !== document.body) {
        const dataValue = element.getAttribute(`data-${targetDataAttribute}`)
        if (dataValue) {
          try {
            extractedData = JSON.parse(dataValue) as T
          } catch {
            extractedData = dataValue as unknown as T
          }
          break
        }
        element = element.parentElement
      }
    }

    setTargetData(extractedData)

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const menuWidth = 220
    const menuHeight = 200 // Approximate height

    let left = e.clientX
    let top = e.clientY

    // Adjust if menu would go off-screen
    if (left + menuWidth > viewportWidth) {
      left = viewportWidth - menuWidth - 10
    }
    if (top + menuHeight > viewportHeight) {
      top = viewportHeight - menuHeight - 10
    }

    setPosition({ top, left })
    setIsOpen(true)
  }, [getTargetData, targetDataAttribute])

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleScroll = () => {
      setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('scroll', handleScroll, true)
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleItemClick = useCallback(
    (item: ContextMenuItem<T>) => {
      const isDisabled = typeof item.disabled === 'function'
        ? item.disabled(targetData)
        : item.disabled
      if (isDisabled) return
      item.onClick?.(targetData, position)
      onItemClick?.(item.label, targetData)
      setIsOpen(false)
    },
    [onItemClick, targetData, position]
  )

  const renderItems = (menuItems: ContextMenuItem<T>[]) => (
    <ul
      style={{
        listStyleType: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '0px 10px',
        margin: 0,
      }}
    >
      {menuItems.map((item, index) => {
        const isDisabled = typeof item.disabled === 'function'
          ? item.disabled(targetData)
          : item.disabled
        return (
          <li
            key={index}
            onClick={() => handleItemClick(item)}
            className="context-menu-item"
            style={{
              display: 'flex',
              alignItems: 'center',
              color: isDisabled ? '#4a4d55' : item.destructive ? '#f87171' : '#7e8590',
              gap: '10px',
              transition: 'all 0.3s ease-out',
              padding: '8px 10px',
              borderRadius: '6px',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: isDisabled ? 0.5 : 1,
            }}
          >
            <Icon name={item.icon} size="base" />
            <span style={{ fontWeight: 600, fontSize: '14px' }}>{item.label}</span>
          </li>
        )
      })}
    </ul>
  )

  return (
    <>
      <div
        ref={containerRef}
        onContextMenu={handleContextMenu}
        style={{ display: 'contents' }}
      >
        {children}
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="context-menu-card"
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              zIndex: 99999,
              width: '220px',
              backgroundColor: 'rgba(36, 40, 50, 1)',
              backgroundImage:
                'linear-gradient(139deg, rgba(36, 40, 50, 1) 0%, rgba(36, 40, 50, 1) 0%, rgba(37, 28, 40, 1) 100%)',
              borderRadius: '10px',
              padding: '12px 0px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)',
              animation: 'contextMenuFadeIn 100ms ease-out',
            }}
          >
            {groups ? (
              groups.map((group, groupIndex) => (
                <React.Fragment key={groupIndex}>
                  {groupIndex > 0 && (
                    <div
                      className="context-menu-separator"
                      style={{
                        borderTop: '1.5px solid #42434a',
                        margin: '4px 10px',
                      }}
                    />
                  )}
                  {renderItems(group.items)}
                </React.Fragment>
              ))
            ) : items ? (
              renderItems(items)
            ) : null}

            <style>{`
              @keyframes contextMenuFadeIn {
                from {
                  opacity: 0;
                  transform: scale(0.95);
                }
                to {
                  opacity: 1;
                  transform: scale(1);
                }
              }

              .context-menu-item:hover:not([style*="not-allowed"]) {
                background-color: rgba(126, 133, 144, 0.15) !important;
                color: #ffffff !important;
              }

              .context-menu-item:hover:not([style*="not-allowed"]) svg {
                color: #ffffff !important;
              }

              .context-menu-item[style*="f87171"]:hover {
                background-color: rgba(248, 113, 113, 0.15) !important;
                color: #fca5a5 !important;
              }
            `}</style>
          </div>,
          document.body
        )}
    </>
  )
}

export default ContextMenu
