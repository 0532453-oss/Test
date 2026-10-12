import { Glimmer, Card } from '@/atlantis'

const HOURS_COUNT = 12 // 7 AM to 6 PM
const DAYS_COUNT = 7 // Monday to Sunday

const UnscheduledJobSkeleton = () => (
  <div className="p-3 rounded-lg border">
    <Glimmer width="75%" height={16} className="mb-2" />
    <div className="flex items-center gap-2">
      <Glimmer shape="rectangle" width={64} height={20} className="rounded-full" />
      <Glimmer width={48} height={12} />
    </div>
  </div>
)

const CalendarCellSkeleton = ({ hasJob }: { hasJob: boolean }) => (
  <div className="p-1 border-r last:border-r-0 min-h-[60px]">
    {hasJob && (
      <Glimmer height={48} className="rounded" />
    )}
  </div>
)

// Use a deterministic pattern instead of Math.random to avoid re-render inconsistencies
const jobPattern = [
  [false, false, true, false, false, false, false],
  [false, false, false, false, false, false, false],
  [false, true, false, false, false, false, false],
  [false, false, false, false, true, false, false],
  [false, false, false, false, false, false, false],
  [true, false, false, false, false, false, false],
  [false, false, false, false, false, true, false],
  [false, false, false, false, false, false, false],
  [false, false, true, false, false, false, false],
  [false, false, false, false, false, false, false],
  [false, false, false, true, false, false, false],
  [false, false, false, false, false, false, false],
]

export const ScheduleSkeleton = () => (
  <div className="flex flex-col lg:flex-row gap-6 mt-4">
    {/* Calendar Section */}
    <div className="flex-1">
      {/* Calendar Header */}
      <Card className="mb-4">
        <Card.Body className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Glimmer shape="rectangle" width={36} height={36} />
              <Glimmer shape="rectangle" width={36} height={36} />
              <Glimmer shape="rectangle" width={64} height={36} />
            </div>
            <Glimmer width="10rem" height={24} />
            <div className="flex items-center gap-2">
              <Glimmer shape="rectangle" width={16} height={16} />
              <Glimmer width={80} height={16} />
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <Card.Body className="p-0">
          {/* Day headers */}
          <div className="grid grid-cols-8 border-b">
            <div className="p-2 border-r bg-[var(--color-surface--hover)]" />
            {Array.from({ length: DAYS_COUNT }).map((_, i) => (
              <div key={i} className="p-2 text-center border-r last:border-r-0">
                <Glimmer width={32} height={12} className="mx-auto mb-1" />
                <Glimmer shape="circle" size="small" className="mx-auto" />
              </div>
            ))}
          </div>

          {/* Time slots */}
          <div className="h-[600px] overflow-hidden">
            {Array.from({ length: HOURS_COUNT }).map((_, hourIndex) => (
              <div key={hourIndex} className="grid grid-cols-8 border-b last:border-b-0">
                <div className="p-2 border-r bg-[var(--color-surface--hover)]">
                  <Glimmer width={40} height={12} />
                </div>
                {Array.from({ length: DAYS_COUNT }).map((_, dayIndex) => (
                  <CalendarCellSkeleton
                    key={dayIndex}
                    hasJob={jobPattern[hourIndex]?.[dayIndex] ?? false}
                  />
                ))}
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    </div>

    {/* Unscheduled Jobs Sidebar */}
    <div className="lg:w-72">
      <Card>
        <Card.Header className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Glimmer shape="rectangle" width={16} height={16} />
            <Glimmer width="8rem" height={20} />
          </div>
        </Card.Header>
        <Card.Body>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <UnscheduledJobSkeleton key={i} />
            ))}
          </div>
        </Card.Body>
      </Card>
    </div>
  </div>
)

export default ScheduleSkeleton
