import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  background,
  border,
  brand,
  feedback,
  skeleton as skeletonColors,
  text as textColors,
} from '../theme';
import {
  fontSize,
  fontWeight,
  radius,
  size,
  spacing,
  typography,
} from '../theme';
import { ClientCard, SearchBar, FAB } from '../components';
import { formatCurrency } from '../utils/format';
import { useCustomers, useCustomerDetails } from '../hooks';
import type { Customer } from '../api/types';

export const ClientListScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 300ms debounce for search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchQuery]);

  const {
    data: customers,
    isLoading,
    isError,
    refetch,
    isRefetching,
    isFetching,
  } = useCustomers(debouncedSearch || undefined);

  // Fetch details for the expanded customer
  const { data: expandedDetails } = useCustomerDetails(expandedId ?? undefined);

  const sortedCustomers = useMemo(() => {
    if (!customers) return [];
    return [...customers].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [customers]);

  const getLastJobDate = (customer: Customer): string | null => {
    if (!expandedDetails || expandedDetails.id !== customer.id) return null;
    const completedJobs = (expandedDetails.recentJobs ?? [])
      .filter(j => j.status === 'COMPLETED' && j.completedAt)
      .sort((a, b) => {
        if (!a.completedAt || !b.completedAt) return 0;
        return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
      });
    if (completedJobs.length === 0) return null;
    const d = new Date(completedJobs[0].completedAt!);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTotalRevenue = (customer: Customer): number => {
    if (!expandedDetails || expandedDetails.id !== customer.id) return 0;
    return (expandedDetails.invoices ?? [])
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + i.total, 0);
  };

  const getCompletedJobCount = (customer: Customer): number => {
    if (!expandedDetails || expandedDetails.id !== customer.id) return 0;
    return (expandedDetails.recentJobs ?? []).filter(
      j => j.status === 'COMPLETED'
    ).length;
  };

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleNavigate = (customer: Customer) => {
    // Open Google Maps to customer primary property address
    if (expandedDetails && expandedDetails.id === customer.id) {
      const property = (expandedDetails.properties ?? []).find(p => p.isPrimary) ?? (expandedDetails.properties ?? [])[0];
      if (property) {
        const address = encodeURIComponent(`${property.street}, ${property.city}, ${property.state} ${property.zip}`);
        const url = Platform.select({
          ios: `maps:0,0?q=${address}`,
          default: `https://www.google.com/maps/search/?api=1&query=${address}`,
        });
        Linking.openURL(url);
      }
    }
  };

  const renderItem = useCallback(({ item }: { item: Customer }) => {
    const isExpanded = expandedId === item.id;
    return (
      <View style={styles.cardWrapper}>
        <ClientCard
          name={item.name}
          lastJobDate={isExpanded ? getLastJobDate(item) : null}
          totalRevenue={isExpanded ? getTotalRevenue(item) : 0}
          phone={item.phone ?? null}
          email={item.email ?? null}
          completedJobCount={isExpanded ? getCompletedJobCount(item) : 0}
          isExpanded={isExpanded}
          onPress={() => toggleExpand(item.id)}
          onNavigate={isExpanded ? () => handleNavigate(item) : undefined}
        />
      </View>
    );
  }, [expandedId, expandedDetails]);

  const renderEmpty = useCallback(() => {
    if (searchQuery.trim()) {
      return (
        <View style={styles.emptySearch}>
          <Text style={styles.emptySearchText}>
            No clients match &quot;{searchQuery}&quot;
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIllustration} />
        <Text style={styles.emptyTitle}>No clients yet</Text>
        <Text style={styles.emptySubtitle}>
          Add your first client to start tracking jobs and revenue
        </Text>
        <Pressable style={styles.addButton}>
          <Text style={styles.addButtonText}>Add Client</Text>
        </Pressable>
      </View>
    );
  }, [searchQuery]);

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Clients</Text>
          <View style={styles.countBadge}>
            <View style={styles.skeletonCountText} />
          </View>
        </View>
        <View style={styles.searchWrapper}>
          <View style={styles.skeletonSearchBar} />
        </View>
        <View style={styles.skeletonList}>
          {[0, 1, 2, 3, 4].map(i => (
            <View key={i} style={styles.skeletonCard}>
              <View style={styles.skeletonRow}>
                <View style={styles.skeletonAvatar} />
                <View style={styles.skeletonTextBlock}>
                  <View style={styles.skeletonName} />
                  <View style={styles.skeletonChips} />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Clients</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorSubtitle}>
            Could not load your clients. Check your connection and try again.
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

  // Show inline search spinner when fetching a new search but data already present
  const showSearchSpinner = isFetching && !isLoading && debouncedSearch !== '';

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Clients</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{sortedCustomers.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <SearchBar
          placeholder="Search clients..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {showSearchSpinner && (
          <ActivityIndicator
            size="small"
            color={brand.olive}
            style={styles.searchSpinner}
          />
        )}
      </View>

      {/* Client List */}
      <FlatList
        data={sortedCustomers}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          sortedCustomers.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}
        decelerationRate="normal"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetching}
            onRefresh={() => refetch()}
            tintColor={brand.olive}
          />
        }
      />

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
  title: {
    ...typography.screenTitle,
    color: textColors.primary,
  },
  countBadge: {
    backgroundColor: background.chipInactive,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  countText: {
    ...typography.countBadge,
    color: textColors.secondary,
  },
  searchWrapper: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchSpinner: {
    position: 'absolute',
    right: spacing.lg + spacing.md,
    top: 12,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: size.tabBarTotalHeight + size.fabSize + spacing.xxxl,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  cardWrapper: {
    marginBottom: spacing.sm + spacing.xxs,
  },

  // ── Empty states ──────────────────────────────────────────────────────────
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
    marginBottom: spacing.xl,
  },
  addButton: {
    backgroundColor: brand.olive,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    minHeight: size.minTapTarget,
    justifyContent: 'center',
  },
  addButtonText: {
    color: textColors.onPrimary,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
  },
  emptySearch: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxxxl,
  },
  emptySearchText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    color: textColors.secondary,
  },

  // ── Error state ───────────────────────────────────────────────────────────
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
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
    borderRadius: radius.sm,
    minHeight: size.minTapTarget,
    justifyContent: 'center',
  },
  retryText: {
    color: textColors.onPrimary,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
  },

  // ── Loading skeleton ──────────────────────────────────────────────────────
  skeletonCountText: {
    width: 20,
    height: 14,
    borderRadius: radius.xs,
    backgroundColor: skeletonColors.base,
  },
  skeletonSearchBar: {
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: skeletonColors.base,
  },
  skeletonList: {
    paddingHorizontal: spacing.lg,
  },
  skeletonCard: {
    backgroundColor: background.card,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: spacing.sm + spacing.xxs,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonAvatar: {
    width: size.clientAvatar,
    height: size.clientAvatar,
    borderRadius: size.clientAvatar / 2,
    backgroundColor: skeletonColors.base,
    marginRight: spacing.md,
  },
  skeletonTextBlock: {
    flex: 1,
  },
  skeletonName: {
    width: '60%',
    height: 16,
    borderRadius: radius.xs,
    backgroundColor: skeletonColors.base,
    marginBottom: spacing.sm,
  },
  skeletonChips: {
    width: '80%',
    height: 12,
    borderRadius: radius.xs,
    backgroundColor: skeletonColors.shimmer,
  },
});
