import { useState } from 'react';
import { useRecordContext, useGetOne } from 'ra-core';
import { Show, ReferenceField } from '@/components/admin';
import {
  jobStatusToSemantic,
  jobPriorityToSemantic,
  formatStatusLabel,
  type Job,
} from '../types';
import { Highlights, type HighlightItem } from '../components';
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
} from '../components/atlantis';
import type { PresentedImage } from '../components/atlantis';

export const JobShow = () => {
  return (
    <Show>
      <JobShowContent />
    </Show>
  );
};

const JobShowContent = () => {
  const record = useRecordContext<Job>();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Fetch related data for highlights
  const { data: client } = useGetOne('clients', { id: record?.clientId || '' }, { enabled: !!record?.clientId });
  const { data: assignedTo } = useGetOne('teamMembers', { id: record?.assignedToId || '' }, { enabled: !!record?.assignedToId });

  if (!record) return null;

  // Build images list from record (images may be URLs or objects)
  const jobImages: PresentedImage[] = (
    (record as Record<string, unknown>).images as Array<string | { url: string; title?: string; caption?: string; alt?: string }> || []
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
      icon: <Icon name="person" size="small" />,
      className: client?.name ? undefined : 'text-[--color-text--secondary]',
    },
    {
      label: 'Scheduled',
      value: record.scheduledStartAt ? (
        <FormatDateTime date={record.scheduledStartAt} showYear={false} />
      ) : (
        'Not scheduled'
      ),
      icon: <Icon name="calendar" size="small" />,
      className: record.scheduledStartAt ? undefined : 'text-[--color-text--secondary]',
    },
    {
      label: 'Assigned To',
      value: assignedTo?.name || 'Unassigned',
      icon: <Icon name="person" size="small" />,
      className: assignedTo?.name ? undefined : 'text-[--color-text--secondary]',
    },
    {
      label: 'Duration',
      value: record.estimatedDuration
        ? `${Math.floor(record.estimatedDuration / 60)}h ${record.estimatedDuration % 60}m`
        : 'Not estimated',
      icon: <Icon name="timer" size="small" />,
      className: record.estimatedDuration ? undefined : 'text-[--color-text--secondary]',
    },
  ];

  // Page title component with job info
  const pageTitle = (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-[--color-interactive--subtle] flex items-center justify-center">
        <Icon name="work" size="large" color="interactive" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <Heading level={1}>{record.title}</Heading>
          <StatusLabel
            label={formatStatusLabel(record.priority)}
            status={jobPriorityToSemantic[record.priority]}
          />
          <StatusLabel
            label={formatStatusLabel(record.status)}
            status={jobStatusToSemantic[record.status]}
          />
        </div>
        <div className="flex items-center gap-2 mt-1">
          <ReferenceField source="clientId" reference="clients" link="show">
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
        url: `/jobs/${record.id}`,
      }}
    >

      {/* Highlights Section */}
      <Highlights items={highlights} />

      {/* Tabbed Content */}
      <div className="mt-6">
        <Tabs defaultTab={0}>
          <Tab label="Overview">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Schedule Information (Timeline) */}
              <AtlantisCard>
                <AtlantisCard.Header className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="calendar" size="base" />
                      <Heading level={4}>Schedule</Heading>
                    </div>
                    <StatusIndicator
                      label={formatStatusLabel(record.status)}
                      status={jobStatusToSemantic[record.status]}
                    />
                  </div>
                </AtlantisCard.Header>
                <AtlantisCard.Body>
                  <DescriptionList
                    data={[
                      {
                        label: 'Scheduled Start',
                        value: record.scheduledStartAt ? (
                          <FormatDateTime date={record.scheduledStartAt} showYear />
                        ) : (
                          'Not scheduled'
                        ),
                      },
                      {
                        label: 'Scheduled End',
                        value: record.scheduledEndAt ? (
                          <FormatDateTime date={record.scheduledEndAt} showYear />
                        ) : (
                          'Not scheduled'
                        ),
                      },
                      {
                        label: 'Estimated Duration',
                        value: record.estimatedDuration
                          ? `${Math.floor(record.estimatedDuration / 60)}h ${record.estimatedDuration % 60}m`
                          : 'Not estimated',
                      },
                    ]}
                  />
                </AtlantisCard.Body>
              </AtlantisCard>

              {/* Assignment */}
              <AtlantisCard>
                <AtlantisCard.Header className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="person" size="base" />
                      <Heading level={4}>Assignment</Heading>
                    </div>
                    <StatusIndicator
                      label={formatStatusLabel(record.priority)}
                      status={jobPriorityToSemantic[record.priority]}
                    />
                  </div>
                </AtlantisCard.Header>
                <AtlantisCard.Body>
                  <DescriptionList
                    data={[
                      {
                        label: 'Assigned To',
                        value: record.assignedToId ? (
                          <ReferenceField source="assignedToId" reference="teamMembers" link={false}>
                            <TeamMemberName />
                          </ReferenceField>
                        ) : (
                          'Unassigned'
                        ),
                      },
                      ...(record.actualStartAt
                        ? [
                            {
                              label: 'Actual Start',
                              value: <FormatDateTime date={record.actualStartAt} showYear />,
                            },
                          ]
                        : []),
                      ...(record.actualEndAt
                        ? [
                            {
                              label: 'Actual End',
                              value: <FormatDateTime date={record.actualEndAt} showYear />,
                            },
                          ]
                        : []),
                    ]}
                  />
                </AtlantisCard.Body>
              </AtlantisCard>
            </div>
          </Tab>

          <Tab label="Details">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Location */}
              <AtlantisCard>
                <AtlantisCard.Header className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Icon name="address" size="base" />
                    <Heading level={4}>Location</Heading>
                  </div>
                </AtlantisCard.Header>
                <AtlantisCard.Body>
                  {record.address ? (
                    <div className="space-y-1">
                      <Text size="base">{record.address.street}</Text>
                      <Text size="base">
                        {record.address.city}, {record.address.state} {record.address.zipCode}
                      </Text>
                    </div>
                  ) : (
                    <Text variation="subdued" size="base">No address specified</Text>
                  )}
                </AtlantisCard.Body>
              </AtlantisCard>

              {/* Description & Notes */}
              <AtlantisCard>
                <AtlantisCard.Header className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Icon name="note" size="base" />
                    <Heading level={4}>Notes</Heading>
                  </div>
                </AtlantisCard.Header>
                <AtlantisCard.Body className="space-y-4">
                  {record.description && (
                    <div>
                      <Text variation="subdued" size="small" className="mb-1">Description</Text>
                      <Text size="base">{record.description}</Text>
                    </div>
                  )}
                  {record.notes && (
                    <div>
                      <Text variation="subdued" size="small" className="mb-1">Internal Notes</Text>
                      <Text size="base">{record.notes}</Text>
                    </div>
                  )}
                  {!record.description && !record.notes && (
                    <Text variation="subdued" size="base">No details</Text>
                  )}
                </AtlantisCard.Body>
              </AtlantisCard>
            </div>
          </Tab>

          <Tab label="Photos">
            <AtlantisCard>
              <AtlantisCard.Header className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Icon name="eye" size="base" />
                  <Heading level={4}>Photos</Heading>
                  {jobImages.length > 0 && (
                    <Text variation="subdued" size="small">
                      {`${jobImages.length} image${jobImages.length !== 1 ? 's' : ''}`}
                    </Text>
                  )}
                </div>
              </AtlantisCard.Header>
              <AtlantisCard.Body>
                {jobImages.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {jobImages.map((image, index) => (
                      <button
                        key={index}
                        type="button"
                        className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-[--color-interactive]"
                        onClick={() => handleImageClick(index)}
                        aria-label={image.alt || image.title || `View image ${index + 1}`}
                      >
                        <img
                          src={image.url}
                          alt={image.alt || image.title || ''}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <Placeholder size="base" aspectRatio="16/9">
                    <Text variation="subdued" size="small">No photos attached</Text>
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
  return <Text variation="subdued" size="base" element="span">{record.name}</Text>;
};

const TeamMemberName = () => {
  const record = useRecordContext();
  if (!record) return null;
  return <Text size="base" element="span" className="font-medium">{record.name}</Text>;
};
