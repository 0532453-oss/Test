import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  background,
  border,
  brand,
  feedback,
  metricIconBg,
  skeleton as skeletonColors,
  text as textColors,
} from '../theme';
import {
  fontSize,
  fontWeight,
  radius,
  shadows,
  size,
  spacing,
  typography,
} from '../theme';
import { MetricCircle, StatBubble, TipCard, FAB } from '../components';
import { useDashboard, useNextJob } from '../hooks';
import { useAuth } from '../auth/AuthContext';
import { formatCurrency } from '../utils/format';
import { WORKSPACE_NAME } from '../data/mockData';

const WEEKLY_TARGET = 10;

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [tipDismissed, setTipDismissed] = useState(false);
  const { user } = useAuth();

  const {
    data: dashboard,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useDashboard();

  const {
    data: nextJobData,
  } = useNextJob(user?.id);

  const navigateTo = (screen: string) => {
    (navigation.navigate as (screen: string) => void)(screen);
  };

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Staggered entrance animation for stat cards
  const cardAnimations = useRef(
    [0, 1, 2, 3].map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(8),
    }))
  ).current;

  useEffect(() => {
    if (isLoading || !dashboard) return;
    // Reset then animate
    cardAnimations.forEach(({ opacity, translateY }) => {
      opacity.setValue(0);
      translateY.setValue(8);
    });
    Animated.stagger(
      50,
      cardAnimations.map(({ opacity, translateY }) =>
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      )
    ).start();
  }, [isLoading, dashboard, cardAnimations]);

  const showTip =
    !tipDismissed &&
    dashboard &&
    (dashboard.customerMetrics.active < 3 || dashboard.jobMetrics.total < 1);

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={background.screen} />
        <View style={styles.header}>
          <Text style={styles.workspaceName}>{WORKSPACE_NAME}</Text>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {user?.fullName?.charAt(0) ?? 'U'}
            </Text>
          </View>
        </View>
        <View style={styles.skeletonContent}>
          {/* Ring placeholder */}
          <View style={styles.skeletonRingWrapper}>
            <View style={styles.skeletonRing} />
          </View>
          {/* Stat card placeholders */}
          <View style={styles.metricRow}>
            <View style={[styles.metricCell, styles.skeletonCard]} />
            <View style={styles.metricGap} />
            <View style={[styles.metricCell, styles.skeletonCard]} />
          </View>
          <View style={[styles.metricRow, { marginTop: spacing.md }]}>
            <View style={[styles.metricCell, styles.skeletonCard]} />
            <View style={styles.metricGap} />
            <View style={[styles.metricCell, styles.skeletonCard]} />
          </View>
        </View>
      </View>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (isError || !dashboard) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={background.screen} />
        <View style={styles.header}>
          <Text style={styles.workspaceName}>{WORKSPACE_NAME}</Text>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {user?.fullName?.charAt(0) ?? 'U'}
            </Text>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorSubtitle}>
            Could not load your dashboard. Check your connection and try again.
          </Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            {isRefetching ? (
              <ActivityIndicator size="small" color={textColors.onPrimary} />
            ) : (
              <Text style={styles.retryText}>Retry</Text>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const completedCount = dashboard.jobMetrics.completed;
  const activeClients = dashboard.customerMetrics.active;
  const pendingJobs = dashboard.jobMetrics.pending;
  const unpaidCount = dashboard.invoiceMetrics.unpaid + dashboard.invoiceMetrics.overdue;
  const weeklyRevenue = dashboard.revenueMetrics.thisWeek;
  const isEmpty = dashboard.customerMetrics.total === 0 && dashboard.jobMetrics.total === 0;

  const nextJob = nextJobData?.job;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={background.screen} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.workspaceName}>{WORKSPACE_NAME}</Text>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>
            {user?.fullName?.charAt(0) ?? 'U'}
          </Text>
        </View>
      </View>

      {isEmpty ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIllustration} />
          <Text style={styles.emptyTitle}>Welcome to FlexDesk</Text>
          <Text style={styles.emptySubtitle}>
            Tap + to add your first client or job
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor={brand.olive}
            />
          }
        >
          {/* Tip Card */}
          {showTip && (
            <View style={styles.section}>
              <TipCard
                icon="👋"
                message="Add your first client to get started"
                ctaText="Add Client >"
                onCtaPress={() => navigateTo('Clients')}
                onDismiss={() => setTipDismissed(true)}
              />
            </View>
          )}

          {/* Health Ring */}
          <View style={styles.ringSection}>
            <MetricCircle
              value={completedCount}
              maxValue={WEEKLY_TARGET}
              label="Jobs this week"
            />
          </View>

          {/* 2x2 Metric Grid */}
          <View style={styles.metricGrid}>
            <View style={styles.metricRow}>
              <Animated.View
                style={[
                  styles.metricCell,
                  {
                    opacity: cardAnimations[0].opacity,
                    transform: [{ translateY: cardAnimations[0].translateY }],
                  },
                ]}
              >
                <StatBubble
                  icon="👥"
                  iconBg={metricIconBg.clients}
                  value={String(activeClients)}
                  label="Active Clients"
                  onPress={() => navigateTo('Clients')}
                />
              </Animated.View>
              <View style={styles.metricGap} />
              <Animated.View
                style={[
                  styles.metricCell,
                  {
                    opacity: cardAnimations[1].opacity,
                    transform: [{ translateY: cardAnimations[1].translateY }],
                  },
                ]}
              >
                <StatBubble
                  icon="🕐"
                  iconBg={metricIconBg.jobs}
                  value={String(pendingJobs)}
                  label="Pending Jobs"
                  onPress={() => navigateTo('Calendar')}
                />
              </Animated.View>
            </View>
            <View style={styles.metricRowBottom}>
              <Animated.View
                style={[
                  styles.metricCell,
                  {
                    opacity: cardAnimations[2].opacity,
                    transform: [{ translateY: cardAnimations[2].translateY }],
                  },
                ]}
              >
                <StatBubble
                  icon="📄"
                  iconBg={metricIconBg.invoices}
                  value={String(unpaidCount)}
                  label="Unpaid"
                  onPress={() => navigateTo('Invoices')}
                />
              </Animated.View>
              <View style={styles.metricGap} />
              <Animated.View
                style={[
                  styles.metricCell,
                  {
                    opacity: cardAnimations[3].opacity,
                    transform: [{ translateY: cardAnimations[3].translateY }],
                  },
                ]}
              >
                <StatBubble
                  icon="💰"
                  iconBg={metricIconBg.revenue}
                  value={formatCurrency(weeklyRevenue)}
                  label="This Week"
                  onPress={() => navigateTo('Invoices')}
                />
              </Animated.View>
            </View>
          </View>

          {/* Next Job Widget */}
          {nextJob && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Next Up</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.nextJobCard,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() => navigateTo('Calendar')}
              >
                <Text style={styles.nextJobTitle}>{nextJob.title}</Text>
                <Text style={styles.nextJobMeta}>
                  {nextJob.scheduledStartTime
                    ? `${nextJob.scheduledStartTime}${nextJob.scheduledEndTime ? ' – ' + nextJob.scheduledEndTime : ''}`
                    : nextJob.scheduledDate}
                </Text>
                {nextJob.location?.address && (
                  <Text style={styles.nextJobAddress} numberOfLines={1}>
                    📍 {nextJob.location.address}
                  </Text>
                )}
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}

      <FAB onPress={() => {}} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: background.screen,
  },
  header: {
    height: size.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  workspaceName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: textColors.primary,
  },
  avatarCircle: {
    width: size.weekDayCircle,
    height: size.weekDayCircle,
    borderRadius: size.weekDayCircle / 2,
    backgroundColor: border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: size.avatarFontSize,
    fontWeight: fontWeight.semibold,
    color: textColors.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: size.tabBarTotalHeight + size.fabSize + spacing.xxxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.sectionHeader,
    color: textColors.primary,
    marginBottom: spacing.sm,
  },
  ringSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  metricGrid: {
    marginBottom: spacing.xl,
  },
  metricRow: {
    flexDirection: 'row',
  },
  metricRowBottom: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  metricCell: {
    flex: 1,
  },
  metricGap: {
    width: spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  emptyIllustration: {
    width: size.emptyIllustrationLg,
    height: size.emptyIllustrationLg,
    borderRadius: size.emptyIllustrationLg / 2,
    backgroundColor: border.light,
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    ...typography.sectionHeader,
    color: textColors.primary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: textColors.secondary,
    textAlign: 'center',
  },

  // ── Skeleton ──────────────────────────────────────────────────────────────
  skeletonContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  skeletonRingWrapper: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  skeletonRing: {
    width: size.healthRingDiameter,
    height: size.healthRingDiameter,
    borderRadius: size.healthRingDiameter / 2,
    backgroundColor: skeletonColors.base,
  },
  skeletonCard: {
    height: 100,
    borderRadius: radius.lg,
    backgroundColor: skeletonColors.base,
  },

  // ── Error ──────────────────────────────────────────────────────────────────
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: spacing.lg,
  },
  errorTitle: {
    ...typography.sectionHeader,
    color: textColors.primary,
    marginBottom: spacing.sm,
  },
  errorSubtitle: {
    ...typography.body,
    color: textColors.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  retryButton: {
    backgroundColor: brand.olive,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    minWidth: 120,
    alignItems: 'center',
  },
  retryText: {
    ...typography.bodyMedium,
    color: textColors.onPrimary,
  },

  // ── Next Job ───────────────────────────────────────────────────────────────
  nextJobCard: {
    backgroundColor: background.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  nextJobTitle: {
    ...typography.cardTitle,
    color: textColors.primary,
    marginBottom: spacing.xs,
  },
  nextJobMeta: {
    ...typography.body,
    color: textColors.secondary,
    marginBottom: spacing.xs,
  },
  nextJobAddress: {
    ...typography.caption,
    color: textColors.muted,
  },
});
