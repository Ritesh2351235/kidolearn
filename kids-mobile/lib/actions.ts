import { db } from './db';
import { auth } from '@clerk/clerk-expo';

export async function getCurrentParent() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      throw new Error('Not authenticated');
    }

    let parent = await db.parent.findUnique({
      where: { clerkId: userId },
      include: { 
        children: {
          orderBy: { createdAt: 'asc' }
        }
      },
    });

    if (!parent) {
      // Create parent if doesn't exist
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

    return parent;
  } catch (error) {
    console.error('Error getting current parent:', error);
    return null;
  }
}