import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts, FontSizes } from '@/constants/Fonts';
// Light mode only - removed useColorScheme
import { useAuth } from '@clerk/clerk-expo';
import { getApiBaseUrl } from '@/lib/productionConfig';

interface AddChildModalProps {
  visible: boolean;
  onClose: () => void;
  onChildCreated: (child: any) => void;
}

const INTEREST_OPTIONS = [
  'Science', 'Math', 'Art', 'Music', 'Sports', 'Animals',
  'Nature', 'History', 'Geography', 'Technology', 'Cooking',
  'Reading', 'Languages', 'Dancing', 'Building', 'Space',
  'Dinosaurs', 'Cars'
];

export default function AddChildModal({ visible, onClose, onChildCreated }: AddChildModalProps) {
  // Force light mode only
  const colors = Colors.light;
  const { getToken } = useAuth();

  // Form state
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form validation
  const isFormValid = name.trim().length > 0 && selectedInterests.length >= 3;
  const interestSelectionText = selectedInterests.length < 3
    ? `Select at least 3 interests (${selectedInterests.length}/3)`
    : `${selectedInterests.length} interests selected`;

  const resetForm = () => {
    setName('');
    setBirthday(new Date());
    setSelectedInterests([]);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setBirthday(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setIsLoading(true);

    try {
      console.log('🔍 Creating child profile:', {
        name: name.trim(),
        birthday: birthday.toISOString(),
        interests: selectedInterests
      });

      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please sign in again.');
        return;
      }

      const response = await fetch(`${getApiBaseUrl()}/api/children`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          birthday: birthday.toISOString(),
          interests: selectedInterests,
        }),
      });

      console.log('📡 API Response:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Child created successfully:', data.child);

        Alert.alert(
          'Success! 🎉',
          `${name}'s profile has been created successfully!`,
          [
            {
              text: 'Continue',
              onPress: () => {
                onChildCreated(data.child);
                resetForm();
                onClose();
              }
            }
          ]
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error:', response.status, errorData);

        Alert.alert(
          'Error',
          errorData.error || 'Failed to create child profile. Please try again.'
        );
      }
    } catch (error) {
      console.error('❌ Error creating child:', error);
      Alert.alert(
        'Error',
        'Failed to create child profile. Please check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    resetForm();
    onClose();
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
          <TouchableOpacity onPress={handleClose} disabled={isLoading}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: colors.textPrimary,
            fontFamily: Fonts.ui.bold
          }}>
            Add Child Profile
          </Text>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isFormValid || isLoading}
            style={{
              backgroundColor: isFormValid ? colors.primary : colors.textTertiary,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 12,
            }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.textOnColor} />
            ) : (
              <Text style={{
                color: colors.textOnColor,
                fontSize: 14,
                fontWeight: '600',
                fontFamily: Fonts.content.semibold
              }}>
                Create
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Child Name Section */}
          <View style={{
            backgroundColor: colors.cardBackground,
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: colors.border
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: colors.textPrimary,
              fontFamily: Fonts.ui.bold,
              marginBottom: 12
            }}>
              Child's Name
            </Text>

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                fontFamily: Fonts.content.regular,
                color: colors.textPrimary,
                backgroundColor: colors.background
              }}
              placeholder="Enter child's name"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
              maxLength={50}
            />
          </View>

          {/* Birthday Section */}
          <View style={{
            backgroundColor: colors.cardBackground,
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: colors.border
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: colors.textPrimary,
              fontFamily: Fonts.ui.bold,
              marginBottom: 12
            }}>
              Birthday
            </Text>

            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: colors.background
              }}
            >
              <Text style={{
                fontSize: 16,
                fontFamily: Fonts.content.regular,
                color: colors.textPrimary
              }}>
                {formatDate(birthday)}
              </Text>
              <Ionicons name="calendar" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <Text style={{
              fontSize: 14,
              color: colors.textSecondary,
              fontFamily: Fonts.content.regular,
              marginTop: 8
            }}>
              Age: {calculateAge(birthday)} years old
            </Text>

            {showDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={birthday}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(new Date().getFullYear() - 18, 0, 1)}
              />
            )}
          </View>

          {/* Interests Section */}
          <View style={{
            backgroundColor: colors.cardBackground,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: colors.textPrimary,
                fontFamily: Fonts.ui.bold
              }}>
                Interests
              </Text>

              <Text style={{
                fontSize: 14,
                color: selectedInterests.length >= 3 ? colors.success : colors.warning,
                fontFamily: Fonts.content.semibold,
                fontWeight: '600'
              }}>
                {interestSelectionText}
              </Text>
            </View>

            <Text style={{
              fontSize: 14,
              color: colors.textSecondary,
              fontFamily: Fonts.content.regular,
              marginBottom: 16,
              lineHeight: 20
            }}>
              Select at least 3 interests to help us recommend the best educational content for your child.
            </Text>

            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 12
            }}>
              {INTEREST_OPTIONS.map((interest) => {
                const isSelected = selectedInterests.includes(interest);

                return (
                  <TouchableOpacity
                    key={interest}
                    onPress={() => toggleInterest(interest)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 20,
                      borderWidth: 2,
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? colors.primary : colors.background,
                      minWidth: 80,
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{
                      fontSize: 14,
                      fontFamily: Fonts.content.semibold,
                      fontWeight: '600',
                      color: isSelected ? colors.textOnColor : colors.textSecondary
                    }}>
                      {interest}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedInterests.length < 3 && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 16,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderRadius: 8
              }}>
                <Ionicons name="information-circle" size={16} color={colors.warning} />
                <Text style={{
                  fontSize: 12,
                  color: colors.warning,
                  fontFamily: Fonts.content.regular,
                  marginLeft: 8
                }}>
                  Please select {3 - selectedInterests.length} more interest{3 - selectedInterests.length !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}