import { Glimmer } from '../atlantis/Glimmer';
import { Card as AtlantisCard } from '../atlantis/Card';

/**
 * Skeleton loader for individual stat cards on the dashboard
 * Uses Atlantis Glimmer for loading placeholders
 */
const StatCardSkeleton = () => (
  <AtlantisCard className="border-l-4 border-l-muted">
    <AtlantisCard.Header className="flex flex-row items-center justify-between pb-2 px-4 py-3">
      <Glimmer width="6rem" height={16} />
      <Glimmer shape="rectangle" width={16} height={16} />
    </AtlantisCard.Header>
    <AtlantisCard.Body>
      <Glimmer width="3rem" height={32} className="mb-1" />
      <Glimmer width="5rem" height={12} />
    </AtlantisCard.Body>
  </AtlantisCard>
);

/**
 * Skeleton for list items inside cards (schedule, requests, etc.)
 * Uses Atlantis Glimmer for loading placeholders
 */
const ListItemSkeleton = () => (
  <div className="flex items-center justify-between p-3 rounded-lg border">
    <div className="flex-1 min-w-0 space-y-2">
      <Glimmer width="75%" height={16} />
      <Glimmer width="33%" height={12} />
    </div>
    <Glimmer shape="rectangle" width={80} height={24} className="rounded-full" />
  </div>
);

/**
 * Skeleton for the Today's Schedule / New Requests cards
 * Uses Atlantis Glimmer and Card for loading placeholders
 */
const ListCardSkeleton = () => (
  <AtlantisCard>
    <AtlantisCard.Header className="flex flex-row items-center justify-between px-4 py-3">
      <Glimmer width="8rem" height={20} />
      <Glimmer width="7rem" height={32} />
    </AtlantisCard.Header>
    <AtlantisCard.Body>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </div>
    </AtlantisCard.Body>
  </AtlantisCard>
);

/**
 * Full dashboard skeleton matching the DashboardPage layout
 * Uses Atlantis Glimmer for all loading placeholders
 */
export const DashboardSkeleton = () => (
  <>
    {/* Welcome Section */}
    <div className="mb-6 space-y-2">
      <Glimmer.Header width="12rem" />
      <Glimmer width="20rem" height={16} />
    </div>

    {/* Stats Cards */}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>

    {/* Main Content Grid */}
    <div className="grid gap-6 md:grid-cols-2">
      {/* Today's Schedule */}
      <ListCardSkeleton />

      {/* New Requests */}
      <ListCardSkeleton />

      {/* Jobs Needing Attention (full width) */}
      <AtlantisCard className="md:col-span-2">
        <AtlantisCard.Header className="flex flex-row items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Glimmer shape="rectangle" width={16} height={16} />
            <Glimmer width="10rem" height={20} />
          </div>
          <Glimmer width="9rem" height={32} />
        </AtlantisCard.Header>
        <AtlantisCard.Body>
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <ListItemSkeleton key={i} />
            ))}
          </div>
        </AtlantisCard.Body>
      </AtlantisCard>
    </div>
  </>
);

export default DashboardSkeleton;
