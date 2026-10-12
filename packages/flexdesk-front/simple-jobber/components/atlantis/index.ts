/**
 * Atlantis Components - Local implementations matching @jobber/components API
 *
 * These components provide the same interface as the Atlantis component library,
 * allowing future migration to the actual library when fully integrated.
 */

export { Button } from './Button';
export type { ButtonProps, ButtonType, ButtonVariation, ButtonSize } from './Button';

export { ButtonDismiss } from './ButtonDismiss';
export type { ButtonDismissProps } from './ButtonDismiss';

export { Icon } from './Icon';
export type { IconProps, IconNames, IconSizes, IconColorNames } from './Icon';

export { Card } from './Card';
export type { CardProps, CardAccent, CardElevation, CardHeaderAction } from './Card';

export { Heading } from './Heading';
export type { HeadingProps, HeadingLevel, HeadingElement, HeadingMaxLines } from './Heading';

export { Text } from './Text';
export type { TextProps, TextElement, TextVariation, TextSize, TextAlign, TextMaxLines } from './Text';

export { StatusIndicator } from './StatusIndicator';
export type { StatusIndicatorProps, StatusIndicatorStatus } from './StatusIndicator';

export { StatusLabel } from './StatusLabel';
export type { StatusLabelProps, StatusLabelStatus, StatusLabelAlignment } from './StatusLabel';

export { Emphasis } from './Emphasis';
export type { EmphasisProps, EmphasisVariation } from './Emphasis';

export { InputText } from './InputText';
export type { InputTextProps, InputTextSize } from './InputText';

export { InputEmail, validateEmail } from './InputEmail';
export type { InputEmailProps, InputEmailSize } from './InputEmail';

export { InputPhoneNumber, formatPhoneNumber, extractPhoneDigits, validatePhoneNumber } from './InputPhoneNumber';
export type { InputPhoneNumberProps, InputPhoneNumberSize } from './InputPhoneNumber';

export { InputNumber } from './InputNumber';
export type { InputNumberProps, InputNumberSize } from './InputNumber';

export { InputDate } from './InputDate';
export type { InputDateProps, InputDateSize } from './InputDate';

export { FormField } from './FormField';
export type { FormFieldProps, ValidationRule } from './FormField';

export { InputValidation } from './InputValidation';
export type { InputValidationProps } from './InputValidation';

export { InputTime, formatTime12Hour, parseTime12Hour, validateTime } from './InputTime';
export type { InputTimeProps, InputTimeSize } from './InputTime';

export { InputDateTime } from './InputDateTime';
export type { InputDateTimeProps, InputDateTimeSize } from './InputDateTime';

export { InputPassword } from './InputPassword';
export type { InputPasswordProps, InputPasswordSize } from './InputPassword';

export { InputFile } from './InputFile';
export type {
  InputFileProps,
  InputFileSize,
  InputFileVariation,
  InputFileAllowedTypes,
  InputFileValidationError,
  FileUpload,
  UploadParams,
} from './InputFile';

export { Select } from './Select';
export type { SelectProps, SelectOption, SelectSize } from './Select';

export { MultiSelect } from './MultiSelect';
export type { MultiSelectProps, MultiSelectSize } from './MultiSelect';

export { Combobox } from './Combobox';
export type {
  ComboboxProps,
  ComboboxOption,
  ComboboxOptionRenderContext,
  ComboboxActivatorProps,
  ComboboxActivatorRenderProps,
  ComboboxActionProps,
} from './Combobox';

export { Autocomplete } from './Autocomplete';
export type { AutocompleteProps, AutocompleteOption } from './Autocomplete';

export { Checkbox } from './Checkbox';
export type { CheckboxProps } from './Checkbox';

export { RadioGroup, RadioOption } from './RadioGroup';
export type { RadioGroupProps, RadioOptionProps, RadioGroupDirection } from './RadioGroup';

export { Switch } from './Switch';
export type { SwitchProps } from './Switch';

export { Form, useAtlantisForm } from './Form';
export type { FormProps, FormState, AtlantisFormState } from './Form';

export { InputGroup } from './InputGroup';
export type { InputGroupProps, InputGroupFlowDirection } from './InputGroup';

export { DataTable, createColumnHelper } from './DataTable';
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
} from './DataTable';

export { DataList } from './DataList';
export type {
  DataListProps,
  DataListItem,
  DataListAction,
  DataListLayoutProps,
  DataListItemActionsProps,
  DataListBulkActionsProps,
  DataListEmptyStateProps,
} from './DataList';

export { DescriptionList } from './DescriptionList';
export type {
  DescriptionListProps,
  DescriptionListDataItem,
  DescriptionListItemProps,
  DescriptionListLayout,
} from './DescriptionList';

export { Table } from './Table';
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
} from './Table';

export { List } from './List';
export type {
  ListProps,
  ListItemProps,
  ListType,
  ListMarker,
  ListGap,
} from './List';

export { Modal } from './Modal';
export type {
  ModalProps,
  ModalAction,
  ModalSize,
  ModalHeaderProps,
  ModalContentProps,
  ModalFooterProps,
} from './Modal';

export { ConfirmationModal } from './ConfirmationModal';
export type {
  ConfirmationModalProps,
  ConfirmationModalRef,
  SimpleConfirmationModalProps,
  ComplexConfirmationModalProps,
} from './ConfirmationModal';

export { Drawer } from './Drawer';
export type {
  DrawerProps,
  DrawerTitleProps,
  DrawerToolbarProps,
  DrawerActionsProps,
  DrawerFooterProps,
} from './Drawer';

export { SideDrawer } from './SideDrawer';
export type {
  SideDrawerProps,
  SideDrawerHeaderProps,
  SideDrawerContentProps,
  SideDrawerFooterProps,
} from './SideDrawer';

export { Popover } from './Popover';
export type {
  PopoverProps,
  PopoverPlacement,
  PopoverHeaderProps,
  PopoverContentProps,
  PopoverDismissButtonProps,
} from './Popover';

export { Tooltip } from './Tooltip';
export type { TooltipProps, TooltipPlacement } from './Tooltip';

export { Menu } from './Menu';
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
} from './Menu';

export { Toaster, ToastProvider, toast, useToast } from './Toast';
export type {
  ToasterProps,
  ToastProps,
  ToastConfig,
  ToastPosition,
  ToastVariation,
  ToastAction,
  ToastOptions,
  ToastContextValue,
} from './Toast';

export { Banner } from './Banner';
export type { BannerProps, BannerType, BannerAction } from './Banner';

export { FormValidationBanner } from './FormValidationBanner';
export type { FormValidationBannerProps } from './FormValidationBanner';

export { ScheduleConflictBanner } from './ScheduleConflictBanner';
export type { ScheduleConflictBannerProps, ScheduleConflict } from './ScheduleConflictBanner';

export { InlineBanner } from './InlineBanner';
export type { InlineBannerProps } from './InlineBanner';

export { Page } from './Page';
export type { PageProps, ButtonActionProps } from './Page';

export { Tabs, Tab } from './Tabs';
export type { TabsProps, TabProps } from './Tabs';

export { FormatDate } from './FormatDate';
export type { FormatDateProps } from './FormatDate';

export { FormatEmail } from './FormatEmail';
export type { FormatEmailProps } from './FormatEmail';

export { FormatTime } from './FormatTime';
export type { FormatTimeProps } from './FormatTime';

export { FormatDateTime } from './FormatDateTime';
export type { FormatDateTimeProps } from './FormatDateTime';

export { FormatRelativeDateTime } from './FormatRelativeDateTime';
export type { FormatRelativeDateTimeProps } from './FormatRelativeDateTime';

export { FormatFile } from './FormatFile';
export type { FormatFileProps } from './FormatFile';

export { FormatCurrency, formatCurrencyValue, useFormatCurrency } from './FormatCurrency';
export type { FormatCurrencyProps } from './FormatCurrency';

export { Grid } from './Grid';
export type { GridProps, GridCellProps, GridCellSize, GridCellSizeType } from './Grid';

export { Glimmer } from './Glimmer';
export type { GlimmerProps, GlimmerShape, GlimmerSize, GlimmerHeaderProps, GlimmerTextProps } from './Glimmer';

export { Flex } from './Flex';
export type { FlexProps, FlexDirection, FlexAlign, FlexJustify, FlexGap } from './Flex';

export { Chip, Chips } from './Chip';
export type { ChipProps, ChipsProps, ChipVariation, ChipSize } from './Chip';

export { Spinner } from './Spinner';
export type { SpinnerProps, SpinnerSize } from './Spinner';

export { Box } from './Box';
export type {
  BoxProps,
  BoxSpacing,
  BoxRadius,
  BoxShadow,
  BoxBackground,
  BoxBorderWidth,
  BoxDimension,
  BoxSpaceObject,
  BoxBorderObject,
} from './Box';

export { Container } from './Container';
export type { ContainerProps, ContainerSize, ContainerVariant, ContainerPadding } from './Container';

export { Content } from './Content';
export type { ContentProps, ContentSpacing } from './Content';

export { Frame } from './Frame';
export type { FrameProps } from './Frame';

export { Stack } from './Stack';
export type { StackProps, StackDirection, StackAlign, StackJustify, StackGap } from './Stack';

export { Link } from './Link';
export type { LinkProps, LinkVariation, LinkSize } from './Link';

export { Divider } from './Divider';
export type { DividerProps, DividerDirection, DividerSize } from './Divider';

export { DatePicker } from './DatePicker';
export type {
  DatePickerProps,
  DatePickerModalProps,
  DatePickerInlineProps,
  DatePickerActivatorProps,
  DayOfWeek,
} from './DatePicker';

export { LightBox } from './LightBox';
export type { LightBoxProps, PresentedImage, RequestCloseOptions } from './LightBox';

export { Placeholder } from './Placeholder';
export type { PlaceholderProps, PlaceholderSize } from './Placeholder';

export { ProgressBar } from './ProgressBar';
export type { ProgressBarProps, ProgressBarSize, ProgressBarVariation } from './ProgressBar';

export { BottomSheet, BottomSheetOption } from './BottomSheet';
export type { BottomSheetProps, BottomSheetRef, BottomSheetOptionProps } from './BottomSheet';

export { RecurringSelect, isMonthly, DurationPeriod, WeekDay } from './RecurringSelect';
export type {
  RecurringSelectProps,
  RecurrenceRule,
  RecurrenceRuleDay,
  RecurrenceRuleWeek,
  RecurrenceRuleYear,
  RecurrenceRuleDayOfMonth,
  RecurrenceRuleWeekDayOfMonth,
  DayOfMonth,
} from './RecurringSelect';

export { Avatar } from './InputAvatar';
export type { AvatarProps, AvatarSize } from './InputAvatar';

export { InputAvatar } from './InputAvatar';
export type { InputAvatarProps } from './InputAvatar';

// Hooks
export { useDebounce, useDebouncedCallback } from './hooks/useDebounce';
export { useBreakpoints, BREAKPOINT_SIZES, type UseBreakpointsReturn } from './hooks/useBreakpoints';
export { useBool, type UseBoolReturn } from './hooks/useBool';
export { useFormState, type UseFormStateReturn } from './hooks/useFormState';
