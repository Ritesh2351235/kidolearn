import { getCurrentParent } from "@/lib/actions";
import { db } from "@/lib/db";
import Link from "next/link";
import { Plus, Users, VideoIcon, ThumbsUp, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default async function DashboardPage() {
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

  const totalChildren = parent.children.length;
  const totalApprovedVideos = await db.approvedVideo.count({
    where: {
      child: {
        parentId: parent.id,
      },
    },
  });

  const totalWatchedVideos = await db.approvedVideo.count({
    where: {
      child: {
        parentId: parent.id,
      },
      watched: true,
    },
  });

  const watchRate = totalApprovedVideos > 0 
    ? Math.round((totalWatchedVideos / totalApprovedVideos) * 100)
    : 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b bg-background">
        <div className="flex h-20 items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <div>
              <h1 className="text-3xl font-bold text-foreground font-serif-elegant">
                Welcome back, {parent.name || "Parent"}!
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your children's curated content and track their learning progress.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-muted/20">
        <div className="space-y-8 p-8">
          {/* Stats Overview */}
          <div>
            <h2 className="text-xl font-semibold text-foreground font-serif-elegant mb-6">Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-background">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Children</p>
                      <p className="text-3xl font-bold text-foreground mt-2">{totalChildren}</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Approved Videos</p>
                      <p className="text-3xl font-bold text-foreground mt-2">{totalApprovedVideos}</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-full">
                      <ThumbsUp className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Watched Videos</p>
                      <p className="text-3xl font-bold text-foreground mt-2">{totalWatchedVideos}</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-full">
                      <VideoIcon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Watch Rate</p>
                      <p className="text-3xl font-bold text-foreground mt-2">{watchRate}%</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-full">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Children Overview */}
          <Card className="bg-background">
            <CardHeader className="border-b px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-semibold font-serif-elegant">Your Children</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Manage profiles and track individual progress
                  </CardDescription>
                </div>
                <Button asChild size="lg">
                  <Link href="/dashboard/children/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Child
                  </Link>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-8">
              {parent.children.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                  <h3 className="text-2xl font-semibold text-foreground mb-3 font-serif-elegant">No children added yet</h3>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                    Start by adding your first child profile to get personalized video recommendations.
                  </p>
                  <Button asChild size="lg" className="px-8">
                    <Link href="/dashboard/children/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Child
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {parent.children.map((child) => (
                    <Card key={child.id} className="hover:border-primary transition-all duration-200 hover:shadow-md bg-background">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-foreground text-lg">{child.name}</h3>
                          <Badge variant="secondary" className="text-sm px-3 py-1">{child.age} years old</Badge>
                        </div>
                        <div className="mb-6">
                          <p className="text-sm text-muted-foreground mb-3 font-medium">Interests:</p>
                          <div className="flex flex-wrap gap-2">
                            {child.interests.map((interest) => (
                              <Badge key={interest} variant="outline" className="text-xs px-2 py-1">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button variant="outline" asChild className="w-full">
                          <Link href={`/dashboard/children/${child.id}`}>
                            Manage Profile →
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-semibold text-foreground font-serif-elegant mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="hover:border-primary transition-all duration-200 group cursor-pointer hover:shadow-md bg-background">
                <Link href="/dashboard/recommendations">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-primary/10 rounded-full mr-4">
                        <VideoIcon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground font-serif-elegant">Get Recommendations</h3>
                    </div>
                    <p className="text-muted-foreground text-base leading-relaxed">
                      Discover new educational videos curated for your children's interests.
                    </p>
                  </CardContent>
                </Link>
              </Card>

              <Card className="hover:border-primary transition-all duration-200 group cursor-pointer hover:shadow-md bg-background">
                <Link href="/dashboard/approved">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-primary/10 rounded-full mr-4">
                        <ThumbsUp className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground font-serif-elegant">Approved Videos</h3>
                    </div>
                    <p className="text-muted-foreground text-base leading-relaxed">
                      View and manage all videos you've approved for your children.
                    </p>
                  </CardContent>
                </Link>
              </Card>

              <Card className="hover:border-primary transition-all duration-200 group cursor-pointer hover:shadow-md bg-background">
                <Link href="/dashboard/analytics">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-primary/10 rounded-full mr-4">
                        <TrendingUp className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground font-serif-elegant">View Analytics</h3>
                    </div>
                    <p className="text-muted-foreground text-base leading-relaxed">
                      Track your children's viewing patterns and educational progress.
                    </p>
                  </CardContent>
                </Link>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}