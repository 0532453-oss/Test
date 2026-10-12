/**
 * Atlantis Components - Local implementations matching @jobber/components API
 *
 * These components provide the same interface as the Atlantis component library,
 * allowing future migration to the actual library when fully integrated.
 *
 * Note: Components are implemented in flexdesk-front/simple-jobber/components/atlantis
 * and re-exported here for use with @/components/atlantis path alias.
 */

// Re-export components from simple-jobber atlantis
export { Button } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Button';
export type { ButtonProps, ButtonType, ButtonVariation, ButtonSize } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Button';

export { ButtonDismiss } from './ButtonDismiss';
export type { ButtonDismissProps } from './ButtonDismiss';

export { Icon } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Icon';
export type { IconProps, IconNames, IconSizes, IconColorNames } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Icon';

export { Card } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Card';
export type { CardProps, CardAccent, CardElevation, CardHeaderAction } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Card';

export { Heading } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Heading';
export type { HeadingProps, HeadingLevel, HeadingElement, HeadingMaxLines } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Heading';

export { Text } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Text';
export type { TextProps, TextElement, TextVariation, TextSize, TextAlign, TextMaxLines } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Text';

export { StatusIndicator } from '../../../../flexdesk-front/simple-jobber/components/atlantis/StatusIndicator';
export type { StatusIndicatorProps, StatusIndicatorStatus } from '../../../../flexdesk-front/simple-jobber/components/atlantis/StatusIndicator';

export { StatusLabel } from '../../../../flexdesk-front/simple-jobber/components/atlantis/StatusLabel';
export type { StatusLabelProps, StatusLabelStatus, StatusLabelAlignment } from '../../../../flexdesk-front/simple-jobber/components/atlantis/StatusLabel';

export { Emphasis } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Emphasis';
export type { EmphasisProps, EmphasisVariation } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Emphasis';

export { InputText } from '../../../../flexdesk-front/simple-jobber/components/atlantis/InputText';
export type { InputTextProps, InputTextSize } from '../../../../flexdesk-front/simple-jobber/components/atlantis/InputText';

export { InputEmail, validateEmail } from '../../../../flexdesk-front/simple-jobber/components/atlantis/InputEmail';
export type { InputEmailProps, InputEmailSize } from '../../../../flexdesk-front/simple-jobber/components/atlantis/InputEmail';

export { InputPhoneNumber, formatPhoneNumber, extractPhoneDigits, validatePhoneNumber } from '../../../../flexdesk-front/simple-jobber/components/atlantis/InputPhoneNumber';
export type { InputPhoneNumberProps, InputPhoneNumberSize } from '../../../../flexdesk-front/simple-jobber/components/atlantis/InputPhoneNumber';

export { InputNumber } from '../../../../flexdesk-front/simple-jobber/components/atlantis/InputNumber';
export type { InputNumberProps, InputNumberSize } from '../../../../flexdesk-front/simple-jobber/components/atlantis/InputNumber';

export { InputDate } from '../../../../flexdesk-front/simple-jobber/components/atlantis/InputDate';
export type { InputDateProps, InputDateSize } from '../../../../flexdesk-front/simple-jobber/components/atlantis/InputDate';

export { FormField } from '../../../../flexdesk-front/simple-jobber/components/atlantis/FormField';
export type { FormFieldProps, ValidationRule } from '../../../../flexdesk-front/simple-jobber/components/atlantis/FormField';

export { InputValidation } from '../../../../flexdesk-front/simple-jobber/components/atlantis/InputValidation';
export type { InputValidationProps } from '../../../../flexdesk-front/simple-jobber/components/atlantis/InputValidation';

export { InputTime, formatTime12Hour, parseTime12Hour, validateTime } from '../../../../flexdesk-front/simple-jobber/components/atlantis/InputTime';
export type { InputTimeProps, InputTimeSize } from '../../../../flexdesk-front/simple-jobber/components/atlantis/InputTime';

export { InputDateTime } from '../../../../flexdesk-front/simple-jobber/components/atlantis/InputDateTime';
export type { InputDateTimeProps, InputDateTimeSize } from '../../../../flexdesk-front/simple-jobber/components/atlantis/InputDateTime';

export { InputPassword } from '../../../../flexdesk-front/simple-jobber/components/atlantis/InputPassword';
export type { InputPasswordProps, InputPasswordSize } from '../../../../flexdesk-front/simple-jobber/components/atlantis/InputPassword';

export { InputFile } from '../../../../flexdesk-front/simple-jobber/components/atlantis/InputFile';
export type {
  InputFileProps,
  InputFileSize,
  InputFileVariation,
  InputFileAllowedTypes,
  InputFileValidationError,
  FileUpload,
  UploadParams,
} from '../../../../flexdesk-front/simple-jobber/components/atlantis/InputFile';

export { Select } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Select';
export type { SelectProps, SelectOption, SelectSize } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Select';

export { MultiSelect } from '../../../../flexdesk-front/simple-jobber/components/atlantis/MultiSelect';
export type { MultiSelectProps, MultiSelectSize } from '../../../../flexdesk-front/simple-jobber/components/atlantis/MultiSelect';

export { Combobox } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Combobox';
export type {
  ComboboxProps,
  ComboboxOption,
  ComboboxOptionRenderContext,
  ComboboxActivatorProps,
  ComboboxActivatorRenderProps,
  ComboboxActionProps,
} from '../../../../flexdesk-front/simple-jobber/components/atlantis/Combobox';

export { Autocomplete } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Autocomplete';
export type { AutocompleteProps, AutocompleteOption } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Autocomplete';

export { Checkbox } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Checkbox';
export type { CheckboxProps } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Checkbox';

export { RadioGroup, RadioOption } from '../../../../flexdesk-front/simple-jobber/components/atlantis/RadioGroup';
export type { RadioGroupProps, RadioOptionProps, RadioGroupDirection } from '../../../../flexdesk-front/simple-jobber/components/atlantis/RadioGroup';

export { Switch } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Switch';
export type { SwitchProps } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Switch';

export { Form, useAtlantisForm } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Form';
export type { FormProps, FormState, AtlantisFormState } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Form';

export { InputGroup } from '../../../../flexdesk-front/simple-jobber/components/atlantis/InputGroup';
export type { InputGroupProps, InputGroupFlowDirection } from '../../../../flexdesk-front/simple-jobber/components/atlantis/InputGroup';

export { DataTable, createColumnHelper } from '../../../../flexdesk-front/simple-jobber/components/atlantis/DataTable';
export type {
  DataTableProps,
  PaginationType,
  ManualPagination,
  DefaultPagination,
  SortingType,
  ManualSorting,
  DefaultSorting,
  ColumnDef,
  CellContext,
  Row,
  SortingState,
  PaginationState,
} from '../../../../flexdesk-front/simple-jobber/components/atlantis/DataTable';

export { DataList } from '../../../../flexdesk-front/simple-jobber/components/atlantis/DataList';
export type {
  DataListProps,
  DataListItem,
  DataListAction,
  DataListLayoutProps,
  DataListItemActionsProps,
  DataListBulkActionsProps,
  DataListEmptyStateProps,
} from '../../../../flexdesk-front/simple-jobber/components/atlantis/DataList';

export { DescriptionList } from '../../../../flexdesk-front/simple-jobber/components/atlantis/DescriptionList';
export type {
  DescriptionListProps,
  DescriptionListDataItem,
  DescriptionListItemProps,
  DescriptionListLayout,
} from '../../../../flexdesk-front/simple-jobber/components/atlantis/DescriptionList';

export { Table } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Table';
export type {
  TableProps,
  TableHeaderProps,
  TableBodyProps,
  TableFooterProps,
  TableRowProps,
  TableHeaderCellProps,
  TableCellProps,
  TableCaptionProps,
  TableCellAlign,
} from '../../../../flexdesk-front/simple-jobber/components/atlantis/Table';

export { List } from '../../../../flexdesk-front/simple-jobber/components/atlantis/List';
export type {
  ListProps,
  ListItemProps,
  ListType,
  ListMarker,
  ListGap,
} from '../../../../flexdesk-front/simple-jobber/components/atlantis/List';

export { Modal } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Modal';
export type {
  ModalProps,
  ModalAction,
  ModalSize,
  ModalHeaderProps,
  ModalContentProps,
  ModalFooterProps,
} from '../../../../flexdesk-front/simple-jobber/components/atlantis/Modal';

export { ConfirmationModal } from '../../../../flexdesk-front/simple-jobber/components/atlantis/ConfirmationModal';
export type {
  ConfirmationModalProps,
  ConfirmationModalRef,
  SimpleConfirmationModalProps,
  ComplexConfirmationModalProps,
} from '../../../../flexdesk-front/simple-jobber/components/atlantis/ConfirmationModal';

export { Drawer } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Drawer';
export type {
  DrawerProps,
  DrawerTitleProps,
  DrawerToolbarProps,
  DrawerActionsProps,
  DrawerFooterProps,
} from '../../../../flexdesk-front/simple-jobber/components/atlantis/Drawer';

export { SideDrawer } from '../../../../flexdesk-front/simple-jobber/components/atlantis/SideDrawer';
export type {
  SideDrawerProps,
  SideDrawerHeaderProps,
  SideDrawerContentProps,
  SideDrawerFooterProps,
} from '../../../../flexdesk-front/simple-jobber/components/atlantis/SideDrawer';

export { Popover } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Popover';
export type {
  PopoverProps,
  PopoverPlacement,
  PopoverHeaderProps,
  PopoverContentProps,
  PopoverDismissButtonProps,
} from '../../../../flexdesk-front/simple-jobber/components/atlantis/Popover';

export { Tooltip } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Tooltip';
export type { TooltipProps, TooltipPlacement } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Tooltip';

export { Menu } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Menu';
export type {
  MenuProps,
  MenuPlacement,
  MenuTriggerProps,
  MenuContentProps,
  MenuItemProps,
  MenuSectionProps,
  MenuHeaderProps,
  MenuRadioGroupProps,
  MenuRadioItemProps,
} from '../../../../flexdesk-front/simple-jobber/components/atlantis/Menu';

export { Toaster, ToastProvider, toast, useToast } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Toast';
export type {
  ToasterProps,
  ToastProps,
  ToastConfig,
  ToastPosition,
  ToastVariation,
  ToastAction,
  ToastOptions,
  ToastContextValue,
} from '../../../../flexdesk-front/simple-jobber/components/atlantis/Toast';

export { Banner } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Banner';
export type { BannerProps, BannerType, BannerAction } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Banner';

// Page, FormatDate, FormatTime, FormatDateTime are omitted from the barrel
// because they depend on date-fns which is not resolvable from flexdesk-front
// by Turbopack's strict package resolution. They are not used in the admin app.

export { Tabs, Tab } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Tabs';
export type { TabsProps, TabProps } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Tabs';

export { FormatCurrency, formatCurrencyValue, useFormatCurrency } from '../../../../flexdesk-front/simple-jobber/components/atlantis/FormatCurrency';
export type { FormatCurrencyProps } from '../../../../flexdesk-front/simple-jobber/components/atlantis/FormatCurrency';

export { Grid } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Grid';
export type { GridProps, GridCellProps, GridCellSize, GridCellSizeType } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Grid';

export { Glimmer } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Glimmer';
export type { GlimmerProps, GlimmerShape, GlimmerSize, GlimmerHeaderProps, GlimmerTextProps } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Glimmer';

export { Flex } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Flex';
export type { FlexProps, FlexDirection, FlexAlign, FlexJustify, FlexGap } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Flex';

export { Chip, Chips } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Chip';
export type { ChipProps, ChipsProps, ChipVariation, ChipSize } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Chip';

export { Spinner } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Spinner';
export type { SpinnerProps, SpinnerSize } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Spinner';

export { Container } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Container';
export type { ContainerProps, ContainerSize } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Container';

export { Content } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Content';
export type { ContentProps, ContentSpacing } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Content';

export { Frame } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Frame';
export type { FrameProps } from '../../../../flexdesk-front/simple-jobber/components/atlantis/Frame';

export { Avatar } from '../../../../flexdesk-front/simple-jobber/components/atlantis/InputAvatar';
export type { AvatarProps, AvatarSize } from '../../../../flexdesk-front/simple-jobber/components/atlantis/InputAvatar';

export { InputAvatar } from '../../../../flexdesk-front/simple-jobber/components/atlantis/InputAvatar';
export type { InputAvatarProps } from '../../../../flexdesk-front/simple-jobber/components/atlantis/InputAvatar';

// Hooks
export { useDebounce, useDebouncedCallback } from '../../../../flexdesk-front/simple-jobber/components/atlantis/hooks/useDebounce';
export { useBreakpoints, BREAKPOINT_SIZES } from '../../../../flexdesk-front/simple-jobber/components/atlantis/hooks/useBreakpoints';
export type { UseBreakpointsReturn } from '../../../../flexdesk-front/simple-jobber/components/atlantis/hooks/useBreakpoints';
export { useBool } from '../../../../flexdesk-front/simple-jobber/components/atlantis/hooks/useBool';
export type { UseBoolReturn } from '../../../../flexdesk-front/simple-jobber/components/atlantis/hooks/useBool';
export { useFormState } from '../../../../flexdesk-front/simple-jobber/components/atlantis/hooks/useFormState';
export type { UseFormStateReturn } from '../../../../flexdesk-front/simple-jobber/components/atlantis/hooks/useFormState';
