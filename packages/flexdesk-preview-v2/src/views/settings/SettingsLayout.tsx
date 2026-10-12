import { NavLink, Outlet } from 'react-router-dom'
import { Heading, Icon, Text } from '@/atlantis'
import type { IconNames } from '@/atlantis'
import { ROUTES } from '@app/routes'

interface SettingsNavItem {
  label: string
  path: string
  icon: IconNames
  description: string
}

const settingsNav: SettingsNavItem[] = [
  {
    label: 'Profile',
    path: ROUTES.SETTINGS_PROFILE,
    icon: 'person',
    description: 'Your personal info and preferences',
  },
  {
    label: 'Workspace',
    path: ROUTES.SETTINGS_WORKSPACE,
    icon: 'building',
    description: 'Workspace name and settings',
  },
  {
    label: 'Company Profile',
    path: ROUTES.SETTINGS_COMPANY_PROFILE,
    icon: 'company',
    description: 'Company branding and details',
  },
  {
    label: 'Team',
    path: ROUTES.SETTINGS_TEAM,
    icon: 'clients',
    description: 'Manage members and roles',
  },
  {
    label: 'Billing',
    path: ROUTES.SETTINGS_BILLING,
    icon: 'payment',
    description: 'Subscription and payment info',
  },
]

export function SettingsLayout() {
  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6">
      <Heading level={2} className="text-gray-900 mb-6">Settings</Heading>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Side Navigation */}
        <nav className="w-full md:w-64 shrink-0">
          <div className="flex flex-col gap-1">
            {settingsNav.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Icon name={item.icon} size="base" />
                <div className="flex flex-col">
                  <Text size="base" className="font-medium">{item.label}</Text>
                  <Text size="small" variation="subdued" className="hidden md:block">
                    {item.description}
                  </Text>
                </div>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Page Content */}
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
