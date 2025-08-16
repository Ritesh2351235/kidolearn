import { google } from 'googleapis';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  highResThumbnail: string;
  channelName: string;
  duration: string;
  publishedAt: string;
  viewCount: string;
  likeCount?: string;
  category: string;
}

export type VideoCategory = 'all' | 'education' | 'entertainment' | 'science' | 'music' | 'sports' | 'arts' | 'stories';

export interface SearchFilters {
  category?: VideoCategory;
  duration?: 'any' | 'short' | 'medium' | 'long';
  uploadDate?: 'any' | 'hour' | 'today' | 'week' | 'month' | 'year';
  sortBy?: 'relevance' | 'date' | 'viewCount' | 'rating';
}

export interface SearchOptions {
  maxResults?: number;
  category?: VideoCategory;
  duration?: 'any' | 'short' | 'medium' | 'long';
  uploadDate?: 'any' | 'hour' | 'today' | 'week' | 'month' | 'year';
  sortBy?: 'relevance' | 'date' | 'viewCount' | 'rating';
  pageToken?: string;
}

export async function searchVideos(query: string, maxResults: number = 10): Promise<YouTubeVideo[]> {
  try {
    console.log('🔍 Searching YouTube for:', query);
    console.log('📊 YouTube API Key configured:', !!process.env.YOUTUBE_API_KEY);
    
    const searchResponse = await youtube.search.list({
      part: ['id', 'snippet'],
      q: query,
      type: ['video'],
      maxResults,
      safeSearch: 'strict',
      order: 'relevance',
      regionCode: 'US',
      relevanceLanguage: 'en',
    });

    console.log('🎬 Search response status:', searchResponse.status);
    console.log('📝 Items found:', searchResponse.data.items?.length || 0);

    if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
      console.log('⚠️ No videos found for query:', query);
      return [];
    }

    const videoIds = searchResponse.data.items
      .map(item => item.id?.videoId)
      .filter((id): id is string => Boolean(id));

    console.log('🎥 Video IDs extracted:', videoIds.length);

    if (videoIds.length === 0) {
      console.log('⚠️ No valid video IDs found');
      return [];
    }

    const videoDetails = await youtube.videos.list({
      part: ['snippet', 'contentDetails', 'statistics'],
      id: videoIds,
    });

    console.log('📊 Video details retrieved:', videoDetails.data.items?.length || 0);

    const videos = videoDetails.data.items?.map(video => ({
      id: video.id!,
      title: video.snippet?.title || '',
      description: video.snippet?.description || '',
      thumbnail: video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.medium?.url || '',
      highResThumbnail: video.snippet?.thumbnails?.maxres?.url || video.snippet?.thumbnails?.high?.url || '',
      channelName: video.snippet?.channelTitle || '',
      duration: formatDuration(video.contentDetails?.duration || ''),
      publishedAt: video.snippet?.publishedAt || '',
      viewCount: video.statistics?.viewCount || '0',
      likeCount: video.statistics?.likeCount || undefined,
      category: video.snippet?.categoryId || 'Unknown',
    })) || [];

    console.log('✅ Final videos processed:', videos.length);
    return videos;
  } catch (error) {
    console.error('❌ YouTube API error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      response: (error as any)?.response?.data || 'No response data'
    });
    
    // More specific error handling
    if ((error as any)?.response?.status === 403) {
      console.error('🔑 YouTube API quota exceeded or invalid API key');
    } else if ((error as any)?.response?.status === 400) {
      console.error('🚫 Bad request to YouTube API - check parameters');
    }
    
    return [];
  }
}


export interface SearchOptions {
  maxResults?: number;
  pageToken?: string;
  filters?: SearchFilters;
}

export async function searchVideosAdvanced(
  query: string, 
  options: SearchOptions = {}
): Promise<{ videos: YouTubeVideo[]; nextPageToken?: string; totalResults?: number }> {
  try {
    const { maxResults = 20, pageToken, filters = {} } = options;
    
    console.log('🔍 Advanced search for:', query, 'with filters:', filters);
    
    // Build search query with filters
    let searchQuery = query;
    if (filters.category && filters.category !== 'all') {
      searchQuery += ` ${getCategoryKeywords(filters.category)}`;
    }
    
    const searchParams: any = {
      part: ['id', 'snippet'],
      q: searchQuery,
      type: ['video'],
      maxResults,
      safeSearch: 'strict',
      order: filters.sortBy || 'relevance',
      regionCode: 'US',
      relevanceLanguage: 'en',
      videoEmbeddable: 'true',
      videoLicense: 'any',
    };

    // Add pagination
    if (pageToken) {
      searchParams.pageToken = pageToken;
    }

    // Add duration filter
    if (filters.duration && filters.duration !== 'any') {
      searchParams.videoDuration = filters.duration;
    }

    // Add upload date filter
    if (filters.uploadDate && filters.uploadDate !== 'any') {
      const publishedAfter = getPublishedAfterDate(filters.uploadDate);
      if (publishedAfter) {
        searchParams.publishedAfter = publishedAfter;
      }
    }

    const searchResponse = await youtube.search.list(searchParams);

    console.log('🎬 Advanced search response:', {
      status: searchResponse.status,
      items: searchResponse.data.items?.length || 0,
      nextPageToken: searchResponse.data.nextPageToken,
      totalResults: searchResponse.data.pageInfo?.totalResults
    });

    if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
      return { videos: [], nextPageToken: undefined, totalResults: 0 };
    }

    const videoIds = searchResponse.data.items
      .map(item => item.id?.videoId)
      .filter((id): id is string => Boolean(id));

    if (videoIds.length === 0) {
      return { videos: [], nextPageToken: undefined, totalResults: 0 };
    }

    const videoDetails = await youtube.videos.list({
      part: ['snippet', 'contentDetails', 'statistics'],
      id: videoIds,
    });

    const videos = videoDetails.data.items?.map(video => ({
      id: video.id!,
      title: video.snippet?.title || '',
      description: video.snippet?.description || '',
      thumbnail: video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.medium?.url || '',
      highResThumbnail: video.snippet?.thumbnails?.maxres?.url || video.snippet?.thumbnails?.high?.url || '',
      channelName: video.snippet?.channelTitle || '',
      duration: formatDuration(video.contentDetails?.duration || ''),
      publishedAt: video.snippet?.publishedAt || '',
      viewCount: video.statistics?.viewCount || '0',
      likeCount: video.statistics?.likeCount || undefined,
      category: mapCategoryId(video.snippet?.categoryId || ''),
    })) || [];

    return {
      videos,
      nextPageToken: searchResponse.data.nextPageToken || undefined,
      totalResults: searchResponse.data.pageInfo?.totalResults || 0
    };
  } catch (error) {
    console.error('❌ Advanced YouTube search error:', error);
    return { videos: [], nextPageToken: undefined, totalResults: 0 };
  }
}

export async function getRecommendationsForChild(
  interests: string[], 
  age: number, 
  options: SearchOptions = {}
) {
  const queries = generateSearchQueries(interests, age);
  const allVideos: YouTubeVideo[] = [];
  
  const maxResults = options.maxResults || 50;
  const videosPerQuery = Math.ceil(maxResults / Math.min(queries.length, 5));
  
  // Use more queries to get more diverse results
  for (const query of queries.slice(0, 5)) {
    const result = await searchVideosAdvanced(query, {
      ...options,
      maxResults: videosPerQuery
    });
    allVideos.push(...result.videos);
  }
  
  // Remove duplicates and limit results
  const uniqueVideos = allVideos.filter((video, index, self) => 
    index === self.findIndex(v => v.id === video.id)
  );
  
  return uniqueVideos.slice(0, maxResults);
}

function getCategoryKeywords(category: VideoCategory): string {
  const keywords: Record<VideoCategory, string> = {
    education: 'educational learning tutorial lesson',
    entertainment: 'fun funny cartoon animation',
    science: 'science experiment STEM physics chemistry biology',
    music: 'music song nursery rhyme dance',
    sports: 'sports exercise fitness physical activity',
    arts: 'art craft drawing painting creative',
    stories: 'story book reading fairy tale bedtime',
    all: ''
  };
  return keywords[category] || '';
}

function getPublishedAfterDate(uploadDate: string): string | null {
  const now = new Date();
  const dates = {
    hour: new Date(now.getTime() - 60 * 60 * 1000),
    today: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    year: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
  };
  
  return dates[uploadDate as keyof typeof dates]?.toISOString() || null;
}

function mapCategoryId(categoryId: string): string {
  const categoryMap: Record<string, string> = {
    '1': 'entertainment',
    '2': 'music', 
    '10': 'music',
    '15': 'entertainment',
    '17': 'sports',
    '19': 'entertainment',
    '20': 'entertainment',
    '22': 'entertainment',
    '23': 'entertainment',
    '24': 'entertainment',
    '25': 'entertainment',
    '26': 'sports',
    '27': 'education',
    '28': 'science'
  };
  
  return categoryMap[categoryId] || 'education';
}

function generateSearchQueries(interests: string[], age: number): string[] {
  const ageGroup = getAgeGroup(age);
  const queries: string[] = [];
  
  interests.forEach(interest => {
    queries.push(`${interest} for kids ${ageGroup} educational`);
    queries.push(`learn ${interest} children ${ageGroup}`);
    queries.push(`${interest} tutorial kids ${ageGroup}`);
    queries.push(`${interest} kids ${ageGroup} fun`);
    queries.push(`${interest} ${ageGroup} children videos`);
    queries.push(`best ${interest} for kids ${ageGroup}`);
  });
  
  // Add some general queries for the age group
  queries.push(`kids ${ageGroup} educational videos`);
  queries.push(`children ${ageGroup} learning content`);
  
  return queries;
}

function getAgeGroup(age: number): string {
  if (age <= 5) return 'preschool';
  if (age <= 8) return 'elementary';
  if (age <= 12) return 'middle grade';
  return 'teen';
}

function formatDuration(duration: string): string {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '';
  
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}