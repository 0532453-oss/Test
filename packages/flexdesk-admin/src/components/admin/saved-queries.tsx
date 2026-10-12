import { useListContext, useTranslate } from "ra-core";
import type { ReactElement } from "react";
import { useState } from "react";
import isEqual from "lodash/isEqual";

import { Modal, type ModalAction, InputText, Text } from "@/components/atlantis";
import {
  extractValidSavedQueries,
  useSavedQueries,
} from "@/hooks/saved-queries";

/**
 * Dialog for saving the current list view query (filters, sort, pagination) as a named saved query.
 *
 * Used by FilterButton in the List view.
 *
 * @internal
 */
export const AddSavedQueryDialog = ({
  open,
  onClose,
}: AddSavedQueryDialogProps): ReactElement => {
  const translate = useTranslate();
  const { resource, filterValues, displayedFilters, sort, perPage } =
    useListContext();

  const [savedQueries, setSavedQueries] = useSavedQueries(resource);

  // input state
  const [queryName, setQueryName] = useState("");

  const addQuery = (): void => {
    const newSavedQuery = {
      label: queryName,
      value: {
        filter: filterValues,
        sort,
        perPage,
        displayedFilters,
      },
    };
    const newSavedQueries = extractValidSavedQueries(savedQueries);
    setSavedQueries(newSavedQueries.concat(newSavedQuery));
    setQueryName("");
    onClose();
  };

  const handleClose = () => {
    setQueryName("");
    onClose();
  };

  const primaryAction: ModalAction = {
    label: translate("ra.action.save"),
    onClick: addQuery,
    disabled: !queryName.trim(),
  };

  const secondaryAction: ModalAction = {
    label: translate("ra.action.cancel"),
    onClick: handleClose,
  };

  return (
    <Modal
      open={open}
      onRequestClose={handleClose}
      title={translate("ra.saved_queries.new_dialog_title", {
        _: "Save current query as",
      })}
      primaryAction={primaryAction}
      secondaryAction={secondaryAction}
      size="small"
    >
      <div className="space-y-2">
        <Text element="span">
          {translate("ra.saved_queries.query_name", {
            _: "Query name",
          })}
        </Text>
        <InputText
          value={queryName}
          onChange={setQueryName}
          placeholder={translate("ra.saved_queries.query_name", {
            _: "Query name",
          })}
        />
      </div>
    </Modal>
  );
};

export interface AddSavedQueryDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Dialog for removing a saved query from the user's list.
 *
 * @internal
 */
export const RemoveSavedQueryDialog = ({
  open,
  onClose,
}: RemoveSavedQueryDialogProps): ReactElement => {
  const translate = useTranslate();
  const { resource, filterValues, sort, perPage, displayedFilters } =
    useListContext();

  const [savedQueries, setSavedQueries] = useSavedQueries(resource);

  const removeQuery = (): void => {
    const savedQueryToRemove = {
      filter: filterValues,
      sort,
      perPage,
      displayedFilters,
    };

    const newSavedQueries = extractValidSavedQueries(savedQueries);
    const index = newSavedQueries.findIndex((savedFilter) =>
      isEqual(savedFilter.value, savedQueryToRemove),
    );
    setSavedQueries([
      ...newSavedQueries.slice(0, index),
      ...newSavedQueries.slice(index + 1),
    ]);
    onClose();
  };

  const primaryAction: ModalAction = {
    label: translate("ra.action.confirm"),
    onClick: removeQuery,
    variation: "destructive",
  };

  const secondaryAction: ModalAction = {
    label: translate("ra.action.cancel"),
    onClick: onClose,
  };

  return (
    <Modal
      open={open}
      onRequestClose={onClose}
      title={translate("ra.saved_queries.remove_dialog_title", {
        _: "Remove saved query?",
      })}
      primaryAction={primaryAction}
      secondaryAction={secondaryAction}
      size="small"
    >
      <Text variation="subdued">
        {translate("ra.saved_queries.remove_message", {
          _: "Are you sure you want to remove that item from your list of saved queries?",
        })}
      </Text>
    </Modal>
  );
};

export interface RemoveSavedQueryDialogProps {
  open: boolean;
  onClose: () => void;
}
