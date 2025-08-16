import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCurrentParent } from '@/lib/actions';
import { calculateAge } from '@/lib/utils';
import { getRecommendationsForChild, searchVideosAdvanced, SearchFilters } from '@/lib/youtube';
import { recommendationsThrottle } from '@/lib/throttle';
import { serverDeduplicator } from '@/lib/requestDeduplication';
import { getSearchTermsForCategory } from '@/lib/growth-categories';

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

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    console.log('❌ No userId found in auth');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Generate deduplication key
  const deduplicationKey = serverDeduplicator.generateKey(
    'GET',
    request.url,
    undefined,
    userId
  );

  return serverDeduplicator.deduplicate(
    deduplicationKey,
    async () => {
      try {
        console.log('🚀 Starting recommendations API request');
        console.log('✅ User authenticated:', userId);

        // Check rate limiting
        const throttleKey = `${userId}-${request.nextUrl.searchParams.get('childId')}`;
        if (!recommendationsThrottle.isAllowed(throttleKey)) {
          const timeUntilReset = recommendationsThrottle.getTimeUntilReset(throttleKey);
          console.log('🚫 Rate limit exceeded for:', throttleKey);
          
          return NextResponse.json({ 
            error: 'Too many requests. Please wait before trying again.',
            retryAfter: Math.ceil(timeUntilReset / 1000),
            remaining: recommendationsThrottle.getRemainingRequests(throttleKey)
          }, { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil(timeUntilReset / 1000).toString(),
              'X-RateLimit-Remaining': recommendationsThrottle.getRemainingRequests(throttleKey).toString()
            }
          });
        }

    const searchParams = request.nextUrl.searchParams;
    const childId = searchParams.get('childId');
    const searchQuery = searchParams.get('q');
    const category = searchParams.get('category');
    const duration = searchParams.get('duration');
    const uploadDate = searchParams.get('uploadDate');
    const sortBy = searchParams.get('sortBy');
    const pageToken = searchParams.get('pageToken');
    const maxResults = parseInt(searchParams.get('maxResults') || '50');

    if (!childId) {
      console.log('❌ No childId provided');
      return NextResponse.json({ error: 'Child ID required' }, { status: 400 });
    }

    console.log('🔍 Looking for child:', childId);
    console.log('🔍 Search params:', { searchQuery, category, duration, uploadDate, sortBy, pageToken, maxResults });

    const parent = await getCurrentParent();
    if (!parent) {
      console.log('❌ Parent not found');
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    console.log('👨‍👩‍👧‍👦 Parent found with', parent.children.length, 'children');

    const child = parent.children.find(c => c.id === childId);
    if (!child) {
      console.log('❌ Child not found in parent\'s children');
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    const childAge = calculateAge(child.birthday);
    console.log('👶 Child found:', child.name, 'age:', childAge, 'interests:', child.interests);

    // Validate child has interests
    if (!child.interests || child.interests.length === 0) {
      console.log('⚠️ Child has no interests defined');
      return NextResponse.json({ 
        recommendations: [],
        message: 'Please add interests to the child\'s profile to get recommendations.' 
      });
    }

    // Build search filters
    const filters: SearchFilters = {};
    if (category && category !== 'all') filters.category = category as any;
    if (duration && duration !== 'any') filters.duration = duration as any;
    if (uploadDate && uploadDate !== 'any') filters.uploadDate = uploadDate as any;
    if (sortBy) filters.sortBy = sortBy as any;

    let result;
    
    if (searchQuery) {
      // Direct search query - ignore category filters
      console.log('🔍 Performing direct search for:', searchQuery);
      const searchFilters: SearchFilters = {};
      if (duration && duration !== 'any') searchFilters.duration = duration as any;
      if (uploadDate && uploadDate !== 'any') searchFilters.uploadDate = uploadDate as any;
      if (sortBy) searchFilters.sortBy = sortBy as any;
      
      result = await searchVideosAdvanced(searchQuery, {
        maxResults,
        pageToken: pageToken || undefined,
        filters: searchFilters
      });
    } else if (category && category !== 'all') {
      // Category-based search - use growth-based categories
      console.log('📂 Performing category-based search for:', category);
      
      // Try to get search terms from growth-based categories first
      const ageBasedSearchTerms = getSearchTermsForCategory(category, child.birthday);
      
      let categoryQuery: string;
      if (ageBasedSearchTerms.length > 0) {
        // Use age-appropriate search terms
        categoryQuery = ageBasedSearchTerms.join(' OR ');
        console.log('🎯 Using age-based search terms:', categoryQuery);
      } else {
        // Fallback to legacy category keywords
        const categoryKeywords = getCategoryKeywords(category as any);
        const ageGroup = getAgeGroup(childAge);
        categoryQuery = `${categoryKeywords} for kids ${ageGroup}`;
        console.log('📚 Using fallback category search:', categoryQuery);
      }
      
      result = await searchVideosAdvanced(categoryQuery, {
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
      
      result = {
        videos,
        nextPageToken: undefined,
        totalResults: videos.length
      };
    }
    
    console.log('📊 Videos retrieved:', result.videos.length);
    
    if (result.videos.length === 0) {
      console.log('⚠️ No videos found');
      return NextResponse.json({ 
        recommendations: [],
        nextPageToken: result.nextPageToken,
        totalResults: Math.min(result.totalResults || 0, 1000),
        message: searchQuery 
          ? 'No videos found for your search. Try different keywords or filters.'
          : 'No recommendations found. Try updating the child\'s interests or check your YouTube API configuration.' 
      });
    }

    // Return videos without summaries for faster loading
    const recommendations = result.videos.map((video) => ({
      ...video,
      summary: '', // Empty summary - will be generated on demand
    }));

    console.log('✅ Recommendations prepared:', recommendations.length);

        return NextResponse.json({ 
          recommendations,
          nextPageToken: result.nextPageToken,
          totalResults: Math.min(result.totalResults || 0, 1000)
        });
      } catch (error) {
        console.error('❌ Recommendations API error:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          error
        });
        
        return NextResponse.json(
          { 
            error: 'Failed to fetch recommendations',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }
  );
}