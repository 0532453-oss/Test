import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { background, invoiceStatus, text as textColors } from '../theme';
import { size, typography } from '../theme';

type InvoicePillStatus = 'PAID' | 'SENT' | 'OVERDUE' | 'DRAFT' | 'CANCELLED';
type JobPillStatus = 'SCHEDULED' | 'DISPATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';

interface StatusPillProps {
  status: InvoicePillStatus | JobPillStatus | string;
}

const INVOICE_LABEL_MAP: Record<InvoicePillStatus, string> = {
  PAID: 'Paid',
  SENT: 'Pending',
  OVERDUE: 'Overdue',
  DRAFT: 'Draft',
  CANCELLED: 'Cancelled',
};

const JOB_LABEL_MAP: Record<JobPillStatus, string> = {
  SCHEDULED: 'Scheduled',
  DISPATCHED: 'Dispatched',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  ON_HOLD: 'On Hold',
};

function getInvoiceColors(status: InvoicePillStatus) {
  switch (status) {
    case 'PAID':
      return invoiceStatus.paid;
    case 'SENT':
      return invoiceStatus.sent;
    case 'OVERDUE':
      return invoiceStatus.overdue;
    case 'DRAFT':
      return invoiceStatus.draft;
    case 'CANCELLED':
      return invoiceStatus.cancelled;
  }
}

function getJobColors(status: JobPillStatus) {
  switch (status) {
    case 'SCHEDULED':
    case 'DISPATCHED':
      return { bg: invoiceStatus.sent.bg, text: invoiceStatus.sent.text };
    case 'IN_PROGRESS':
      return { bg: invoiceStatus.overdue.bg, text: invoiceStatus.overdue.text };
    case 'COMPLETED':
      return { bg: invoiceStatus.paid.bg, text: invoiceStatus.paid.text };
    case 'ON_HOLD':
      return { bg: background.chipInactive, text: textColors.secondary };
  }
}

function isInvoiceStatus(status: string): status is InvoicePillStatus {
  return ['PAID', 'SENT', 'OVERDUE', 'DRAFT', 'CANCELLED'].includes(status);
}

function isJobStatus(status: string): status is JobPillStatus {
  return ['SCHEDULED', 'DISPATCHED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'].includes(status);
}

const FALLBACK_COLORS = { bg: background.chipInactive, text: textColors.secondary };

export const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  const isInvoice = isInvoiceStatus(status);
  const isJob = isJobStatus(status);
  const colors = isInvoice
    ? getInvoiceColors(status as InvoicePillStatus)
    : isJob
      ? getJobColors(status as JobPillStatus)
      : FALLBACK_COLORS;
  const label = isInvoice
    ? INVOICE_LABEL_MAP[status as InvoicePillStatus]
    : isJob
      ? JOB_LABEL_MAP[status as JobPillStatus]
      : status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  const isCancelled = status === 'CANCELLED';

  return (
    <View
      style={[styles.container, { backgroundColor: colors.bg }]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Status: ${label}`}
    >
      <Text
        style={[
          styles.label,
          { color: colors.text },
          isCancelled && styles.strikethrough,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: size.pillPaddingH,
    paddingVertical: size.pillPaddingV,
    borderRadius: size.pillRadius,
    alignSelf: 'flex-start',
  },
  label: {
    ...typography.pillLabel,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
});
