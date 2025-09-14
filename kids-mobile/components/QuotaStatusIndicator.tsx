/**
 * Quota Status Indicator Component
 * Shows users their daily API quota usage in a friendly way
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, ThemeColors } from '@/constants/Colors';
import { useAuth } from '@clerk/clerk-expo';

interface QuotaStatus {
  user: {
    searchesUsed: number;
    searchesRemaining: number;
    unitsUsed: number;
    canMakeRequests: boolean;
    dailyLimit: number;
  };
  global: {
    totalUnitsUsed: number;
    totalUnitsRemaining: number;
    activeUsers: number;
    dailyLimit: number;
  };
  tips: {
    message: string;
    recommendedActions: string[];
  };
}

interface QuotaStatusIndicatorProps {
  onQuotaUpdate?: (status: QuotaStatus) => void;
}

export default function QuotaStatusIndicator({ onQuotaUpdate }: QuotaStatusIndicatorProps) {
  const { getToken } = useAuth();
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadQuotaStatus();
    // Refresh quota status every 5 minutes
    const interval = setInterval(loadQuotaStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadQuotaStatus = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://172.16.22.127:8081';
      const response = await fetch(`${apiBaseUrl}/api/quota-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const status = await response.json();
        setQuotaStatus(status);
        onQuotaUpdate?.(status);
      }
    } catch (error) {
      console.error('❌ Failed to load quota status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (): string => {
    if (!quotaStatus) return ThemeColors.analytics.activity;

    const remaining = quotaStatus.user.searchesRemaining;
    if (remaining <= 0) return Colors.light.error;
    if (remaining <= 3) return ThemeColors.charts.warning;
    return ThemeColors.analytics.completion;
  };

  const getStatusIcon = (): keyof typeof Ionicons.glyphMap => {
    if (!quotaStatus) return 'hourglass-outline';

    const remaining = quotaStatus.user.searchesRemaining;
    if (remaining <= 0) return 'warning-outline';
    if (remaining <= 3) return 'time-outline';
    return 'checkmark-circle-outline';
  };

  const getStatusText = (): string => {
    if (!quotaStatus) return 'Loading...';

    const remaining = quotaStatus.user.searchesRemaining;
    if (remaining <= 0) return 'Limit Reached';
    if (remaining <= 3) return `${remaining} left`;
    return `${remaining} searches`;
  };

  const showQuotaDetails = () => {
    if (!quotaStatus) {
      Alert.alert('Quota Status', 'Loading quota information...');
      return;
    }

    const { user, global, tips } = quotaStatus;

    Alert.alert(
      'Daily Quota Status',
      `Your Usage: ${user.searchesUsed}/${user.dailyLimit} searches\n` +
      `Global Usage: ${Math.round((global.totalUnitsUsed / global.dailyLimit) * 100)}% of daily limit\n\n` +
      `💡 ${tips.message}\n\n` +
      `Recommended Actions:\n${tips.recommendedActions.map(action => `• ${action}`).join('\n')}`,
      [
        { text: 'Refresh', onPress: loadQuotaStatus },
        { text: 'OK', style: 'default' }
      ]
    );
  };

  if (!quotaStatus && !loading) return null;

  return (
    <TouchableOpacity
      style={[styles.indicator, { borderColor: getStatusColor() }]}
      onPress={showQuotaDetails}
      activeOpacity={0.7}
    >
      <Ionicons
        name={getStatusIcon()}
        size={16}
        color={getStatusColor()}
        style={styles.icon}
      />
      <Text style={[styles.text, { color: getStatusColor() }]}>
        {getStatusText()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: Colors.light.background,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});





