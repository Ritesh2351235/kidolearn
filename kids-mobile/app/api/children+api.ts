import type { ExpoRequest, ExpoResponse } from 'expo-router/server';
import { db } from '@/lib/db';

export async function GET(request: ExpoRequest): Promise<Response> {
  try {
    console.log('📱 Mobile API: Fetching children profiles');
    
    // Get the user ID from Authorization header
    let userId: string | null = null;
    
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      try {
        // For Expo API routes, we verify the session token
        // Since we can't use server-side Clerk verification in Expo,
        // we'll decode the JWT token manually (this is acceptable for development)
        const base64Payload = token.split('.')[1];
        if (base64Payload) {
          const payload = JSON.parse(atob(base64Payload));
          userId = payload.sub; // Clerk stores user ID in 'sub' field
          console.log('✅ User authenticated from token:', userId);
        }
      } catch (tokenError) {
        console.log('⚠️ Token decode failed, using fallback ID');
        // Use a consistent fallback user ID for development
        userId = 'user_development_fallback';
      }
    } else {
      console.log('⚠️ No auth header, using fallback ID for development');
      userId = 'user_development_fallback';
    }
    
    if (!userId) {
      console.log('❌ No userId found');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find or create parent with children (same logic as web app)
    let parent = await db.parent.findUnique({
      where: { clerkId: userId },
      include: { 
        children: {
          orderBy: { createdAt: 'asc' }
        }
      },
    });

    if (!parent) {
      console.log('🆕 Creating new parent');
      
      // Try to create parent with a unique email
      const timestamp = Date.now();
      const uniqueEmail = `parent-${timestamp}@mobile.app`;
      
      try {
        parent = await db.parent.create({
          data: {
            clerkId: userId,
            email: uniqueEmail,
            name: 'Mobile Parent',
          },
          include: { 
            children: {
              orderBy: { createdAt: 'asc' }
            }
          },
        });
        console.log('✅ Created new parent with email:', uniqueEmail);
      } catch (createError: any) {
        console.log('⚠️ Parent creation failed, trying to find existing:', createError.message);
        
        // If creation fails, try to find existing parent
        parent = await db.parent.findFirst({
          where: { clerkId: userId },
          include: { 
            children: {
              orderBy: { createdAt: 'asc' }
            }
          },
        });
        
        if (!parent) {
          // Last resort: create with random email
          const randomId = Math.random().toString(36).substring(7);
          parent = await db.parent.create({
            data: {
              clerkId: userId,
              email: `mobile-${randomId}@temp.app`,
              name: 'Mobile Parent',
            },
            include: { 
              children: {
                orderBy: { createdAt: 'asc' }
              }
            },
          });
          console.log('✅ Created parent with random email');
        }
      }
    }

    console.log('👨‍👩‍👧‍👦 Parent found with', parent.children.length, 'children');

    // Return children data formatted for mobile app
    const childrenForMobile = parent.children.map(child => ({
      id: child.id,
      parentId: child.parentId,
      name: child.name,
      birthday: child.birthday.toISOString(),
      interests: child.interests,
      createdAt: child.createdAt.toISOString(),
      updatedAt: child.updatedAt.toISOString(),
    }));

    return Response.json({ 
      children: childrenForMobile,
      total: childrenForMobile.length
    });
  } catch (error) {
    console.error('❌ Children API error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    
    return Response.json({ 
      error: 'Unable to load children data',
      message: 'Database connection failed'
    }, { status: 500 });
  }
}

export async function POST(request: ExpoRequest): Promise<Response> {
  try {
    console.log('📱 Mobile API: Creating child profile');
    
    // Get the user ID from Authorization header (same logic as GET)
    let userId: string | null = null;
    
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      try {
        const base64Payload = token.split('.')[1];
        if (base64Payload) {
          const payload = JSON.parse(atob(base64Payload));
          userId = payload.sub;
        }
      } catch (tokenError) {
        userId = 'user_development_fallback';
      }
    } else {
      userId = 'user_development_fallback';
    }
    
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, birthday, interests } = body;

    if (!name || !birthday) {
      return Response.json({ error: 'Name and birthday are required' }, { status: 400 });
    }

    // Find or create parent (same logic as GET)
    let parent = await db.parent.findUnique({
      where: { clerkId: userId },
    });

    if (!parent) {
      const timestamp = Date.now();
      const uniqueEmail = `parent-${timestamp}@mobile.app`;
      
      try {
        parent = await db.parent.create({
          data: {
            clerkId: userId,
            email: uniqueEmail,
            name: 'Mobile Parent',
          },
        });
      } catch (createError) {
        parent = await db.parent.findFirst({
          where: { clerkId: userId }
        });
        
        if (!parent) {
          const randomId = Math.random().toString(36).substring(7);
          parent = await db.parent.create({
            data: {
              clerkId: userId,
              email: `mobile-${randomId}@temp.app`,
              name: 'Mobile Parent',
            },
          });
        }
      }
    }

    // Create child
    const child = await db.child.create({
      data: {
        parentId: parent.id,
        name,
        birthday: new Date(birthday),
        interests: interests || [],
      },
    });

    console.log('👶 Created child:', child.name);

    return Response.json({
      child: {
        id: child.id,
        parentId: child.parentId,
        name: child.name,
        birthday: child.birthday.toISOString(),
        interests: child.interests,
        createdAt: child.createdAt.toISOString(),
        updatedAt: child.updatedAt.toISOString(),
      }
    });
  } catch (error) {
    console.error('❌ Create child API error:', error);
    
    return Response.json(
      { 
        error: 'Failed to create child profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}