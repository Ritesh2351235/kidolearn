import { getCurrentParent, removeApprovedVideo } from "@/lib/actions";
import { db } from "@/lib/db";
import Image from "next/image";
import { Clock, User, Trash2, Play, ExternalLink, Plus } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";

async function ApproveVideoButton({ videoId }: { videoId: string }) {
  async function handleRemove() {
    "use server";
    await removeApprovedVideo(videoId);
  }

  return (
    <form action={handleRemove}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive hover:bg-destructive/10 p-2 rounded-full"
        title="Remove approval"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </form>
  );
}

export default async function ApprovedVideosPage() {
  const parent = await getCurrentParent();
  
  if (!parent) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  const approvedVideos = await db.approvedVideo.findMany({
    where: {
      child: {
        parentId: parent.id,
      },
    },
    include: {
      child: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Group videos by child
  const videosByChild = approvedVideos.reduce((acc, video) => {
    const childName = video.child.name;
    if (!acc[childName]) {
      acc[childName] = [];
    }
    acc[childName].push(video);
    return acc;
  }, {} as Record<string, typeof approvedVideos>);

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
        <div className="space-y-8 p-8">

          {Object.entries(videosByChild).map(([childName, videos]) => (
            <Card key={childName} className="bg-background">
              <CardHeader className="border-b px-6 py-5">
                <CardTitle className="text-xl font-semibold text-foreground flex items-center font-serif-elegant">
                  <User className="h-5 w-5 mr-3 text-primary" />
                  {childName} ({videos.length} video{videos.length !== 1 ? 's' : ''})
                </CardTitle>
              </CardHeader>

              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videos.map((video) => (
                    <Card key={video.id} className="group hover:border-primary transition-colors bg-background">
                      <div className="relative aspect-video bg-muted/20 overflow-hidden rounded-t-lg">
                        <Image
                          src={video.thumbnail}
                          alt={video.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/75 text-white px-2 py-1 rounded text-xs">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {video.duration}
                        </div>
                        <div className="absolute top-2 right-2">
                          <ApproveVideoButton videoId={video.id} />
                        </div>
                      </div>

                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground mb-2 line-clamp-2 text-sm leading-tight">
                          {video.title}
                        </h3>
                        
                        <p className="text-xs text-muted-foreground mb-3 flex items-center">
                          <User className="h-3 w-3 inline mr-1" />
                          {video.channelName}
                        </p>

                        <Card className="bg-primary/5 border-primary/20 mb-3">
                          <CardContent className="p-3">
                            <p className="text-xs text-foreground line-clamp-3">{video.summary}</p>
                          </CardContent>
                        </Card>

                        <div className="flex items-center justify-between text-xs">
                          <Badge 
                            variant={video.watched ? "default" : "secondary"}
                            className={video.watched ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"}
                          >
                            {video.watched ? 'Watched' : 'Not watched'}
                          </Badge>
                          
                          <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary h-auto p-1">
                            <a
                              href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Watch
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}