/**
 * AtlantisThemeContext - Local implementation matching @jobber/components AtlantisThemeContext API
 *
 * This provides the same interface as the Atlantis component library's theme context,
 * allowing future migration to the actual library when fully integrated.
 */
import type { CSSProperties, PropsWithChildren } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export type Theme = 'light' | 'dark';

export type OverrideTokens = Record<string, string | number>;

/**
 * Design tokens structure matching @jobber/design tokens
 * This is a simplified version - full tokens would come from @jobber/design
 */
export interface DesignTokens {
  // Color tokens
  'color-surface': string;
  'color-surface--background': string;
  'color-surface--hover': string;
  'color-surface--reverse': string;
  'color-text': string;
  'color-text--secondary': string;
  'color-text--reverse': string;
  'color-interactive': string;
  'color-interactive--hover': string;
  'color-interactive--subtle': string;
  'color-critical': string;
  'color-critical--surface': string;
  'color-warning': string;
  'color-warning--surface': string;
  'color-success': string;
  'color-success--surface': string;
  'color-informative': string;
  'color-informative--surface': string;
  'color-border': string;
  'color-border--hover': string;
  // Semantic status text colors (for icons, labels, indicators)
  'color-success--text': string;
  'color-warning--text': string;
  'color-critical--text': string;
  'color-informative--text': string;
  'color-inactive': string;
  'color-inactive--surface': string;
  // Semantic status border colors
  'color-success--border': string;
  'color-warning--border': string;
  'color-critical--border': string;
  'color-informative--border': string;
  // Spacing tokens
  'space-smaller': string;
  'space-small': string;
  'space-base': string;
  'space-large': string;
  'space-larger': string;
  'space-largest': string;
  // Typography tokens
  'typography-fontFamily': string;
  'typography-fontSize-base': string;
  'typography-fontSize-small': string;
  'typography-fontSize-large': string;
  'typography-lineHeight': string;
  // Border width tokens
  'border-base': string;
  'border-thick': string;
  // Border radius tokens
  'radius-small': string;
  'radius-base': string;
  'radius-large': string;
  'radius-larger': string;
  // Shadow tokens
  'shadow-base': string;
  'shadow-high': string;
  // Allow additional custom tokens
  [key: string]: string | number;
}

/**
 * Light theme tokens
 */
const lightTokens: DesignTokens = {
  // Colors
  'color-surface': '#ffffff',
  'color-surface--background': '#f6f6f6',
  'color-surface--hover': '#f0f0f0',
  'color-surface--reverse': '#1a1a1a',
  'color-text': '#1a1a1a',
  'color-text--secondary': '#6b6b6b',
  'color-text--reverse': '#ffffff',
  'color-interactive': '#0070f3',
  'color-interactive--hover': '#0060d0',
  'color-interactive--subtle': '#e6f0ff',
  'color-critical': '#dc2626',
  'color-critical--surface': '#fef2f2',
  'color-warning': '#f59e0b',
  'color-warning--surface': '#fffbeb',
  'color-success': '#16a34a',
  'color-success--surface': '#f0fdf4',
  'color-informative': '#0284c7',
  'color-informative--surface': '#f0f9ff',
  'color-border': '#e5e5e5',
  'color-border--hover': '#d4d4d4',
  // Semantic status text colors
  'color-success--text': '#16a34a',
  'color-warning--text': '#ca8a04',
  'color-critical--text': '#dc2626',
  'color-informative--text': '#0284c7',
  'color-inactive': '#737373',
  'color-inactive--surface': '#f5f5f5',
  // Semantic status border colors
  'color-success--border': '#bbf7d0',
  'color-warning--border': '#fef08a',
  'color-critical--border': '#fecaca',
  'color-informative--border': '#bae6fd',
  // Spacing
  'space-smaller': '4px',
  'space-small': '8px',
  'space-base': '16px',
  'space-large': '24px',
  'space-larger': '32px',
  'space-largest': '48px',
  // Typography
  'typography-fontFamily': 'Inter, system-ui, sans-serif',
  'typography-fontSize-base': '14px',
  'typography-fontSize-small': '12px',
  'typography-fontSize-large': '16px',
  'typography-lineHeight': '1.5',
  // Border widths
  'border-base': '1px',
  'border-thick': '2px',
  // Border radius
  'radius-small': '4px',
  'radius-base': '8px',
  'radius-large': '16px',
  'radius-larger': '24px',
  // Shadows
  'shadow-base': '0 1px 3px 0 rgb(0 0 0 / 0.1)',
  'shadow-high': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
};

/**
 * Dark theme tokens (merged with light as base)
 */
const darkTokens: Partial<DesignTokens> = {
  // Override colors for dark theme
  'color-surface': '#1a1a1a',
  'color-surface--background': '#0f0f0f',
  'color-surface--hover': '#2a2a2a',
  'color-surface--reverse': '#ffffff',
  'color-text': '#f5f5f5',
  'color-text--secondary': '#a3a3a3',
  'color-text--reverse': '#1a1a1a',
  'color-interactive': '#3b82f6',
  'color-interactive--hover': '#60a5fa',
  'color-interactive--subtle': '#1e3a5f',
  'color-critical': '#ef4444',
  'color-critical--surface': '#450a0a',
  'color-warning': '#fbbf24',
  'color-warning--surface': '#451a03',
  'color-success': '#22c55e',
  'color-success--surface': '#052e16',
  'color-informative': '#38bdf8',
  'color-informative--surface': '#082f49',
  'color-border': '#404040',
  'color-border--hover': '#525252',
  // Semantic status text colors (dark)
  'color-success--text': '#4ade80',
  'color-warning--text': '#facc15',
  'color-critical--text': '#f87171',
  'color-informative--text': '#38bdf8',
  'color-inactive': '#a3a3a3',
  'color-inactive--surface': '#262626',
  // Semantic status border colors (dark)
  'color-success--border': '#166534',
  'color-warning--border': '#854d0e',
  'color-critical--border': '#991b1b',
  'color-informative--border': '#075985',
  // Shadows for dark mode
  'shadow-base': '0 1px 3px 0 rgb(0 0 0 / 0.3)',
  'shadow-high': '0 4px 6px -1px rgb(0 0 0 / 0.4)',
};

export interface AtlantisThemeContextValue {
  /**
   * The theme of the application.
   */
  readonly theme: Theme;

  /**
   * The design tokens for the current theme.
   */
  readonly tokens: DesignTokens;

  /**
   * Any overridden tokens supplied by the user.
   */
  readonly overrideTokens?: OverrideTokens;
}

export interface AtlantisThemeContextProviderProps extends PropsWithChildren {
  /**
   * The children to render.
   */
  readonly children: React.ReactNode;

  /**
   * Force the theme for this provider to always be the same as the provided theme.
   * Useful for sections that should remain the same theme regardless of the rest of the application's theme.
   * This is dangerous because the children in this provider will not be able to change the theme.
   */
  readonly dangerouslyOverrideTheme?: Theme;

  /**
   * Overrides existing design tokens with custom values.
   * Can also supply custom tokens which will be accessible via useAtlantisTheme() context and css variables.
   *
   * **Important**: you should provide a constant or at least a memoized value for performance reasons.
   */
  readonly dangerouslyOverrideTokens?: OverrideTokens;
}

export const THEME_CHANGE_EVENT = 'atlantis.toggle-theme';

export interface ThemeChangeDetails {
  theme: Theme;
}

export const atlantisThemeContextDefaultValues: AtlantisThemeContextValue = {
  theme: 'light',
  tokens: lightTokens,
};

const AtlantisThemeContext = createContext(atlantisThemeContextDefaultValues);

/**
 * Merge tokens with overrides
 */
function mergeTokens(base: DesignTokens, overrides?: OverrideTokens): DesignTokens {
  if (!overrides) return base;
  return { ...base, ...overrides };
}

/**
 * Get the tokens for the given theme
 */
function getThemeTokens(theme: Theme): DesignTokens {
  if (theme === 'dark') {
    return { ...lightTokens, ...darkTokens } as DesignTokens;
  }
  return lightTokens;
}

/**
 * Convert tokens to CSS variable overrides
 */
function getCssVariableOverrides(overrideTokens: OverrideTokens): CSSProperties {
  return Object.entries(overrideTokens).reduce<Record<string, string | number>>(
    (variables, [tokenName, tokenValue]) => {
      variables[`--${tokenName}`] = tokenValue;
      return variables;
    },
    {},
  ) as CSSProperties;
}

/**
 * Hook to compute tokens with theme and overrides
 */
function useTokens(theme: Theme, overrideTokens: OverrideTokens | undefined) {
  const currentTokens = getThemeTokens(theme);

  const finalTokens = useMemo(() => {
    return mergeTokens(currentTokens, overrideTokens);
  }, [currentTokens, overrideTokens]);

  const cssVariableOverrides = overrideTokens
    ? getCssVariableOverrides(overrideTokens)
    : undefined;

  return {
    finalTokens,
    cssVariableOverrides,
  };
}

/**
 * Internal provider for dynamic theme (listens to theme change events)
 */
function InternalDynamicThemeProvider({
  children,
  dangerouslyOverrideTokens,
}: {
  readonly children: React.ReactNode;
  readonly dangerouslyOverrideTokens: OverrideTokens | undefined;
}) {
  const getInitialTheme = (): Theme => {
    if (typeof document !== 'undefined') {
      return (document.documentElement.dataset.theme as Theme) ?? 'light';
    }
    return 'light';
  };

  const [internalTheme, setInternalTheme] = useState<Theme>(getInitialTheme);
  const { finalTokens, cssVariableOverrides } = useTokens(
    internalTheme,
    dangerouslyOverrideTokens,
  );

  const handleThemeChangeEvent = useCallback((event: Event) => {
    const newTheme = (event as CustomEvent<ThemeChangeDetails>).detail.theme;
    setInternalTheme(newTheme);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChangeEvent);

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChangeEvent);
    };
  }, [handleThemeChangeEvent]);

  return (
    <AtlantisThemeContext.Provider
      value={{
        theme: internalTheme,
        tokens: finalTokens,
        overrideTokens: dangerouslyOverrideTokens,
      }}
    >
      {cssVariableOverrides ? (
        <div style={{ ...cssVariableOverrides, display: 'contents' }}>
          {children}
        </div>
      ) : (
        children
      )}
    </AtlantisThemeContext.Provider>
  );
}

/**
 * Internal provider for static theme (always uses the specified theme)
 */
function InternalStaticThemeProvider({
  dangerouslyOverrideTheme,
  children,
  dangerouslyOverrideTokens,
}: {
  readonly dangerouslyOverrideTheme: Theme;
  readonly children: React.ReactNode;
  readonly dangerouslyOverrideTokens: OverrideTokens | undefined;
}) {
  const { finalTokens, cssVariableOverrides } = useTokens(
    dangerouslyOverrideTheme,
    dangerouslyOverrideTokens,
  );

  return (
    <AtlantisThemeContext.Provider
      value={{
        theme: dangerouslyOverrideTheme,
        tokens: finalTokens,
        overrideTokens: dangerouslyOverrideTokens,
      }}
    >
      <div
        data-theme={dangerouslyOverrideTheme}
        style={{ ...cssVariableOverrides, display: 'contents' }}
      >
        {children}
      </div>
    </AtlantisThemeContext.Provider>
  );
}

/**
 * AtlantisThemeContextProvider
 *
 * Provides theme context for Atlantis components. Supports light/dark themes
 * and custom token overrides.
 *
 * @example
 * ```tsx
 * // Basic usage with dynamic theme
 * <AtlantisThemeContextProvider>
 *   <App />
 * </AtlantisThemeContextProvider>
 *
 * // Force dark theme
 * <AtlantisThemeContextProvider dangerouslyOverrideTheme="dark">
 *   <App />
 * </AtlantisThemeContextProvider>
 *
 * // With custom token overrides
 * const customTokens = useMemo(() => ({
 *   'color-interactive': '#007bff',
 * }), []);
 *
 * <AtlantisThemeContextProvider dangerouslyOverrideTokens={customTokens}>
 *   <App />
 * </AtlantisThemeContextProvider>
 * ```
 */
export function AtlantisThemeContextProvider({
  children,
  dangerouslyOverrideTheme,
  dangerouslyOverrideTokens,
}: AtlantisThemeContextProviderProps) {
  if (dangerouslyOverrideTheme) {
    return (
      <InternalStaticThemeProvider
        dangerouslyOverrideTokens={dangerouslyOverrideTokens}
        dangerouslyOverrideTheme={dangerouslyOverrideTheme}
      >
        {children}
      </InternalStaticThemeProvider>
    );
  }

  return (
    <InternalDynamicThemeProvider dangerouslyOverrideTokens={dangerouslyOverrideTokens}>
      {children}
    </InternalDynamicThemeProvider>
  );
}

/**
 * Hook to access the current Atlantis theme context
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, tokens } = useAtlantisTheme();
 *   return (
 *     <div style={{ color: tokens['color-text'] }}>
 *       Current theme: {theme}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAtlantisTheme(): AtlantisThemeContextValue {
  return useContext(AtlantisThemeContext);
}
