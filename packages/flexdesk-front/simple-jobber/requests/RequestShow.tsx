import { useRecordContext } from 'ra-core';
import { Show, RecordField, ReferenceField } from '@/components/admin';
import {
  Button as AtlantisButton,
  Card as AtlantisCard,
  DescriptionList,
  StatusLabel,
  Heading,
  Text,
  Icon,
  FormatDate,
  FormatDateTime,
  FormatCurrency,
} from '../components/atlantis';
import { differenceInDays } from 'date-fns';
import { Link } from 'react-router';
import { requestStatusToSemantic, formatStatusLabel, type Request } from '../types';
import { Highlights, type HighlightItem } from '../components';

export const RequestShow = () => {
  return (
    <Show>
      <RequestShowContent />
    </Show>
  );
};

const RequestShowContent = () => {
  const record = useRecordContext<Request>();
  if (!record) return null;

  // Calculate highlights data
  const daysSinceCreated = differenceInDays(new Date(), new Date(record.createdAt));

  const highlights: HighlightItem[] = [
    {
      label: 'Estimated Value',
      value: record.estimatedValue
        ? <FormatCurrency value={record.estimatedValue} minimumFractionDigits={0} maximumFractionDigits={0} />
        : 'Not estimated',
      icon: <Icon name="money" size="small" />,
      className: record.estimatedValue
        ? 'text-[--color-success--text]'
        : 'text-[--color-text--secondary]',
    },
    {
      label: 'Preferred Date',
      value: record.preferredDate
        ? <FormatDate date={record.preferredDate} showYear useRelative />
        : 'No preference',
      icon: <Icon name="calendar" size="small" />,
      className: record.preferredDate ? undefined : 'text-[--color-text--secondary]',
    },
    {
      label: 'Days Open',
      value: daysSinceCreated.toString(),
      icon: <Icon name="timer" size="small" />,
      className: daysSinceCreated > 7 ? 'text-[--color-warning--text]' : undefined,
    },
    {
      label: 'Status',
      value: record.status,
      icon: <Icon name="inbox" size="small" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <AtlantisCard>
        <AtlantisCard.Header className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[--color-interactive--subtle] flex items-center justify-center">
                <Icon name="inbox" size="large" color="interactive" />
              </div>
              <div>
                <Heading level={3}>{record.title}</Heading>
                <div className="flex items-center gap-2 mt-1">
                  <ReferenceField source="clientId" reference="clients" link="show">
                    <ClientName />
                  </ReferenceField>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusLabel
                label={formatStatusLabel(record.status)}
                status={requestStatusToSemantic[record.status]}
              />
              <Link to={`/requests/${record.id}`}>
                <AtlantisButton type="secondary" variation="subtle" size="small" icon="edit">
                  Edit
                </AtlantisButton>
              </Link>
            </div>
          </div>
        </AtlantisCard.Header>
      </AtlantisCard>

      {/* Highlights Section */}
      <Highlights items={highlights} />

      {/* Action Card - Convert to Job */}
      {record.status !== 'CONVERTED' && record.status !== 'CLOSED' && (
        <AtlantisCard accent="blue" className="border-[--color-interactive]/50 bg-[--color-interactive--subtle]">
          <AtlantisCard.Body>
            <div className="flex items-center justify-between">
              <div>
                <Heading level={4}>Ready to convert this request?</Heading>
                <Text variation="subdued" size="small">
                  Create a job from this request to schedule and assign work.
                </Text>
              </div>
              <Link to={`/jobs/create?clientId=${record.clientId}&requestId=${record.id}`}>
                <AtlantisButton type="primary" variation="work" icon="longArrowRight">
                  Convert to Job
                </AtlantisButton>
              </Link>
            </div>
          </AtlantisCard.Body>
        </AtlantisCard>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Request Details */}
        <AtlantisCard>
          <AtlantisCard.Header className="p-4 pb-2">
            <div className="flex items-center gap-2">
              <Icon name="file" size="small" />
              <Heading level={4}>Request Details</Heading>
            </div>
          </AtlantisCard.Header>
          <AtlantisCard.Body>
            <DescriptionList
              data={[
                { label: 'Source', value: record.source || '—' },
                { label: 'Submitted', value: <FormatDateTime date={record.createdAt} showYear /> },
              ]}
            />
          </AtlantisCard.Body>
        </AtlantisCard>

        {/* Scheduling */}
        <AtlantisCard>
          <AtlantisCard.Header className="p-4 pb-2">
            <div className="flex items-center gap-2">
              <Icon name="calendar" size="small" />
              <Heading level={4}>Scheduling</Heading>
            </div>
          </AtlantisCard.Header>
          <AtlantisCard.Body>
            <DescriptionList
              data={[
                {
                  label: 'Preferred Date',
                  value: record.preferredDate
                    ? <FormatDate date={record.preferredDate} showYear useRelative />
                    : 'No preference',
                },
              ]}
            />
          </AtlantisCard.Body>
        </AtlantisCard>

        {/* Estimate */}
        <AtlantisCard>
          <AtlantisCard.Header className="p-4 pb-2">
            <div className="flex items-center gap-2">
              <Icon name="money" size="small" />
              <Heading level={4}>Estimate</Heading>
            </div>
          </AtlantisCard.Header>
          <AtlantisCard.Body>
            <DescriptionList
              data={[
                {
                  label: 'Estimated Value',
                  value: record.estimatedValue
                    ? <FormatCurrency value={record.estimatedValue} minimumFractionDigits={0} maximumFractionDigits={0} />
                    : 'Not estimated',
                },
              ]}
            />
          </AtlantisCard.Body>
        </AtlantisCard>

        {/* Client Info */}
        <AtlantisCard>
          <AtlantisCard.Header className="p-4 pb-2">
            <div className="flex items-center gap-2">
              <Icon name="person" size="small" />
              <Heading level={4}>Client</Heading>
            </div>
          </AtlantisCard.Header>
          <AtlantisCard.Body>
            <ReferenceField source="clientId" reference="clients" link="show">
              <ClientDetails />
            </ReferenceField>
          </AtlantisCard.Body>
        </AtlantisCard>

        {/* Description */}
        {record.description && (
          <AtlantisCard className="md:col-span-2">
            <AtlantisCard.Header className="p-4 pb-2">
              <Heading level={4}>Description</Heading>
            </AtlantisCard.Header>
            <AtlantisCard.Body>
              <Text size="small" className="whitespace-pre-wrap">{record.description}</Text>
            </AtlantisCard.Body>
          </AtlantisCard>
        )}
      </div>
    </div>
  );
};

const ClientName = () => {
  const record = useRecordContext();
  if (!record) return null;
  return <Text element="span" variation="subdued" size="small">{record.name}</Text>;
};

const ClientDetails = () => {
  const record = useRecordContext();
  if (!record) return null;

  return (
    <div className="space-y-1">
      <Text className="font-medium">{record.name}</Text>
      {record.email && <Text variation="subdued" size="small">{record.email}</Text>}
      {record.phone && <Text variation="subdued" size="small">{record.phone}</Text>}
    </div>
  );
};
