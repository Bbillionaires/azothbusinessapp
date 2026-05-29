declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    mergeItem(key: string, value: string): Promise<void>;
    clear(): Promise<void>;
    getAllKeys(): Promise<readonly string[]>;
    multiGet(keys: string[]): Promise<readonly [string, string | null][]>;
    multiSet(keyValuePairs: [string, string][]): Promise<void>;
    multiRemove(keys: string[]): Promise<void>;
  };
  export default AsyncStorage;
}

declare module '@react-native-firebase/messaging' {
  interface FirebaseMessagingTypes {
    getToken(): Promise<string>;
    onMessage(handler: (message: any) => void): () => void;
    onNotificationOpenedApp(handler: (message: any) => void): () => void;
    getInitialNotification(): Promise<any>;
    requestPermission(): Promise<number>;
    hasPermission(): Promise<number>;
    onTokenRefresh(handler: (token: string) => void): () => void;
    setBackgroundMessageHandler(handler: (message: any) => Promise<void>): void;
  }
  interface MessagingModule {
    (): FirebaseMessagingTypes;
    AuthorizationStatus: {
      NOT_DETERMINED: -1;
      DENIED: 0;
      AUTHORIZED: 1;
      PROVISIONAL: 2;
    };
  }
  const messaging: MessagingModule;
  export default messaging;
}
