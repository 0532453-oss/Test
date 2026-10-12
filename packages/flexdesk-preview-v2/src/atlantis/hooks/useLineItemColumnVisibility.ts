/**
 * useLineItemColumnVisibility Hook
 *
 * Manages column visibility state for invoice line items table with localStorage persistence.
 * Allows users to show/hide Qty and Unit Price columns while keeping Description and Total
 * always visible.
 *
 * @example
 * const { showQty, showUnitPrice, setShowQty, setShowUnitPrice } = useLineItemColumnVisibility();
 *
 * return (
 *   <Table>
 *     <Table.HeaderCell>Description</Table.HeaderCell>
 *     {showQty && <Table.HeaderCell>Qty</Table.HeaderCell>}
 *     {showUnitPrice && <Table.HeaderCell>Unit Price</Table.HeaderCell>}
 *     <Table.HeaderCell>Total</Table.HeaderCell>
 *   </Table>
 * );
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'flexdesk:invoice-line-items:columnVisibility';

interface ColumnVisibilityState {
  showQty: boolean;
  showUnitPrice: boolean;
}

const DEFAULT_STATE: ColumnVisibilityState = {
  showQty: true,
  showUnitPrice: true,
};

/**
 * Return type for useLineItemColumnVisibility hook
 */
export interface UseLineItemColumnVisibilityReturn {
  /** Whether the Qty column is visible */
  showQty: boolean;
  /** Whether the Unit Price column is visible */
  showUnitPrice: boolean;
  /** Set Qty column visibility */
  setShowQty: (show: boolean) => void;
  /** Set Unit Price column visibility */
  setShowUnitPrice: (show: boolean) => void;
  /** Toggle Qty column visibility */
  toggleQty: () => void;
  /** Toggle Unit Price column visibility */
  toggleUnitPrice: () => void;
}

/**
 * Hook for managing invoice line items column visibility with localStorage persistence.
 *
 * @returns An object containing visibility states and setter methods
 */
export function useLineItemColumnVisibility(): UseLineItemColumnVisibilityReturn {
  // Initialize state from localStorage or default
  const [state, setState] = useState<ColumnVisibilityState>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_STATE;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          showQty: typeof parsed.showQty === 'boolean' ? parsed.showQty : DEFAULT_STATE.showQty,
          showUnitPrice: typeof parsed.showUnitPrice === 'boolean' ? parsed.showUnitPrice : DEFAULT_STATE.showUnitPrice,
        };
      }
    } catch {
      // Ignore localStorage errors
    }
    return DEFAULT_STATE;
  });

  // Persist to localStorage when state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore localStorage errors
    }
  }, [state]);

  const setShowQty = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showQty: show }));
  }, []);

  const setShowUnitPrice = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showUnitPrice: show }));
  }, []);

  const toggleQty = useCallback(() => {
    setState(prev => ({ ...prev, showQty: !prev.showQty }));
  }, []);

  const toggleUnitPrice = useCallback(() => {
    setState(prev => ({ ...prev, showUnitPrice: !prev.showUnitPrice }));
  }, []);

  return useMemo(
    () => ({
      showQty: state.showQty,
      showUnitPrice: state.showUnitPrice,
      setShowQty,
      setShowUnitPrice,
      toggleQty,
      toggleUnitPrice,
    }),
    [state.showQty, state.showUnitPrice, setShowQty, setShowUnitPrice, toggleQty, toggleUnitPrice]
  );
}

export default useLineItemColumnVisibility;
