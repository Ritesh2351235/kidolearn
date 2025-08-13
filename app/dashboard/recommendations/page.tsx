"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getCurrentParent, approveVideo } from "@/lib/actions";
import { Play, User, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import VideoFilters from "@/components/dashboard/video-filters";
import VideoCard from "@/components/dashboard/video-card";
import Pagination from "@/components/dashboard/pagination";
import { SearchFilters } from "@/lib/youtube";
import { useDebounce } from "@/hooks/useDebounce";
import { useApiCache } from "@/hooks/useApiCache";
import { requestQueue } from "@/lib/throttle";

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
  age: number;
  interests: string[];
}

const RESULTS_PER_PAGE = 50;

export default function RecommendationsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [recommendations, setRecommendations] = useState<VideoRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState("");
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

  // Debounce search query to prevent excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Memoize API URL building to prevent unnecessary recalculations
  const buildApiUrl = useCallback((pageToken?: string) => {
    const params = new URLSearchParams({
      childId: selectedChildId,
      maxResults: RESULTS_PER_PAGE.toString(),
    });

    // If user is searching, use search query and ignore category filter
    if (debouncedSearchQuery.trim()) {
      params.set('q', debouncedSearchQuery.trim());
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
  }, [selectedChildId, debouncedSearchQuery, filters]);

  // Generate cache key based on current state
  const cacheKey = useMemo(() => {
    return `recommendations-${selectedChildId}-${debouncedSearchQuery}-${JSON.stringify(filters)}-${currentPage}`;
  }, [selectedChildId, debouncedSearchQuery, filters, currentPage]);

  // Optimized fetch function with caching and request queue
  const fetchRecommendationsData = useCallback(async (pageToken?: string) => {
    if (!selectedChildId) return { recommendations: [], totalResults: 0, nextPageToken: undefined };
    
    const requestId = `recommendations-${selectedChildId}-${debouncedSearchQuery}-${JSON.stringify(filters)}-${pageToken || 'page1'}`;
    
    return requestQueue.add(requestId, async () => {
      console.log('🔍 Fetching recommendations:', { selectedChildId, debouncedSearchQuery, filters, pageToken });
      
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
  }, [selectedChildId, buildApiUrl, debouncedSearchQuery, filters]);

  // Use the cache hook for the current page
  const {
    data: cachedData,
    loading: isLoadingCache,
    error,
    fetch: fetchCachedData,
    refetch,
    clearCache
  } = useApiCache(cacheKey, () => fetchRecommendationsData(), 2 * 60 * 1000); // 2 minutes cache

  // Set up recommendations from cached data
  useEffect(() => {
    if (cachedData) {
      setRecommendations(cachedData.recommendations);
      setTotalResults(cachedData.totalResults);
      setNextPageToken(cachedData.nextPageToken);
      
      if (cachedData.nextPageToken) {
        setPageTokens(prev => ({
          ...prev,
          [currentPage + 1]: cachedData.nextPageToken
        }));
      }
    }
  }, [cachedData, currentPage]);

  const handleSearch = useCallback(() => {
    // If user is searching, reset category to 'all'  
    if (searchQuery.trim()) {
      setFilters(prev => ({ ...prev, category: 'all' }));
    }
    setCurrentPage(1);
    setPageTokens({});
    clearCache(); // Clear cache when doing new search
  }, [searchQuery, clearCache]);

  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    console.log('🔄 Filters changed:', newFilters);
    
    // If category changed and not 'all', clear search query
    if (newFilters.category !== filters.category && newFilters.category !== 'all') {
      setSearchQuery('');
    }
    
    setFilters(newFilters);
    setCurrentPage(1);
    setPageTokens({});
    clearCache(); // Clear cache when filters change
  }, [filters.category, clearCache]);

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
    clearCache(); // Clear cache when child changes
  }, [clearCache]);

  const handleRefresh = useCallback(() => {
    setCurrentPage(1);
    setPageTokens({});
    refetch(); // Use refetch to force refresh
  }, [refetch]);

  // Single useEffect to trigger data fetching with proper dependencies
  useEffect(() => {
    if (!selectedChildId) return;
    
    // Only fetch if we don't have cached data or if key parameters changed
    if (cachedData === null) {
      console.log('🔄 Triggering fetch due to missing cached data');
      fetchCachedData();
    }
  }, [selectedChildId, fetchCachedData, cachedData]);

  // Separate useEffect for search query changes (debounced)
  useEffect(() => {
    if (!selectedChildId) return;
    
    // Only trigger search when debounced query is stable and different from current
    if (debouncedSearchQuery !== searchQuery) {
      console.log('🔍 Search query debounced, clearing cache for new search');
      clearCache('recommendations-');
    }
  }, [debouncedSearchQuery, searchQuery, selectedChildId, clearCache]);

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
            disabled={isLoading || isLoadingCache}
            variant="outline"
            size="lg"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(isLoading || isLoadingCache) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-muted/20">
        <div className="space-y-8 p-8">

          {/* Child Selector */}
          <Card className="bg-background">
            <CardContent className="p-6">
              <label htmlFor="child-select" className="block text-sm font-medium text-foreground mb-3">
                Select child:
              </label>
              <select
                id="child-select"
                value={selectedChildId}
                onChange={(e) => handleChildChange(e.target.value)}
                className="w-full md:w-auto px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name} ({child.age} years old) - {child.interests.length} interests
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

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

      {/* Filters */}
      <VideoFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearch}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        isLoading={(isLoading || isLoadingCache) || !!rateLimitError}
      />

          {/* Results Summary */}
          {totalResults > 0 && (
            <Card className="bg-background">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-foreground">
                    {searchQuery ? (
                      <>Found <strong>{totalResults.toLocaleString()}</strong>{totalResults >= 1000 ? '+' : ''} videos for "{searchQuery}"</>
                    ) : (
                      <>Showing <strong>{totalResults.toLocaleString()}</strong>{totalResults >= 1000 ? '+' : ''} recommended videos</>
                    )}
                    {filters.category !== 'all' && <> in <strong>{filters.category}</strong></>}
                    {totalResults >= 1000 && <span className="text-sm text-muted-foreground ml-2">(showing first 1000 results)</span>}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Page {currentPage}</span>
                    {totalResults > RESULTS_PER_PAGE && (
                      <span>of {Math.ceil(totalResults / RESULTS_PER_PAGE)}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {(isLoading || isLoadingCache) && recommendations.length === 0 && (
            <Card className="bg-background">
              <CardContent className="p-16 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-6 mx-auto" />
                <h3 className="text-xl font-semibold text-foreground mb-3 font-serif-elegant">
                  {searchQuery ? 'Searching Videos' : 'Loading Recommendations'}
                </h3>
                <p className="text-muted-foreground text-lg">
                  {searchQuery 
                    ? 'Finding the best videos that match your search...' 
                    : 'Curating personalized video recommendations...'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* No Results */}
          {!(isLoading || isLoadingCache) && recommendations.length === 0 && selectedChildId && (
            <Card className="bg-background">
              <CardContent className="p-16 text-center">
                <div className="p-6 bg-muted/20 rounded-full w-fit mx-auto mb-6">
                  <Play className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-3 font-serif-elegant">
                  {searchQuery ? 'No videos found' : 'No recommendations available'}
                </h3>
                <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-lg leading-relaxed">
                  {searchQuery 
                    ? 'We couldn\'t find any videos matching your search criteria. Try using different keywords or adjusting your filters.'
                    : 'We couldn\'t find recommendations for this profile. Try updating the child\'s interests or adjusting the filters.'
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {searchQuery && (
                    <Button
                      onClick={() => {
                        setSearchQuery('');
                        handleSearch();
                      }}
                      size="lg"
                      className="px-6"
                    >
                      Show all recommendations
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setFilters({
                        category: 'all',
                        duration: 'any',
                        uploadDate: 'any',
                        sortBy: 'relevance'
                      });
                      setTimeout(() => handleSearch(), 100);
                    }}
                    variant="outline"
                    size="lg"
                    className="px-6"
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
                    onApprove={handleApprove}
                    isApproving={approvingIds.has(video.id)}
                  />
                ))}
              </div>

              {/* Pagination */}
              <Card className="bg-background">
                <CardContent className="p-6">
                  <Pagination
                    currentPage={currentPage}
                    totalResults={totalResults}
                    resultsPerPage={RESULTS_PER_PAGE}
                    onPageChange={handlePageChange}
                    hasNextPage={!!nextPageToken}
                    isLoading={isLoading || isLoadingCache}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}