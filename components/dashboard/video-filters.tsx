"use client";

import { memo, useCallback } from "react";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { VideoCategory, SearchFilters } from "@/lib/youtube";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface VideoFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  isLoading?: boolean;
}

const categories: Array<{ value: VideoCategory; label: string; icon: string }> = [
  { value: 'all', label: 'All Categories', icon: '🎯' },
  { value: 'education', label: 'Educational', icon: '📚' },
  { value: 'science', label: 'Science', icon: '🔬' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎪' },
  { value: 'music', label: 'Music', icon: '🎵' },
  { value: 'sports', label: 'Sports', icon: '⚽' },
  { value: 'arts', label: 'Arts & Crafts', icon: '🎨' },
  { value: 'stories', label: 'Stories', icon: '📖' },
];

const durations = [
  { value: 'any', label: 'Any Duration' },
  { value: 'short', label: 'Under 4 minutes' },
  { value: 'medium', label: '4-20 minutes' },
  { value: 'long', label: 'Over 20 minutes' },
];

const uploadDates = [
  { value: 'any', label: 'Any Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
];

const sortOptions = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'date', label: 'Most Recent' },
  { value: 'viewCount', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
];

function VideoFilters({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  filters,
  onFiltersChange,
  isLoading = false
}: VideoFiltersProps) {
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearchSubmit();
    }
  }, [onSearchSubmit]);

  const handleCategoryChange = useCallback((category: VideoCategory) => {
    onFiltersChange({ ...filters, category });
  }, [filters, onFiltersChange]);

  const handleDurationChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, duration: e.target.value as any });
  }, [filters, onFiltersChange]);

  const handleUploadDateChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, uploadDate: e.target.value as any });
  }, [filters, onFiltersChange]);

  const handleSortByChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, sortBy: e.target.value as any });
  }, [filters, onFiltersChange]);

  return (
    <Card className="bg-background">
      <CardContent className="p-6 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            type="text"
            placeholder="Search for videos, topics, or content..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="pl-10 pr-32 h-12 text-base"
          />
          <Button
            onClick={onSearchSubmit}
            disabled={isLoading}
            className="absolute inset-y-0 right-2 my-2 px-4"
            size="sm"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* Category Pills */}
        <div className="space-y-4">
          {searchQuery.trim() && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <p className="text-sm text-foreground">
                  <strong>Search Mode:</strong> Showing results for "{searchQuery}". Category filters are disabled during search.
                </p>
              </CardContent>
            </Card>
          )}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const isActive = (filters.category === category.value || (!filters.category && category.value === 'all')) && searchQuery.trim() === '';
              const isDisabled = searchQuery.trim() !== '' && category.value !== 'all';
              
              return (
                <Button
                  key={category.value}
                  onClick={() => handleCategoryChange(category.value)}
                  disabled={isDisabled}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className="h-9 px-3"
                >
                  <span className="mr-1.5">{category.icon}</span>
                  {category.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="flex items-center text-base font-medium">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Duration
            </Label>
            <Select value={filters.duration || 'any'} onValueChange={(value) => onFiltersChange({ ...filters, duration: value as any })}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durations.map((duration) => (
                  <SelectItem key={duration.value} value={duration.value}>
                    {duration.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">Upload Date</Label>
            <Select value={filters.uploadDate || 'any'} onValueChange={(value) => onFiltersChange({ ...filters, uploadDate: value as any })}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {uploadDates.map((date) => (
                  <SelectItem key={date.value} value={date.value}>
                    {date.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">Sort By</Label>
            <Select value={filters.sortBy || 'relevance'} onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value as any })}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((sort) => (
                  <SelectItem key={sort.value} value={sort.value}>
                    {sort.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(VideoFilters);