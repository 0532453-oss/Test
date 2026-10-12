/**
 * Alternative Sidebar Design Option
 * 
 * This is an alternative design with a lighter, more minimal aesthetic.
 * To use this version, rename this file to AppSidebar.tsx and update the CSS.
 */

import { NavLink, useLocation } from 'react-router-dom'
import {
  CSidebar,
  CSidebarBrand,
  CSidebarNav,
  CNavTitle,
  CSidebarToggler,
  CSidebarFooter,
  CAvatar,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilBriefcase,
  cilPeople,
  cilDescription,
  cilCalendar,
  cilEnvelopeOpen,
  cilSettings,
} from '@coreui/icons'
import { ROUTES } from '@app/routes'
import { useAuth } from '@app/providers'
import './AppSidebar.alt.css'

interface Props {
  visible: boolean
  onVisibleChange: (visible: boolean) => void
}

interface NavItemProps {
  to: string
  icon: string[]
  label: string
}

function NavItem({ to, icon, label }: NavItemProps) {
  const location = useLocation()
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/')

  return (
    <li className="nav-item">
      <NavLink
        to={to}
        className={`nav-link-alt ${isActive ? 'active' : ''}`}
      >
        <CIcon icon={icon} customClassName="nav-icon-alt" />
        <span className="nav-label-alt">{label}</span>
        {isActive && <div className="nav-indicator-alt" />}
      </NavLink>
    </li>
  )
}

export function AppSidebarAlt({ visible, onVisibleChange }: Props) {
  const { user } = useAuth()
  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <CSidebar
      className="border-end sidebar-alt"
      colorScheme="light"
      position="fixed"
      visible={visible}
      onVisibleChange={onVisibleChange}
    >
      <CSidebarBrand className="d-none d-md-flex sidebar-brand-alt">
        <div className="brand-container-alt">
          <span className="sidebar-brand-full-alt fw-bold">FlexDesk</span>
          <span className="sidebar-brand-narrow-alt fw-bold">FD</span>
        </div>
      </CSidebarBrand>

      <CSidebarNav className="sidebar-nav-alt">
        <div className="nav-section-alt">
          <NavItem
            to={ROUTES.DASHBOARD}
            icon={cilSpeedometer}
            label="Dashboard"
          />
        </div>

        <div className="nav-section-alt">
          <CNavTitle className="nav-title-alt">Management</CNavTitle>
          <NavItem
            to={ROUTES.CLIENTS}
            icon={cilPeople}
            label="Clients"
          />
          <NavItem
            to={ROUTES.JOBS}
            icon={cilBriefcase}
            label="Jobs"
          />
          <NavItem
            to={ROUTES.REQUESTS}
            icon={cilEnvelopeOpen}
            label="Requests"
          />
          <NavItem
            to={ROUTES.INVOICES}
            icon={cilDescription}
            label="Invoices"
          />
        </div>

        <div className="nav-section-alt">
          <CNavTitle className="nav-title-alt">Planning</CNavTitle>
          <NavItem
            to={ROUTES.SCHEDULE}
            icon={cilCalendar}
            label="Schedule"
          />
        </div>
      </CSidebarNav>

      <CSidebarFooter className="sidebar-footer-alt">
        <div className="user-profile-alt">
          <CAvatar color="primary" textColor="white" size="md" className="user-avatar-alt">
            {initials}
          </CAvatar>
          <div className="user-info-alt">
            <div className="user-name-alt">{user?.fullName || 'User'}</div>
            <div className="user-email-alt">{user?.email || ''}</div>
          </div>
        </div>
        <NavLink to={ROUTES.SETTINGS} className="settings-link-alt">
          <CIcon icon={cilSettings} customClassName="nav-icon-alt" />
        </NavLink>
      </CSidebarFooter>

      <CSidebarToggler
        className="d-none d-lg-flex sidebar-toggler-alt"
        onClick={() => onVisibleChange(!visible)}
      />
    </CSidebar>
  )
}
