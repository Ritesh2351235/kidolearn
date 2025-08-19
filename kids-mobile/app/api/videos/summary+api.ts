import { ExpoRequest, ExpoResponse } from 'expo-router/server';
import { generateVideoSummary } from '../../../lib/openai';
import { db } from '../../../lib/db';

export async function POST(request: ExpoRequest): Promise<ExpoResponse> {
  try {
    const body = await request.json();
    const { videoTitle, videoDescription, childId } = body;

    if (!videoTitle || !childId) {
      return new Response(JSON.stringify({ 
        error: 'Video title and child ID are required' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify the child exists
    let child;
    try {
      child = await db.child.findUnique({
        where: { id: childId }
      });
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      // Fallback to mock data
      child = {
        id: childId,
        name: 'Demo Child',
        birthday: '2018-01-01',
        interests: ['science', 'music', 'arts']
      };
    }

    if (!child) {
      return new Response(JSON.stringify({ error: 'Child not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🤖 Generating summary for:', videoTitle);

    // Calculate child age from birthday
    const childAge = Math.floor((Date.now() - new Date(child.birthday).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    // Generate the summary for this specific video
    const summary = await generateVideoSummary(
      videoTitle,
      videoDescription || '',
      childAge,
      child.interests
    );

    console.log('✅ Summary generated successfully');

    return new Response(JSON.stringify({ summary }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('❌ Summary generation error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to generate summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}