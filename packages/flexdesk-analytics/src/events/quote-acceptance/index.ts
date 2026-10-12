/**
 * Quote Acceptance Event
 *
 * Tracks when a customer accepts or rejects an estimate,
 * including conversion timing and value data.
 */

import { AnalyticsEvent } from '../../providers';

export interface QuoteAcceptanceEvent {
  estimateId: string;
  workspaceId: string;
  customerId: string;
  accepted: boolean;
  totalValue: number;
  sentAt: Date;
  respondedAt: Date;
  jobType: string;
  conversionSource?: string;
}

export function createQuoteAcceptanceEvent(data: QuoteAcceptanceEvent): AnalyticsEvent {
  const responseTimeHours = Math.round(
    (data.respondedAt.getTime() - data.sentAt.getTime()) / (1000 * 60 * 60) * 10
  ) / 10;

  return {
    name: data.accepted ? 'quote.accepted' : 'quote.rejected',
    properties: {
      estimateId: data.estimateId,
      customerId: data.customerId,
      accepted: data.accepted,
      totalValue: data.totalValue,
      jobType: data.jobType,
      responseTimeHours,
      conversionSource: data.conversionSource || 'direct',
    },
    timestamp: data.respondedAt,
    workspaceId: data.workspaceId,
  };
}
