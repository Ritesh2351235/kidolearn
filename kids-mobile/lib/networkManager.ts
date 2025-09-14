/**
 * Network Manager for Internet Connection Requirements
 * Shows "No Internet" popup when connection is unavailable
 */

import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

class NetworkManager {
  private isConnected: boolean = true;
  private listeners: ((isConnected: boolean) => void)[] = [];

  constructor() {
    this.initializeNetworkListener();
  }

  private initializeNetworkListener() {
    // Subscribe to network state updates
    NetInfo.addEventListener(state => {
      const wasConnected = this.isConnected;
      this.isConnected = state.isConnected ?? false;

      console.log('🌐 Network state changed:', {
        isConnected: this.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable
      });

      // Notify listeners of network changes
      this.listeners.forEach(listener => listener(this.isConnected));

      // Show popup when connection is lost
      if (wasConnected && !this.isConnected) {
        this.showNoInternetAlert();
      }

      // Show success message when connection is restored
      if (!wasConnected && this.isConnected) {
        this.showConnectionRestoredAlert();
      }
    });
  }

  // Check if device is connected to internet
  async checkConnection(): Promise<boolean> {
    const state = await NetInfo.fetch();
    this.isConnected = state.isConnected ?? false;

    console.log('🌐 Connection check:', {
      isConnected: this.isConnected,
      type: state.type,
      isInternetReachable: state.isInternetReachable
    });

    return this.isConnected;
  }

  // Get current connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Add listener for network state changes
  addNetworkListener(listener: (isConnected: boolean) => void) {
    this.listeners.push(listener);

    // Return cleanup function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Show "No Internet" alert
  showNoInternetAlert() {
    Alert.alert(
      'No Internet Connection',
      'This app requires an internet connection to work properly. Please check your network settings and try again.',
      [
        {
          text: 'Retry',
          onPress: async () => {
            const isConnected = await this.checkConnection();
            if (!isConnected) {
              // Still no connection, show alert again
              setTimeout(() => this.showNoInternetAlert(), 500);
            }
          }
        },
        {
          text: 'Settings',
          onPress: () => {
            // On iOS, this will open Settings app
            // On Android, you might need to use a library like react-native-android-open-settings
            Alert.alert(
              'Network Settings',
              'Please check your WiFi or cellular data connection in your device settings.',
              [{ text: 'OK' }]
            );
          }
        }
      ],
      { cancelable: false } // Prevent dismissing without action
    );
  }

  // Show connection restored message
  showConnectionRestoredAlert() {
    Alert.alert(
      'Connection Restored',
      'Internet connection has been restored. You can now use the app normally.',
      [{ text: 'OK' }],
      { cancelable: true }
    );
  }

  // Check connection before API calls
  async requireConnection(): Promise<boolean> {
    const isConnected = await this.checkConnection();

    if (!isConnected) {
      this.showNoInternetAlert();
      return false;
    }

    return true;
  }

  // Enhanced API call wrapper that checks connection first
  async withNetworkCheck<T>(
    apiCall: () => Promise<T>,
    errorMessage: string = 'Network request failed'
  ): Promise<T> {
    // First check if we have internet
    const hasConnection = await this.requireConnection();
    if (!hasConnection) {
      throw new Error('No internet connection');
    }

    try {
      return await apiCall();
    } catch (error) {
      console.error('🚨 API call failed:', error);

      // Check if it's a network error
      if (this.isNetworkError(error)) {
        // Double-check connection status
        const stillConnected = await this.checkConnection();
        if (!stillConnected) {
          this.showNoInternetAlert();
        } else {
          // Connected but API failed - show API error
          Alert.alert(
            'Service Unavailable',
            'The service is temporarily unavailable. Please try again in a few moments.',
            [
              { text: 'Retry', onPress: () => this.withNetworkCheck(apiCall, errorMessage) },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
        }
      }

      throw error;
    }
  }

  // Determine if error is network-related
  private isNetworkError(error: any): boolean {
    if (!error) return false;

    const errorMessage = error.message?.toLowerCase() || '';
    const networkErrorKeywords = [
      'network request failed',
      'network error',
      'connection failed',
      'timeout',
      'unreachable',
      'no internet',
      'connection refused'
    ];

    return networkErrorKeywords.some(keyword => errorMessage.includes(keyword));
  }
}

export const networkManager = new NetworkManager();
