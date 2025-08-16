"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getCurrentParent, approveVideo } from "@/lib/actions";
import { calculateAge } from "@/lib/utils";
import { Play, User, Loader2, RefreshCw, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import VideoCard from "@/components/dashboard/video-card";
import VideoDetailModal from "@/components/dashboard/video-detail-modal";
import Pagination from "@/components/dashboard/pagination";
import { SearchFilters } from "@/lib/youtube";
import { requestQueue } from "@/lib/throttle";
import { getAgeGroupInfo } from "@/lib/growth-categories";

interface VideoRecommendation {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  highResThumbnail: string;
  channelName: string;
  duration: string;
  publishedAt: string;
  viewCount: string;
  category: string;
  summary: string;
}

interface Child {
  id: string;
  name: string;
  birthday: Date;
  interests: string[];
}

const RESULTS_PER_PAGE = 50;

// Helper function to get appropriate icons for categories
function getCategoryIcon(categoryId: string): string {
  const iconMap: Record<string, string> = {
    'nursery-rhymes': '🎵',
    'animated-stories': '📺',
    'colors-shapes': '🔷',
    'family-time': '👨‍👩‍👧‍👦',
    'story-reading': '📖',
    'early-math': '🔢',
    'world-cultures': '🌍',
    'fine-motor': '✂️',
    'science-experiments': '🔬',
    'nature-discovery': '🌿',
    'creative-arts': '🎨',
    'movement-dance': '💃',
    'documentary-exploration': '🎬',
    'technology-digital': '💻',
    'environment-sustainability': '🌱',
    'problem-solving': '🧩',
    'career-exploration': '👩‍💼',
    'life-skills': '🎯',
    'advanced-learning': '🎓',
    'leadership-thinking': '🧠',
    'multilingual-learning': '🗣️',
  };
  
  return iconMap[categoryId] || '📚';
}

export default function RecommendationsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [recommendations, setRecommendations] = useState<VideoRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  
  // Modal state
  const [selectedVideo, setSelectedVideo] = useState<VideoRecommendation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState(""); // What user is typing
  const [activeSearchQuery, setActiveSearchQuery] = useState(""); // What we actually search for
  const [filters, setFilters] = useState<SearchFilters>({
    category: 'all',
    duration: 'any',
    uploadDate: 'any',
    sortBy: 'relevance'
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [pageTokens, setPageTokens] = useState<Record<number, string>>({});

  useEffect(() => {
    async function loadChildren() {
      try {
        const parent = await getCurrentParent();
        if (parent?.children) {
          setChildren(parent.children);
          if (parent.children.length > 0) {
            setSelectedChildId(parent.children[0].id);
          }
        }
      } catch (error) {
        console.error("Error loading children:", error);
      }
    }

    loadChildren();
  }, []);


  // Memoize API URL building to prevent unnecessary recalculations
  const buildApiUrl = useCallback((pageToken?: string) => {
    const params = new URLSearchParams({
      childId: selectedChildId,
      maxResults: RESULTS_PER_PAGE.toString(),
    });

    // If user is searching, use active search query and ignore category filter
    if (activeSearchQuery.trim()) {
      params.set('q', activeSearchQuery.trim());
      // Only apply non-category filters when searching
      if (filters.duration && filters.duration !== 'any') {
        params.set('duration', filters.duration);
      }
      
      if (filters.uploadDate && filters.uploadDate !== 'any') {
        params.set('uploadDate', filters.uploadDate);
      }
      
      if (filters.sortBy) {
        params.set('sortBy', filters.sortBy);
      }
    } else {
      // If no search query, apply category filter for browsing
      if (filters.category && filters.category !== 'all') {
        params.set('category', filters.category);
      }
      
      if (filters.duration && filters.duration !== 'any') {
        params.set('duration', filters.duration);
      }
      
      if (filters.uploadDate && filters.uploadDate !== 'any') {
        params.set('uploadDate', filters.uploadDate);
      }
      
      if (filters.sortBy) {
        params.set('sortBy', filters.sortBy);
      }
    }

    if (pageToken) {
      params.set('pageToken', pageToken);
    }

    return `/api/recommendations?${params.toString()}`;
  }, [selectedChildId, activeSearchQuery, filters]);


  // Optimized fetch function with caching and request queue
  const fetchRecommendationsData = useCallback(async (pageToken?: string) => {
    if (!selectedChildId) return { recommendations: [], totalResults: 0, nextPageToken: undefined };
    
    const requestId = `recommendations-${selectedChildId}-${activeSearchQuery}-${JSON.stringify(filters)}-${pageToken || 'page1'}`;
    
    return requestQueue.add(requestId, async () => {
      console.log('🔍 Fetching recommendations:', { selectedChildId, activeSearchQuery, filters, pageToken });
      
      const url = buildApiUrl(pageToken);
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          console.warn(`🚫 Rate limited. Retry after ${retryAfter} seconds`);
          const message = `Too many requests. Please wait ${retryAfter} seconds before trying again.`;
          setRateLimitError(message);
          
          // Clear rate limit error after the retry period
          setTimeout(() => {
            setRateLimitError(null);
          }, (parseInt(retryAfter || '60') + 1) * 1000);
          
          throw new Error(message);
        }
        
        console.error("❌ Error fetching recommendations:", {
          status: response.status,
          error: errorData.error,
          details: errorData.details
        });
        throw new Error(errorData.error || 'Failed to fetch recommendations');
      }

      const data = await response.json();
      console.log('📊 API Response:', { 
        status: response.status, 
        ok: response.ok, 
        videoCount: data.recommendations?.length || 0,
        totalResults: data.totalResults,
        nextPageToken: data.nextPageToken
      });

      return {
        recommendations: data.recommendations || [],
        totalResults: data.totalResults || 0,
        nextPageToken: data.nextPageToken
      };
    });
  }, [selectedChildId, buildApiUrl, activeSearchQuery, filters]);

  // Simple loading state management
  const [lastFetchedKey, setLastFetchedKey] = useState<string>('');


  const handleSearch = useCallback(() => {
    console.log('🔍 Search triggered:', searchQuery);
    
    // Set the active search query to trigger API call
    setActiveSearchQuery(searchQuery.trim());
    
    // If user is searching, reset category to 'all'  
    if (searchQuery.trim()) {
      setFilters(prev => ({ ...prev, category: 'all' }));
    }
    
    setCurrentPage(1);
    setPageTokens({});
    setRecommendations([]); // Clear current recommendations immediately
    setTotalResults(0);
    setLastFetchedKey(''); // Reset to trigger new fetch
  }, [searchQuery]);

  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    console.log('🔄 Filters changed:', newFilters);
    
    // If category changed, clear search queries (always, regardless of which category)
    if (newFilters.category !== filters.category) {
      setSearchQuery('');
      setActiveSearchQuery('');
    }
    
    setFilters(newFilters);
    setCurrentPage(1);
    setPageTokens({});
    setRecommendations([]); // Clear current recommendations immediately
    setTotalResults(0);
    setLastFetchedKey(''); // Reset to trigger new fetch
  }, [filters.category]);

  const handlePageChange = useCallback((page: number) => {
    if (page === currentPage) return;
    
    setCurrentPage(page);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const handleChildChange = useCallback((childId: string) => {
    setSelectedChildId(childId);
    setCurrentPage(1);
    setPageTokens({});
    setRecommendations([]);
    setTotalResults(0);
    setSearchQuery("");
    setFilters({
      category: 'all',
      duration: 'any', 
      uploadDate: 'any',
      sortBy: 'relevance'
    });
    setLastFetchedKey(''); // Reset to trigger new fetch
  }, []);

  const handleRefresh = useCallback(() => {
    setCurrentPage(1);
    setPageTokens({});
    setLastFetchedKey(''); // Reset to trigger new fetch
  }, []);

  // Main useEffect to trigger data fetching when key parameters change
  useEffect(() => {
    if (!selectedChildId) return;
    
    const timeoutId = setTimeout(async () => {
      const currentKey = `${selectedChildId}-${activeSearchQuery}-${JSON.stringify(filters)}-${currentPage}`;
      
      // Prevent duplicate requests
      if (lastFetchedKey === currentKey) {
        console.log('🔄 Skipping duplicate request for:', currentKey);
        return;
      }
      
      setLastFetchedKey(currentKey);
      setIsLoading(true);
      
      try {
        console.log('🔍 Fetching recommendations:', currentKey);
        const result = await fetchRecommendationsData();
        
        setRecommendations(result.recommendations);
        setTotalResults(result.totalResults);
        setNextPageToken(result.nextPageToken);
        
        if (result.nextPageToken) {
          setPageTokens(prev => ({
            ...prev,
            [currentPage + 1]: result.nextPageToken
          }));
        }
      } catch (error) {
        console.error('❌ Error fetching recommendations:', error);
        setRecommendations([]);
        setTotalResults(0);
        
        // Handle rate limiting
        if (error instanceof Error && error.message.includes('Too many requests')) {
          setRateLimitError('Rate limit exceeded. Please wait before making more requests.');
          setTimeout(() => setRateLimitError(null), 60000); // Clear after 1 minute
        }
      } finally {
        setIsLoading(false);
      }
    }, 300); // Increased delay to reduce rapid API calls
    
    return () => clearTimeout(timeoutId);
  }, [selectedChildId, activeSearchQuery, filters, currentPage, lastFetchedKey, fetchRecommendationsData]);


  const handleShowDetails = (video: VideoRecommendation) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedVideo(null);
    setIsModalOpen(false);
  };

  const handleApprove = async (video: VideoRecommendation) => {
    if (approvingIds.has(video.id)) return;

    setApprovingIds(prev => {
      const newSet = new Set(prev);
      newSet.add(video.id);
      return newSet;
    });
    
    try {
      await approveVideo(selectedChildId, {
        youtubeId: video.id,
        title: video.title,
        description: video.description,
        thumbnail: video.highResThumbnail || video.thumbnail,
        channelName: video.channelName,
        duration: video.duration,
        summary: video.summary,
      });
      
      // Remove approved video from recommendations
      setRecommendations(prev => prev.filter(v => v.id !== video.id));
      setTotalResults(prev => Math.max(0, prev - 1));
      
      // Close modal if this video was being viewed
      if (selectedVideo?.id === video.id) {
        handleCloseModal();
      }
    } catch (error) {
      console.error("Error approving video:", error);
    } finally {
      setApprovingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(video.id);
        return newSet;
      });
    }
  };

  if (children.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="shrink-0 border-b bg-background">
          <div className="flex h-20 items-center px-8">
            <SidebarTrigger className="md:hidden mr-4" />
            <h1 className="text-3xl font-bold text-foreground font-serif-elegant">
              Video Discovery
            </h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-muted/20">
          <Card className="bg-background max-w-md">
            <CardContent className="p-16 text-center">
              <User className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-foreground mb-3 font-serif-elegant">No children profiles found</h2>
              <p className="text-muted-foreground text-lg">
                Please add at least one child profile to get personalized video recommendations.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b bg-background">
        <div className="flex h-20 items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <div>
              <h1 className="text-3xl font-bold text-foreground font-serif-elegant">
                Video Discovery
              </h1>
              <p className="text-muted-foreground mt-1">
                Search and discover safe, educational videos for your children
              </p>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            variant="outline"
            size="lg"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-muted/20">
        <div className="space-y-4 p-6">

          {/* Compact Child Selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg font-semibold text-foreground">
                  {children.find(c => c.id === selectedChildId)?.name} ({calculateAge(children.find(c => c.id === selectedChildId)?.birthday)} years old)
                </span>
              </div>
              
              {children.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Switch child:</span>
                  <select
                    value={selectedChildId}
                    onChange={(e) => handleChildChange(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.name} ({calculateAge(child.birthday)} years old)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Compact Age Group Info Banner */}
          {selectedChildId && (() => {
            const selectedChild = children.find(c => c.id === selectedChildId);
            const ageGroupInfo = selectedChild ? getAgeGroupInfo(selectedChild.birthday) : null;
            
            return ageGroupInfo && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-blue-100 rounded-full">
                    <User className="h-3 w-3 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-blue-900 text-sm">
                    {ageGroupInfo.ageGroup} ({ageGroupInfo.age} years old) - Curated Categories
                  </h3>
                </div>
                <p className="text-xs text-blue-700 mb-2">
                  Content specially selected for {ageGroupInfo.ageRange} year olds focusing on: {ageGroupInfo.skillFocus.join(', ')}
                </p>
                <div className="flex flex-wrap gap-1">
                  {ageGroupInfo.contentTypes.map((type, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 h-5">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Rate Limit Error */}
          {rateLimitError && (
            <Card className="bg-background border-destructive">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-destructive">Rate Limit Exceeded</h3>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <p>{rateLimitError}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compact Search Bar with Categories */}
          <Card className="bg-background">
            <CardContent className="p-4">
              {/* Search Input */}
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  type="text"
                  placeholder="Search for videos, topics, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  disabled={isLoading || !!rateLimitError}
                  className="pl-10 pr-24 h-10 border-2 focus:border-primary focus:ring-0"
                />
                <Button
                  onClick={handleSearch}
                  disabled={isLoading || !!rateLimitError}
                  className="absolute inset-y-0 right-1 my-1 px-4 h-auto"
                  size="sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      <span className="text-xs">Searching...</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-3 w-3 mr-1" />
                      <span className="text-xs">Search</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Search Mode Notice */}
              {searchQuery.trim() && (
                <div className="mb-3 p-2 bg-primary/5 border border-primary/20 rounded-md">
                  <p className="text-xs text-foreground">
                    <strong>Search Mode:</strong> Showing results for "{searchQuery}"
                  </p>
                </div>
              )}

              {/* Category Pills - Integrated */}
              {selectedChildId && (() => {
                const selectedChild = children.find(c => c.id === selectedChildId);
                const ageGroupInfo = selectedChild ? getAgeGroupInfo(selectedChild.birthday) : null;
                const dynamicCategories = [
                  { value: 'all', label: 'All Categories', icon: '🎯', description: 'Browse all available content' },
                  ...(ageGroupInfo?.categories.map(cat => ({
                    value: cat.id,
                    label: cat.name,
                    icon: getCategoryIcon(cat.id),
                    description: cat.description
                  })) || [])
                ];

                return (
                  <div className="flex flex-wrap gap-1.5">
                    {dynamicCategories.map((category) => {
                      const isActive = (filters.category === category.value || (!filters.category && category.value === 'all')) && searchQuery.trim() === '';
                      const isSearchMode = searchQuery.trim() !== '';
                      
                      return (
                        <Button
                          key={category.value}
                          onClick={() => handleFiltersChange({ ...filters, category: category.value })}
                          variant={isActive ? "default" : "outline"}
                          size="sm"
                          className={`h-7 px-2 text-xs ${
                            isSearchMode && !isActive 
                              ? 'opacity-60 hover:opacity-100' 
                              : ''
                          }`}
                          title={category.description}
                        >
                          <span className="mr-1">{category.icon}</span>
                          {category.label}
                        </Button>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Compact Results Summary */}
          {totalResults > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-lg">
              <p>
                {activeSearchQuery ? (
                  <>Found <strong className="text-foreground">{totalResults.toLocaleString()}</strong>{totalResults >= 1000 ? '+' : ''} videos for "{activeSearchQuery}"</>
                ) : (
                  <>Showing <strong className="text-foreground">{totalResults.toLocaleString()}</strong>{totalResults >= 1000 ? '+' : ''} recommended videos</>
                )}
                {filters.category !== 'all' && <> in <strong className="text-foreground">{filters.category}</strong></>}
              </p>
              <div className="flex items-center gap-2">
                <span>Page {currentPage}</span>
                {totalResults > RESULTS_PER_PAGE && (
                  <span>of {Math.ceil(totalResults / RESULTS_PER_PAGE)}</span>
                )}
              </div>
            </div>
          )}

          {/* Compact Loading State */}
          {isLoading && recommendations.length === 0 && (
            <Card className="bg-background">
              <CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4 mx-auto" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {activeSearchQuery ? 'Searching Videos' : 'Loading Recommendations'}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {activeSearchQuery 
                    ? 'Finding the best videos that match your search...' 
                    : 'Curating personalized video recommendations...'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Compact No Results */}
          {!isLoading && recommendations.length === 0 && selectedChildId && (
            <Card className="bg-background">
              <CardContent className="p-8 text-center">
                <div className="p-3 bg-muted/20 rounded-full w-fit mx-auto mb-4">
                  <Play className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {activeSearchQuery ? 'No videos found' : 'No recommendations available'}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-lg mx-auto text-sm">
                  {activeSearchQuery 
                    ? 'We couldn\'t find any videos matching your search criteria. Try using different keywords.'
                    : 'We couldn\'t find recommendations for this profile. Try updating the child\'s interests.'
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  {activeSearchQuery && (
                    <Button
                      onClick={() => {
                        setSearchQuery('');
                        setActiveSearchQuery('');
                      }}
                      size="sm"
                      className="px-4"
                    >
                      Show all recommendations
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveSearchQuery('');
                      setFilters({
                        category: 'all',
                        duration: 'any',
                        uploadDate: 'any',
                        sortBy: 'relevance'
                      });
                    }}
                    variant="outline"
                    size="sm"
                    className="px-4"
                  >
                    Reset filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Video Grid */}
          {recommendations.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {recommendations.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    childId={selectedChildId}
                    onApprove={handleApprove}
                    onShowDetails={handleShowDetails}
                    isApproving={approvingIds.has(video.id)}
                  />
                ))}
              </div>

              {/* Compact Pagination */}
              <div className="bg-muted/30 px-4 py-3 rounded-lg">
                <Pagination
                  currentPage={currentPage}
                  totalResults={totalResults}
                  resultsPerPage={RESULTS_PER_PAGE}
                  onPageChange={handlePageChange}
                  hasNextPage={!!nextPageToken}
                  isLoading={isLoading}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Video Detail Modal */}
      {selectedVideo && (
        <VideoDetailModal
          video={selectedVideo}
          childId={selectedChildId}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onApprove={handleApprove}
          isApproving={approvingIds.has(selectedVideo.id)}
        />
      )}
    </div>
  );
}