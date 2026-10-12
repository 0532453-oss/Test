import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Icon, type IconNames } from '@/atlantis'

/**
 * Dark-themed dropdown menu for adding clients
 * Styled based on uiverse.io/Na3ar-17/terrible-gecko-91
 */

interface AddClientMenuItemProps {
  icon: IconNames
  label: string
  onClick?: () => void
}

interface AddClientMenuProps {
  children: React.ReactNode
  items: AddClientMenuItemProps[]
  onItemClick?: (label: string) => void
}

export function AddClientMenu({ children, items, onItemClick }: AddClientMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Calculate position when menu opens
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return

    const updatePosition = () => {
      if (!triggerRef.current) return
      const rect = triggerRef.current.getBoundingClientRect()
      const scrollY = window.scrollY
      const scrollX = window.scrollX

      setPosition({
        top: rect.bottom + scrollY + 8,
        left: rect.left + scrollX,
      })
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen])

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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
    (item: AddClientMenuItemProps) => {
      item.onClick?.()
      onItemClick?.(item.label)
      setIsOpen(false)
    },
    [onItemClick]
  )

  return (
    <>
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer', display: 'inline-block' }}
      >
        {children}
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="add-client-menu-card"
            style={{
              position: 'absolute',
              top: position.top,
              left: position.left,
              zIndex: 9999,
              width: '220px',
              backgroundColor: 'rgba(36, 40, 50, 1)',
              backgroundImage:
                'linear-gradient(139deg, rgba(36, 40, 50, 1) 0%, rgba(36, 40, 50, 1) 0%, rgba(37, 28, 40, 1) 100%)',
              borderRadius: '10px',
              padding: '15px 0px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)',
              animation: 'addClientMenuFadeIn 150ms ease-out',
            }}
          >
            <ul
              style={{
                listStyleType: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '0px 10px',
                margin: 0,
              }}
            >
              {items.map((item, index) => (
                <li
                  key={index}
                  onClick={() => handleItemClick(item)}
                  className="add-client-menu-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: '#7e8590',
                    gap: '10px',
                    transition: 'all 0.3s ease-out',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <Icon name={item.icon} size="base" />
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{item.label}</span>
                </li>
              ))}
            </ul>

            <style>{`
              @keyframes addClientMenuFadeIn {
                from {
                  opacity: 0;
                  transform: translateY(-8px) scale(0.95);
                }
                to {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                }
              }

              .add-client-menu-item:hover {
                background-color: rgba(126, 133, 144, 0.1) !important;
                color: #ffffff !important;
              }

              .add-client-menu-item:hover svg {
                color: #ffffff !important;
              }
            `}</style>
          </div>,
          document.body
        )}
    </>
  )
}

/**
 * Variant with separator for grouped items
 */
interface AddClientMenuGroupedProps {
  children: React.ReactNode
  groups: {
    items: AddClientMenuItemProps[]
  }[]
  onItemClick?: (label: string) => void
}

export function AddClientMenuGrouped({
  children,
  groups,
  onItemClick,
}: AddClientMenuGroupedProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return

    const updatePosition = () => {
      if (!triggerRef.current) return
      const rect = triggerRef.current.getBoundingClientRect()
      const scrollY = window.scrollY
      const scrollX = window.scrollX

      setPosition({
        top: rect.bottom + scrollY + 8,
        left: rect.left + scrollX,
      })
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

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
    (item: AddClientMenuItemProps) => {
      item.onClick?.()
      onItemClick?.(item.label)
      setIsOpen(false)
    },
    [onItemClick]
  )

  return (
    <>
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer', display: 'inline-block' }}
      >
        {children}
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="add-client-menu-card"
            style={{
              position: 'absolute',
              top: position.top,
              left: position.left,
              zIndex: 9999,
              width: '220px',
              backgroundColor: 'rgba(36, 40, 50, 1)',
              backgroundImage:
                'linear-gradient(139deg, rgba(36, 40, 50, 1) 0%, rgba(36, 40, 50, 1) 0%, rgba(37, 28, 40, 1) 100%)',
              borderRadius: '10px',
              padding: '15px 0px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)',
              animation: 'addClientMenuFadeIn 150ms ease-out',
            }}
          >
            {groups.map((group, groupIndex) => (
              <React.Fragment key={groupIndex}>
                {groupIndex > 0 && (
                  <div
                    style={{
                      borderTop: '1.5px solid #42434a',
                      margin: '0 10px',
                    }}
                  />
                )}
                <ul
                  style={{
                    listStyleType: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    padding: '0px 10px',
                    margin: 0,
                  }}
                >
                  {group.items.map((item, index) => (
                    <li
                      key={index}
                      onClick={() => handleItemClick(item)}
                      className="add-client-menu-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        color: '#7e8590',
                        gap: '10px',
                        transition: 'all 0.3s ease-out',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <Icon name={item.icon} size="base" />
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </React.Fragment>
            ))}

            <style>{`
              @keyframes addClientMenuFadeIn {
                from {
                  opacity: 0;
                  transform: translateY(-8px) scale(0.95);
                }
                to {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                }
              }

              .add-client-menu-item:hover {
                background-color: rgba(126, 133, 144, 0.1) !important;
                color: #ffffff !important;
              }

              .add-client-menu-item:hover svg {
                color: #ffffff !important;
              }
            `}</style>
          </div>,
          document.body
        )}
    </>
  )
}

export default AddClientMenu
