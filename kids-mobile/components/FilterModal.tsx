import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Fonts, FontSizes } from '@/constants/Fonts';
import { getAgeGroupInfo, getCategoryIcon } from '@/lib/growth-categories';

const { width, height } = Dimensions.get('window');

interface Child {
  id: string;
  name: string;
  birthday: string;
  interests: string[];
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  selectedChild: Child | null;
  filters: {
    category: string;
    duration: string;
    uploadDate: string;
    sortBy: string;
  };
  onFiltersChange: (filters: any) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  selectedChild,
  filters,
  onFiltersChange,
}) => {
  const ageGroupInfo = selectedChild ? getAgeGroupInfo(selectedChild.birthday) : null;
  
  const dynamicCategories = [
    { value: 'all', label: 'All Categories', icon: '🎯' },
    ...(ageGroupInfo?.categories.map(cat => ({
      value: cat.id,
      label: cat.name,
      icon: getCategoryIcon(cat.id),
    })) || [])
  ];

  const durationOptions = [
    { key: 'any', label: 'Any Length' },
    { key: 'short', label: 'Short (< 4 min)' },
    { key: 'medium', label: 'Medium (4-20 min)' },
    { key: 'long', label: 'Long (> 20 min)' }
  ];

  const uploadDateOptions = [
    { key: 'any', label: 'Any time' },
    { key: 'hour', label: 'Last hour' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This week' },
    { key: 'month', label: 'This month' },
    { key: 'year', label: 'This year' }
  ];

  const sortByOptions = [
    { key: 'relevance', label: 'Relevance' },
    { key: 'date', label: 'Upload date' },
    { key: 'viewCount', label: 'View count' },
    { key: 'rating', label: 'Rating' }
  ];

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFiltersChange({
      category: 'all',
      duration: 'any',
      uploadDate: 'any',
      sortBy: 'relevance'
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <IconSymbol name="xmark" size={24} color={Colors.light.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Filter Videos</Text>
          <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Age Group Info */}
          {ageGroupInfo && (
            <View style={styles.ageGroupSection}>
              <Text style={styles.ageGroupTitle}>
                {ageGroupInfo.ageGroup} ({ageGroupInfo.age} years)
              </Text>
              <Text style={styles.ageGroupSubtitle}>
                Focus: {ageGroupInfo.skillFocus.slice(0, 2).join(', ')}
              </Text>
            </View>
          )}

          {/* Category Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Category</Text>
            <View style={styles.filterGrid}>
              {dynamicCategories.map((category) => {
                const isSelected = filters.category === category.value;
                return (
                  <TouchableOpacity
                    key={category.value}
                    style={[
                      styles.filterOption,
                      isSelected && styles.filterOptionSelected
                    ]}
                    onPress={() => handleFilterChange('category', category.value)}
                  >
                    <Text style={styles.filterOptionIcon}>{category.icon}</Text>
                    <Text style={[
                      styles.filterOptionText,
                      isSelected && styles.filterOptionTextSelected
                    ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Duration Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Duration</Text>
            <View style={styles.filterList}>
              {durationOptions.map((option) => {
                const isSelected = filters.duration === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterListItem,
                      isSelected && styles.filterListItemSelected
                    ]}
                    onPress={() => handleFilterChange('duration', option.key)}
                  >
                    <Text style={[
                      styles.filterListText,
                      isSelected && styles.filterListTextSelected
                    ]}>
                      {option.label}
                    </Text>
                    {isSelected && (
                      <IconSymbol name="checkmark" size={16} color={Colors.light.textOnColor} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Upload Date Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Upload Date</Text>
            <View style={styles.filterList}>
              {uploadDateOptions.map((option) => {
                const isSelected = filters.uploadDate === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterListItem,
                      isSelected && styles.filterListItemSelected
                    ]}
                    onPress={() => handleFilterChange('uploadDate', option.key)}
                  >
                    <Text style={[
                      styles.filterListText,
                      isSelected && styles.filterListTextSelected
                    ]}>
                      {option.label}
                    </Text>
                    {isSelected && (
                      <IconSymbol name="checkmark" size={16} color={Colors.light.textOnColor} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Sort By Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Sort By</Text>
            <View style={styles.filterList}>
              {sortByOptions.map((option) => {
                const isSelected = filters.sortBy === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterListItem,
                      isSelected && styles.filterListItemSelected
                    ]}
                    onPress={() => handleFilterChange('sortBy', option.key)}
                  >
                    <Text style={[
                      styles.filterListText,
                      isSelected && styles.filterListTextSelected
                    ]}>
                      {option.label}
                    </Text>
                    {isSelected && (
                      <IconSymbol name="checkmark" size={16} color={Colors.light.textOnColor} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Apply Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyButton} onPress={onClose}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.ui.semibold,
    color: Colors.light.textPrimary,
  },
  resetButton: {
    padding: 4,
  },
  resetButtonText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.ui.medium,
    color: Colors.light.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  ageGroupSection: {
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 12,
    marginVertical: 16,
  },
  ageGroupTitle: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.ui.semibold,
    color: Colors.light.primary,
  },
  ageGroupSubtitle: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.regular,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  filterSection: {
    marginBottom: 32,
  },
  filterTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.ui.semibold,
    color: Colors.light.textPrimary,
    marginBottom: 16,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: (width - 64) / 2,
  },
  filterOptionSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterOptionIcon: {
    fontSize: FontSizes.base,
    marginRight: 6,
  },
  filterOptionText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.content.medium,
    color: Colors.light.textPrimary,
    flex: 1,
  },
  filterOptionTextSelected: {
    color: Colors.light.textOnColor,
  },
  filterList: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  filterListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  filterListItemSelected: {
    backgroundColor: Colors.light.primary,
  },
  filterListText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.content.regular,
    color: Colors.light.textPrimary,
  },
  filterListTextSelected: {
    color: Colors.light.textOnColor,
    fontFamily: Fonts.content.semibold,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  applyButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.ui.semibold,
    color: Colors.light.textOnColor,
  },
});

export default FilterModal;