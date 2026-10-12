import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Geolocation from 'react-native-geolocation-service';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
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
  shadows,
  size,
  spacing,
  typography,
} from '../theme';
import { StatusPill } from '../components';
import { useJobDetails, useUpdateJobStatus, useAddJobNote, useUploadJobPhoto, useCreateInvoice, useParts, useJobPartTotals, useAddJobPart, useUpdateJobPart, useRemoveJobPart } from '../hooks';
import { useAuth } from '../auth/useAuth';
import type { Invoice, JobDetails, JobStatus, Part } from '../api/types';
import { canTransitionTo, getStatusActions, type StatusAction } from '../utils/jobTransitions';
import { checkGeofence, GEOFENCE_RADIUS_M } from '../utils/geofence';

// ── Navigation types ─────────────────────────────────────────────────────────

export type JobDetailParamList = {
  JobDetail: { jobId: string };
};

type Props = NativeStackScreenProps<JobDetailParamList, 'JobDetail'>;

// ── Priority badge ───────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  LOW: { bg: '#E8F5E9', text: '#2E7D32' },
  MEDIUM: { bg: '#FFF8E1', text: '#F57F17' },
  HIGH: { bg: '#FFF3E0', text: '#D84315' },
  URGENT: { bg: '#FFEBEE', text: '#C62828' },
};

// ── Time formatting ──────────────────────────────────────────────────────────

function formatTime(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ── Component ────────────────────────────────────────────────────────────────

export const JobDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { jobId } = route.params;
  const insets = useSafeAreaInsets();
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [pendingPhotos, setPendingPhotos] = useState<
    { uri: string; fileName: string }[]
  >([]);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [partsPickerVisible, setPartsPickerVisible] = useState(false);
  const [partsSearch, setPartsSearch] = useState('');
  const [quantityPrompt, setQuantityPrompt] = useState<{ part: Part; qty: string } | null>(null);
  const [completionChecklistVisible, setCompletionChecklistVisible] = useState(false);
  const [completionLoading, setCompletionLoading] = useState(false);
  const [completionSuccess, setCompletionSuccess] = useState<{
    invoice: Invoice | null;
    invoiceWarning: string | null;
  } | null>(null);

  const auth = useAuth();

  const {
    data: job,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useJobDetails(jobId);

  const { data: partTotals } = useJobPartTotals(jobId);
  const { data: inventoryParts, isLoading: partsLoading } = useParts(
    partsPickerVisible ? partsSearch || undefined : undefined,
  );

  const statusMutation = useUpdateJobStatus();
  const createInvoiceMutation = useCreateInvoice();
  const addNoteMutation = useAddJobNote();
  const uploadPhotoMutation = useUploadJobPhoto();
  const addPartMutation = useAddJobPart();
  const updatePartMutation = useUpdateJobPart();
  const removePartMutation = useRemoveJobPart();

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // ── Photo picker + upload ──────────────────────────────────────────

  const IMAGE_PICKER_OPTIONS = {
    mediaType: 'photo' as const,
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.8,
  };

  const handlePickPhoto = useCallback(() => {
    Alert.alert('Add Photo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: async () => {
          const result = await launchCamera(IMAGE_PICKER_OPTIONS);
          if (!result.didCancel && result.assets?.[0]) {
            processPhoto(result.assets[0]);
          }
        },
      },
      {
        text: 'Photo Library',
        onPress: async () => {
          const result = await launchImageLibrary(IMAGE_PICKER_OPTIONS);
          if (!result.didCancel && result.assets?.[0]) {
            processPhoto(result.assets[0]);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [jobId, uploadPhotoMutation]);

  const processPhoto = useCallback(
    (asset: { uri?: string; fileName?: string; type?: string }) => {
      if (!asset.uri) return;

      const file = {
        uri: asset.uri,
        fileName: asset.fileName ?? `photo_${Date.now()}.jpg`,
        type: asset.type ?? 'image/jpeg',
      };

      setUploadProgress(0);
      uploadPhotoMutation.mutate(
        {
          jobId,
          file,
          onProgress: (percent) => setUploadProgress(percent),
        },
        {
          onSuccess: () => {
            setUploadProgress(null);
          },
          onError: (err) => {
            setUploadProgress(null);
            // If backend endpoint doesn't exist yet, queue locally
            if (
              err.message?.includes('404') ||
              err.message?.includes('Network') ||
              (err as { response?: { status?: number } }).response?.status === 404
            ) {
              setPendingPhotos((prev) => [
                ...prev,
                { uri: file.uri, fileName: file.fileName },
              ]);
              Alert.alert(
                'Upload Pending',
                'Photo saved locally. It will be uploaded when the server is available.',
              );
            } else {
              Alert.alert('Upload Failed', err.message || 'Could not upload photo.');
            }
          },
        },
      );
    },
    [jobId, uploadPhotoMutation],
  );

  // ── Geofence check + status transition ────────────────────────────────

  const performTransition = useCallback(
    (targetStatus: JobStatus) => {
      if (job && !canTransitionTo(job.status, targetStatus)) {
        Alert.alert('Invalid Transition', `Cannot change status from ${job.status} to ${targetStatus}.`);
        return;
      }
      setTransitionLoading(true);
      statusMutation.mutate(
        { id: jobId, req: { status: targetStatus } },
        {
          onSuccess: () => {
            setTransitionLoading(false);
          },
          onError: (err) => {
            setTransitionLoading(false);
            Alert.alert('Error', err.message || 'Failed to update job status.');
          },
        },
      );
    },
    [jobId, statusMutation],
  );

  const handleAction = useCallback(
    (action: StatusAction, jobData: JobDetails) => {
      if (transitionLoading) return;

      // Cancel needs confirmation dialog
      if (action.targetStatus === 'CANCELLED') {
        Alert.alert(
          'Cancel Job',
          'Are you sure you want to cancel this job? This action cannot be undone.',
          [
            { text: 'Keep Job', style: 'cancel' },
            {
              text: 'Cancel Job',
              style: 'destructive',
              onPress: () => performTransition('CANCELLED'),
            },
          ],
        );
        return;
      }

      // Geofence check for Start Job (SCHEDULED/DISPATCHED → IN_PROGRESS)
      if (action.requiresGeofence) {
        const jobLat = jobData.property?.lat;
        const jobLng = jobData.property?.lng;

        // If job has no location, allow start without geofence check
        if (jobLat == null || jobLng == null) {
          performTransition(action.targetStatus);
          return;
        }

        setTransitionLoading(true);
        Geolocation.getCurrentPosition(
          (position) => {
            const result = checkGeofence(
              position.coords.latitude,
              position.coords.longitude,
              jobLat,
              jobLng,
            );
            if (result.withinRange) {
              performTransition(action.targetStatus);
            } else {
              setTransitionLoading(false);
              Alert.alert(
                'Too Far From Job Site',
                `You are ${result.distanceM}m from the job site. Move closer (within ${GEOFENCE_RADIUS_M}m) to start this job.`,
              );
            }
          },
          (error) => {
            setTransitionLoading(false);
            Alert.alert(
              'Location Error',
              `Could not get your location: ${error.message}. Please enable location services and try again.`,
            );
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
        );
        return;
      }

      // Complete Job — show checklist first
      if (action.targetStatus === 'COMPLETED') {
        setCompletionChecklistVisible(true);
        return;
      }

      // All other transitions — no geofence needed
      performTransition(action.targetStatus);
    },
    [transitionLoading, performTransition],
  );

  // ── Complete Job flow with auto-invoice ─────────────────────────────────

  const handleCompleteJob = useCallback(() => {
    setCompletionChecklistVisible(false);
    setCompletionLoading(true);

    statusMutation.mutate(
      { id: jobId, req: { status: 'COMPLETED' } },
      {
        onSuccess: () => {
          // Job completed — now auto-create invoice
          createInvoiceMutation.mutate(jobId, {
            onSuccess: (invoice) => {
              setCompletionLoading(false);
              setCompletionSuccess({ invoice, invoiceWarning: null });
            },
            onError: (err) => {
              // Invoice creation failed — non-blocking, job still completed
              setCompletionLoading(false);
              setCompletionSuccess({
                invoice: null,
                invoiceWarning: err.message || 'Could not create invoice automatically.',
              });
            },
          });
        },
        onError: (err) => {
          setCompletionLoading(false);
          Alert.alert('Error', err.message || 'Failed to complete job.');
        },
      },
    );
  }, [jobId, statusMutation, createInvoiceMutation]);

  const openPhone = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const openEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const openMaps = (address: string) => {
    const encoded = encodeURIComponent(address);
    const url = Platform.select({
      ios: `maps:0,0?q=${encoded}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
    });
    Linking.openURL(url);
  };

  const handleSaveNote = useCallback(() => {
    const trimmed = noteText.trim();
    if (!trimmed) return;

    addNoteMutation.mutate(
      {
        jobId,
        content: trimmed,
        authorName: auth.user?.fullName ?? 'You',
      },
      {
        onSuccess: () => {
          setNoteText('');
          setNoteModalVisible(false);
        },
        onError: () => {
          Alert.alert('Failed to save note', 'Please try again.', [
            { text: 'OK' },
            {
              text: 'Retry',
              onPress: () => handleSaveNote(),
            },
          ]);
        },
      },
    );
  }, [noteText, jobId, auth.user?.fullName, addNoteMutation]);

  // ── Parts handlers ──────────────────────────────────────────────────────

  const handleSelectPart = useCallback((part: Part) => {
    setQuantityPrompt({ part, qty: '1' });
  }, []);

  const handleConfirmAddPart = useCallback(() => {
    if (!quantityPrompt) return;
    const qty = parseInt(quantityPrompt.qty, 10);
    if (isNaN(qty) || qty < 1) {
      Alert.alert('Invalid Quantity', 'Please enter a number of 1 or more.');
      return;
    }
    addPartMutation.mutate(
      { jobId, req: { partId: quantityPrompt.part.id, quantity: qty } },
      {
        onSuccess: () => {
          setQuantityPrompt(null);
          setPartsPickerVisible(false);
          setPartsSearch('');
        },
        onError: (err) => {
          Alert.alert('Error', err.message || 'Failed to add part.');
        },
      },
    );
  }, [quantityPrompt, jobId, addPartMutation]);

  const handleAdjustQuantity = useCallback(
    (jobPartId: string, currentQty: number) => {
      Alert.prompt
        ? Alert.prompt(
            'Adjust Quantity',
            `Current: ${currentQty}`,
            (text) => {
              const qty = parseInt(text, 10);
              if (isNaN(qty) || qty < 1) return;
              updatePartMutation.mutate({ jobId, jobPartId, req: { quantity: qty } });
            },
            'plain-text',
            String(currentQty),
            'number-pad',
          )
        : // Android fallback — prompt not available
          Alert.alert('Adjust Quantity', `Current: ${currentQty}. Use the parts picker to update.`);
    },
    [jobId, updatePartMutation],
  );

  const handleRemovePart = useCallback(
    (jobPartId: string, partName: string) => {
      Alert.alert('Remove Part', `Remove "${partName}" from this job?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removePartMutation.mutate({ jobId, jobPartId }),
        },
      ]);
    },
    [jobId, removePartMutation],
  );

  // ── Loading skeleton ─────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>{'<'} Back</Text>
          </Pressable>
        </View>
        <View style={styles.skeletonContainer}>
          <View style={styles.skeletonPill} />
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonLine} />
          <View style={styles.skeletonLineShort} />
          <View style={styles.skeletonSection} />
          <View style={styles.skeletonLine} />
          <View style={styles.skeletonLine} />
          <View style={styles.skeletonSection} />
          <View style={styles.skeletonLine} />
        </View>
      </View>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────

  if (isError || !job) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>{'<'} Back</Text>
          </Pressable>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>&#x26A0;&#xFE0F;</Text>
          <Text style={styles.errorTitle}>Could not load job</Text>
          <Text style={styles.errorSubtitle}>
            Check your connection and try again.
          </Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Derived data ─────────────────────────────────────────────────────────

  const customerName = job.customer?.name ?? 'Unknown Customer';
  const customerPhone = job.customer?.phone;
  const customerEmail = job.customer?.email;

  const address = job.property
    ? `${job.property.street}, ${job.property.city}, ${job.property.state} ${job.property.zip}`
    : job.location?.address ?? null;

  const timeStr =
    job.scheduledStartTime && job.scheduledEndTime
      ? `${formatTime(job.scheduledStartTime)} - ${formatTime(job.scheduledEndTime)}`
      : 'Time not set';

  const dateStr = formatFullDate(job.scheduledDate);
  const durationStr = job.estimatedDuration
    ? `${job.estimatedDuration} min`
    : null;

  const actions = getStatusActions(job.status);
  const priorityColor = job.priority ? PRIORITY_COLORS[job.priority] : null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{'<'} Back</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Job Detail
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={brand.olive}
          />
        }
      >
        {/* Status + Priority row */}
        <View style={styles.statusRow}>
          <StatusPill status={job.status} />
          {priorityColor && (
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: priorityColor.bg },
              ]}
            >
              <Text style={[styles.priorityText, { color: priorityColor.text }]}>
                {job.priority}
              </Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.jobTitle}>{job.title}</Text>

        {job.description ? (
          <Text style={styles.description}>{job.description}</Text>
        ) : null}

        {/* ── Customer section ──────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <Text style={styles.customerName}>{customerName}</Text>

          {customerPhone && (
            <Pressable
              onPress={() => openPhone(customerPhone)}
              style={styles.contactRow}
            >
              <Text style={styles.contactIcon}>&#x260E;&#xFE0F;</Text>
              <Text style={styles.contactLink}>{customerPhone}</Text>
            </Pressable>
          )}

          {customerEmail && (
            <Pressable
              onPress={() => openEmail(customerEmail)}
              style={styles.contactRow}
            >
              <Text style={styles.contactIcon}>&#x2709;&#xFE0F;</Text>
              <Text style={styles.contactLink}>{customerEmail}</Text>
            </Pressable>
          )}

          {address && (
            <Pressable
              onPress={() => openMaps(address)}
              style={styles.contactRow}
            >
              <Text style={styles.contactIcon}>&#x1F4CD;</Text>
              <Text style={styles.contactLink}>{address}</Text>
            </Pressable>
          )}
        </View>

        {/* ── Schedule section ──────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>&#x1F4C5;</Text>
            <Text style={styles.infoText}>{dateStr}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>&#x1F552;</Text>
            <Text style={styles.infoText}>{timeStr}</Text>
          </View>
          {durationStr && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>&#x23F1;&#xFE0F;</Text>
              <Text style={styles.infoText}>Est. {durationStr}</Text>
            </View>
          )}
        </View>

        {/* ── Notes section ────────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              Notes{job.notes && job.notes.length > 0 ? ` (${job.notes.length})` : ''}
            </Text>
            <Pressable
              style={styles.addButton}
              onPress={() => setNoteModalVisible(true)}
            >
              <Text style={styles.addButtonText}>+ Add Note</Text>
            </Pressable>
          </View>
          {job.notes && job.notes.length > 0 ? (
            [...job.notes]
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )
              .map((note) => (
                <View key={note.id} style={styles.noteItem}>
                  <Text style={styles.noteContent}>{note.content}</Text>
                  <Text style={styles.noteMeta}>
                    {note.authorName} &middot;{' '}
                    {new Date(note.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              ))
          ) : (
            <Text style={styles.emptyText}>No notes yet</Text>
          )}
        </View>

        {/* ── Parts section ────────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              Parts{job.parts && job.parts.length > 0 ? ` (${job.parts.length})` : ''}
            </Text>
            <Pressable
              style={styles.addButton}
              onPress={() => setPartsPickerVisible(true)}
            >
              <Text style={styles.addButtonText}>+ Add Part</Text>
            </Pressable>
          </View>
          {job.parts && job.parts.length > 0 ? (
            <>
              {job.parts.map((part) => (
                <Pressable
                  key={part.id}
                  style={styles.partItem}
                  onPress={() => handleAdjustQuantity(part.id, part.quantity)}
                  onLongPress={() => handleRemovePart(part.id, part.partName)}
                >
                  <View style={styles.partInfo}>
                    <Text style={styles.partName}>{part.partName}</Text>
                    <Text style={styles.partQty}>
                      x{part.quantity} @ ${part.unitPrice.toFixed(2)}
                    </Text>
                  </View>
                  <Text style={styles.partPrice}>
                    ${part.lineTotal.toFixed(2)}
                  </Text>
                </Pressable>
              ))}
              {partTotals ? (
                <View style={styles.partTotalsBlock}>
                  <View style={styles.partTotalRow}>
                    <Text style={styles.partTotalLabel}>Cost</Text>
                    <Text style={styles.partTotalValue}>
                      ${partTotals.cost.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.partTotalRow}>
                    <Text style={styles.partTotalLabel}>Price</Text>
                    <Text style={styles.partTotalValue}>
                      ${partTotals.price.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.partTotalRow}>
                    <Text style={[styles.partTotalLabel, { fontWeight: fontWeight.bold }]}>
                      Profit
                    </Text>
                    <Text style={[styles.partTotalValue, { color: partTotals.profit >= 0 ? brand.olive : feedback.error }]}>
                      ${partTotals.profit.toFixed(2)}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.partTotalRow}>
                  <Text style={styles.partTotalLabel}>Total</Text>
                  <Text style={styles.partTotalValue}>
                    ${job.parts.reduce((sum, p) => sum + p.lineTotal, 0).toFixed(2)}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.emptyText}>No parts logged</Text>
          )}
        </View>

        {/* ── Photos section ───────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              Photos
              {(job.attachments?.length ?? 0) + pendingPhotos.length > 0
                ? ` (${(job.attachments?.length ?? 0) + pendingPhotos.length})`
                : ''}
            </Text>
            <Pressable
              style={styles.addButton}
              onPress={handlePickPhoto}
              disabled={uploadProgress !== null}
            >
              <Text style={styles.addButtonText}>+ Take Photo</Text>
            </Pressable>
          </View>

          {/* Upload progress bar */}
          {uploadProgress !== null && (
            <View style={styles.uploadProgressContainer}>
              <View style={styles.uploadProgressTrack}>
                <View
                  style={[
                    styles.uploadProgressFill,
                    { width: `${uploadProgress}%` },
                  ]}
                />
              </View>
              <Text style={styles.uploadProgressText}>
                Uploading... {uploadProgress}%
              </Text>
            </View>
          )}

          {(job.attachments?.length ?? 0) + pendingPhotos.length > 0 ? (
            <View style={styles.photoGrid}>
              {/* Server attachments */}
              {job.attachments?.map((att) => (
                <Pressable
                  key={att.id}
                  style={styles.photoThumb}
                  onPress={() => setViewerImage(att.url)}
                >
                  <Image
                    source={{ uri: att.url }}
                    style={styles.photoImage}
                    resizeMode="cover"
                  />
                </Pressable>
              ))}
              {/* Pending local photos */}
              {pendingPhotos.map((photo, idx) => (
                <View key={`pending-${idx}`} style={styles.photoThumb}>
                  <Image
                    source={{ uri: photo.uri }}
                    style={styles.photoImage}
                    resizeMode="cover"
                  />
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>Pending</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No photos yet</Text>
          )}
        </View>
      </ScrollView>

      {/* ── Status action buttons ──────────────────────────────────────── */}
      {actions.length > 0 && (
        <View
          style={[
            styles.actionBar,
            { paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.lg },
          ]}
        >
          {actions.map((action) => {
            const btnStyle =
              action.variant === 'primary'
                ? styles.actionBtnPrimary
                : action.variant === 'destructive'
                  ? styles.actionBtnDestructive
                  : styles.actionBtnSecondary;
            const textStyle =
              action.variant === 'primary'
                ? styles.actionBtnTextPrimary
                : action.variant === 'destructive'
                  ? styles.actionBtnTextDestructive
                  : styles.actionBtnTextSecondary;

            return (
              <Pressable
                key={action.label}
                style={[styles.actionBtn, btnStyle]}
                onPress={() => handleAction(action, job)}
                disabled={transitionLoading}
              >
                {transitionLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={
                      action.variant === 'primary'
                        ? textColors.onPrimary
                        : brand.olive
                    }
                  />
                ) : (
                  <Text style={[styles.actionBtnText, textStyle]}>
                    {action.label}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      {/* ── Add Note Modal ──────────────────────────────────────────────── */}
      <Modal
        visible={noteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setNoteModalVisible(false)}
          />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Note</Text>
              <Pressable onPress={() => setNoteModalVisible(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </Pressable>
            </View>
            <TextInput
              style={styles.noteInput}
              placeholder="Add a note about this job..."
              placeholderTextColor={textColors.muted}
              multiline
              autoFocus
              value={noteText}
              onChangeText={setNoteText}
              textAlignVertical="top"
            />
            <Pressable
              style={[
                styles.saveNoteBtn,
                (!noteText.trim() || addNoteMutation.isPending) && styles.saveNoteBtnDisabled,
              ]}
              onPress={handleSaveNote}
              disabled={!noteText.trim() || addNoteMutation.isPending}
            >
              {addNoteMutation.isPending ? (
                <ActivityIndicator size="small" color={textColors.onPrimary} />
              ) : (
                <Text style={styles.saveNoteBtnText}>Save Note</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Full-screen Image Viewer ───────────────────────────────────── */}
      <Modal
        visible={viewerImage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerImage(null)}
      >
        <View style={styles.imageViewerOverlay}>
          <Pressable
            style={styles.imageViewerClose}
            onPress={() => setViewerImage(null)}
          >
            <Text style={styles.imageViewerCloseText}>Close</Text>
          </Pressable>
          {viewerImage && (
            <Image
              source={{ uri: viewerImage }}
              style={styles.imageViewerImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* ── Parts Picker Modal ─────────────────────────────────────────── */}
      <Modal
        visible={partsPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setPartsPickerVisible(false);
          setPartsSearch('');
          setQuantityPrompt(null);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              setPartsPickerVisible(false);
              setPartsSearch('');
              setQuantityPrompt(null);
            }}
          />
          <View
            style={[
              styles.modalContent,
              styles.partsPickerContent,
              { paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.lg },
            ]}
          >
            {quantityPrompt ? (
              // ── Quantity prompt sub-view ──
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Set Quantity</Text>
                  <Pressable onPress={() => setQuantityPrompt(null)}>
                    <Text style={styles.modalCancel}>Back</Text>
                  </Pressable>
                </View>
                <Text style={styles.partPickerItemName}>
                  {quantityPrompt.part.name}
                </Text>
                <Text style={styles.partPickerItemPrice}>
                  ${quantityPrompt.part.unitPrice.toFixed(2)} each
                </Text>
                <TextInput
                  style={styles.quantityInput}
                  value={quantityPrompt.qty}
                  onChangeText={(t) =>
                    setQuantityPrompt((prev) => prev ? { ...prev, qty: t } : null)
                  }
                  keyboardType="number-pad"
                  autoFocus
                  selectTextOnFocus
                  placeholder="1"
                  placeholderTextColor={textColors.muted}
                />
                <Pressable
                  style={[
                    styles.saveNoteBtn,
                    addPartMutation.isPending && styles.saveNoteBtnDisabled,
                  ]}
                  onPress={handleConfirmAddPart}
                  disabled={addPartMutation.isPending}
                >
                  {addPartMutation.isPending ? (
                    <ActivityIndicator size="small" color={textColors.onPrimary} />
                  ) : (
                    <Text style={styles.saveNoteBtnText}>Add to Job</Text>
                  )}
                </Pressable>
              </>
            ) : (
              // ── Search + parts list sub-view ──
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add Part</Text>
                  <Pressable
                    onPress={() => {
                      setPartsPickerVisible(false);
                      setPartsSearch('');
                    }}
                  >
                    <Text style={styles.modalCancel}>Cancel</Text>
                  </Pressable>
                </View>
                <TextInput
                  style={styles.partsSearchInput}
                  placeholder="Search parts..."
                  placeholderTextColor={textColors.muted}
                  value={partsSearch}
                  onChangeText={setPartsSearch}
                  autoFocus
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {partsLoading ? (
                  <View style={styles.partsLoadingContainer}>
                    <ActivityIndicator size="small" color={brand.olive} />
                  </View>
                ) : inventoryParts && inventoryParts.length > 0 ? (
                  <ScrollView
                    style={styles.partsListScroll}
                    keyboardShouldPersistTaps="handled"
                  >
                    {inventoryParts.map((part) => (
                      <Pressable
                        key={part.id}
                        style={styles.partPickerItem}
                        onPress={() => handleSelectPart(part)}
                      >
                        <View style={styles.partPickerItemInfo}>
                          <Text style={styles.partPickerItemName}>
                            {part.name}
                          </Text>
                          {part.sku ? (
                            <Text style={styles.partPickerItemSku}>
                              SKU: {part.sku}
                            </Text>
                          ) : null}
                        </View>
                        <Text style={styles.partPickerItemPrice}>
                          ${part.unitPrice.toFixed(2)}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.partsEmptyText}>
                    {partsSearch ? 'No parts found' : 'No parts available'}
                  </Text>
                )}
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* ── Completion Checklist Modal ──────────────────────────────── */}
      <Modal
        visible={completionChecklistVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCompletionChecklistVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setCompletionChecklistVisible(false)}
          />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complete Job</Text>
              <Pressable onPress={() => setCompletionChecklistVisible(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </Pressable>
            </View>

            <Text style={styles.checklistSubtitle}>
              Review before completing this job:
            </Text>

            {/* Checklist items */}
            <View style={styles.checklistItem}>
              <Text style={styles.checklistIcon}>
                {job && job.notes && job.notes.length > 0 ? '\u2705' : '\u26A0\uFE0F'}
              </Text>
              <Text style={styles.checklistText}>
                Notes added{job && job.notes && job.notes.length > 0 ? ` (${job.notes.length})` : ' — none yet'}
              </Text>
            </View>
            <View style={styles.checklistItem}>
              <Text style={styles.checklistIcon}>
                {job && ((job.attachments?.length ?? 0) + pendingPhotos.length > 0) ? '\u2705' : '\u26A0\uFE0F'}
              </Text>
              <Text style={styles.checklistText}>
                Photos taken{job && ((job.attachments?.length ?? 0) + pendingPhotos.length > 0)
                  ? ` (${(job.attachments?.length ?? 0) + pendingPhotos.length})`
                  : ' — none yet'}
              </Text>
            </View>
            <View style={styles.checklistItem}>
              <Text style={styles.checklistIcon}>
                {job && job.parts && job.parts.length > 0 ? '\u2705' : '\u26A0\uFE0F'}
              </Text>
              <Text style={styles.checklistText}>
                Parts logged{job && job.parts && job.parts.length > 0 ? ` (${job.parts.length})` : ' — none yet'}
              </Text>
            </View>

            <Text style={styles.checklistNote}>
              An invoice will be automatically created after completion.
            </Text>

            <Pressable
              style={styles.saveNoteBtn}
              onPress={handleCompleteJob}
            >
              <Text style={styles.saveNoteBtnText}>Confirm &amp; Complete</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Completion Loading Overlay ────────────────────────────────── */}
      <Modal
        visible={completionLoading}
        transparent
        animationType="fade"
      >
        <View style={styles.completionOverlay}>
          <ActivityIndicator size="large" color={brand.olive} />
          <Text style={styles.completionOverlayText}>Completing job...</Text>
        </View>
      </Modal>

      {/* ── Completion Success Modal ─────────────────────────────────── */}
      <Modal
        visible={completionSuccess !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setCompletionSuccess(null)}
      >
        <View style={styles.completionOverlay}>
          <View style={styles.successCard}>
            <Text style={styles.successIcon}>{'\u2705'}</Text>
            <Text style={styles.successTitle}>Job Completed!</Text>

            {completionSuccess?.invoice ? (
              <Text style={styles.successMessage}>
                Invoice #{completionSuccess.invoice.invoiceNumber} created for $
                {completionSuccess.invoice.total.toFixed(2)}
              </Text>
            ) : completionSuccess?.invoiceWarning ? (
              <Text style={styles.successWarning}>
                {completionSuccess.invoiceWarning}
              </Text>
            ) : null}

            <View style={styles.successActions}>
              {completionSuccess?.invoice && (
                <Pressable
                  style={styles.successBtnPrimary}
                  onPress={() => {
                    setCompletionSuccess(null);
                    // Navigate to Invoices tab
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Tabs' as never }],
                    });
                  }}
                >
                  <Text style={styles.successBtnPrimaryText}>View Invoice</Text>
                </Pressable>
              )}
              <Pressable
                style={completionSuccess?.invoice ? styles.successBtnSecondary : styles.successBtnPrimary}
                onPress={() => {
                  setCompletionSuccess(null);
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Tabs' as never }],
                  });
                }}
              >
                <Text
                  style={completionSuccess?.invoice ? styles.successBtnSecondaryText : styles.successBtnPrimaryText}
                >
                  Back to Schedule
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: background.screen,
  },

  // Header
  header: {
    height: size.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  backBtn: {
    minHeight: size.minTapTarget,
    justifyContent: 'center',
    paddingRight: spacing.md,
  },
  backText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: brand.olive,
  },
  headerTitle: {
    ...typography.cardTitle,
    color: textColors.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60, // Balance the back button
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },

  // Status row
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  priorityBadge: {
    paddingHorizontal: size.pillPaddingH,
    paddingVertical: size.pillPaddingV,
    borderRadius: size.pillRadius,
  },
  priorityText: {
    ...typography.pillLabel,
  },

  // Title + description
  jobTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: textColors.primary,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body,
    color: textColors.onTip,
    marginBottom: spacing.lg,
  },

  // Card sections
  card: {
    backgroundColor: background.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  sectionTitle: {
    ...typography.cardTitleSm,
    color: textColors.primary,
    marginBottom: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  // Customer section
  customerName: {
    ...typography.body,
    color: textColors.primary,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  contactIcon: {
    fontSize: fontSize.md,
    marginRight: spacing.sm,
  },
  contactLink: {
    ...typography.body,
    color: brand.olive,
    flex: 1,
  },

  // Info rows (schedule)
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xxs,
  },
  infoIcon: {
    fontSize: fontSize.md,
    marginRight: spacing.sm,
  },
  infoText: {
    ...typography.body,
    color: textColors.primary,
  },

  // Add buttons
  addButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  addButtonText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    color: brand.olive,
  },

  // Notes
  noteItem: {
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: border.light,
  },
  noteContent: {
    ...typography.body,
    color: textColors.primary,
  },
  noteMeta: {
    ...typography.caption,
    color: textColors.secondary,
    marginTop: spacing.xxs,
  },

  // Parts
  partItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: border.light,
  },
  partInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  partName: {
    ...typography.body,
    color: textColors.primary,
    flex: 1,
  },
  partQty: {
    ...typography.caption,
    color: textColors.secondary,
    marginLeft: spacing.sm,
  },
  partPrice: {
    ...typography.bodyMedium,
    color: textColors.primary,
    marginLeft: spacing.lg,
  },
  partTotalsBlock: {
    borderTopWidth: 1,
    borderTopColor: border.divider,
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
  },
  partTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.xxs,
  },
  partTotalLabel: {
    ...typography.bodyMedium,
    color: textColors.primary,
  },
  partTotalValue: {
    ...typography.bodyMedium,
    color: textColors.primary,
    fontWeight: fontWeight.bold,
  },

  // Photos
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoThumb: {
    width: 72,
    height: 72,
    borderRadius: radius.sm,
    backgroundColor: background.chipInactive,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImage: {
    width: 72,
    height: 72,
    borderRadius: radius.sm,
  },
  pendingBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  pendingBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: fontWeight.semibold,
  },
  uploadProgressContainer: {
    marginBottom: spacing.sm,
  },
  uploadProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: border.light,
    overflow: 'hidden',
    marginBottom: spacing.xxs,
  },
  uploadProgressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: brand.olive,
  },
  uploadProgressText: {
    ...typography.caption,
    color: textColors.secondary,
  },

  // Image viewer
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 60,
    right: spacing.lg,
    zIndex: 10,
    padding: spacing.sm,
  },
  imageViewerCloseText: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  imageViewerImage: {
    width: '100%',
    height: '80%',
  },

  // Empty text
  emptyText: {
    ...typography.body,
    color: textColors.muted,
  },

  // Action bar
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: background.card,
    borderTopWidth: 1,
    borderTopColor: border.light,
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: size.minTapTarget,
    justifyContent: 'center',
  },
  actionBtnPrimary: {
    backgroundColor: brand.olive,
  },
  actionBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: brand.olive,
  },
  actionBtnDestructive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#C62828',
  },
  actionBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  actionBtnTextPrimary: {
    color: textColors.onPrimary,
  },
  actionBtnTextSecondary: {
    color: brand.olive,
  },
  actionBtnTextDestructive: {
    color: '#C62828',
  },

  // Skeleton
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  skeletonPill: {
    width: 80,
    height: 28,
    borderRadius: size.pillRadius,
    backgroundColor: skeletonColors.base,
    marginBottom: spacing.md,
  },
  skeletonTitle: {
    width: '75%',
    height: 24,
    borderRadius: radius.xs,
    backgroundColor: skeletonColors.base,
    marginBottom: spacing.lg,
  },
  skeletonLine: {
    width: '60%',
    height: 16,
    borderRadius: radius.xs,
    backgroundColor: skeletonColors.shimmer,
    marginBottom: spacing.md,
  },
  skeletonLineShort: {
    width: '40%',
    height: 16,
    borderRadius: radius.xs,
    backgroundColor: skeletonColors.shimmer,
    marginBottom: spacing.md,
  },
  skeletonSection: {
    width: '30%',
    height: 18,
    borderRadius: radius.xs,
    backgroundColor: skeletonColors.base,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },

  // Note modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: background.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.cardTitle,
    color: textColors.primary,
  },
  modalCancel: {
    fontSize: fontSize.md,
    color: textColors.secondary,
  },
  noteInput: {
    ...typography.body,
    color: textColors.primary,
    backgroundColor: background.input,
    borderRadius: radius.sm,
    padding: spacing.md,
    minHeight: 120,
    maxHeight: 200,
    marginBottom: spacing.md,
  },
  saveNoteBtn: {
    backgroundColor: brand.olive,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: size.minTapTarget,
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  saveNoteBtnDisabled: {
    opacity: 0.5,
  },
  saveNoteBtnText: {
    ...typography.bodyMedium,
    color: textColors.onPrimary,
    fontWeight: fontWeight.semibold,
  },

  // Error
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

  // Parts picker modal
  partsPickerContent: {
    maxHeight: '70%',
  },
  partsSearchInput: {
    ...typography.body,
    color: textColors.primary,
    backgroundColor: background.input,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  partsLoadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  partsListScroll: {
    maxHeight: 300,
  },
  partPickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: border.light,
  },
  partPickerItemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  partPickerItemName: {
    ...typography.bodyMedium,
    color: textColors.primary,
  },
  partPickerItemSku: {
    ...typography.caption,
    color: textColors.secondary,
    marginTop: spacing.xxs,
  },
  partPickerItemPrice: {
    ...typography.bodyMedium,
    color: textColors.secondary,
  },
  partsEmptyText: {
    ...typography.body,
    color: textColors.muted,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
  quantityInput: {
    ...typography.body,
    color: textColors.primary,
    backgroundColor: background.input,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginVertical: spacing.md,
    textAlign: 'center',
    fontSize: fontSize.xl,
  },

  // Completion checklist
  checklistSubtitle: {
    ...typography.body,
    color: textColors.secondary,
    marginBottom: spacing.lg,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  checklistIcon: {
    fontSize: fontSize.lg,
    marginRight: spacing.md,
  },
  checklistText: {
    ...typography.body,
    color: textColors.primary,
    flex: 1,
  },
  checklistNote: {
    ...typography.caption,
    color: textColors.muted,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },

  // Completion overlay & success
  completionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  completionOverlayText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    marginTop: spacing.lg,
  },
  successCard: {
    backgroundColor: background.card,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    ...shadows.card,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  successTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: textColors.primary,
    marginBottom: spacing.sm,
  },
  successMessage: {
    ...typography.body,
    color: textColors.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  successWarning: {
    ...typography.body,
    color: feedback.offlineText,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  successActions: {
    width: '100%',
    gap: spacing.sm,
  },
  successBtnPrimary: {
    backgroundColor: brand.olive,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: size.minTapTarget,
    justifyContent: 'center',
  },
  successBtnPrimaryText: {
    ...typography.bodyMedium,
    color: textColors.onPrimary,
    fontWeight: fontWeight.semibold,
  },
  successBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: brand.olive,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: size.minTapTarget,
    justifyContent: 'center',
  },
  successBtnSecondaryText: {
    ...typography.bodyMedium,
    color: brand.olive,
    fontWeight: fontWeight.semibold,
  },
});
