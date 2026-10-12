/**
 * Atlantis Tabs Component
 *
 * Matches @jobber/components Tabs API for migration path.
 * Tabs provide a horizontal navigation pattern for switching between views.
 *
 * @example
 * <Tabs defaultTab={0} onTabChange={(index) => console.log(index)}>
 *   <Tab label="All Clients">
 *     <ClientList filter={undefined} />
 *   </Tab>
 *   <Tab label="Leads">
 *     <ClientList filter="LEAD" />
 *   </Tab>
 * </Tabs>
 *
 * @example Controlled mode
 * const [activeTab, setActiveTab] = useState(0);
 * <Tabs activeTab={activeTab} onTabChange={setActiveTab}>
 *   <Tab label="Tab 1"><Content1 /></Tab>
 *   <Tab label="Tab 2"><Content2 /></Tab>
 * </Tabs>
 */
import type { ReactElement, ReactNode } from 'react';
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Text } from './Text';

export interface TabsProps {
  /** Tab children - must be Tab components */
  readonly children:
    | ReactElement
    | Array<ReactElement | null | undefined | boolean>;

  /**
   * Index of the tab that should be active on mount.
   * @default 0
   */
  readonly defaultTab?: number;

  /**
   * Index of the active tab (controlled mode).
   * If provided, component is controlled and active tab is determined by this prop.
   */
  readonly activeTab?: number;

  /**
   * Callback fired when the active tab changes.
   */
  onTabChange?(newTabIndex: number): void;

  /**
   * Additional class name for the tabs container.
   */
  readonly className?: string;
}

export interface TabProps {
  /** Label displayed on the tab button */
  readonly label: string | ReactNode;

  /**
   * Content to display when this tab is active.
   * Optional when using controlled mode with content rendered outside Tabs.
   */
  readonly children?: ReactNode | ReactNode[];

  /** Click handler for the tab button */
  onClick?(event: React.MouseEvent<HTMLButtonElement>): void;
}

/**
 * Tab content component - children are rendered when tab is active.
 */
export function Tab({ label }: TabProps) {
  return <>{label}</>;
}

Tab.displayName = 'Tab';

/**
 * Tabs container component.
 */
export function Tabs({
  children,
  defaultTab = 0,
  activeTab: controlledActiveTab,
  onTabChange,
  className,
}: TabsProps) {
  const tabChildren = getActiveTabs(children);
  const activeTabInitialValue = defaultTab < tabChildren.length ? defaultTab : 0;
  const [internalActiveTab, setInternalActiveTab] = useState(activeTabInitialValue);
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

  const tabRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const activateTab = (index: number) => () => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(index);
    }
    onTabChange?.(index);
  };

  // Handle arrow key navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    const tabCount = tabChildren.length;
    let newIndex = activeTab;

    if (event.key === 'ArrowLeft') {
      newIndex = activeTab === 0 ? tabCount - 1 : activeTab - 1;
      event.preventDefault();
    } else if (event.key === 'ArrowRight') {
      newIndex = activeTab === tabCount - 1 ? 0 : activeTab + 1;
      event.preventDefault();
    } else if (event.key === 'Home') {
      newIndex = 0;
      event.preventDefault();
    } else if (event.key === 'End') {
      newIndex = tabCount - 1;
      event.preventDefault();
    }

    if (newIndex !== activeTab) {
      activateTab(newIndex)();
      tabRefs.current.get(newIndex)?.focus();
    }
  };

  const activeTabProps = tabChildren[activeTab]?.props;

  // Reset to default if active tab is out of bounds
  useEffect(() => {
    if (activeTab > tabChildren.length - 1) {
      setInternalActiveTab(activeTabInitialValue);
    }
  }, [tabChildren.length, activeTab, activeTabInitialValue]);

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Tab List */}
      <div className="border-b border-[var(--color-border)]">
        <ul
          role="tablist"
          className="flex items-center gap-1 -mb-px"
          onKeyDown={handleKeyDown}
        >
          {(() => {
            let tabIndex = 0;
            return React.Children.map(children, (child) => {
              if (!isChildTab(child)) {
                return child;
              }

              const currentTabIndex = tabIndex;
              tabIndex++;

              return (
                <InternalTab
                  key={currentTabIndex}
                  label={child.props.label}
                  selected={activeTab === currentTabIndex}
                  activateTab={activateTab(currentTabIndex)}
                  onClick={child.props.onClick}
                  tabIndex={activeTab === currentTabIndex ? 0 : -1}
                  ref={(el) => {
                    if (el) {
                      tabRefs.current.set(currentTabIndex, el);
                    } else {
                      tabRefs.current.delete(currentTabIndex);
                    }
                  }}
                />
              );
            });
          })()}
        </ul>
      </div>

      {/* Tab Panel */}
      <section
        role="tabpanel"
        className="pt-4"
        aria-label={
          typeof activeTabProps?.label === 'string'
            ? activeTabProps.label
            : undefined
        }
      >
        {activeTabProps?.children}
      </section>
    </div>
  );
}

interface InternalTabProps {
  readonly label: string | ReactNode;
  readonly selected: boolean;
  activateTab(): void;
  onClick?(event: React.MouseEvent<HTMLButtonElement>): void;
  readonly tabIndex: number;
}

const InternalTab = React.forwardRef<HTMLButtonElement, InternalTabProps>(
  ({ label, selected, activateTab, onClick, tabIndex }, ref) => {
    return (
      <li role="presentation">
        <button
          type="button"
          role="tab"
          ref={ref}
          tabIndex={tabIndex}
          aria-selected={selected}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
            'border-b-2 -mb-px',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-interactive)] focus-visible:ring-offset-2',
            selected
              ? 'border-[var(--color-interactive)] text-[var(--color-text)]'
              : 'border-transparent text-[var(--color-text--secondary)] hover:text-[var(--color-text)] hover:border-indigo-500'
          )}
          onClick={(event) => {
            activateTab();
            onClick?.(event);
          }}
        >
          {typeof label === 'string' ? (
            <Text element="span" className="font-semibold">
              {label}
            </Text>
          ) : (
            label
          )}
        </button>
      </li>
    );
  }
);

InternalTab.displayName = 'InternalTab';

function getActiveTabs(children: TabsProps['children']) {
  const activeTabChildren: ReactElement<TabProps, typeof Tab>[] = [];

  React.Children.toArray(children).forEach((child) => {
    if (isChildTab(child)) {
      activeTabChildren.push(child);
    }
  });

  return activeTabChildren;
}

function isChildTab(
  child: ReactNode
): child is ReactElement<TabProps, typeof Tab> {
  if (!React.isValidElement(child)) return false;
  // Use reference equality first, fall back to displayName for HMR compatibility
  return child.type === Tab ||
    (typeof child.type === 'function' && (child.type as any).displayName === 'Tab');
}
