import * as React from "react";
import type {
  ComponentType,
  ReactElement,
  ReactNode,
  HTMLAttributes,
} from "react";
import { Children, isValidElement, useEffect, useState } from "react";
import type { InputProps } from "ra-core";
import {
  FieldTitle,
  RecordContextProvider,
  shallowEqual,
  useInput,
  useTranslate,
} from "ra-core";
import type {
  DropzoneOptions,
  FileRejection,
  DropEvent,
  DropzoneInputProps,
} from "react-dropzone";
import { useDropzone } from "react-dropzone";

import { cn } from "@/lib/utils";
import { FormError, FormField, FormLabel } from "@/components/admin/form";
import { InputHelperText } from "@/components/admin/input-helper-text";
import { Button as AtlantisButton, Icon, Text } from "@/components/atlantis";

/**
 * File upload input with drag-and-drop support and preview capabilities.
 *
 * Use `<FileInput>` for document uploads, images, PDFs, CSV files, or any file attachment field.
 * Powered by react-dropzone with support for multiple files, file type restrictions (accept), and
 * size constraints. Pass a child component (typically `<FileField>`) to render file previews.
 *
 * @see {@link https://marmelab.com/shadcn-admin-kit/docs/fileinput/ FileInput documentation}
 * @see {@link https://react-dropzone.js.org/ React Dropzone documentation}
 *
 * @example
 * import {
 *   Edit,
 *   SimpleForm,
 *   TextInput,
 *   FileInput,
 *   FileField,
 * } from '@/components/admin';
 *
 * const DocumentEdit = () => (
 *   <Edit>
 *     <SimpleForm>
 *       <TextInput source="title" />
 *       <FileInput source="attachments" multiple accept={{ 'image/*': [], 'application/pdf': [] }}>
 *         <FileField source="src" title="title" />
 *       </FileInput>
 *     </SimpleForm>
 *   </Edit>
 * );
 */
export const FileInput = (props: FileInputProps) => {
  const {
    alwaysOn,
    defaultValue,
    format,
    label,
    helperText,
    name: nameProp,
    onBlur: onBlurProp,
    onChange: onChangeProp,
    parse,
    resource,
    source,
    validate,
    readOnly,
    disabled,

    accept,
    maxSize,
    minSize,
    multiple = false,
    options = {},

    children,
    className,
    inputProps: inputPropsOptions,

    onRemove: onRemoveProp,
    validateFileRemoval,

    placeholder,
    labelMultiple = "ra.input.file.upload_several",
    labelSingle = "ra.input.file.upload_single",
    removeIcon,
    ...rest
  } = props;
  const { onDrop: onDropProp } = options;
  const translate = useTranslate();

  // turn a browser dropped file structure into expected structure
  const transformFile = (file: unknown) => {
    if (!(file instanceof File)) {
      return file;
    }

    const preview = URL.createObjectURL(file);
    const transformedFile: TransformedFile = {
      rawFile: file,
      src: preview,
      title: file.name,
    };

    return transformedFile;
  };

  const transformFiles = (files: unknown[]) => {
    if (!files) {
      return multiple ? [] : null;
    }

    if (Array.isArray(files)) {
      return files.map(transformFile);
    }

    return transformFile(files);
  };

  const {
    id,
    field: { onChange, onBlur, value, name },
    isRequired,
  } = useInput({
    alwaysOn,
    defaultValue,
    format: format || transformFiles,
    label,
    helperText,
    name: nameProp,
    onBlur: onBlurProp,
    onChange: onChangeProp,
    parse: parse || transformFiles,
    resource,
    source,
    validate,
    readOnly,
    disabled,
  });
  const files = value ? (Array.isArray(value) ? value : [value]) : [];

  const onDrop = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    newFiles: any[],
    rejectedFiles: FileRejection[],
    event: DropEvent,
  ) => {
    const updatedFiles = multiple ? [...files, ...newFiles] : [...newFiles];

    if (multiple) {
      onChange(updatedFiles);
      onBlur();
    } else {
      onChange(updatedFiles[0]);
      onBlur();
    }

    if (onDropProp) {
      onDropProp(newFiles, rejectedFiles, event);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onRemove = (file: any) => async () => {
    if (validateFileRemoval) {
      try {
        await validateFileRemoval(file);
      } catch {
        return;
      }
    }

    if (multiple) {
      const filteredFiles = files.filter(
        (stateFile) => !shallowEqual(stateFile, file),
      );
      onChange(filteredFiles);
      onBlur();
    } else {
      onChange(null);
      onBlur();
    }

    if (onRemoveProp) {
      onRemoveProp(file);
    }
  };

  const childrenElement =
    children && isValidElement(Children.only(children))
      ? (Children.only(children) as ReactElement)
      : undefined;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxSize,
    minSize,
    multiple,
    disabled: disabled || readOnly,
    ...options,
    onDrop,
  });

  return (
    <FormField
      id={id}
      name={name}
      className={cn("w-full", className)}
      {...rest}
    >
      <FormLabel
        htmlFor={id}
        className={disabled || readOnly ? "cursor-default" : "cursor-pointer"}
      >
        <FieldTitle
          label={label}
          source={source}
          resource={resource}
          isRequired={isRequired}
        />
      </FormLabel>

      <div
        {...getRootProps({
          className: cn(
            "relative flex flex-col items-center justify-center gap-2",
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
            "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            isDragActive
              ? "border-[var(--color-interactive)] bg-[var(--color-interactive)]/5"
              : "border-gray-300 hover:border-gray-400 bg-gray-50",
            disabled || readOnly && "cursor-not-allowed opacity-50",
          ),
        })}
      >
        <input
          id={id}
          name={name}
          {...getInputProps({
            ...inputPropsOptions,
          })}
        />

        {placeholder ? (
          placeholder
        ) : (
          <>
            <Icon name="upload" size="large" color="greyBlue" />
            <AtlantisButton
              type="secondary"
              size="small"
              onClick={(e) => e.stopPropagation()}
              disabled={disabled || readOnly}
            >
              {multiple ? translate(labelMultiple) : translate(labelSingle)}
            </AtlantisButton>
            <Text variation="subdued" size="small">
              {multiple ? "or drag and drop files here" : "or drag and drop a file here"}
            </Text>
          </>
        )}
      </div>

      <InputHelperText helperText={helperText} />
      <FormError />

      {children && (
        <div className="previews flex flex-col gap-1">
          {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            files.map((file: any, index: number) => (
              <FileInputPreview
                key={index}
                file={file}
                onRemove={onRemove(file)}
                removeIcon={removeIcon}
              >
                <RecordContextProvider value={file}>
                  {childrenElement}
                </RecordContextProvider>
              </FileInputPreview>
            ))
          }
        </div>
      )}
    </FormField>
  );
};

export type FileInputProps = Omit<InputProps, "type"> & {
  accept?: DropzoneOptions["accept"];
  className?: string;
  children?: ReactNode;
  labelMultiple?: string;
  labelSingle?: string;
  maxSize?: DropzoneOptions["maxSize"];
  minSize?: DropzoneOptions["minSize"];
  multiple?: DropzoneOptions["multiple"];
  options?: DropzoneOptions;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRemove?: (file: any) => void;
  placeholder?: ReactNode;
  removeIcon?: ComponentType<{ className?: string }>;
  inputProps?: DropzoneInputProps & React.ComponentProps<"input">;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validateFileRemoval?(file: any): boolean | Promise<boolean>;
};

export interface TransformedFile {
  rawFile: File;
  src: string;
  title: string;
}

/**
 * Preview container for uploaded files in `<FileInput>`, with a remove button.
 *
 * @internal
 */
export const FileInputPreview = (props: FileInputPreviewProps) => {
  const {
    className,
    children,

    file,
    onRemove,
    removeIcon: _removeIcon, // Kept for backwards compatibility but now using Atlantis icon

    ...rest
  } = props;

  const translate = useTranslate();

  useEffect(() => {
    return () => {
      const preview = file.rawFile ? file.rawFile.preview : file.preview;

      if (preview) {
        window.URL.revokeObjectURL(preview);
      }
    };
  }, [file]);

  return (
    <div className={cn("flex flex-row gap-2 items-center", className)} {...rest}>
      <AtlantisButton
        type="tertiary"
        variation="destructive"
        size="small"
        icon="trash"
        onClick={onRemove}
        ariaLabel={translate("ra.action.delete")}
      />
      {children}
    </div>
  );
};

export interface FileInputPreviewProps extends HTMLAttributes<HTMLDivElement> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  file: any;
  onRemove: () => void;
  removeIcon?: React.ComponentType<{ className?: string }>;
}
