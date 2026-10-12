/**
 * Sync Filters - Define sync scopes and filters
 * 
 * Provides utilities for building sync queries and filters
 */

function format(date: Date, formatStr: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  if (formatStr === 'yyyy-MM-dd') return `${year}-${month}-${day}`;
  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export interface DateRangeFilter {
  startDate: Date;
  endDate: Date;
}

export interface SyncScope {
  entityType: 'Job' | 'Technician' | 'Customer' | 'Invoice';
  filters?: {
    workspaceId?: string;
    technicianId?: string;
    status?: string;
    dateRange?: DateRangeFilter;
  };
}

export class SyncFilters {
  /**
   * Build query parameters for sync endpoint
   */
  static buildQueryParams(scope: SyncScope): Record<string, string> {
    const params: Record<string, string> = {};

    if (scope.filters?.workspaceId) {
      params.workspaceId = scope.filters.workspaceId;
    }

    if (scope.filters?.technicianId) {
      params.technicianId = scope.filters.technicianId;
    }

    if (scope.filters?.status) {
      params.status = scope.filters.status;
    }

    if (scope.filters?.dateRange) {
      params.startDate = format(scope.filters.dateRange.startDate, 'yyyy-MM-dd');
      params.endDate = format(scope.filters.dateRange.endDate, 'yyyy-MM-dd');
    }

    return params;
  }

  /**
   * Create date range filter for current day
   */
  static currentDay(): DateRangeFilter {
    const today = new Date();
    return {
      startDate: startOfDay(today),
      endDate: endOfDay(today),
    };
  }

  /**
   * Create date range filter for current week
   */
  static currentWeek(): DateRangeFilter {
    const today = new Date();
    const startOfWeek = startOfDay(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    
    const endOfWeek = endOfDay(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // Saturday

    return {
      startDate: startOfWeek,
      endDate: endOfWeek,
    };
  }

  /**
   * Create date range filter for current month
   */
  static currentMonth(): DateRangeFilter {
    const today = new Date();
    return {
      startDate: startOfDay(new Date(today.getFullYear(), today.getMonth(), 1)),
      endDate: endOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
    };
  }

  /**
   * Create date range filter for next N days
   */
  static nextDays(days: number): DateRangeFilter {
    const today = new Date();
    return {
      startDate: startOfDay(today),
      endDate: endOfDay(new Date(today.getTime() + days * 24 * 60 * 60 * 1000)),
    };
  }
}
