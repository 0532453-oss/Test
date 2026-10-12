import React from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { background, border, brand, text as textColors } from '../theme';
import {
  fontSize,
  fontWeight,
  pressFeedback,
  radius,
  shadows,
  size,
  spacing,
  typography,
} from '../theme';
import { formatCurrency } from '../utils/format';

interface ClientCardProps {
  name: string;
  lastJobDate: string | null;
  totalRevenue: number;
  phone: string | null;
  email: string | null;
  completedJobCount: number;
  isExpanded: boolean;
  onPress: () => void;
  onNewJob?: () => void;
  onNewInvoice?: () => void;
  onNavigate?: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

export const ClientCard: React.FC<ClientCardProps> = ({
  name,
  lastJobDate,
  totalRevenue,
  phone,
  email,
  completedJobCount,
  isExpanded,
  onPress,
  onNewJob,
  onNewInvoice,
  onNavigate,
}) => {
  const initials = getInitials(name);

  const handleCall = () => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleText = () => {
    if (phone) {
      Linking.openURL(`sms:${phone}`);
    }
  };

  const handleEmail = () => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && !isExpanded && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${formatCurrency(totalRevenue)} total revenue`}
      accessibilityState={{ expanded: isExpanded }}
    >
      {/* Row 1: Avatar + Name + Chevron */}
      <View style={styles.row1}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.chevron}>{isExpanded ? '\u25B2' : '\u25B6'}</Text>
      </View>

      {/* Row 2: Info chips */}
      <View style={styles.row2}>
        <Text style={styles.chip}>
          Last job: {lastJobDate ?? 'No jobs yet'}
        </Text>
        <Text style={[styles.chip, styles.chipSpaced]}>
          {formatCurrency(totalRevenue)} total
        </Text>
      </View>

      {/* Expanded content */}
      {isExpanded && (
        <View style={styles.expandedSection}>
          {/* Call */}
          <Pressable
            onPress={handleCall}
            style={styles.contactRow}
            disabled={!phone}
          >
            <Text style={styles.contactIcon}>📞</Text>
            <Text style={[styles.contactText, phone ? styles.tappableText : undefined]}>
              {phone ?? '--'}
            </Text>
          </Pressable>

          {/* Text / SMS */}
          <Pressable
            onPress={handleText}
            style={styles.contactRow}
            disabled={!phone}
          >
            <Text style={styles.contactIcon}>💬</Text>
            <Text style={[styles.contactText, phone ? styles.tappableText : undefined]}>
              {phone ? 'Send Text' : '--'}
            </Text>
          </Pressable>

          {/* Email */}
          <Pressable
            onPress={handleEmail}
            style={styles.contactRow}
            disabled={!email}
          >
            <Text style={styles.contactIcon}>✉️</Text>
            <Text style={[styles.contactText, email ? styles.tappableText : undefined]}>
              {email ?? '--'}
            </Text>
          </Pressable>

          {/* Jobs summary */}
          <Text style={styles.jobsSummary}>
            {completedJobCount} jobs completed
          </Text>

          {/* Quick actions */}
          <View style={styles.actionsRow}>
            <Pressable
              onPress={onNewJob}
              style={styles.actionButton}
            >
              <Text style={styles.actionButtonText}>New Job</Text>
            </Pressable>
            <Pressable
              onPress={onNewInvoice}
              style={[styles.actionButton, styles.actionButtonRight]}
            >
              <Text style={styles.actionButtonText}>New Invoice</Text>
            </Pressable>
            {onNavigate && (
              <Pressable
                onPress={onNavigate}
                style={[styles.actionButton, styles.actionButtonRight]}
              >
                <Text style={styles.actionButtonText}>Navigate</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: background.card,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...shadows.cardSubtle,
  },
  pressed: {
    transform: [{ scale: pressFeedback.scale }],
    opacity: pressFeedback.opacity,
  },
  row1: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: size.clientAvatar,
    height: size.clientAvatar,
    borderRadius: size.clientAvatar / 2,
    backgroundColor: brand.olive,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: size.avatarFontSize,
    fontWeight: fontWeight.bold,
    color: textColors.onPrimary,
  },
  name: {
    ...typography.cardTitle,
    color: textColors.primary,
    flex: 1,
  },
  chevron: {
    fontSize: fontSize.sm,
    color: textColors.muted,
    marginLeft: spacing.sm,
  },
  row2: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    marginLeft: size.clientAvatar + spacing.md,
  },
  chip: {
    ...typography.caption,
    color: textColors.secondary,
  },
  chipSpaced: {
    marginLeft: spacing.lg,
  },
  expandedSection: {
    marginTop: spacing.md,
    marginLeft: size.clientAvatar + spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: border.light,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: size.minTapTarget,
  },
  contactIcon: {
    fontSize: fontSize.md,
    marginRight: spacing.sm,
  },
  contactText: {
    ...typography.body,
    color: textColors.secondary,
  },
  tappableText: {
    color: textColors.link,
  },
  jobsSummary: {
    ...typography.caption,
    color: textColors.secondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: brand.olive,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    minHeight: size.minTapTarget,
    justifyContent: 'center',
  },
  actionButtonRight: {
    marginLeft: 0,
  },
  actionButtonText: {
    ...typography.caption,
    color: brand.olive,
    fontWeight: fontWeight.semibold,
  },
});
