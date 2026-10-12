/**
 * AtlantisPortalContent - Local implementation matching @jobber/components AtlantisPortalContent API
 *
 * This component is used to wrap content that is rendered inside a portal (like modals, drawers, etc.)
 * It ensures that portal content inherits the current theme from the AtlantisThemeContext.
 *
 * When components render content in React portals (document.body), they lose access to the
 * React context tree. This component re-establishes the theme context for that portal content.
 */
import type { ReactNode } from 'react';
import { AtlantisThemeContextProvider, useAtlantisTheme } from './AtlantisThemeContext';

export interface AtlantisPortalContentProps {
  /** The content that will be rendered inside a portal. */
  readonly children: ReactNode;
}

/**
 * AtlantisPortalContent
 *
 * Wraps portal content with the current theme context so that modals, drawers,
 * and other overlay components inherit the correct theme styling.
 *
 * @example
 * ```tsx
 * // In your App root, render AtlantisPortalContent as a sibling to your main content
 * <AtlantisContext.Provider value={atlantisConfig}>
 *   <AtlantisThemeContextProvider dangerouslyOverrideTheme="dark">
 *     <AppContent />
 *     <AtlantisPortalContent>
 *       {/* Portal content like modals will render here *\/}
 *     </AtlantisPortalContent>
 *   </AtlantisThemeContextProvider>
 * </AtlantisContext.Provider>
 * ```
 */
export function AtlantisPortalContent({ children }: AtlantisPortalContentProps) {
  const { theme, overrideTokens } = useAtlantisTheme();

  return (
    <AtlantisThemeContextProvider
      dangerouslyOverrideTheme={theme}
      dangerouslyOverrideTokens={overrideTokens}
    >
      {children}
    </AtlantisThemeContextProvider>
  );
}
