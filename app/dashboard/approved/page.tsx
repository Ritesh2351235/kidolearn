"use client";

import { useState, useEffect, useCallback } from "react";
import { getCurrentParent, removeApprovedVideo } from "@/lib/actions";
import { Play, User, Plus } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import ApprovedVideoCard from "@/components/dashboard/approved-video-card";
import VideoDetailModal from "@/components/dashboard/video-detail-modal";

interface ApprovedVideo {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelName: string;
  duration: string;
  summary: string;
  watched: boolean;
  createdAt: Date;
  child: {
    id: string;
    name: string;
    birthday: Date;
    interests: string[];
  };
}

export default function ApprovedVideosPage() {
  const [approvedVideos, setApprovedVideos] = useState<ApprovedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  
  // Modal state
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load approved videos
  useEffect(() => {
    async function loadApprovedVideos() {
      try {
        setIsLoading(true);
        const parent = await getCurrentParent();
        
        if (!parent) {
          setIsLoading(false);
          return;
        }

        // Fetch approved videos via API
        const response = await fetch('/api/approved-videos');
        if (response.ok) {
          const data = await response.json();
          setApprovedVideos(data.approvedVideos || []);
        } else {
          console.error('Failed to fetch approved videos');
          setApprovedVideos([]);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading approved videos:", error);
        setIsLoading(false);
      }
    }

    loadApprovedVideos();
  }, []);

  const handleRemoveVideo = useCallback(async (videoId: string) => {
    if (removingIds.has(videoId)) return;

    setRemovingIds(prev => {
      const newSet = new Set(prev);
      newSet.add(videoId);
      return newSet;
    });
    
    try {
      await removeApprovedVideo(videoId);
      
      // Remove video from local state
      setApprovedVideos(prev => prev.filter(v => v.id !== videoId));
      
      // Close modal if this video was being viewed
      if (selectedVideo?.id === videoId) {
        handleCloseModal();
      }
    } catch (error) {
      console.error("Error removing video:", error);
    } finally {
      setRemovingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(videoId);
        return newSet;
      });
    }
  }, [removingIds, selectedVideo?.id]);

  const handleShowDetails = (video: any) => {
    // Convert approved video to format expected by VideoDetailModal
    const videoForModal = {
      id: video.youtubeId,
      title: video.title,
      description: video.description || '',
      thumbnail: video.thumbnail,
      highResThumbnail: video.thumbnail,
      channelName: video.channelName,
      duration: video.duration,
      publishedAt: video.createdAt.toISOString(),
      viewCount: '0', // Not available for approved videos
      category: 'approved',
      summary: video.summary || '',
    };
    
    setSelectedVideo(videoForModal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedVideo(null);
    setIsModalOpen(false);
  };

  // Group videos by child
  const videosByChild = approvedVideos.reduce((acc, video) => {
    const childName = video.child.name;
    if (!acc[childName]) {
      acc[childName] = [];
    }
    acc[childName].push(video);
    return acc;
  }, {} as Record<string, ApprovedVideo[]>);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (approvedVideos.length === 0) {
    return (
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="shrink-0 border-b bg-background">
          <div className="flex h-20 items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <div>
                <h1 className="text-3xl font-bold text-foreground font-serif-elegant">
                  Approved Videos
                </h1>
                <p className="text-muted-foreground mt-1">
                  Videos you've approved for your children to watch.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto bg-muted/20">
          <div className="p-8">
            <Card className="bg-background">
              <CardContent className="p-16 text-center">
                <Play className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-foreground mb-3 font-serif-elegant">No approved videos yet</h3>
                <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-lg leading-relaxed">
                  Start by browsing recommendations and approving videos for your children.
                </p>
                <Button asChild size="lg" className="px-8">
                  <Link href="/dashboard/recommendations">
                    Browse Recommendations
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
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
                Approved Videos
              </h1>
              <p className="text-muted-foreground mt-1">
                {approvedVideos.length} video{approvedVideos.length !== 1 ? 's' : ''} approved across {Object.keys(videosByChild).length} child{Object.keys(videosByChild).length !== 1 ? 'ren' : ''}
              </p>
            </div>
          </div>
          <Button asChild size="lg">
            <Link href="/dashboard/recommendations">
              <Plus className="h-4 w-4 mr-2" />
              Add More Videos
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-muted/20">
        <div className="space-y-6 p-6">

          {Object.entries(videosByChild).map(([childName, videos]) => (
            <Card key={childName} className="bg-background">
              <CardHeader className="border-b px-6 py-4">
                <CardTitle className="text-lg font-semibold text-foreground flex items-center font-serif-elegant">
                  <User className="h-4 w-4 mr-3 text-primary" />
                  {childName} ({videos.length} video{videos.length !== 1 ? 's' : ''})
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                  {videos.map((video) => (
                    <ApprovedVideoCard
                      key={video.id}
                      video={video}
                      childId={video.child.id}
                      onRemove={handleRemoveVideo}
                      onShowDetails={handleShowDetails}
                      isRemoving={removingIds.has(video.id)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Video Detail Modal */}
      {selectedVideo && (
        <VideoDetailModal
          video={selectedVideo}
          childId={selectedVideo.childId}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onApprove={() => {}} // No approve action needed for already approved videos
          isApproving={false}
          isApprovedVideo={true}
        />
      )}
    </div>
  );
}