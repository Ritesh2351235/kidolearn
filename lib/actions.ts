"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getCurrentParent() {
  const { userId } = await auth();
  if (!userId) return null;

  let parent = await db.parent.findUnique({
    where: { clerkId: userId },
    include: { children: true },
  });

  if (!parent) {
    // Try to get user information from Clerk for better parent creation
    try {
      const user = await (await clerkClient()).users.getUser(userId);

      parent = await db.parent.create({
        data: {
          clerkId: userId,
          email: user.emailAddresses[0]?.emailAddress || `user-${userId}@temp.placeholder`,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Parent',
        },
        include: { children: true },
      });
    } catch (error) {
      console.error('Error creating parent with user data:', error);

      // Fallback: create parent with placeholder data
      const timestamp = Date.now();
      parent = await db.parent.create({
        data: {
          clerkId: userId,
          email: `user-${userId}-${timestamp}@temp.placeholder`,
          name: 'Parent',
        },
        include: { children: true },
      });
    }
  }

  return parent;
}

export async function createChild(formData: FormData) {
  const parent = await getCurrentParent();
  if (!parent) throw new Error("Not authenticated");

  const name = formData.get("name") as string;
  const birthday = new Date(formData.get("birthday") as string);
  const interests = formData.getAll("interests") as string[];

  await db.child.create({
    data: {
      parentId: parent.id,
      name,
      birthday,
      interests,
    },
  });

  revalidatePath("/dashboard");
}

export async function updateChildInterests(childId: string, interests: string[]) {
  const parent = await getCurrentParent();
  if (!parent) throw new Error("Not authenticated");

  const child = await db.child.findFirst({
    where: { id: childId, parentId: parent.id },
  });

  if (!child) throw new Error("Child not found");

  await db.child.update({
    where: { id: childId },
    data: { interests },
  });

  revalidatePath("/dashboard");
}

export async function approveVideo(childId: string, videoData: {
  youtubeId: string;
  title: string;
  description?: string;
  thumbnail: string;
  channelName: string;
  duration?: string;
  summary: string;
}) {
  const parent = await getCurrentParent();
  if (!parent) throw new Error("Not authenticated");

  const child = await db.child.findFirst({
    where: { id: childId, parentId: parent.id },
  });

  if (!child) throw new Error("Child not found");

  await db.approvedVideo.upsert({
    where: {
      childId_youtubeId: {
        childId,
        youtubeId: videoData.youtubeId,
      },
    },
    update: videoData,
    create: {
      childId,
      ...videoData,
    },
  });

  revalidatePath("/dashboard");
}

export async function removeApprovedVideo(videoId: string) {
  const parent = await getCurrentParent();
  if (!parent) throw new Error("Not authenticated");

  const video = await db.approvedVideo.findFirst({
    where: { id: videoId },
    include: { child: true },
  });

  if (!video || video.child.parentId !== parent.id) {
    throw new Error("Video not found");
  }

  await db.approvedVideo.delete({
    where: { id: videoId },
  });

  revalidatePath("/dashboard");
}