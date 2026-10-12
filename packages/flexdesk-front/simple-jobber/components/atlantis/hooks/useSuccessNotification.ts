import { useCallback } from 'react';
import { useNotify, useRedirect, useResourceContext } from 'ra-core';
import type { RaRecord, RedirectionSideEffect } from 'ra-core';

/**
 * Return type for useSuccessNotification hook
 */
export interface UseSuccessNotificationReturn {
  /** mutationOptions to pass to <Create> or <Edit> components */
  mutationOptions: {
    onSuccess: (data: RaRecord) => void;
  };
}

/**
 * Hook that provides mutationOptions with a success toast notification.
 *
 * When passed to React Admin's <Create> or <Edit> components, it shows
 * a descriptive success notification (green "success" type) with auto-dismiss
 * and handles redirect after the operation.
 *
 * @param action - The action label ("created", "updated", etc.)
 * @param options - Additional options
 * @param options.redirectTo - Where to redirect after success (default: "list" for create, "list" for edit)
 * @param options.resourceLabel - Display label for the resource (e.g., "Job", "Invoice")
 *
 * @example
 * ```tsx
 * const { mutationOptions } = useSuccessNotification('created');
 * return <Create mutationOptions={mutationOptions}>...</Create>;
 * ```
 */
export function useSuccessNotification(
  action: 'created' | 'updated' | 'deleted' | string,
  options?: {
    redirectTo?: RedirectionSideEffect;
    resourceLabel?: string;
  },
): UseSuccessNotificationReturn {
  const notify = useNotify();
  const redirect = useRedirect();
  const resource = useResourceContext();
  const redirectTo = options?.redirectTo ?? 'list';

  const resourceLabel = options?.resourceLabel ?? resource ?? 'Record';

  const onSuccess = useCallback(
    (data: RaRecord) => {
      notify(`${resourceLabel} ${action} successfully`, {
        type: 'success',
      });
      redirect(redirectTo, resource, data?.id, data);
    },
    [notify, redirect, redirectTo, resource, resourceLabel, action],
  );

  return {
    mutationOptions: { onSuccess },
  };
}
