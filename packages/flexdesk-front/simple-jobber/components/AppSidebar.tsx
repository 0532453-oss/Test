import { createElement } from 'react';
import {
  useCanAccess,
  useCreatePath,
  useGetResourceLabel,
  useHasDashboard,
  useResourceDefinitions,
  useTranslate,
} from 'ra-core';
import { useMatch } from 'react-router';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Glimmer, Icon, Link, Stack, Text, Divider } from './atlantis';
import type { IconNames } from './atlantis';
import logoUrl from '../../../flexdesk-website/public/images/core/logo.svg';

/**
 * Custom sidebar for Simple Jobber with additional navigation items.
 * Extends the base AppSidebar with Schedule page.
 * Migrated to use Atlantis components (Stack, Link, Icon, Text, Divider).
 */
export function AppSidebar() {
  const hasDashboard = useHasDashboard();
  const resources = useResourceDefinitions();
  const { openMobile, setOpenMobile } = useSidebar();
  const handleClick = () => {
    if (openMobile) {
      setOpenMobile(false);
    }
  };
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link to="/" className="p-2 flex items-center gap-2">
                <img 
                  src={logoUrl} 
                  alt="FlexDesk" 
                  className="w-8 h-8 flex-shrink-0"
                />
                <Text size="large" className="font-semibold">FlexDesk</Text>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <Stack as="ul" gap="smaller" className="w-full min-w-0">
              {hasDashboard ? (
                <DashboardMenuItem onClick={handleClick} />
              ) : null}
              {Object.keys(resources)
                .filter((name) => resources[name].hasList)
                .map((name) => (
                  <ResourceMenuItem
                    key={name}
                    name={name}
                    onClick={handleClick}
                  />
                ))}
              <Divider className="my-1 mx-2" />
              {/* Custom menu items */}
              <ScheduleMenuItem onClick={handleClick} />
            </Stack>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}

/**
 * Menu item for the dashboard link in the sidebar.
 */
export const DashboardMenuItem = ({ onClick }: { onClick?: () => void }) => {
  const translate = useTranslate();
  const label = translate('ra.page.dashboard', {
    _: 'Dashboard',
  });
  const match = useMatch({ path: '/', end: true });
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={!!match}>
        <Link to="/" onClick={onClick} icon="home">
          <Text>{label}</Text>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

/**
 * Menu item for a resource link in the sidebar.
 */
export const ResourceMenuItem = ({
  name,
  onClick,
}: {
  name: string;
  onClick?: () => void;
}) => {
  const { canAccess, isPending } = useCanAccess({
    resource: name,
    action: 'list',
  });
  const resources = useResourceDefinitions();
  const getResourceLabel = useGetResourceLabel();
  const createPath = useCreatePath();
  const to = createPath({
    resource: name,
    type: 'list',
  });
  const match = useMatch({ path: to, end: false });

  if (isPending) {
    return <Glimmer shape="rectangle" size="base" className="h-8 w-full" />;
  }

  if (!resources || !resources[name] || !canAccess) return null;

  // Check if the resource has a custom icon component
  const hasCustomIcon = !!resources[name].icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={!!match}>
        <Link to={to} state={{ _scrollToTop: true }} onClick={onClick} icon={hasCustomIcon ? undefined : 'list' as IconNames}>
          {hasCustomIcon && createElement(resources[name].icon)}
          <Text>{getResourceLabel(name, 2)}</Text>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

/**
 * Menu item for the Schedule page.
 */
export const ScheduleMenuItem = ({ onClick }: { onClick?: () => void }) => {
  const match = useMatch({ path: '/schedule', end: true });
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={!!match}>
        <Link to="/schedule" onClick={onClick} icon="calendar">
          <Text>Schedule</Text>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

