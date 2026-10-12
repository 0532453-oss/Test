declare module '@react-native-community/netinfo' {
  export interface NetInfoState {
    type: string;
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
    details: unknown;
  }

  export interface NetInfoSubscription {
    (): void;
  }

  const NetInfo: {
    addEventListener(listener: (state: NetInfoState) => void): NetInfoSubscription;
    fetch(): Promise<NetInfoState>;
  };

  export default NetInfo;
}
