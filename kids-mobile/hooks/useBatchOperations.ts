import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

export interface BatchableVideo {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  channelName?: string;
  duration?: string;
  summary?: string;
}

interface BatchOperationsState {
  selectedVideos: BatchableVideo[];
  isProcessing: boolean;
  processedCount: number;
}

export function useBatchOperations() {
  const [state, setState] = useState<BatchOperationsState>({
    selectedVideos: [],
    isProcessing: false,
    processedCount: 0
  });

  const addToSelection = useCallback((video: BatchableVideo) => {
    setState(prev => {
      if (prev.selectedVideos.find(v => v.id === video.id)) {
        // Already selected, remove it
        return {
          ...prev,
          selectedVideos: prev.selectedVideos.filter(v => v.id !== video.id)
        };
      } else {
        // Not selected, add it (limit to 10 for batch processing)
        if (prev.selectedVideos.length >= 10) {
          Alert.alert('Limit Reached', 'You can only select up to 10 videos for batch approval.');
          return prev;
        }
        return {
          ...prev,
          selectedVideos: [...prev.selectedVideos, video]
        };
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedVideos: []
    }));
  }, []);

  const isSelected = useCallback((videoId: string): boolean => {
    return state.selectedVideos.some(v => v.id === videoId);
  }, [state.selectedVideos]);

  const batchApprove = useCallback(async (
    childId: string,
    onSuccess?: (approvedCount: number) => void,
    onError?: (error: string) => void
  ) => {
    if (state.selectedVideos.length === 0) {
      Alert.alert('No Selection', 'Please select videos to approve.');
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true, processedCount: 0 }));

    try {
      console.log(`📦 Batch approving ${state.selectedVideos.length} videos...`);

      const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://172.16.22.127:8081';
      const response = await fetch(`${apiBaseUrl}/api/approved-videos/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childId,
          videos: state.selectedVideos.map(video => ({
            youtubeId: video.id,
            title: video.title,
            description: video.description,
            thumbnail: video.thumbnail,
            channelName: video.channelName,
            duration: video.duration,
            summary: video.summary,
          }))
        }),
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const errorData = await response.json();
        const errorMessage = errorData.message || `Too many requests. Please wait ${retryAfter} seconds`;

        Alert.alert('Rate Limit Exceeded', errorMessage);
        if (onError) onError(errorMessage);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        const approvedCount = data.approvedCount || state.selectedVideos.length;

        Alert.alert(
          'Batch Approval Complete! 🎉',
          `Successfully approved ${approvedCount} video${approvedCount !== 1 ? 's' : ''}.`
        );

        setState(prev => ({
          ...prev,
          processedCount: approvedCount,
          selectedVideos: [] // Clear selection after successful batch approval
        }));

        if (onSuccess) onSuccess(approvedCount);

        console.log(`✅ Batch approved ${approvedCount} videos successfully`);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to approve videos';
        console.error('❌ Batch approve error:', errorData);

        Alert.alert('Batch Approval Failed', errorMessage);
        if (onError) onError(errorMessage);
      }
    } catch (error) {
      const errorMessage = 'Failed to approve videos. Please check your connection.';
      console.error('❌ Batch approve network error:', error);

      Alert.alert('Network Error', errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [state.selectedVideos]);

  const getSelectionSummary = useCallback((): string => {
    const count = state.selectedVideos.length;
    if (count === 0) return 'No videos selected';
    if (count === 1) return '1 video selected';
    return `${count} videos selected`;
  }, [state.selectedVideos]);

  return {
    selectedVideos: state.selectedVideos,
    isProcessing: state.isProcessing,
    processedCount: state.processedCount,
    selectionCount: state.selectedVideos.length,
    addToSelection,
    clearSelection,
    isSelected,
    batchApprove,
    getSelectionSummary,
    hasSelection: state.selectedVideos.length > 0,
    isSelectionFull: state.selectedVideos.length >= 10
  };
}