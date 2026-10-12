import { NavLink, useLocation , Link } from 'react-router-dom'
import {
  CContainer,
  CHeader,
  CHeaderNav,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CDropdownDivider,
  CAvatar,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilAccountLogout,
  cilSettings,
  cilUser,
  cilSpeedometer,
  cilPeople,
  cilBriefcase,
  cilBell,
  cilDescription,
  cilCalendar,
  cilChartPie,
} from '@coreui/icons'
import { useAuth } from '@app/providers'
import { ROUTES } from '@app/routes'

import './AppHeader.css'

interface Props {
  onToggleSidebar?: () => void
}

interface NavItemProps {
  to: string
  icon: string[]
  label: string
}

function TopNavItem({ to, icon, label }: NavItemProps) {
  const location = useLocation()
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/')

  return (
    <NavLink
      to={to}
      className={`top-nav-item ${isActive ? 'active' : ''}`}
    >
      <CIcon icon={icon} className="top-nav-icon" />
      <span className="top-nav-label">{label}</span>
      {isActive && <div className="top-nav-indicator" />}
    </NavLink>
  )
}

export function AppHeader({ onToggleSidebar }: Props) {
  const { user, logout } = useAuth()

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <CHeader position="sticky" className="app-header-modern">
      <CContainer fluid className="header-container">
        {/* Brand Logo */}
        <div className="header-brand">
          <div className="brand-icon-wrapper">
            <CIcon icon={cilChartPie} className="brand-icon" />
          </div>
          <span className="brand-text">FlexDesk</span>
        </div>

        {/* Top Navigation */}
        <nav className="top-navigation">
          <TopNavItem
            to={ROUTES.DASHBOARD}
            icon={cilSpeedometer}
            label="Dashboard"
          />
          <TopNavItem
            to={ROUTES.CLIENTS}
            icon={cilPeople}
            label="Clients"
          />
          <TopNavItem
            to={ROUTES.JOBS}
            icon={cilBriefcase}
            label="Jobs"
          />
          <TopNavItem
            to={ROUTES.REQUESTS}
            icon={cilBell}
            label="Requests"
          />
          <TopNavItem
            to={ROUTES.INVOICES}
            icon={cilDescription}
            label="Invoices"
          />
          <TopNavItem
            to={ROUTES.SCHEDULE}
            icon={cilCalendar}
            label="Schedule"
          />
        </nav>

        {/* User Menu */}
        <CHeaderNav className="header-user-menu">
          <CDropdown variant="nav-item" alignment="end">
            <CDropdownToggle caret={false} className="user-menu-toggle">
              <CAvatar color="warning" textColor="white" size="md" className="user-avatar-header">
                {initials}
              </CAvatar>
            </CDropdownToggle>
            <CDropdownMenu>
              <CDropdownItem disabled className="text-muted user-email-item">
                {user?.email}
              </CDropdownItem>
              <CDropdownDivider />
              <CDropdownItem as={Link} to={ROUTES.SETTINGS_PROFILE}>
                <CIcon icon={cilUser} className="me-2" />
                Profile
              </CDropdownItem>
              <CDropdownItem as={Link} to={ROUTES.SETTINGS}>
                <CIcon icon={cilSettings} className="me-2" />
                Settings
              </CDropdownItem>
              <CDropdownDivider />
              <CDropdownItem onClick={logout} style={{ cursor: 'pointer' }}>
                <CIcon icon={cilAccountLogout} className="me-2" />
                Logout
              </CDropdownItem>
            </CDropdownMenu>
          </CDropdown>
        </CHeaderNav>
      </CContainer>
    </CHeader>
  )
}
