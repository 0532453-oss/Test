import { Glimmer, Card } from '@/atlantis'

const StatCardSkeleton = () => (
  <Card className="border-l-4 border-l-muted">
    <Card.Header className="flex flex-row items-center justify-between pb-2 px-4 py-3">
      <Glimmer width="6rem" height={16} />
      <Glimmer shape="rectangle" width={16} height={16} />
    </Card.Header>
    <Card.Body>
      <Glimmer width="3rem" height={32} className="mb-1" />
      <Glimmer width="5rem" height={12} />
    </Card.Body>
  </Card>
)

const ListItemSkeleton = () => (
  <div className="flex items-center justify-between p-3 rounded-lg border">
    <div className="flex-1 min-w-0 space-y-2">
      <Glimmer width="75%" height={16} />
      <Glimmer width="33%" height={12} />
    </div>
    <Glimmer shape="rectangle" width={80} height={24} className="rounded-full" />
  </div>
)

const ListCardSkeleton = () => (
  <Card>
    <Card.Header className="flex flex-row items-center justify-between px-4 py-3">
      <Glimmer width="8rem" height={20} />
      <Glimmer width="7rem" height={32} />
    </Card.Header>
    <Card.Body>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </div>
    </Card.Body>
  </Card>
)

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
      <ListCardSkeleton />
      <ListCardSkeleton />

      <Card className="md:col-span-2">
        <Card.Header className="flex flex-row items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Glimmer shape="rectangle" width={16} height={16} />
            <Glimmer width="10rem" height={20} />
          </div>
          <Glimmer width="9rem" height={32} />
        </Card.Header>
        <Card.Body>
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <ListItemSkeleton key={i} />
            ))}
          </div>
        </Card.Body>
      </Card>
    </div>
  </>
)

export default DashboardSkeleton
