export interface WeeklyReportSnapshot {
  workspaceId: string;
  period: {
    startDate: string;
    endDate: string;
  };
  jobs: {
    completed: number;
    scheduled: number;
    cancelled: number;
    averageCompletionMinutes: number;
  };
  revenue: {
    invoiced: number;
    collected: number;
    outstanding: number;
  };
  customers: {
    newCustomers: number;
    totalActive: number;
  };
  technicians: {
    totalActive: number;
    jobsPerTechnician: Record<string, number>;
  };
  generatedAt: string;
}
