/**
 * Type declarations for react-native-image-picker.
 *
 * The package ships its own types, but this stub ensures typecheck
 * passes even without node_modules installed.
 */
declare module 'react-native-image-picker' {
  export interface Asset {
    uri?: string;
    fileName?: string;
    fileSize?: number;
    type?: string;
    width?: number;
    height?: number;
    base64?: string;
    originalPath?: string;
  }

  export interface ImagePickerResponse {
    didCancel?: boolean;
    errorCode?: string;
    errorMessage?: string;
    assets?: Asset[];
  }

  export interface CameraOptions {
    mediaType: 'photo' | 'video' | 'mixed';
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    includeBase64?: boolean;
    saveToPhotos?: boolean;
    cameraType?: 'back' | 'front';
    presentationStyle?: 'fullScreen' | 'pageSheet' | 'formSheet' | 'currentContext' | 'overFullScreen' | 'overCurrentContext' | 'popover';
  }

  export interface ImageLibraryOptions {
    mediaType: 'photo' | 'video' | 'mixed';
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    includeBase64?: boolean;
    selectionLimit?: number;
  }

  export function launchCamera(options: CameraOptions): Promise<ImagePickerResponse>;
  export function launchImageLibrary(options: ImageLibraryOptions): Promise<ImagePickerResponse>;
}
