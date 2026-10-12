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
  cilPeople,
  cilBriefcase,
  cilDescription,
  cilBell,
  cilCalendar,
  cilSettings,
  cilChartPie,
  cilCog,
} from '@coreui/icons'
import { ROUTES } from '@app/routes'
import { useAuth } from '@app/providers'
import './AppSidebar.css'

interface Props {
  visible: boolean
  onVisibleChange: (visible: boolean) => void
}

interface NavItemProps {
  to: string
  icon: string[]
  label: string
  color?: string
}

function NavItem({ to, icon, label, color = '#f59e0b' }: NavItemProps) {
  const location = useLocation()
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/')

  return (
    <li className="nav-item">
      <NavLink
        to={to}
        className={`nav-link-pro ${isActive ? 'active' : ''}`}
      >
        <div className="nav-content-pro">
          <div
            className="nav-icon-pro"
            style={
              isActive
                ? { 
                    backgroundColor: color,
                    borderColor: color,
                  }
                : {}
            }
          >
            <CIcon icon={icon} customClassName="nav-icon-svg-pro" />
          </div>
          <span className="nav-label-pro">{label}</span>
        </div>
        {isActive && <div className="nav-active-indicator-pro" style={{ backgroundColor: color }} />}
      </NavLink>
    </li>
  )
}

export function AppSidebar({ visible, onVisibleChange }: Props) {
  const { user } = useAuth()
  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <CSidebar
      className="border-end sidebar-pro"
      colorScheme="light"
      position="fixed"
      visible={visible}
      onVisibleChange={onVisibleChange}
    >
      <CSidebarBrand className="d-none d-md-flex sidebar-brand-pro">
        <div className="brand-wrapper-pro">
          <div className="brand-icon-pro">
            <CIcon icon={cilChartPie} customClassName="brand-icon-svg-pro" />
          </div>
          <span className="sidebar-brand-full-pro fw-bold">FlexDesk</span>
          <span className="sidebar-brand-narrow-pro fw-bold">FD</span>
        </div>
      </CSidebarBrand>

      <CSidebarNav className="sidebar-nav-pro">
        <div className="nav-section-pro">
          <NavItem
            to={ROUTES.DASHBOARD}
            icon={cilSpeedometer}
            label="Dashboard"
            color="#f59e0b"
          />
        </div>

        <div className="nav-section-pro">
          <CNavTitle className="nav-title-pro">Operations</CNavTitle>
          <NavItem
            to={ROUTES.CLIENTS}
            icon={cilPeople}
            label="Clients"
            color="#f59e0b"
          />
          <NavItem
            to={ROUTES.JOBS}
            icon={cilBriefcase}
            label="Jobs"
            color="#f59e0b"
          />
          <NavItem
            to={ROUTES.REQUESTS}
            icon={cilBell}
            label="Requests"
            color="#f59e0b"
          />
          <NavItem
            to={ROUTES.INVOICES}
            icon={cilDescription}
            label="Invoices"
            color="#f59e0b"
          />
          <NavItem
            to={ROUTES.SERVICE_PROVIDERS}
            icon={cilCog}
            label="Providers"
            color="#f59e0b"
          />
        </div>

        <div className="nav-section-pro">
          <CNavTitle className="nav-title-pro">Planning</CNavTitle>
          <NavItem
            to={ROUTES.SCHEDULE}
            icon={cilCalendar}
            label="Schedule"
            color="#f59e0b"
          />
        </div>
      </CSidebarNav>

      <CSidebarFooter className="sidebar-footer-pro">
        <div className="user-profile-pro">
          <CAvatar color="warning" textColor="white" size="md" className="user-avatar-pro">
            {initials}
          </CAvatar>
          <div className="user-info-pro">
            <div className="user-name-pro">{user?.fullName || 'User'}</div>
            <div className="user-email-pro">{user?.email || ''}</div>
          </div>
        </div>
        <NavLink to={ROUTES.SETTINGS} className="settings-link-pro">
          <CIcon icon={cilSettings} customClassName="settings-icon-pro" />
        </NavLink>
      </CSidebarFooter>

      <CSidebarToggler
        className="d-none d-lg-flex sidebar-toggler-pro"
        onClick={() => onVisibleChange(!visible)}
      />
    </CSidebar>
  )
}
