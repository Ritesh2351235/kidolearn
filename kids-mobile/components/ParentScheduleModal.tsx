import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Alert,
  FlatList,
  TextInput,
  Platform,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { apiClient } from '@/lib/api';
import { getApiBaseUrl } from '@/lib/productionConfig';
import { useAuth } from '@clerk/clerk-expo';

interface ApprovedVideo {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  category?: string;
  child: {
    id: string;
    name: string;
  };
}

interface Child {
  id: string;
  name: string;
}

interface ParentScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onSchedule: (videoIds: string[], childrenIds: string[], date: string) => Promise<void>;
}

export default function ParentScheduleModal({ visible, onClose, onSchedule }: ParentScheduleModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { getToken } = useAuth();
  
  const [step, setStep] = useState(1); // 1: Select Videos, 2: Select Children, 3: Select Date
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [approvedVideos, setApprovedVideos] = useState<ApprovedVideo[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const token = await getToken();
      if (!token) {
        console.log('❌ No auth token for schedule modal');
        return;
      }

      // Load children first using API client
      try {
        const childrenData = await apiClient.getChildren(token);
        setChildren(childrenData || []);
        console.log('✅ Loaded', childrenData?.length || 0, 'children for scheduling');
        
        // Load approved videos for all children
        if (childrenData && childrenData.length > 0) {
          const allVideos: ApprovedVideo[] = [];
          
          for (const child of childrenData) {
            try {
              const childVideos = await apiClient.getApprovedVideos(child.id, token);
              // Format videos to match the interface
              const formattedVideos = childVideos.map(video => ({
                id: video.id,
                title: video.title,
                duration: video.duration || 'Unknown',
                thumbnail: video.thumbnail,
                category: 'Educational',
                child: {
                  id: child.id,
                  name: child.name
                }
              }));
              allVideos.push(...formattedVideos);
            } catch (videoError) {
              console.log(`❌ Error loading videos for child ${child.name}:`, videoError);
            }
          }
          
          setApprovedVideos(allVideos);
          console.log('✅ Loaded', allVideos.length, 'total approved videos for scheduling');
        } else {
          console.log('⚠️ No children found, cannot load approved videos');
          setApprovedVideos([]);
        }
      } catch (error) {
        console.log('❌ Error loading children and videos:', error);
        setChildren([]);
        setApprovedVideos([]);
      }
      
    } catch (error) {
      console.error('Error loading schedule data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setSelectedVideos([]);
    setSelectedChildren([]);
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleVideoToggle = (videoId: string, childId: string) => {
    const compositeId = `${videoId}-${childId}`;
    setSelectedVideos(prev => 
      prev.includes(compositeId) 
        ? prev.filter(id => id !== compositeId)
        : [...prev, compositeId]
    );
  };

  const handleChildToggle = (childId: string) => {
    setSelectedChildren(prev => 
      prev.includes(childId) 
        ? prev.filter(id => id !== childId)
        : [...prev, childId]
    );
  };

  const handleNext = () => {
    if (step === 1 && selectedVideos.length === 0) {
      Alert.alert('Error', 'Please select at least one video');
      return;
    }
    if (step === 2 && selectedChildren.length === 0) {
      Alert.alert('Error', 'Please select at least one child');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSchedule = async () => {
    try {
      setIsLoading(true);
      
      // Extract actual video IDs from composite IDs (videoId-childId format)
      const actualVideoIds = selectedVideos.map(compositeId => compositeId.split('-')[0]);
      
      await onSchedule(actualVideoIds, selectedChildren, selectedDate);
      Alert.alert('Success', 'Videos scheduled successfully!');
      handleClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule videos. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderVideoItem = ({ item }: { item: ApprovedVideo }) => {
    const compositeId = `${item.id}-${item.child.id}`;
    const isSelected = selectedVideos.includes(compositeId);
    
    return (
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          padding: 16,
          backgroundColor: isSelected ? colors.primary + '20' : colors.cardBackground,
          borderRadius: 12,
          marginBottom: 12,
          borderWidth: isSelected ? 2 : 1,
          borderColor: isSelected ? colors.primary : colors.border,
        }}
        onPress={() => handleVideoToggle(item.id, item.child.id)}
        activeOpacity={0.7}
      >
        <View style={{
          width: 80,
          height: 60,
          backgroundColor: colors.border,
          borderRadius: 8,
          marginRight: 12,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <IconSymbol name="play.circle.fill" size={24} color={colors.textTertiary} />
        </View>
        
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.textPrimary,
            fontFamily: 'Poppins_600SemiBold',
            marginBottom: 4
          }}>
            {item.title}
          </Text>
          <Text style={{
            fontSize: 14,
            color: colors.textSecondary,
            fontFamily: 'Poppins_400Regular'
          }}>
            {item.duration} • {item.category || 'Educational'}
          </Text>
        </View>
        
        <View style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: isSelected ? colors.primary : colors.border,
          backgroundColor: isSelected ? colors.primary : 'transparent',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {isSelected && (
            <IconSymbol name="checkmark" size={16} color={colors.textOnColor} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderChildItem = ({ item }: { item: Child }) => {
    const isSelected = selectedChildren.includes(item.id);
    
    return (
      <TouchableOpacity
        style={{
          padding: 20,
          backgroundColor: isSelected ? colors.primary + '20' : colors.cardBackground,
          borderRadius: 12,
          marginBottom: 12,
          borderWidth: isSelected ? 2 : 1,
          borderColor: isSelected ? colors.primary : colors.border,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
        onPress={() => handleChildToggle(item.id)}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.secondary + '30',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 16
          }}>
            <IconSymbol name="person.fill" size={24} color={colors.secondary} />
          </View>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: colors.textPrimary,
            fontFamily: 'Poppins_600SemiBold'
          }}>
            {item.name}
          </Text>
        </View>
        
        <View style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: isSelected ? colors.primary : colors.border,
          backgroundColor: isSelected ? colors.primary : 'transparent',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {isSelected && (
            <IconSymbol name="checkmark" size={16} color={colors.textOnColor} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: colors.textPrimary,
              fontFamily: 'Poppins_600SemiBold',
              marginBottom: 20
            }}>
              Select Videos to Schedule ({selectedVideos.length} selected)
            </Text>
            
            <FlatList
              data={approvedVideos}
              renderItem={renderVideoItem}
              keyExtractor={(item) => `${item.id}-${item.child.id}`}
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
            />
          </View>
        );
        
      case 2:
        return (
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: colors.textPrimary,
              fontFamily: 'Poppins_600SemiBold',
              marginBottom: 20
            }}>
              Select Children ({selectedChildren.length} selected)
            </Text>
            
            <FlatList
              data={children}
              renderItem={renderChildItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
            />
          </View>
        );
        
      case 3:
        return (
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: colors.textPrimary,
              fontFamily: 'Poppins_600SemiBold',
              marginBottom: 20
            }}>
              Select Schedule Date
            </Text>
            
            <View style={{
              backgroundColor: colors.cardBackground,
              borderRadius: 12,
              padding: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: colors.border
            }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.textSecondary,
                fontFamily: 'Poppins_600SemiBold',
                marginBottom: 12
              }}>
                Date
              </Text>
              
              <TextInput
                style={{
                  backgroundColor: colors.background,
                  borderRadius: 8,
                  padding: 16,
                  fontSize: 16,
                  color: colors.textPrimary,
                  borderWidth: 1,
                  borderColor: colors.border,
                  fontFamily: 'Poppins_400Regular'
                }}
                value={selectedDate}
                onChangeText={setSelectedDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            
            {/* Summary */}
            <View style={{
              backgroundColor: colors.primary + '10',
              borderRadius: 12,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.primary + '30'
            }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.textPrimary,
                fontFamily: 'Poppins_600SemiBold',
                marginBottom: 12
              }}>
                Summary
              </Text>
              
              <Text style={{
                fontSize: 14,
                color: colors.textSecondary,
                fontFamily: 'Poppins_400Regular',
                marginBottom: 8
              }}>
                Videos: {selectedVideos.length} selected
              </Text>
              
              <Text style={{
                fontSize: 14,
                color: colors.textSecondary,
                fontFamily: 'Poppins_400Regular',
                marginBottom: 8
              }}>
                Children: {selectedChildren.length} selected
              </Text>
              
              <Text style={{
                fontSize: 14,
                color: colors.textSecondary,
                fontFamily: 'Poppins_400Regular'
              }}>
                Date: {new Date(selectedDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={{
        flex: 1,
        backgroundColor: colors.background
      }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 20,
          paddingTop: Platform.OS === 'ios' ? 60 : 20,
          borderBottomWidth: 1,
          borderBottomColor: colors.border
        }}>
          <TouchableOpacity onPress={step > 1 ? handleBack : handleClose}>
            <IconSymbol 
              name={step > 1 ? "chevron.left" : "xmark"} 
              size={24} 
              color={colors.textPrimary} 
            />
          </TouchableOpacity>
          
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: colors.textPrimary,
            fontFamily: 'Poppins_700Bold'
          }}>
            Schedule Videos
          </Text>
          
          <View style={{ width: 24 }} />
        </View>

        {/* Progress Indicator */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 20,
          paddingHorizontal: 20
        }}>
          {[1, 2, 3].map((stepNumber) => (
            <View key={stepNumber} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: step >= stepNumber ? colors.primary : colors.border,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: step >= stepNumber ? colors.textOnColor : colors.textTertiary,
                  fontFamily: 'Poppins_600SemiBold'
                }}>
                  {stepNumber}
                </Text>
              </View>
              {stepNumber < 3 && (
                <View style={{
                  width: 40,
                  height: 2,
                  backgroundColor: step > stepNumber ? colors.primary : colors.border,
                  marginHorizontal: 8
                }} />
              )}
            </View>
          ))}
        </View>

        {/* Content */}
        <View style={{ flex: 1, padding: 20 }}>
          {renderStepContent()}
        </View>

        {/* Footer Buttons */}
        <View style={{
          flexDirection: 'row',
          padding: 20,
          paddingBottom: Platform.OS === 'ios' ? 40 : 20,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          gap: 12
        }}>
          {step < 3 ? (
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: colors.primary,
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center'
              }}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.textOnColor,
                fontFamily: 'Poppins_600SemiBold'
              }}>
                Next
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: colors.primary,
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center',
                opacity: isLoading ? 0.6 : 1
              }}
              onPress={handleSchedule}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.textOnColor,
                fontFamily: 'Poppins_600SemiBold'
              }}>
                {isLoading ? 'Scheduling...' : 'Schedule Videos'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}