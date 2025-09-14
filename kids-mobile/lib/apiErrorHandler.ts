import { Alert } from 'react-native';

export interface ApiError {
  status: number;
  message: string;
  isNetworkError: boolean;
  isRetryable: boolean;
}

export const handleApiError = (error: any, context: string = 'API request'): ApiError => {
  console.error(`❌ ${context} failed:`, error);

  let apiError: ApiError = {
    status: 0,
    message: 'Unknown error occurred',
    isNetworkError: false,
    isRetryable: true,
  };

  if (error?.response) {
    // HTTP error response
    apiError.status = error.response.status;
    apiError.message = error.response.data?.message || `HTTP ${error.response.status} error`;
    apiError.isNetworkError = false;

    switch (error.response.status) {
      case 404:
        apiError.message = 'Resource not found. The server may be updating.';
        apiError.isRetryable = true;
        break;
      case 429:
        apiError.message = 'Too many requests. Please wait a moment and try again.';
        apiError.isRetryable = true;
        break;
      case 500:
      case 502:
      case 503:
        apiError.message = 'Server temporarily unavailable. Please try again later.';
        apiError.isRetryable = true;
        break;
      case 401:
      case 403:
        apiError.message = 'Authentication required. Please sign in again.';
        apiError.isRetryable = false;
        break;
      default:
        apiError.isRetryable = error.response.status >= 500;
    }
  } else if (error?.request) {
    // Network error
    apiError.isNetworkError = true;
    apiError.message = 'Network connection failed. Please check your internet connection.';
    apiError.isRetryable = true;
  } else if (error?.message) {
    // Other error
    apiError.message = error.message;
    apiError.isRetryable = true;
  }

  return apiError;
};

export const showApiErrorAlert = (
  error: ApiError,
  context: string = 'Operation',
  onRetry?: () => void,
  onCancel?: () => void
) => {
  const title = error.isNetworkError ? 'Connection Error' : `${context} Failed`;

  const buttons: any[] = [];

  if (error.isRetryable && onRetry) {
    buttons.push({ text: 'Try Again', onPress: onRetry });
  }

  buttons.push({
    text: 'OK',
    style: 'cancel',
    onPress: onCancel
  });

  Alert.alert(title, error.message, buttons);
};

export const withApiErrorHandling = async <T>(
  operation: () => Promise<T>,
  context: string = 'API request',
  showAlert: boolean = false,
  onError?: (error: ApiError) => void
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    const apiError = handleApiError(error, context);

    if (onError) {
      onError(apiError);
    }

    if (showAlert) {
      showApiErrorAlert(apiError, context);
    }

    return null;
  }
};

// Retry utility with exponential backoff
export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  context: string = 'Operation'
): Promise<T | null> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const apiError = handleApiError(error, context);

      if (!apiError.isRetryable || attempt === maxRetries) {
        console.error(`❌ ${context} failed after ${attempt + 1} attempts`);
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`⏳ ${context} failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return null;
};
