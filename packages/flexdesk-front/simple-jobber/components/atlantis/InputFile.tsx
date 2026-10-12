/**
 * InputFile Component - File upload input matching @jobber/components InputFile API
 *
 * This component provides a file upload interface with drag-and-drop support.
 * Based on @jobber/components InputFile API pattern.
 *
 * @example
 * // Basic dropzone usage
 * <InputFile
 *   allowedTypes="images"
 *   onUploadStart={(file) => console.log('Upload started:', file.name)}
 *   onUploadComplete={(file) => console.log('Upload complete:', file.key)}
 *   getUploadParams={(file) => ({ url: '/api/upload', key: file.name })}
 * />
 *
 * // Button variation
 * <InputFile
 *   variation="button"
 *   buttonLabel="Choose Photo"
 *   allowedTypes="basicImages"
 *   getUploadParams={(file) => ({ url: '/api/upload' })}
 * />
 *
 * // Multiple files
 * <InputFile
 *   allowMultiple
 *   maxFilesValidation={{ maxFiles: 5, numberOfCurrentFiles: 2 }}
 *   getUploadParams={(file) => ({ url: '/api/upload' })}
 * />
 */

import React, { useCallback, useState, useRef, type SyntheticEvent } from 'react';
import { Icon } from './Icon';
import { Button } from './Button';
import { Text } from './Text';

// ============================================================================
// Types
// ============================================================================

export interface FileUpload {
  /** File Identifier */
  readonly key: string;
  /** The name of the file */
  readonly name: string;
  /** The MIME type of the file */
  readonly type: string;
  /** The size of the file in bytes */
  readonly size: number;
  /** The progress of a file upload between 0 and 1 */
  readonly progress: number;
  /** Base URL where file was sent as a POST */
  readonly uploadUrl?: string;
  /** Returns the data URL of the file */
  src(): Promise<string>;
  /** Callback for when the image file fails to load */
  onImageLoadError?(event: SyntheticEvent<HTMLImageElement>): void;
}

export interface UploadParams {
  /** URL to POST file to */
  readonly url: string;
  /** Key to identify file. If unspecified, a generated ID will be used */
  readonly key?: string;
  /** Extra fields or headers to send with the upload */
  readonly fields?: Record<string, string>;
  /** The HTTP method for the upload. Default: "POST" */
  readonly httpMethod?: 'POST' | 'PUT';
}

export interface InputFileValidationError {
  code: string;
  message: string;
}

export type InputFileSize = 'small' | 'base';
export type InputFileVariation = 'dropzone' | 'button';
export type InputFileAllowedTypes = 'all' | 'images' | 'basicImages' | string[];

export interface InputFileProps {
  /** Display variation. Default: "dropzone" */
  variation?: InputFileVariation;
  /** Size of the InputFile. Default: "base" */
  size?: InputFileSize;
  /** Sets the name attribute on the underlying input element */
  name?: string;
  /** Label for the InputFile's button */
  buttonLabel?: string;
  /** Allowed File types. Default: "all" */
  allowedTypes?: InputFileAllowedTypes;
  /** Allow for multiple files to be selected. Default: false */
  allowMultiple?: boolean;
  /** Override the default hint text */
  hintText?: string;
  /** Further description of the input */
  description?: string;
  /** Control and validate the number of files being uploaded */
  maxFilesValidation?: {
    maxFiles: number;
    numberOfCurrentFiles: number;
  };
  /** Maximum file size in bytes. Files exceeding this will be rejected. */
  maxFileSize?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Callback to get upload parameters for a file */
  getUploadParams?: (file: File) => UploadParams | Promise<UploadParams>;
  /** Upload event handler - triggered on upload start */
  onUploadStart?: (file: FileUpload) => void;
  /** Upload event handler - triggered as upload progresses */
  onUploadProgress?: (file: FileUpload) => void;
  /** Upload event handler - triggered on upload completion */
  onUploadComplete?: (file: FileUpload) => void;
  /** Upload event handler - triggered on upload error */
  onUploadError?: (error: Error) => void;
  /** Called when files are selected (for direct handling without upload) */
  onFilesSelected?: (files: File[]) => void;
  /** Custom file validator function */
  validator?: (file: File) => InputFileValidationError | InputFileValidationError[] | null;
  /** Children to render inside the dropzone */
  children?: React.ReactNode;
}

// ============================================================================
// Allowed Types to Accept Mapping
// ============================================================================

const BASIC_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
const ALL_IMAGE_TYPES = ['image/*'];

function getAllowedMimeTypes(allowedTypes: InputFileAllowedTypes): string {
  if (allowedTypes === 'all') {
    return '*/*';
  }
  if (allowedTypes === 'images') {
    return ALL_IMAGE_TYPES.join(',');
  }
  if (allowedTypes === 'basicImages') {
    return BASIC_IMAGE_TYPES.join(',');
  }
  if (Array.isArray(allowedTypes)) {
    return allowedTypes.join(',');
  }
  return '*/*';
}

function formatAllowedTypesText(allowedTypes: InputFileAllowedTypes): string {
  if (allowedTypes === 'all') {
    return 'all files';
  }
  if (allowedTypes === 'images') {
    return 'images';
  }
  if (allowedTypes === 'basicImages') {
    return 'PNG, JPG, or JPEG';
  }
  if (Array.isArray(allowedTypes)) {
    return allowedTypes.map((t) => t.replace('image/', '').replace('application/', '')).join(', ');
  }
  return 'files';
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return Math.floor(Math.random() * Date.now()).toString(16);
}

function getFileUpload(file: File, key: string, uploadUrl?: string): FileUpload {
  return {
    key,
    name: file.name,
    type: file.type,
    size: file.size,
    progress: 0,
    uploadUrl,
    src: () => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result && typeof event.target.result === 'string') {
            resolve(event.target.result);
          } else {
            reject(new Error('Could not generate file data URL.'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file.'));
        reader.readAsDataURL(file);
      });
    },
  };
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);
  return `${size < 10 ? size.toFixed(1) : Math.round(size)} ${units[i]}`;
}

function validateFileSize(file: File, maxFileSize: number): InputFileValidationError | null {
  if (file.size > maxFileSize) {
    return {
      code: 'file-too-large',
      message: `${file.name} exceeds the maximum file size of ${formatFileSize(maxFileSize)}.`,
    };
  }
  return null;
}

function validateFileType(file: File, allowedTypes: InputFileAllowedTypes): InputFileValidationError | null {
  if (allowedTypes === 'all') return null;

  const mimeTypes =
    allowedTypes === 'images'
      ? ['image/']
      : allowedTypes === 'basicImages'
        ? BASIC_IMAGE_TYPES
        : allowedTypes;

  const isValid = Array.isArray(mimeTypes)
    ? mimeTypes.some((type) => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', '/'));
        }
        if (type.endsWith('/')) {
          return file.type.startsWith(type);
        }
        return file.type === type;
      })
    : true;

  if (!isValid) {
    return {
      code: 'file-invalid-type',
      message: `${file.name} must be in ${formatAllowedTypesText(allowedTypes)} format.`,
    };
  }

  return null;
}

// ============================================================================
// InputFile Component
// ============================================================================

export function InputFile({
  variation = 'dropzone',
  size = 'base',
  name,
  buttonLabel,
  allowedTypes = 'all',
  allowMultiple = false,
  hintText,
  description,
  maxFilesValidation,
  maxFileSize,
  disabled = false,
  getUploadParams,
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  onFilesSelected,
  validator,
  children,
}: InputFileProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState<InputFileValidationError[]>([]);

  const maxFiles = maxFilesValidation?.maxFiles ?? 0;
  const numberOfCurrentFiles = maxFilesValidation?.numberOfCurrentFiles ?? 0;

  const handleValidation = useCallback(
    (files: File[]): InputFileValidationError[] => {
      const errors: InputFileValidationError[] = [];

      // Check max files
      if (maxFiles > 0 && numberOfCurrentFiles + files.length > maxFiles) {
        errors.push({
          code: 'too-many-files',
          message: `Cannot exceed a maximum of ${maxFiles} files.`,
        });
      }

      // Validate each file
      for (const file of files) {
        // Type validation
        const typeError = validateFileType(file, allowedTypes);
        if (typeError) {
          errors.push(typeError);
        }

        // Size validation
        if (maxFileSize) {
          const sizeError = validateFileSize(file, maxFileSize);
          if (sizeError) {
            errors.push(sizeError);
          }
        }

        // Custom validation
        if (validator) {
          const customErrors = validator(file);
          if (customErrors) {
            if (Array.isArray(customErrors)) {
              errors.push(...customErrors);
            } else {
              errors.push(customErrors);
            }
          }
        }
      }

      return errors;
    },
    [allowedTypes, maxFiles, maxFileSize, numberOfCurrentFiles, validator]
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      // Validate files
      const errors = handleValidation(files);
      setValidationErrors(errors);

      if (errors.length > 0) {
        return;
      }

      // If onFilesSelected is provided, call it (for direct file handling)
      if (onFilesSelected) {
        onFilesSelected(files);
        return;
      }

      // Upload files if getUploadParams is provided
      if (getUploadParams) {
        for (const file of files) {
          try {
            const params = await getUploadParams(file);
            const key = params.key ?? generateId();
            const fileUpload = getFileUpload(file, key, params.url);

            onUploadStart?.(fileUpload);

            // Create upload request
            const { url, fields = {}, httpMethod = 'POST' } = params;

            const xhr = new XMLHttpRequest();
            xhr.open(httpMethod, url);

            // Handle progress
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const progress = event.loaded / event.total;
                onUploadProgress?.({ ...fileUpload, progress });
              }
            };

            // Handle completion
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                onUploadComplete?.({ ...fileUpload, progress: 1 });
              } else {
                onUploadError?.(new Error(`Upload failed with status ${xhr.status}`));
              }
            };

            // Handle error
            xhr.onerror = () => {
              onUploadError?.(new Error('Failed to upload file'));
            };

            // Send request
            if (httpMethod === 'POST') {
              const formData = new FormData();
              Object.entries(fields).forEach(([key, value]) => {
                formData.append(key, value);
              });
              formData.append('file', file);
              xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
              xhr.send(formData);
            } else {
              // PUT - send file directly with headers
              Object.entries(fields).forEach(([key, value]) => {
                xhr.setRequestHeader(key, value);
              });
              xhr.send(file);
            }
          } catch (error) {
            onUploadError?.(error instanceof Error ? error : new Error('Failed to get upload params'));
          }
        }
      }
    },
    [getUploadParams, handleValidation, onFilesSelected, onUploadComplete, onUploadError, onUploadProgress, onUploadStart]
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        handleFiles(Array.from(files));
      }
      // Reset input value so same file can be selected again
      event.target.value = '';
    },
    [handleFiles]
  );

  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragActive(false);

      if (disabled) return;

      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        handleFiles(Array.from(files));
      }
    },
    [disabled, handleFiles]
  );

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if ((event.key === 'Enter' || event.key === ' ') && !disabled) {
        event.preventDefault();
        inputRef.current?.click();
      }
    },
    [disabled]
  );

  // Determine file type label
  const fileTypeLabel = allowedTypes === 'images' || allowedTypes === 'basicImages' ? 'image' : 'file';

  // Default button label
  const defaultButtonLabel = allowMultiple
    ? `Choose ${fileTypeLabel}s`
    : `Choose ${fileTypeLabel}`;
  const actualButtonLabel = buttonLabel ?? defaultButtonLabel;

  // Default hint text
  const defaultHintText = allowMultiple
    ? `or drag and drop ${fileTypeLabel}s here`
    : `or drag and drop a ${fileTypeLabel} here`;
  const actualHintText = hintText ?? defaultHintText;

  // Accepted MIME types
  const acceptedTypes = getAllowedMimeTypes(allowedTypes);

  // ============================================================================
  // Render
  // ============================================================================

  if (variation === 'button') {
    return (
      <div className="inline-block">
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept={acceptedTypes}
          multiple={allowMultiple}
          disabled={disabled}
          onChange={handleInputChange}
          className="sr-only"
          tabIndex={-1}
        />
        <Button
          type="secondary"
          onClick={handleClick}
          disabled={disabled}
          icon="upload"
          ariaLabel={actualButtonLabel}
          fullWidth
        >
          {actualButtonLabel}
        </Button>
        {validationErrors.length > 0 && (
          <div className="mt-2 space-y-1">
            {validationErrors.map((error, index) => (
              <Text key={index} variation="error" size="small">
                {error.message}
              </Text>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Dropzone variation
  return (
    <div>
      <div
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        className={`
          relative flex flex-col items-center justify-center gap-2
          rounded-lg border-2 border-dashed p-6 transition-colors
          cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
          ${isDragActive
            ? 'border-[var(--color-interactive)] bg-[var(--color-interactive)]/5'
            : validationErrors.length > 0
              ? 'border-[var(--color-critical)] bg-[var(--color-critical)]/5'
              : 'border-[--color-border] hover:border-[--color-border--hover] bg-[--color-surface--background]'
          }
          ${disabled ? 'cursor-not-allowed opacity-50' : ''}
          ${size === 'small' ? 'p-4' : 'p-6'}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept={acceptedTypes}
          multiple={allowMultiple}
          disabled={disabled}
          onChange={handleInputChange}
          className="sr-only"
          tabIndex={-1}
        />

        {children || (
          <>
            <Icon name="upload" size="large" color="greyBlue" />
            <Button
              type="secondary"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              disabled={disabled}
            >
              {actualButtonLabel}
            </Button>
            {size === 'base' && (
              <>
                <Text variation="subdued" size="small">
                  {actualHintText}
                </Text>
                {description && (
                  <Text variation="subdued" size="small">
                    {description}
                  </Text>
                )}
              </>
            )}
          </>
        )}
      </div>

      {validationErrors.length > 0 && (
        <div className="mt-2 space-y-1">
          {validationErrors.map((error, index) => (
            <Text key={index} variation="error" size="small">
              {error.message}
            </Text>
          ))}
        </div>
      )}
    </div>
  );
}
