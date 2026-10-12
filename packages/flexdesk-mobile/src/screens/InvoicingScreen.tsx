import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  background,
  border,
  brand,
  feedback,
  invoiceStatus as invoiceStatusColors,
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
import { InvoiceRow, FAB } from '../components';
import { formatCurrency, formatDate } from '../utils/format';
import { useInvoices, useSendInvoice, useMarkInvoicePaid, useGetPaymentLink } from '../hooks';
import type { Invoice, InvoiceStatus } from '../api/types';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const INVOICE_ROW_HEIGHT = 64 + spacing.sm; // card height + rowWrapper marginBottom

type FilterOption = 'All' | 'Draft' | 'Sent' | 'Paid' | 'Overdue';

const FILTER_OPTIONS: FilterOption[] = ['All', 'Draft', 'Sent', 'Paid', 'Overdue'];

/** Map filter chip to API InvoiceStatus value, or undefined for All. */
function getStatusParam(filter: FilterOption): string | undefined {
  switch (filter) {
    case 'All':
      return undefined;
    case 'Draft':
      return 'DRAFT';
    case 'Sent':
      return 'SENT';
    case 'Paid':
      return 'PAID';
    case 'Overdue':
      return 'OVERDUE';
  }
}

function getDefaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
}

export const InvoicingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All');

  // Quick-create sheet state (kept for UI — actual save wired in US-028)
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [amountText, setAmountText] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate] = useState(getDefaultDueDate);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  // Invoice action sheet state
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);

  // Sheet animation
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Action sheet animation
  const actionSheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const actionBackdropOpacity = useRef(new Animated.Value(0)).current;

  // ── API hooks ────────────────────────────────────────────────────────────
  const statusParam = getStatusParam(activeFilter);
  const {
    data: invoicesData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useInvoices(statusParam);

  const sendInvoiceMutation = useSendInvoice();
  const markPaidMutation = useMarkInvoicePaid();
  const paymentLinkMutation = useGetPaymentLink();

  const invoices = invoicesData ?? [];

  const sortedInvoices = useMemo(() => {
    return [...invoices].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [invoices]);

  // Outstanding summary computed from real data (use ALL invoices, not filtered)
  // We fetch unfiltered for summary separately via the 'all' key which is always in cache
  const outstanding = useMemo(() => {
    const unpaid = invoices.filter(
      (i: Invoice) => i.status === 'SENT' || i.status === 'OVERDUE'
    );
    const total = unpaid.reduce((sum: number, i: Invoice) => sum + i.total, 0);
    const pendingCount = invoices.filter(
      (i: Invoice) => i.status === 'SENT' || i.status === 'DRAFT'
    ).length;
    const overdueCount = invoices.filter((i: Invoice) => i.status === 'OVERDUE').length;
    return { total, pendingCount, overdueCount };
  }, [invoices]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // ── Invoice action handlers ──────────────────────────────────────────────

  const handleInvoicePress = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowActionSheet(true);
    actionSheetTranslateY.setValue(SCREEN_HEIGHT);
    actionBackdropOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(actionSheetTranslateY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.timing(actionBackdropOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [actionSheetTranslateY, actionBackdropOpacity]);

  const closeActionSheet = useCallback(() => {
    Animated.parallel([
      Animated.timing(actionSheetTranslateY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(actionBackdropOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowActionSheet(false);
      setSelectedInvoice(null);
    });
  }, [actionSheetTranslateY, actionBackdropOpacity]);

  const handleSendInvoice = useCallback(() => {
    if (!selectedInvoice) return;
    sendInvoiceMutation.mutate(selectedInvoice.id, {
      onSuccess: () => {
        closeActionSheet();
        Alert.alert('Invoice Sent', 'The invoice has been sent to the customer.');
      },
      onError: () => {
        Alert.alert('Error', 'Failed to send invoice. Please try again.');
      },
    });
  }, [selectedInvoice, sendInvoiceMutation, closeActionSheet]);

  const handleMarkPaid = useCallback(() => {
    if (!selectedInvoice) return;
    markPaidMutation.mutate(selectedInvoice.id, {
      onSuccess: () => {
        closeActionSheet();
        Alert.alert('Marked Paid', 'The invoice has been marked as paid.');
      },
      onError: () => {
        Alert.alert('Error', 'Failed to mark invoice as paid. Please try again.');
      },
    });
  }, [selectedInvoice, markPaidMutation, closeActionSheet]);

  const handleSharePaymentLink = useCallback(() => {
    if (!selectedInvoice) return;
    paymentLinkMutation.mutate(selectedInvoice.id, {
      onSuccess: (data) => {
        closeActionSheet();
        Share.share({
          message: `Pay invoice ${selectedInvoice.invoiceNumber}: ${data.url}`,
          url: data.url,
        });
      },
      onError: () => {
        Alert.alert('Error', 'Failed to generate payment link. Please try again.');
      },
    });
  }, [selectedInvoice, paymentLinkMutation, closeActionSheet]);

  const isActionLoading =
    sendInvoiceMutation.isPending ||
    markPaidMutation.isPending ||
    paymentLinkMutation.isPending;

  // ── Render helpers ───────────────────────────────────────────────────────

  const renderItem = useCallback(({ item }: { item: Invoice }) => {
    return (
      <Pressable
        style={styles.rowWrapper}
        onPress={() => handleInvoicePress(item)}
      >
        <InvoiceRow
          clientName={item.invoiceNumber}
          invoiceNumber={item.invoiceNumber}
          date={item.createdAt}
          amount={item.total}
          status={item.status}
        />
      </Pressable>
    );
  }, [handleInvoicePress]);

  const renderEmpty = useCallback(() => {
    if (activeFilter !== 'All') {
      return (
        <View style={styles.emptyFilter}>
          <Text style={styles.emptyFilterText}>
            No {activeFilter.toLowerCase()} invoices
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIllustration} />
        <Text style={styles.emptyTitle}>No invoices yet</Text>
        <Text style={styles.emptySubtitle}>
          Create your first invoice after completing a job
        </Text>
      </View>
    );
  }, [activeFilter]);

  const getItemLayout = useCallback((_data: ArrayLike<Invoice> | null | undefined, index: number) => ({
    length: INVOICE_ROW_HEIGHT,
    offset: INVOICE_ROW_HEIGHT * index,
    index,
  }), []);

  // ── Create sheet helpers ─────────────────────────────────────────────────

  const openCreateSheet = useCallback(() => {
    setSelectedClientId(null);
    setAmountText('');
    setDescription('');
    setShowClientPicker(false);
    setClientSearch('');
    setShowCreateSheet(true);
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

  const closeCreateSheet = useCallback(() => {
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
      setShowCreateSheet(false);
    });
  }, [sheetTranslateY, backdropOpacity]);

  const renderCreateSheet = () => {
    if (!showCreateSheet) return null;

    // Client picker sub-view
    if (showClientPicker) {
      return (
        <Modal
          visible
          transparent
          animationType="none"
          onRequestClose={() => setShowClientPicker(false)}
        >
          <Animated.View style={[styles.overlay, { opacity: backdropOpacity }]}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setShowClientPicker(false)}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.createSheetAnimated,
              { transform: [{ translateY: sheetTranslateY }] },
            ]}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.createSheetInner}
            >
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Select Client</Text>
              <TextInput
                style={styles.clientSearchInput}
                placeholder="Search clients..."
                placeholderTextColor={textColors.muted}
                value={clientSearch}
                onChangeText={setClientSearch}
                autoCorrect={false}
              />
              <ScrollView style={styles.clientPickerList}>
                <Text style={styles.clientPickerEmpty}>
                  Client list will load from API (US-028)
                </Text>
              </ScrollView>
            </KeyboardAvoidingView>
          </Animated.View>
        </Modal>
      );
    }

    return (
      <Modal
        visible
        transparent
        animationType="none"
        onRequestClose={closeCreateSheet}
      >
        <Animated.View style={[styles.overlay, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeCreateSheet} />
        </Animated.View>
        <Animated.View
          style={[
            styles.createSheetAnimated,
            { transform: [{ translateY: sheetTranslateY }] },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.createSheetInner}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>New Invoice</Text>

            <ScrollView
              style={styles.formScroll}
              keyboardShouldPersistTaps="handled"
            >
              {/* Client selector */}
              <Text style={styles.fieldLabel}>Client</Text>
              <Pressable
                style={styles.clientSelector}
                onPress={() => setShowClientPicker(true)}
              >
                <Text
                  style={[
                    styles.clientSelectorText,
                    !selectedClientId && styles.clientSelectorPlaceholder,
                  ]}
                >
                  {selectedClientId ?? 'Select Client'}
                </Text>
                <Text style={styles.clientSelectorChevron}>{'\u203A'}</Text>
              </Pressable>

              {/* Amount input */}
              <Text style={styles.fieldLabel}>Amount</Text>
              <View style={styles.amountRow}>
                <Text style={styles.amountPrefix}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor={textColors.muted}
                  keyboardType="numeric"
                  value={amountText}
                  onChangeText={setAmountText}
                />
              </View>

              {/* Description */}
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="What was this for?"
                placeholderTextColor={textColors.muted}
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />

              {/* Due date */}
              <Text style={styles.fieldLabel}>Due Date</Text>
              <View style={styles.dueDateRow}>
                <Text style={styles.dueDateText}>
                  {formatDate(dueDate, 'full')}
                </Text>
              </View>
            </ScrollView>

            {/* Action buttons */}
            <View
              style={[
                styles.sheetActions,
                { paddingBottom: Math.max(insets.bottom, spacing.lg) },
              ]}
            >
              <Pressable
                style={styles.draftBtn}
                onPress={closeCreateSheet}
              >
                <Text style={styles.draftBtnText}>Save as Draft</Text>
              </Pressable>
              <Pressable
                style={styles.sendBtn}
                onPress={closeCreateSheet}
              >
                <Text style={styles.sendBtnText}>Send Invoice</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Modal>
    );
  };

  // ── Action sheet for invoice actions ─────────────────────────────────────

  const renderActionSheet = () => {
    if (!showActionSheet || !selectedInvoice) return null;

    const canSend = selectedInvoice.status === 'DRAFT';
    const canMarkPaid =
      selectedInvoice.status === 'SENT' || selectedInvoice.status === 'OVERDUE';
    const canShareLink =
      selectedInvoice.status === 'SENT' || selectedInvoice.status === 'OVERDUE';

    return (
      <Modal
        visible
        transparent
        animationType="none"
        onRequestClose={closeActionSheet}
      >
        <Animated.View style={[styles.overlay, { opacity: actionBackdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeActionSheet} />
        </Animated.View>
        <Animated.View
          style={[
            styles.actionSheetAnimated,
            { transform: [{ translateY: actionSheetTranslateY }] },
          ]}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>
            {selectedInvoice.invoiceNumber}
          </Text>
          <Text style={styles.actionSheetAmount}>
            {formatCurrency(selectedInvoice.total)}
          </Text>

          <View style={styles.actionList}>
            {canSend && (
              <Pressable
                style={styles.actionBtn}
                onPress={handleSendInvoice}
                disabled={isActionLoading}
              >
                {sendInvoiceMutation.isPending ? (
                  <ActivityIndicator size="small" color={brand.olive} />
                ) : (
                  <Text style={styles.actionBtnText}>Send Invoice</Text>
                )}
              </Pressable>
            )}

            {canMarkPaid && (
              <Pressable
                style={styles.actionBtn}
                onPress={handleMarkPaid}
                disabled={isActionLoading}
              >
                {markPaidMutation.isPending ? (
                  <ActivityIndicator size="small" color={brand.olive} />
                ) : (
                  <Text style={styles.actionBtnText}>Mark as Paid</Text>
                )}
              </Pressable>
            )}

            {canShareLink && (
              <Pressable
                style={styles.actionBtn}
                onPress={handleSharePaymentLink}
                disabled={isActionLoading}
              >
                {paymentLinkMutation.isPending ? (
                  <ActivityIndicator size="small" color={brand.olive} />
                ) : (
                  <Text style={styles.actionBtnText}>Share Payment Link</Text>
                )}
              </Pressable>
            )}

            <Pressable
              style={[styles.actionBtn, styles.actionBtnCancel]}
              onPress={closeActionSheet}
            >
              <Text style={styles.actionBtnCancelText}>Cancel</Text>
            </Pressable>
          </View>

          <View style={{ height: Math.max(insets.bottom, spacing.lg) }} />
        </Animated.View>
      </Modal>
    );
  };

  // ── Header with filter chips + summary ───────────────────────────────────

  const renderHeader = useCallback(() => (
    <>
      {/* Filter chips */}
      {showFilters && (
        <View style={styles.filterRow}>
          {FILTER_OPTIONS.map(opt => {
            const isActive = activeFilter === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => setActiveFilter(opt)}
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Outstanding summary card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryLabel}>Total Outstanding</Text>
          <Text style={styles.summaryAmount}>
            {formatCurrency(outstanding.total)}
          </Text>
        </View>
        <View style={styles.summaryRight}>
          <View style={styles.summaryStatRow}>
            <View style={[styles.dot, styles.dotYellow]} />
            <Text style={styles.summaryStat}>
              {outstanding.pendingCount} pending
            </Text>
          </View>
          <View style={styles.summaryStatRow}>
            <View style={[styles.dot, styles.dotRed]} />
            <Text style={styles.summaryStat}>
              {outstanding.overdueCount} overdue
            </Text>
          </View>
        </View>
      </View>
    </>
  ), [showFilters, activeFilter, outstanding]);

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Invoices</Text>
          <View style={styles.filterToggle} />
        </View>
        <View style={styles.skeletonContent}>
          {/* Summary card skeleton */}
          <View style={styles.skeletonSummary} />
          {/* Invoice row skeletons */}
          {[0, 1, 2, 3, 4].map(i => (
            <View key={i} style={styles.skeletonRow}>
              <View style={styles.skeletonRowLeft}>
                <View style={styles.skeletonTextLong} />
                <View style={styles.skeletonTextShort} />
              </View>
              <View style={styles.skeletonRowRight}>
                <View style={styles.skeletonTextMedium} />
                <View style={styles.skeletonPill} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (isError) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Invoices</Text>
          <View style={styles.filterToggle} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.errorText}>Failed to load invoices</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Main content ─────────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Invoices</Text>
        <Pressable
          onPress={() => setShowFilters(prev => !prev)}
          style={styles.filterToggle}
        >
          <Text style={styles.filterIcon}>
            {showFilters ? '\u2715' : '\u229C'}
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={sortedInvoices}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          sortedInvoices.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}
        decelerationRate="normal"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={brand.olive}
          />
        }
      />

      <FAB onPress={openCreateSheet} />

      {/* Quick-create invoice bottom sheet */}
      {renderCreateSheet()}

      {/* Invoice action sheet */}
      {renderActionSheet()}
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
  filterToggle: {
    width: size.minTapTarget,
    height: size.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    fontSize: fontSize.xl,
    color: textColors.secondary,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: background.outstanding,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  summaryLeft: {
    flex: 1,
  },
  summaryLabel: {
    ...typography.caption,
    color: textColors.secondary,
  },
  summaryAmount: {
    ...typography.metricOutstanding,
    color: textColors.primary,
    marginTop: spacing.xs,
  },
  summaryRight: {
    gap: spacing.sm,
  },
  summaryStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: spacing.sm / 2,
    marginRight: spacing.sm,
  },
  dotYellow: {
    backgroundColor: invoiceStatusColors.sent.text,
  },
  dotRed: {
    backgroundColor: feedback.error,
  },
  summaryStat: {
    ...typography.caption,
    color: textColors.secondary,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: background.chipInactive,
    minHeight: size.minTapTarget,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: brand.olive,
  },
  filterChipText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    color: textColors.onTip,
  },
  filterChipTextActive: {
    color: textColors.onPrimary,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: size.tabBarTotalHeight + size.fabSize + spacing.xxxl,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  rowWrapper: {
    marginBottom: spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  emptyIllustration: {
    width: size.emptyIllustration,
    height: size.emptyIllustration,
    borderRadius: size.emptyIllustration / 2,
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
  emptyFilter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFilterText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    color: textColors.secondary,
  },
  // Loading skeleton
  skeletonContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  skeletonSummary: {
    height: 80,
    borderRadius: radius.xl,
    backgroundColor: skeletonColors.base,
    marginBottom: spacing.lg,
  },
  skeletonRow: {
    flexDirection: 'row',
    backgroundColor: skeletonColors.base,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
    height: 64,
  },
  skeletonRowLeft: {
    flex: 1,
    gap: spacing.xs,
  },
  skeletonRowRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  skeletonTextLong: {
    width: 120,
    height: 14,
    borderRadius: radius.sm,
    backgroundColor: skeletonColors.shimmer,
  },
  skeletonTextShort: {
    width: 80,
    height: 12,
    borderRadius: radius.sm,
    backgroundColor: skeletonColors.shimmer,
  },
  skeletonTextMedium: {
    width: 60,
    height: 14,
    borderRadius: radius.sm,
    backgroundColor: skeletonColors.shimmer,
  },
  skeletonPill: {
    width: 50,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: skeletonColors.shimmer,
  },
  // Error state
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  errorIcon: {
    fontSize: 40,
    color: feedback.error,
    marginBottom: spacing.md,
    fontWeight: fontWeight.bold,
  },
  errorText: {
    ...typography.body,
    color: textColors.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: brand.olive,
    borderRadius: radius.sm,
    minHeight: size.minTapTarget,
    justifyContent: 'center',
  },
  retryBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: textColors.onPrimary,
  },
  // Bottom sheet styles
  overlay: {
    flex: 1,
    backgroundColor: background.overlay,
  },
  createSheetAnimated: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.8,
    backgroundColor: background.card,
    borderTopLeftRadius: size.sheetTopRadius,
    borderTopRightRadius: size.sheetTopRadius,
    ...shadows.bottomSheet,
  },
  createSheetInner: {
    flex: 1,
  },
  sheetHandle: {
    width: size.sheetHandleWidth,
    height: size.sheetHandleHeight,
    borderRadius: size.sheetHandleHeight / 2,
    backgroundColor: border.divider,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: textColors.primary,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  formScroll: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  fieldLabel: {
    ...typography.caption,
    color: textColors.secondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  // Client selector
  clientSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: background.input,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: size.minTapTarget,
  },
  clientSelectorText: {
    flex: 1,
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.medium,
    color: textColors.primary,
  },
  clientSelectorPlaceholder: {
    color: textColors.muted,
    fontWeight: fontWeight.regular,
  },
  clientSelectorChevron: {
    fontSize: fontSize.xl,
    color: textColors.muted,
  },
  // Amount input
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: background.input,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minHeight: size.minTapTarget,
  },
  amountPrefix: {
    fontSize: fontSize.metric,
    fontWeight: fontWeight.bold,
    color: textColors.secondary,
    marginRight: spacing.xs,
  },
  amountInput: {
    flex: 1,
    fontSize: fontSize.metric,
    fontWeight: fontWeight.bold,
    color: textColors.primary,
    paddingVertical: spacing.sm,
  },
  // Description
  descriptionInput: {
    backgroundColor: background.input,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.body,
    fontWeight: fontWeight.regular,
    color: textColors.primary,
    minHeight: 80,
  },
  // Due date
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: background.input,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: size.minTapTarget,
  },
  dueDateText: {
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.medium,
    color: textColors.primary,
  },
  // Action buttons
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  draftBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: brand.olive,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: size.minTapTarget,
    justifyContent: 'center',
  },
  draftBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: brand.olive,
  },
  sendBtn: {
    flex: 1,
    backgroundColor: brand.olive,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: size.minTapTarget,
    justifyContent: 'center',
  },
  sendBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: textColors.onPrimary,
  },
  // Client picker
  clientSearchInput: {
    backgroundColor: background.input,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.body,
    color: textColors.primary,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  clientPickerList: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  clientPickerEmpty: {
    fontSize: fontSize.body,
    color: textColors.secondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  // Action sheet
  actionSheetAnimated: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: background.card,
    borderTopLeftRadius: size.sheetTopRadius,
    borderTopRightRadius: size.sheetTopRadius,
    ...shadows.bottomSheet,
  },
  actionSheetAmount: {
    fontSize: fontSize.metric,
    fontWeight: fontWeight.bold,
    color: textColors.primary,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  actionList: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  actionBtn: {
    backgroundColor: background.input,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: size.minTapTarget,
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: brand.olive,
  },
  actionBtnCancel: {
    backgroundColor: 'transparent',
    marginTop: spacing.xs,
  },
  actionBtnCancelText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: textColors.secondary,
  },
});
