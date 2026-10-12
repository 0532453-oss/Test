import { useState } from 'react';
import { useRecordContext, useGetOne } from 'ra-core';
import { Show, ReferenceField } from '@/components/admin';
import {
  jobStatusToSemantic,
  jobPriorityToSemantic,
  formatStatusLabel,
  type Job,
} from '@/types';
import { Highlights, type HighlightItem } from '@/components/Highlights';
import {
  Card as AtlantisCard,
  Icon,
  Heading,
  Text,
  StatusLabel,
  StatusIndicator,
  DescriptionList,
  Page,
  FormatDateTime,
  LightBox,
  Placeholder,
  Tabs,
  Tab,
} from '@/atlantis';
import type { PresentedImage } from '@/atlantis';

export const JobShow = () => {
  // Breadcrumb label options (choose one):
  // Option 1: Custom text (simple)
  // breadcrumbLabel="Job Details"
  
  // Option 2: Use job number format
  // breadcrumbLabel="View Job"
  
  // Option 3: Let it use context.defaultTitle automatically (current - shows record title)
  
  return (
    <Show 
      resource="jobs" 
      disableBreadcrumb={false}
      title={false}
      breadcrumbListLabel="Jobs"
      // breadcrumbLabel="Job Details" // Uncomment for custom label
    >
      <JobShowContent />
    </Show>
  );
};

const JobShowContent = () => {
  const record = useRecordContext<Job>();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Fetch related data for highlights
  const clientId = record?.customerId || record?.clientId || '';
  const technicianId = record?.technicianId || record?.assignedToId || '';
  const { data: client } = useGetOne('clients', { id: clientId }, { enabled: !!clientId });
  const { data: assignedTo } = useGetOne('teamMembers', { id: technicianId }, { enabled: !!technicianId });

  if (!record) return null;

  // Build images list from record (images may be URLs or objects)
  const jobImages: PresentedImage[] = (
    (record as unknown as Record<string, unknown>).images as Array<string | { url: string; title?: string; caption?: string; alt?: string }> || []
  ).map((img) =>
    typeof img === 'string'
      ? { url: img }
      : { url: img.url, title: img.title, caption: img.caption, alt: img.alt }
  );

  const handleImageClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Build highlights data
  const highlights: HighlightItem[] = [
    {
      label: 'Client',
      value: client?.name || 'Not assigned',
      icon: <Icon name="person" size="small" color="informative" />,
      className: client?.name ? undefined : 'text-[var(--color-text--secondary)]',
    },
    {
      label: 'Scheduled',
      value: record.scheduledDate ? (
        <>
          <FormatDateTime date={`${record.scheduledDate}T${record.scheduledStartTime || '00:00'}`} showYear={false} />
        </>
      ) : (
        'Not scheduled'
      ),
      icon: <Icon name="calendar" size="small" color="informative" />,
      className: record.scheduledDate ? undefined : 'text-[var(--color-text--secondary)]',
    },
    {
      label: 'Assigned To',
      value: assignedTo?.name || 'Unassigned',
      icon: <Icon name="person" size="small" color="success" />,
      className: assignedTo?.name ? undefined : 'text-[var(--color-text--secondary)]',
    },
    {
      label: 'Duration',
      value: record.estimatedDuration
        ? `${Math.floor(record.estimatedDuration / 60)}h ${record.estimatedDuration % 60}m`
        : 'Not estimated',
      icon: <Icon name="timer" size="small" color="warning" />,
      className: record.estimatedDuration ? undefined : 'text-[var(--color-text--secondary)]',
    },
  ];

  // Page title component with job info
  const pageTitle = (
    <div className="flex items-start gap-5">
      <div className="w-14 h-14 rounded-xl bg-[var(--color-interactive)] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[var(--color-interactive)]/20">
        <Icon name="work" size="base" color="white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-4 flex-wrap mb-3">
          <Heading level={1} className="mb-0 flex-1 min-w-0 text-3xl font-bold">{record.title}</Heading>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusLabel
              label={formatStatusLabel(record.priority)}
              status={jobPriorityToSemantic[record.priority]}
            />
            <StatusLabel
              label={formatStatusLabel(record.status)}
              status={jobStatusToSemantic[record.status]}
            />
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Icon name="person" size="small" color="greyBlue" />
          <ReferenceField source="customerId" reference="clients" link="show">
            <ClientName />
          </ReferenceField>
        </div>
      </div>
    </div>
  );

  return (
    <Page
      title={pageTitle}
      primaryAction={{
        label: 'Edit',
        icon: 'edit',
        url: `/jobs/${record.id}/edit`,
      }}
    >

      {/* Highlights Section */}
      <div className="mb-10">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {highlights.map((item, index) => (
            <AtlantisCard key={index} className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-[var(--color-border)]" elevation="base">
              <AtlantisCard.Body className="p-5">
                <div className="flex items-start gap-3">
                  {item.icon && (
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-[var(--color-informative--surface)] flex items-center justify-center">
                      {item.icon}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Text variation="subdued" size="small" className="mb-1 block font-medium">
                      {item.label}
                    </Text>
                    <Text size="base" className={item.className || 'font-semibold'}>
                      {item.value}
                    </Text>
                  </div>
                </div>
              </AtlantisCard.Body>
            </AtlantisCard>
          ))}
        </div>
      </div>

      {/* Tabbed Content */}
      <div className="mt-8">
        <Tabs defaultTab={0}>
          <Tab label="Overview">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Schedule Information */}
              <AtlantisCard className="transition-all duration-200 hover:shadow-lg border border-[var(--color-border)]" elevation="base" accent="blue">
                <AtlantisCard.Header className="px-6 py-5 border-b border-[var(--color-border)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--color-informative--surface)] flex items-center justify-center">
                        <Icon name="calendar" size="base" color="informative" />
                      </div>
                      <Heading level={4} className="mb-0 text-lg font-semibold">Schedule</Heading>
                    </div>
                    <StatusIndicator
                      label={formatStatusLabel(record.status)}
                      status={jobStatusToSemantic[record.status]}
                    />
                  </div>
                </AtlantisCard.Header>
                <AtlantisCard.Body className="px-6 py-6 bg-[var(--color-surface)]">
                  <DescriptionList
                    data={[
                      {
                        label: 'Scheduled Date',
                        value: record.scheduledDate ? (
                          <FormatDateTime date={`${record.scheduledDate}T00:00`} showYear />
                        ) : (
                          <Text variation="subdued" size="base">Not scheduled</Text>
                        ),
                      },
                      {
                        label: 'Start Time',
                        value: record.scheduledStartTime ? (
                          <Text size="base">{record.scheduledStartTime}</Text>
                        ) : (
                          <Text variation="subdued" size="base">Not set</Text>
                        ),
                      },
                      {
                        label: 'End Time',
                        value: record.scheduledEndTime ? (
                          <Text size="base">{record.scheduledEndTime}</Text>
                        ) : (
                          <Text variation="subdued" size="base">Not set</Text>
                        ),
                      },
                      {
                        label: 'Estimated Duration',
                        value: record.estimatedDuration
                          ? (
                            <Text size="base">
                              {`${Math.floor(record.estimatedDuration / 60)}h ${record.estimatedDuration % 60}m`}
                            </Text>
                          )
                          : (
                            <Text variation="subdued" size="base">Not estimated</Text>
                          ),
                      },
                    ]}
                  />
                </AtlantisCard.Body>
              </AtlantisCard>

              {/* Assignment */}
              <AtlantisCard className="transition-all duration-200 hover:shadow-lg border border-[var(--color-border)]" elevation="base" accent="green">
                <AtlantisCard.Header className="px-6 py-5 border-b border-[var(--color-border)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--color-success--surface)] flex items-center justify-center">
                        <Icon name="person" size="base" color="success" />
                      </div>
                      <Heading level={4} className="mb-0 text-lg font-semibold">Assignment</Heading>
                    </div>
                    <StatusIndicator
                      label={formatStatusLabel(record.priority)}
                      status={jobPriorityToSemantic[record.priority]}
                    />
                  </div>
                </AtlantisCard.Header>
                <AtlantisCard.Body className="px-6 py-6 bg-[var(--color-surface)]">
                  <DescriptionList
                    data={[
                      {
                        label: 'Assigned To',
                        value: (record.technicianId || record.assignedToId) ? (
                          <ReferenceField source="technicianId" reference="teamMembers" link={false}>
                            <TeamMemberName />
                          </ReferenceField>
                        ) : (
                          <Text variation="subdued" size="base">Unassigned</Text>
                        ),
                      },
                    ]}
                  />
                  
                  {/* Actual Time Tracking - Only show if job has started */}
                  {(record.actualStartAt || record.actualEndAt) && (
                    <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
                      <div className="flex items-center gap-2 mb-4">
                        <Icon name="timer" size="small" color="success" />
                        <Text variation="subdued" size="small" className="font-semibold uppercase tracking-wide">
                          Actual Time
                        </Text>
                      </div>
                      <DescriptionList
                        data={[
                          ...(record.actualStartAt
                            ? [
                                {
                                  label: 'Started',
                                  value: <FormatDateTime date={record.actualStartAt} showYear />,
                                },
                              ]
                            : []),
                          ...(record.actualEndAt
                            ? [
                                {
                                  label: 'Completed',
                                  value: <FormatDateTime date={record.actualEndAt} showYear />,
                                },
                              ]
                            : []),
                        ]}
                      />
                    </div>
                  )}
                </AtlantisCard.Body>
              </AtlantisCard>
            </div>
          </Tab>

          <Tab label="Details">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Location */}
              <AtlantisCard className="transition-all duration-200 hover:shadow-lg border border-[var(--color-border)]" elevation="base" accent="purple">
                <AtlantisCard.Header className="px-6 py-5 border-b border-[var(--color-border)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-informative--surface)] flex items-center justify-center">
                      <Icon name="address" size="base" color="informative" />
                    </div>
                    <Heading level={4} className="mb-0 text-lg font-semibold">Location</Heading>
                  </div>
                </AtlantisCard.Header>
                <AtlantisCard.Body className="px-6 py-6 bg-[var(--color-surface)]">
                  {record.address ? (
                    <address className="not-italic space-y-2">
                      <div className="flex items-start gap-2">
                        <Icon name="address" size="small" color="informative" className="mt-0.5" />
                        <div>
                          <Text size="base" className="font-semibold block">{record.address.street}</Text>
                          <Text size="base" variation="subdued" className="block mt-1">
                            {record.address.city}, {record.address.state} {record.address.zipCode}
                          </Text>
                        </div>
                      </div>
                    </address>
                  ) : (
                    <div className="flex items-center gap-3 py-4">
                      <Icon name="address" size="base" color="greyBlue" />
                      <Text variation="subdued" size="base">No address specified</Text>
                    </div>
                  )}
                </AtlantisCard.Body>
              </AtlantisCard>

              {/* Description & Notes */}
              <AtlantisCard className="transition-all duration-200 hover:shadow-lg border border-[var(--color-border)]" elevation="base" accent="orange">
                <AtlantisCard.Header className="px-6 py-5 border-b border-[var(--color-border)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-warning--surface)] flex items-center justify-center">
                      <Icon name="note" size="base" color="warning" />
                    </div>
                    <Heading level={4} className="mb-0 text-lg font-semibold">Notes</Heading>
                  </div>
                </AtlantisCard.Header>
                <AtlantisCard.Body className="px-6 py-6 bg-[var(--color-surface)] space-y-5">
                  {record.description && (
                    <div className="pb-6 border-b border-[var(--color-border)] last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon name="note" size="small" color="warning" />
                        <Text variation="subdued" size="small" className="font-semibold uppercase tracking-wide">Description</Text>
                      </div>
                      <Text size="base" className="leading-relaxed whitespace-pre-wrap">{record.description}</Text>
                    </div>
                  )}
                  {record.notes && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Icon name="eye" size="small" color="warning" />
                        <Text variation="subdued" size="small" className="font-semibold uppercase tracking-wide">Internal Notes</Text>
                      </div>
                      <Text size="base" className="leading-relaxed whitespace-pre-wrap">{record.notes}</Text>
                    </div>
                  )}
                  {!record.description && !record.notes && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-[var(--color-warning--surface)] flex items-center justify-center mb-4">
                        <Icon name="note" size="large" color="warning" />
                      </div>
                      <Text variation="subdued" size="base">No details available</Text>
                    </div>
                  )}
                </AtlantisCard.Body>
              </AtlantisCard>
            </div>
          </Tab>

          <Tab label="Photos">
            <AtlantisCard className="transition-all duration-200 hover:shadow-lg border border-[var(--color-border)]" elevation="base" accent="indigo">
              <AtlantisCard.Header className="px-6 py-5 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-informative--surface)] flex items-center justify-center">
                    <Icon name="eye" size="base" color="informative" />
                  </div>
                  <Heading level={4} className="mb-0 text-lg font-semibold">Photos</Heading>
                  {jobImages.length > 0 && (
                    <Text variation="subdued" size="small" className="ml-2 px-2 py-1 rounded-full bg-[var(--color-informative--surface)] font-medium">
                      {`${jobImages.length} image${jobImages.length !== 1 ? 's' : ''}`}
                    </Text>
                  )}
                </div>
              </AtlantisCard.Header>
              <AtlantisCard.Body className="px-6 py-6 bg-[var(--color-surface)]">
                {jobImages.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                    {jobImages.map((image, index) => (
                      <button
                        key={index}
                        type="button"
                        className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)] focus:ring-offset-2 border-2 border-[var(--color-border)] hover:border-[var(--color-interactive)]"
                        onClick={() => handleImageClick(index)}
                        aria-label={image.alt || image.title || `View image ${index + 1} of ${jobImages.length}`}
                      >
                        <img
                          src={image.url}
                          alt={image.alt || image.title || `Job photo ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <Placeholder size="base" aspectRatio="16/9">
                    <div className="flex flex-col items-center justify-center py-12">
                      <Icon name="eye" size="large" color="greyBlue" className="mb-3" />
                      <Text variation="subdued" size="base">No photos attached</Text>
                    </div>
                  </Placeholder>
                )}
              </AtlantisCard.Body>
            </AtlantisCard>
          </Tab>
        </Tabs>
      </div>

      {/* LightBox for full-screen image viewing */}
      <LightBox
        open={lightboxOpen}
        images={jobImages}
        imageIndex={lightboxIndex}
        onRequestClose={({ lastPosition }) => {
          setLightboxOpen(false);
          setLightboxIndex(lastPosition);
        }}
      />
    </Page>
  );
};

const ClientName = () => {
  const record = useRecordContext();
  if (!record) return null;
  return (
    <Text size="base" element="span" className="font-medium hover:text-[var(--color-interactive)] transition-colors">
      {record.name}
    </Text>
  );
};

const TeamMemberName = () => {
  const record = useRecordContext();
  if (!record) return null;
  return <Text size="base" element="span">{record.name}</Text>;
};
