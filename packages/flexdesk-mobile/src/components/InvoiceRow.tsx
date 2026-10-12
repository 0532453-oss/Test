import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { background, text as textColors } from '../theme';
import {
  fontSize,
  fontWeight,
  pressFeedback,
  radius,
  shadows,
  spacing,
  typography,
} from '../theme';
import { StatusPill } from './StatusPill';
import { formatCurrency, formatDate } from '../utils/format';
import type { InvoiceStatus } from '../api/types';

interface InvoiceRowProps {
  clientName: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  status: InvoiceStatus;
}

export const InvoiceRow: React.FC<InvoiceRowProps> = ({
  clientName,
  invoiceNumber,
  date,
  amount,
  status,
}) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
      ]}
      accessible
      accessibilityLabel={`${clientName}, ${invoiceNumber}, ${formatCurrency(amount)}, ${status.toLowerCase()}`}
    >
      <View style={styles.left}>
        <Text style={styles.clientName}>{clientName || 'Unknown Client'}</Text>
        <Text style={styles.invoiceInfo}>
          {invoiceNumber} {'\u00B7'} {formatDate(date)}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>{formatCurrency(amount)}</Text>
        <StatusPill status={status} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: background.card,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    ...shadows.cardLight,
  },
  pressed: {
    transform: [{ scale: pressFeedback.scale }],
    opacity: pressFeedback.opacity,
  },
  left: {
    flex: 1,
  },
  clientName: {
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.semibold,
    color: textColors.primary,
  },
  invoiceInfo: {
    ...typography.caption,
    color: textColors.secondary,
    marginTop: spacing.xxs,
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: textColors.primary,
    marginBottom: spacing.xs,
  },
});
