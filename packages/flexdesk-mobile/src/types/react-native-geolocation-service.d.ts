/**
 * Type declarations for react-native-geolocation-service.
 *
 * The package ships its own types, but this stub ensures typecheck
 * passes even without node_modules installed.
 */
declare module 'react-native-geolocation-service' {
  export interface GeoPosition {
    coords: {
      latitude: number;
      longitude: number;
      altitude: number | null;
      accuracy: number;
      altitudeAccuracy: number | null;
      heading: number | null;
      speed: number | null;
    };
    timestamp: number;
  }

  export interface GeoError {
    code: number;
    message: string;
  }

  export interface GeoOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
    distanceFilter?: number;
    showLocationDialog?: boolean;
    forceRequestLocation?: boolean;
    forceLocationManager?: boolean;
  }

  export type SuccessCallback = (position: GeoPosition) => void;
  export type ErrorCallback = (error: GeoError) => void;

  const Geolocation: {
    getCurrentPosition(
      success: SuccessCallback,
      error?: ErrorCallback,
      options?: GeoOptions,
    ): void;
    watchPosition(
      success: SuccessCallback,
      error?: ErrorCallback,
      options?: GeoOptions,
    ): number;
    clearWatch(watchId: number): void;
    stopObserving(): void;
    requestAuthorization(authorizationLevel: 'always' | 'whenInUse'): Promise<'granted' | 'denied' | 'disabled' | 'restricted'>;
  };

  export default Geolocation;
}
