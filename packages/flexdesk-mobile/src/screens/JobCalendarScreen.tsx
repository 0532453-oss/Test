import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { background, border, brand, jobStatus as jobStatusColors, skeleton as skeletonColors, text as textColors } from '../theme';
import {
  fontSize,
  fontWeight,
  radius,
  shadows,
  size,
  spacing,
  typography,
} from '../theme';
import { JobBlock, StatusPill, FAB } from '../components';
import { useJobs, useScheduledJobs, useJobDetails } from '../hooks';
import { formatDate } from '../utils/format';
import type { Job, JobStatus } from '../api/types';

type MainStackParamList = {
  Tabs: undefined;
  JobDetail: { jobId: string };
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const DAY_CELL_WIDTH = (SCREEN_WIDTH - 32) / 7;

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Priority order for job statuses (higher = more prominent dot color). */
const STATUS_PRIORITY: Record<JobStatus, number> = {
  CANCELLED: 0,
  ON_HOLD: 1,
  COMPLETED: 2,
  SCHEDULED: 3,
  DISPATCHED: 3,
  IN_PROGRESS: 4,
};

function getStatusDotColor(status: JobStatus): string {
  switch (status) {
    case 'SCHEDULED':
    case 'DISPATCHED':
      return jobStatusColors.scheduled;
    case 'IN_PROGRESS':
      return jobStatusColors.inProgress;
    case 'COMPLETED':
      return jobStatusColors.completed;
    case 'CANCELLED':
    case 'ON_HOLD':
      return jobStatusColors.cancelled;
  }
}

function getDotColorForJobs(dayJobs: Job[]): string {
  if (dayJobs.length === 0) return jobStatusColors.scheduled;
  let highest = dayJobs[0];
  for (let i = 1; i < dayJobs.length; i++) {
    if (STATUS_PRIORITY[dayJobs[i].status] > STATUS_PRIORITY[highest.status]) {
      highest = dayJobs[i];
    }
  }
  return getStatusDotColor(highest.status);
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatWeekLabel(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return `${formatDate(monday)} - ${sunday.getDate()}, ${monday.getFullYear()}`;
}

function formatTime(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  return `${weekday}, ${formatDate(dateStr)}`;
}

export const JobCalendarScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const today = new Date();
  const [weekStart, setWeekStart] = useState(() => getMonday(today));
  const [selectedDateStr, setSelectedDateStr] = useState(
    formatDateStr(today)
  );
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Bottom sheet animation
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [sheetVisible, setSheetVisible] = useState(false);

  // ── API hooks ────────────────────────────────────────────────────────────
  // Daily jobs for selected date with 1 min auto-refresh
  const {
    data: dayJobs = [],
    isLoading: isDayLoading,
    isError: isDayError,
    refetch: refetchDay,
    isRefetching: isDayRefetching,
  } = useJobs(selectedDateStr, { refetchInterval: 60000 });

  // Week strip: scheduled jobs for the whole week (dot indicators)
  const weekEndDate = useMemo(() => {
    const sunday = new Date(weekStart);
    sunday.setDate(weekStart.getDate() + 6);
    return formatDateStr(sunday);
  }, [weekStart]);

  const weekStartStr = useMemo(() => formatDateStr(weekStart), [weekStart]);

  const { data: weekJobs = [] } = useScheduledJobs(weekStartStr, weekEndDate);

  // Job detail for selected job in bottom sheet
  const {
    data: jobDetails,
    isLoading: isDetailLoading,
  } = useJobDetails(selectedJobId ?? undefined);

  // ── Bottom sheet controls ────────────────────────────────────────────────
  const openSheet = useCallback((job: Job) => {
    setSelectedJobId(job.id);
    setSheetVisible(true);
    sheetTranslateY.setValue(SCREEN_HEIGHT);
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(sheetTranslateY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [sheetTranslateY, backdropOpacity]);

  const closeSheet = useCallback(() => {
    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSheetVisible(false);
      setSelectedJobId(null);
    });
  }, [sheetTranslateY, backdropOpacity]);

  // ── Week days with dot indicators from API data ──────────────────────────
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const dateStr = formatDateStr(d);
      const jobsOnDay = weekJobs.filter(j => j.scheduledDate === dateStr);
      return {
        dateStr,
        dayName: DAY_NAMES[i],
        dateNum: d.getDate(),
        isToday: dateStr === formatDateStr(today),
        hasJobs: jobsOnDay.length > 0,
        dotColor: jobsOnDay.length > 0 ? getDotColorForJobs(jobsOnDay) : brand.olive,
      };
    });
  }, [weekStart, weekJobs]);

  // Sort day jobs by start time
  const sortedDayJobs = useMemo(() => {
    return [...dayJobs].sort((a, b) => {
      if (!a.scheduledStartTime) return 1;
      if (!b.scheduledStartTime) return -1;
      return a.scheduledStartTime.localeCompare(b.scheduledStartTime);
    });
  }, [dayJobs]);

  const navigateWeek = (direction: number) => {
    setWeekStart(prev => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + direction * 7);
      return next;
    });
  };

  const goToToday = () => {
    setWeekStart(getMonday(today));
    setSelectedDateStr(formatDateStr(today));
  };

  const getJobAddress = (job: Job): string | null => {
    // If we have details with a property, use that
    if (jobDetails && jobDetails.id === job.id && jobDetails.property) {
      return `${jobDetails.property.street}, ${jobDetails.property.city}`;
    }
    return job.location?.address ?? null;
  };

  const onRefresh = useCallback(() => {
    refetchDay();
  }, [refetchDay]);

  // ── Render helpers ───────────────────────────────────────────────────────
  const renderJobItem = useCallback(({ item }: { item: Job }) => {
    return (
      <View style={styles.jobCardWrapper}>
        <JobBlock
          title={item.title}
          clientName={item.customerId}
          address={item.location?.address ?? null}
          startTime={item.scheduledStartTime ?? null}
          endTime={item.scheduledEndTime ?? null}
          status={item.status}
          onPress={() => openSheet(item)}
        />
      </View>
    );
  }, [openSheet]);

  const renderEmptyDay = useCallback(() => {
    if (isDayLoading) return null;
    const d = new Date(selectedDateStr + 'T00:00:00');
    const label = d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    return (
      <View style={styles.emptyDay}>
        <Text style={styles.emptyDayText}>No jobs on {label}</Text>
        <Text style={styles.emptyDayHint}>Tap + to schedule a job</Text>
      </View>
    );
  }, [selectedDateStr, isDayLoading]);

  // ── Loading skeleton ─────────────────────────────────────────────────────
  const renderLoadingSkeleton = () => (
    <View style={styles.skeletonList}>
      {[0, 1, 2].map(i => (
        <View key={i} style={styles.skeletonJobCard}>
          <View style={styles.skeletonStatusBar} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonTimeLine} />
            <View style={styles.skeletonTitleLine} />
            <View style={styles.skeletonClientLine} />
          </View>
        </View>
      ))}
    </View>
  );

  // ── Error state ──────────────────────────────────────────────────────────
  if (isDayError) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Calendar</Text>
          <Pressable onPress={goToToday} style={styles.todayButton}>
            <Text style={styles.todayText}>Today</Text>
          </Pressable>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorSubtitle}>
            Could not load your schedule. Check your connection and try again.
          </Text>
          <Pressable style={styles.retryButton} onPress={() => refetchDay()}>
            {isDayRefetching ? (
              <ActivityIndicator size="small" color={textColors.onPrimary} />
            ) : (
              <Text style={styles.retryText}>Retry</Text>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Job detail bottom sheet ──────────────────────────────────────────────
  const renderJobDetail = () => {
    if (!sheetVisible || !selectedJobId) return null;

    // Use the detailed job if available, otherwise fall back to the basic job from the list
    const basicJob = dayJobs.find(j => j.id === selectedJobId);
    const job = jobDetails && jobDetails.id === selectedJobId ? jobDetails : basicJob;
    if (!job) return null;

    const customerName = jobDetails?.customer?.name ?? 'Loading...';
    const address =
      jobDetails?.property
        ? `${jobDetails.property.street}, ${jobDetails.property.city}`
        : job.location?.address ?? null;

    const timeStr =
      job.scheduledStartTime && job.scheduledEndTime
        ? `${formatTime(job.scheduledStartTime)} - ${formatTime(job.scheduledEndTime)}, ${formatFullDate(job.scheduledDate)}`
        : `Unscheduled, ${formatFullDate(job.scheduledDate)}`;

    let actionLabel: string | null = null;
    if (job.status === 'SCHEDULED' || job.status === 'DISPATCHED') {
      actionLabel = 'Start Job';
    } else if (job.status === 'IN_PROGRESS') {
      actionLabel = 'Complete Job';
    } else if (job.status === 'COMPLETED') {
      actionLabel = 'Create Invoice';
    }

    return (
      <Modal
        visible
        transparent
        animationType="none"
        onRequestClose={closeSheet}
      >
        <Animated.View style={[styles.overlay, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
        </Animated.View>
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}
        >
          <View style={styles.sheetHandle} />

          {isDetailLoading ? (
            <View style={styles.sheetLoading}>
              <ActivityIndicator size="small" color={brand.olive} />
              <Text style={styles.sheetLoadingText}>Loading details...</Text>
            </View>
          ) : null}

          <StatusPill status={job.status} />
          <Text style={styles.sheetTitle}>{job.title}</Text>
          <Text style={styles.sheetClient}>{customerName}</Text>
          <View style={styles.sheetRow}>
            <Text style={styles.sheetRowIcon}>🕐</Text>
            <Text style={styles.sheetRowText}>{timeStr}</Text>
          </View>
          {address && (
            <View style={styles.sheetRow}>
              <Text style={styles.sheetRowIcon}>📍</Text>
              <Text style={styles.sheetRowText}>{address}</Text>
            </View>
          )}
          {job.description ? (
            <Text style={styles.sheetDescription} numberOfLines={4}>
              {job.description}
            </Text>
          ) : null}

          {/* Notes preview */}
          {jobDetails?.notes && jobDetails.notes.length > 0 && (
            <View style={styles.sheetSection}>
              <Text style={styles.sheetSectionTitle}>
                Notes ({jobDetails.notes.length})
              </Text>
              <Text style={styles.sheetNotePreview} numberOfLines={2}>
                {jobDetails.notes[0].content}
              </Text>
            </View>
          )}

          {/* Parts preview */}
          {jobDetails?.parts && jobDetails.parts.length > 0 && (
            <View style={styles.sheetSection}>
              <Text style={styles.sheetSectionTitle}>
                Parts ({jobDetails.parts.length})
              </Text>
              {jobDetails.parts.slice(0, 2).map(part => (
                <Text key={part.id} style={styles.sheetPartLine}>
                  {part.partName} x{part.quantity}
                </Text>
              ))}
            </View>
          )}

          <View style={styles.sheetActions}>
            <Pressable
              onPress={() => {
                closeSheet();
                navigation.navigate('JobDetail', { jobId: selectedJobId });
              }}
              style={styles.viewDetailsBtn}
            >
              <Text style={styles.viewDetailsText}>View Full Details</Text>
            </Pressable>

            {actionLabel && (
              <Pressable
                onPress={() => {
                  try {
                    Vibration.vibrate(20);
                  } catch {}
                }}
                style={[
                  styles.actionBtn,
                  job.status === 'COMPLETED' && styles.actionBtnOutlined,
                ]}
              >
                <Text
                  style={[
                    styles.actionBtnText,
                    job.status === 'COMPLETED' &&
                      styles.actionBtnTextOutlined,
                  ]}
                >
                  {actionLabel}
                </Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </Modal>
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
        <Pressable onPress={goToToday} style={styles.todayButton}>
          <Text style={styles.todayText}>Today</Text>
        </Pressable>
      </View>

      {/* Week label with nav arrows */}
      <View style={styles.weekLabelRow}>
        <Pressable
          onPress={() => navigateWeek(-1)}
          style={styles.weekNav}
          accessibilityRole="button"
          accessibilityLabel="Previous week"
        >
          <Text style={styles.weekNavText}>{'<'}</Text>
        </Pressable>
        <Text style={styles.weekLabel}>{formatWeekLabel(weekStart)}</Text>
        <Pressable
          onPress={() => navigateWeek(1)}
          style={styles.weekNav}
          accessibilityRole="button"
          accessibilityLabel="Next week"
        >
          <Text style={styles.weekNavText}>{'>'}</Text>
        </Pressable>
      </View>

      {/* Week strip */}
      <View style={styles.weekStrip}>
        {weekDays.map(day => {
          const isSelected = day.dateStr === selectedDateStr;
          return (
            <Pressable
              key={day.dateStr}
              onPress={() => setSelectedDateStr(day.dateStr)}
              style={styles.dayCell}
            >
              <Text style={styles.dayName}>{day.dayName}</Text>
              <View
                style={[
                  styles.dateCircle,
                  day.isToday && styles.todayCircle,
                  isSelected && !day.isToday && styles.selectedCircle,
                ]}
              >
                <Text
                  style={[
                    styles.dateNum,
                    day.isToday && styles.dateNumActive,
                  ]}
                >
                  {day.dateNum}
                </Text>
              </View>
              {day.hasJobs && (
                <View
                  style={[
                    styles.dotIndicator,
                    { backgroundColor: day.dotColor },
                  ]}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Day jobs */}
      {isDayLoading ? (
        renderLoadingSkeleton()
      ) : (
        <FlatList
          data={sortedDayJobs}
          keyExtractor={item => item.id}
          renderItem={renderJobItem}
          ListEmptyComponent={renderEmptyDay}
          contentContainerStyle={[
            styles.listContent,
            sortedDayJobs.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          bounces={true}
          decelerationRate="normal"
          refreshControl={
            <RefreshControl
              refreshing={isDayRefetching}
              onRefresh={onRefresh}
              tintColor={brand.olive}
            />
          }
        />
      )}

      <FAB onPress={() => {}} />

      {/* Job detail bottom sheet */}
      {renderJobDetail()}
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
  title: {
    ...typography.screenTitle,
    color: textColors.primary,
  },
  todayButton: {
    minHeight: size.minTapTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  todayText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    color: brand.olive,
  },
  weekLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  weekLabel: {
    ...typography.captionMd,
    color: textColors.secondary,
    textAlign: 'center',
    flex: 1,
  },
  weekStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  weekNav: {
    width: size.minTapTarget,
    height: size.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNavText: {
    fontSize: fontSize.lg,
    color: textColors.secondary,
    fontWeight: fontWeight.medium,
  },
  dayCell: {
    width: DAY_CELL_WIDTH,
    alignItems: 'center',
    minHeight: size.minTapTarget,
    paddingVertical: spacing.xs,
  },
  dayName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    color: textColors.secondary,
    marginBottom: spacing.xs,
  },
  dateCircle: {
    width: size.weekDayCircle,
    height: size.weekDayCircle,
    borderRadius: size.weekDayCircle / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCircle: {
    backgroundColor: brand.olive,
  },
  selectedCircle: {
    backgroundColor: background.chipInactive,
  },
  dateNum: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: textColors.primary,
  },
  dateNumActive: {
    color: textColors.onPrimary,
  },
  dotIndicator: {
    width: size.weekDotSize,
    height: size.weekDotSize,
    borderRadius: size.weekDotSize / 2,
    marginTop: spacing.xxs,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: size.tabBarTotalHeight + size.fabSize + spacing.xxxl,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  jobCardWrapper: {
    marginBottom: spacing.md,
  },
  emptyDay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxxxl,
  },
  emptyDayText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    color: textColors.secondary,
  },
  emptyDayHint: {
    ...typography.captionMd,
    color: textColors.muted,
    marginTop: spacing.sm,
  },

  // ── Loading skeleton ─────────────────────────────────────────────────────
  skeletonList: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  skeletonJobCard: {
    flexDirection: 'row',
    height: 90,
    borderRadius: radius.lg,
    backgroundColor: skeletonColors.base,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  skeletonStatusBar: {
    width: size.jobStatusBarWidth,
    backgroundColor: skeletonColors.shimmer,
  },
  skeletonContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  skeletonTimeLine: {
    width: '45%',
    height: 12,
    borderRadius: radius.xs,
    backgroundColor: skeletonColors.shimmer,
  },
  skeletonTitleLine: {
    width: '70%',
    height: 14,
    borderRadius: radius.xs,
    backgroundColor: skeletonColors.shimmer,
  },
  skeletonClientLine: {
    width: '50%',
    height: 12,
    borderRadius: radius.xs,
    backgroundColor: skeletonColors.shimmer,
  },

  // ── Error state ──────────────────────────────────────────────────────────
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

  // ── Bottom sheet ─────────────────────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: background.overlay,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: background.card,
    borderTopLeftRadius: size.sheetTopRadius,
    borderTopRightRadius: size.sheetTopRadius,
    padding: spacing.xl,
    paddingBottom: spacing.xxxxl,
    minHeight: '50%',
    ...shadows.bottomSheet,
  },
  sheetHandle: {
    width: size.sheetHandleWidth,
    height: size.sheetHandleHeight,
    borderRadius: size.sheetHandleHeight / 2,
    backgroundColor: border.divider,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  sheetLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sheetLoadingText: {
    ...typography.caption,
    color: textColors.muted,
    marginLeft: spacing.sm,
  },
  sheetTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: textColors.primary,
    marginTop: spacing.md,
  },
  sheetClient: {
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.regular,
    color: brand.olive,
    marginTop: spacing.xs,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  sheetRowIcon: {
    fontSize: fontSize.md,
    marginRight: spacing.sm,
  },
  sheetRowText: {
    ...typography.body,
    color: textColors.primary,
    flex: 1,
  },
  sheetDescription: {
    ...typography.body,
    color: textColors.onTip,
    marginTop: spacing.lg,
  },
  sheetSection: {
    marginTop: spacing.lg,
  },
  sheetSectionTitle: {
    ...typography.captionMd,
    color: textColors.secondary,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  sheetNotePreview: {
    ...typography.body,
    color: textColors.primary,
  },
  sheetPartLine: {
    ...typography.caption,
    color: textColors.secondary,
    marginTop: spacing.xxs,
  },
  sheetActions: {
    marginTop: spacing.xxl,
  },
  actionBtn: {
    backgroundColor: brand.olive,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: size.minTapTarget,
    justifyContent: 'center',
  },
  actionBtnOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: brand.olive,
  },
  actionBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: textColors.onPrimary,
  },
  actionBtnTextOutlined: {
    color: brand.olive,
  },
  viewDetailsBtn: {
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: size.minTapTarget,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: border.light,
    marginBottom: spacing.sm,
  },
  viewDetailsText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: brand.olive,
  },
});
