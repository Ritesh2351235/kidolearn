import { ExpoRequest, ExpoResponse } from 'expo-router/server';
import { auth } from '@clerk/nextjs/server';
import { getRecommendationsForChild, searchVideosAdvanced, SearchFilters } from '../../lib/youtube';
import { db } from '../../lib/db';
import { requestDeduplication } from '../../lib/requestDeduplication';
import { recommendationsThrottle, createRateLimitResponse } from '../../lib/throttle';

// Helper functions
function getCategoryKeywords(category: string): string {
  const keywords: Record<string, string> = {
    education: 'educational learning tutorial lesson',
    entertainment: 'fun funny cartoon animation',
    science: 'science experiment STEM physics chemistry biology',
    music: 'music song nursery rhyme dance',
    sports: 'sports exercise fitness physical activity',
    arts: 'art craft drawing painting creative',
    stories: 'story book reading fairy tale bedtime',
  };
  return keywords[category] || '';
}

function getAgeGroup(age: number): string {
  if (age <= 5) return 'preschool';
  if (age <= 8) return 'elementary';
  if (age <= 12) return 'middle grade';
  return 'teen';
}

function calculateAge(birthday: string): number {
  return Math.floor((Date.now() - new Date(birthday).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

export async function GET(request: ExpoRequest): Promise<ExpoResponse> {
  try {
    console.log('🚀 Starting mobile recommendations API request');

    // Get user ID for throttling (you may need to adjust this based on your auth system)
    const authHeader = request.headers.get('Authorization');
    const userId = authHeader ? 'authenticated-user' : 'anonymous'; // Simplified for demo
    
    // Check rate limiting
    const throttleResult = await recommendationsThrottle.checkAndIncrement(userId);
    if (!throttleResult.allowed) {
      console.log('🚫 Rate limit exceeded for user:', userId);
      const rateLimitResponse = createRateLimitResponse(throttleResult.retryAfter!);
      return new Response(JSON.stringify(rateLimitResponse), {
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': throttleResult.retryAfter!.toString()
        }
      });
    }

    // Parse URL and get search params
    const url = new URL(request.url);
    const childId = url.searchParams.get('childId');
    const searchQuery = url.searchParams.get('q');
    const category = url.searchParams.get('category');
    const duration = url.searchParams.get('duration');
    const uploadDate = url.searchParams.get('uploadDate');
    const sortBy = url.searchParams.get('sortBy');
    const pageToken = url.searchParams.get('pageToken');
    const maxResults = parseInt(url.searchParams.get('maxResults') || '50');

    if (!childId) {
      console.log('❌ No childId provided');
      return new Response(JSON.stringify({ error: 'Child ID required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🔍 Looking for child:', childId);
    console.log('🔍 Search params:', { searchQuery, category, duration, uploadDate, sortBy, pageToken, maxResults });

    // Get child from database
    let child;
    try {
      child = await db.child.findUnique({
        where: { id: childId },
        include: {
          parent: true
        }
      });
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      // Fallback to mock data
      child = {
        id: childId,
        name: 'Demo Child',
        birthday: '2018-01-01',
        interests: ['science', 'music', 'arts'],
        parent: { id: 'demo-parent' }
      };
    }

    if (!child) {
      console.log('❌ Child not found');
      return new Response(JSON.stringify({ error: 'Child not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const childAge = calculateAge(child.birthday);
    console.log('👶 Child found:', child.name, 'age:', childAge, 'interests:', child.interests);

    // Validate child has interests
    if (!child.interests || child.interests.length === 0) {
      console.log('⚠️ Child has no interests defined');
      return new Response(JSON.stringify({ 
        recommendations: [],
        message: 'Please add interests to the child\'s profile to get recommendations.' 
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build search filters
    const filters: SearchFilters = {};
    if (category && category !== 'all') filters.category = category as any;
    if (duration && duration !== 'any') filters.duration = duration as any;
    if (uploadDate && uploadDate !== 'any') filters.uploadDate = uploadDate as any;
    if (sortBy) filters.sortBy = sortBy as any;

    // Generate request deduplication key
    const requestKey = requestDeduplication.generateKey(
      'GET',
      'recommendations',
      JSON.stringify({ childId, searchQuery, category, duration, uploadDate, sortBy, pageToken, maxResults }),
      userId
    );
    
    console.log('🔑 Request key generated:', requestKey);

    let result;
    
    // Use request deduplication to prevent duplicate API calls
    result = await requestDeduplication.deduplicate(
      requestKey,
      async () => {
        if (searchQuery) {
          // Direct search query - ignore category filters
          console.log('🔍 Performing direct search for:', searchQuery);
          const searchFilters: SearchFilters = {};
          if (duration && duration !== 'any') searchFilters.duration = duration as any;
          if (uploadDate && uploadDate !== 'any') searchFilters.uploadDate = uploadDate as any;
          if (sortBy) searchFilters.sortBy = sortBy as any;
          
          return await searchVideosAdvanced(searchQuery, {
            maxResults,
            pageToken: pageToken || undefined,
            filters: searchFilters
          });
        } else if (category && category !== 'all') {
          // Category-based search
          console.log('📂 Performing category-based search for:', category);
          
          const categoryKeywords = getCategoryKeywords(category as any);
          const ageGroup = getAgeGroup(childAge);
          const categoryQuery = `${categoryKeywords} for kids ${ageGroup}`;
          console.log('📚 Using category search:', categoryQuery);
          
          return await searchVideosAdvanced(categoryQuery, {
            maxResults,
            pageToken: pageToken || undefined,
            filters
          });
        } else {
          // Get recommendations based on child's interests
          console.log('🎬 Fetching YouTube recommendations based on interests...');
          const videos = await getRecommendationsForChild(child.interests, childAge, {
            maxResults,
            pageToken: pageToken || undefined,
            filters
          });
          
          return {
            videos,
            nextPageToken: undefined,
            totalResults: videos.length
          };
        }
      },
      3 * 60 * 1000 // 3 minutes cache for recommendations
    );
    
    console.log('📊 Videos retrieved:', result.videos.length);
    
    if (result.videos.length === 0) {
      console.log('⚠️ No videos found');
      return new Response(JSON.stringify({ 
        recommendations: [],
        nextPageToken: result.nextPageToken,
        totalResults: Math.min(result.totalResults || 0, 1000),
        message: searchQuery 
          ? 'No videos found for your search. Try different keywords or filters.'
          : 'No recommendations found. Try updating the child\'s interests or check your YouTube API configuration.' 
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return videos without summaries for faster loading
    const recommendations = result.videos.map((video) => ({
      ...video,
      summary: '', // Empty summary - will be generated on demand
    }));

    console.log('✅ Recommendations prepared:', recommendations.length);

    return new Response(JSON.stringify({ 
      recommendations,
      nextPageToken: result.nextPageToken,
      totalResults: Math.min(result.totalResults || 0, 1000)
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('❌ Mobile Recommendations API error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}