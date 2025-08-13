import { getCurrentParent } from "@/lib/actions";
import { db } from "@/lib/db";
import { BarChart3, TrendingUp, Clock, Users, Play, ThumbsUp, Star, Activity, Eye, Target, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default async function AnalyticsPage() {
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

  // Get basic data
  const totalChildren = parent.children.length;
  const childIds = parent.children.map(child => child.id);
  
  // Get video activity statistics
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentActivities = await db.videoActivity.findMany({
    where: {
      childId: { in: childIds },
      createdAt: { gte: sevenDaysAgo }
    },
    include: {
      child: {
        select: { id: true, name: true, age: true }
      },
      approvedVideo: {
        select: { title: true, thumbnail: true, channelName: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const totalActivities = recentActivities.length;
  const totalWatchTime = recentActivities.reduce((sum, activity) => sum + (activity.watchTimeSeconds || 0), 0);
  const completedVideos = recentActivities.filter(activity => activity.activityType === 'COMPLETE').length;
  const uniqueVideosWatched = new Set(recentActivities
    .filter(activity => ['PLAY', 'COMPLETE'].includes(activity.activityType))
    .map(activity => activity.youtubeId)
  ).size;

  // Get session statistics
  const recentSessions = await db.appSession.findMany({
    where: {
      childId: { in: childIds },
      startTime: { gte: sevenDaysAgo }
    },
    include: {
      child: {
        select: { id: true, name: true, age: true }
      }
    },
    orderBy: { startTime: 'desc' }
  });

  const totalSessions = recentSessions.length;
  const averageSessionDuration = totalSessions > 0 
    ? Math.round(recentSessions.reduce((sum, session) => sum + (session.duration || 0), 0) / totalSessions)
    : 0;

  // Get most watched videos
  const videoStats = recentActivities
    .filter(activity => ['PLAY', 'COMPLETE'].includes(activity.activityType))
    .reduce((acc, activity) => {
      const key = activity.youtubeId;
      if (!acc[key]) {
        acc[key] = {
          youtubeId: activity.youtubeId,
          title: activity.videoTitle,
          channelName: activity.channelName,
          watchCount: 0,
          totalWatchTime: 0,
          completions: 0
        };
      }
      acc[key].watchCount++;
      acc[key].totalWatchTime += (activity.watchTimeSeconds || 0);
      if (activity.activityType === 'COMPLETE') {
        acc[key].completions++;
      }
      return acc;
    }, {} as Record<string, any>);

  const mostWatchedVideos = Object.values(videoStats)
    .sort((a: any, b: any) => b.watchCount - a.watchCount)
    .slice(0, 5);

  // Get activity by child
  const activityByChild = parent.children.map(child => {
    const childActivities = recentActivities.filter(activity => activity.childId === child.id);
    const childSessions = recentSessions.filter(session => session.childId === child.id);
    const childWatchTime = childActivities.reduce((sum, activity) => sum + (activity.watchTimeSeconds || 0), 0);
    const childCompletions = childActivities.filter(activity => activity.activityType === 'COMPLETE').length;
    const uniqueVideos = new Set(childActivities
      .filter(activity => ['PLAY', 'COMPLETE'].includes(activity.activityType))
      .map(activity => activity.youtubeId)
    ).size;

    return {
      ...child,
      totalActivities: childActivities.length,
      totalSessions: childSessions.length,
      watchTimeSeconds: childWatchTime,
      completedVideos: childCompletions,
      uniqueVideosWatched: uniqueVideos,
      averageSessionDuration: childSessions.length > 0 
        ? Math.round(childSessions.reduce((sum, session) => sum + (session.duration || 0), 0) / childSessions.length)
        : 0
    };
  });

  // Get daily activity trends
  const dailyActivities = recentActivities.reduce((acc, activity) => {
    const date = activity.createdAt.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = {
        date,
        activities: 0,
        watchTime: 0,
        completions: 0
      };
    }
    acc[date].activities++;
    acc[date].watchTime += (activity.watchTimeSeconds || 0);
    if (activity.activityType === 'COMPLETE') {
      acc[date].completions++;
    }
    return acc;
  }, {} as Record<string, any>);

  const dailyTrends = Object.values(dailyActivities)
    .sort((a: any, b: any) => a.date.localeCompare(b.date))
    .slice(-7); // Last 7 days

  // Helper functions
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b bg-background">
        <div className="flex h-20 items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <div>
              <h1 className="text-3xl font-bold text-foreground font-serif-elegant">
                Analytics
              </h1>
              <p className="text-muted-foreground mt-1">
                Monitor your children's app usage, watch time, and engagement patterns (Last 7 days).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-muted/20">
        <div className="space-y-8 p-8">

          {/* Key Metrics */}
          <div>
            <h2 className="text-xl font-semibold text-foreground font-serif-elegant mb-6">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-background">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Activities</p>
                      <p className="text-3xl font-bold text-foreground mt-2">{totalActivities}</p>
                      <p className="text-xs text-muted-foreground">Clicks, plays, completions</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Activity className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Watch Time</p>
                      <p className="text-3xl font-bold text-foreground mt-2">{formatDuration(totalWatchTime)}</p>
                      <p className="text-xs text-muted-foreground">Across all children</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Videos Completed</p>
                      <p className="text-3xl font-bold text-foreground mt-2">{completedVideos}</p>
                      <p className="text-xs text-muted-foreground">Watched to the end</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">App Sessions</p>
                      <p className="text-3xl font-bold text-foreground mt-2">{totalSessions}</p>
                      <p className="text-xs text-muted-foreground">Avg: {formatDuration(averageSessionDuration)}</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Most Watched Videos */}
            <Card className="bg-background">
              <CardHeader className="border-b px-6 py-5">
                <CardTitle className="text-xl font-semibold text-foreground flex items-center font-serif-elegant">
                  <Star className="h-5 w-5 mr-3 text-primary" />
                  Most Watched Videos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {mostWatchedVideos.length > 0 ? (
                  <div className="space-y-4">
                    {mostWatchedVideos.map((video: any, index: number) => (
                      <div key={video.youtubeId} className="flex items-center space-x-4 p-4 bg-muted/20 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">#{index + 1}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{video.title}</p>
                          <p className="text-sm text-muted-foreground">{video.channelName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-primary">{video.watchCount} plays</p>
                          <p className="text-xs text-muted-foreground">{formatDuration(video.totalWatchTime)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No video activity yet</p>
                )}
              </CardContent>
            </Card>

            {/* Children's Activity Breakdown */}
            <Card className="bg-background">
              <CardHeader className="border-b px-6 py-5">
                <CardTitle className="text-xl font-semibold text-foreground flex items-center font-serif-elegant">
                  <BarChart3 className="h-5 w-5 mr-3 text-primary" />
                  Children's Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {activityByChild.length > 0 ? (
                  <div className="space-y-4">
                    {activityByChild.map((child: any) => (
                      <Card key={child.id} className="bg-background border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-foreground">{child.name}</h3>
                            <Badge variant="secondary" className="text-sm">{child.age} years old</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Sessions</p>
                              <p className="font-semibold text-primary">{child.totalSessions}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Watch Time</p>
                              <p className="font-semibold text-primary">{formatDuration(child.watchTimeSeconds)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Completed</p>
                              <p className="font-semibold text-primary">{child.completedVideos}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Unique Videos</p>
                              <p className="font-semibold text-primary">{child.uniqueVideosWatched}</p>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground">
                              Avg session: {formatDuration(child.averageSessionDuration)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No children activity yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="bg-background">
            <CardHeader className="border-b px-6 py-5">
              <CardTitle className="text-xl font-semibold text-foreground flex items-center font-serif-elegant">
                <Clock className="h-5 w-5 mr-3 text-muted-foreground" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4 p-4 bg-muted/20 rounded-lg">
                      <div className="w-12 h-12 flex-shrink-0">
                        {activity.approvedVideo?.thumbnail ? (
                          <img 
                            src={activity.approvedVideo.thumbnail} 
                            alt={activity.videoTitle}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center">
                            <Play className="h-5 w-5 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{activity.videoTitle}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.child.name} • {activity.activityType.toLowerCase()} • {new Date(activity.createdAt).toLocaleString()}
                        </p>
                        {activity.watchTimeSeconds && activity.watchTimeSeconds > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Watch time: {formatDuration(activity.watchTimeSeconds)}
                          </p>
                        )}
                      </div>
                      <Badge 
                        variant={
                          activity.activityType === 'COMPLETE' ? "default" :
                          activity.activityType === 'CLICK' ? "secondary" :
                          activity.activityType === 'EXIT' ? "destructive" :
                          "outline"
                        }
                        className="text-xs"
                      >
                        {activity.activityType === 'COMPLETE' ? 'Completed' : 
                         activity.activityType === 'CLICK' ? 'Clicked' :
                         activity.activityType === 'EXIT' ? 'Exited' :
                         activity.activityType}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No recent activity</p>
              )}
            </CardContent>
          </Card>

          {/* Daily Activity Trends */}
          <Card className="bg-background">
            <CardHeader className="border-b px-6 py-5">
              <CardTitle className="text-xl font-semibold text-foreground flex items-center font-serif-elegant">
                <TrendingUp className="h-5 w-5 mr-3 text-primary" />
                Daily Activity Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {dailyTrends.length > 0 ? (
                <div className="space-y-4">
                  {dailyTrends.map((day: any) => (
                    <div key={day.date} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{formatDate(day.date)}</p>
                          <p className="text-sm text-muted-foreground">{day.activities} activities</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary">{formatDuration(day.watchTime)}</p>
                        <p className="text-xs text-muted-foreground">{day.completions} completed</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No activity trends available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}