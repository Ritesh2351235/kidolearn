import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('📱 Mobile API: Fetching children profiles');
    
    const { userId } = await auth();
    if (!userId) {
      console.log('❌ No userId found in auth');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', userId);

    // Find or create parent with children
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
      parent = await db.parent.create({
        data: {
          clerkId: userId,
          email: '',
          name: '',
        },
        include: { 
          children: {
            orderBy: { createdAt: 'asc' }
          }
        },
      });
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

    return NextResponse.json({ 
      children: childrenForMobile,
      total: childrenForMobile.length
    });
  } catch (error) {
    console.error('❌ Children API error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch children profiles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📱 Mobile API: Creating child profile');
    
    const { userId } = await auth();
    if (!userId) {
      console.log('❌ No userId found in auth');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', userId);

    const body = await request.json();
    const { name, birthday, interests } = body;

    if (!name || !birthday) {
      return NextResponse.json({ 
        error: 'Name and birthday are required' 
      }, { status: 400 });
    }

    // Find or create parent
    let parent = await db.parent.findUnique({
      where: { clerkId: userId },
    });

    if (!parent) {
      console.log('🆕 Creating new parent for child creation');
      parent = await db.parent.create({
        data: {
          clerkId: userId,
          email: '',
          name: '',
        },
      });
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

    return NextResponse.json({
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
    
    return NextResponse.json(
      { 
        error: 'Failed to create child profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}