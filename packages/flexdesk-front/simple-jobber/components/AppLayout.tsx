import type { ErrorInfo } from 'react';
import { Suspense, useState } from 'react';
import type { CoreLayoutProps } from 'ra-core';
import { ErrorBoundary } from 'react-error-boundary';
import { AtlantisContext } from './AtlantisContext';
import type { AtlantisContextProps } from './AtlantisContext';
import { AtlantisThemeContextProvider } from './AtlantisThemeContext';
import type { OverrideTokens, Theme } from './AtlantisThemeContext';
import { AtlantisPortalContent } from './AtlantisPortalContent';
import { Frame } from './atlantis/Frame';
import { Content } from './atlantis/Content';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import {
  UserMenu,
  Notification,
  LocalesMenuButton,
  Error,
  Loading,
} from '@/components/admin';
import { AppSidebar } from './AppSidebar';
import { CommandPalette } from './CommandPalette';

/**
 * Atlantis context configuration for FlexDesk
 * Configures locale, date/time formats, and currency settings
 */
const atlantisConfig: AtlantisContextProps = {
  dateFormat: 'P', // Locale-aware date format (e.g., "04/29/2024" for en-US)
  timeFormat: 'p', // Locale-aware time format (e.g., "12:00 AM" for en-US)
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  floatSeparators: { group: ',', decimal: '.' },
  currencySymbol: '$',
  locale: 'en',
  firstDayOfWeek: 0, // Sunday
};

/**
 * FlexDesk theme configuration
 * Maps existing Tailwind/CSS color variables to Atlantis design tokens
 *
 * The app uses a light theme with warm off-white background
 * These token overrides ensure Atlantis components match the existing design
 */
const flexDeskThemeTokens: OverrideTokens = {
  // Light background colors
  'color-surface': '#ffffff',
  'color-surface--background': '#F9F8F6',
  'color-surface--hover': '#f0f0f0',
  'color-surface--reverse': '#032B3A',
  // Text colors for light theme
  'color-text': '#032B3A',
  'color-text--secondary': '#5D757E',
  'color-text--reverse': '#ffffff',
  // Interactive colors - teal/cyan accent
  'color-interactive': 'hsl(195, 80%, 40%)',
  'color-interactive--hover': 'hsl(195, 80%, 35%)',
  'color-interactive--subtle': 'hsl(195, 60%, 93%)',
  // Status colors for light theme
  'color-critical': '#dc2626',
  'color-critical--surface': '#fef2f2',
  'color-warning': '#f59e0b',
  'color-warning--surface': '#fffbeb',
  'color-success': '#16a34a',
  'color-success--surface': '#f0fdf4',
  'color-informative': '#0284c7',
  'color-informative--surface': '#f0f9ff',
  // Border colors for light theme
  'color-border': '#DADFE2',
  'color-border--hover': '#d4d4d4',
  // Shadows for light theme
  'shadow-base': '0 1px 3px 0 rgb(0 0 0 / 0.1)',
  'shadow-high': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
};

/**
 * Default theme for FlexDesk - light theme
 */
const defaultTheme: Theme = 'light';

/**
 * AppLayoutHeader component - Header bar with sidebar trigger and user menu
 * Extracted for cleaner composition with Frame component
 */
function AppLayoutHeader() {
  return (
    <header className="flex h-16 md:h-12 shrink-0 items-center gap-2 px-4">
      <SidebarTrigger className="scale-125 sm:scale-100" />
      <div className="flex-1 flex items-center" id="breadcrumb" />
      <LocalesMenuButton />
      <UserMenu />
    </header>
  );
}

/**
 * Custom layout for Simple Jobber with custom sidebar navigation
 * including Schedule and Insights pages.
 *
 * Uses Atlantis layout components:
 * - Frame: Top-level app structure with sidebar support
 * - Content: Consistent vertical spacing for page content
 * - Container: Horizontal padding and max-width constraints
 *
 * AtlantisContext, AtlantisThemeContext, and AtlantisPortalContent
 * are configured at the root level for global theme and overlay support.
 */
export const AppLayout = (props: CoreLayoutProps) => {
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | undefined>(undefined);
  const handleError = (_: Error, info: ErrorInfo) => {
    setErrorInfo(info);
  };

  return (
    <AtlantisContext.Provider value={atlantisConfig}>
      <AtlantisThemeContextProvider
        dangerouslyOverrideTheme={defaultTheme}
        dangerouslyOverrideTokens={flexDeskThemeTokens}
      >
        <SidebarProvider>
          {/* Frame provides the main app structure with sidebar support */}
          <Frame
            sidebar={<AppSidebar />}
            header={<AppLayoutHeader />}
            contentClassName="h-svh overflow-y-auto group-data-[scroll-locked=1]/body:h-full has-[main.fixed-main]:group-data-[scroll-locked=1]/body:h-svh"
          >
            <ErrorBoundary
              onError={handleError}
              fallbackRender={({ error, resetErrorBoundary }) => (
                <Error
                  error={error}
                  errorInfo={errorInfo}
                  resetErrorBoundary={resetErrorBoundary}
                />
              )}
            >
              <Suspense fallback={<Loading />}>
                {/* Content provides consistent vertical spacing */}
                <Content className="px-4">
                  {props.children}
                </Content>
              </Suspense>
            </ErrorBoundary>
          </Frame>
          <Notification />
          <CommandPalette />
        </SidebarProvider>
        {/* Portal container for Atlantis overlays (modals, drawers, etc.) */}
        <AtlantisPortalContent>
          <div id="atlantis-portal-container" />
        </AtlantisPortalContent>
      </AtlantisThemeContextProvider>
    </AtlantisContext.Provider>
  );
};
