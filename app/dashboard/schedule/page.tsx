"use client";

import { useState, useEffect } from "react";
import { Calendar, Users, VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ScheduleVideoModal from "@/components/dashboard/schedule-video-modal";

interface ScheduledVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  scheduledDate: string;
  childrenIds: string[];
  childrenNames: string[];
  isWatched: boolean;
  carriedOver: boolean;
}

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledVideos, setScheduledVideos] = useState<ScheduledVideo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load scheduled videos
  useEffect(() => {
    loadScheduledVideos();
  }, []);

  const loadScheduledVideos = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/scheduled-videos');
      if (response.ok) {
        const data = await response.json();
        setScheduledVideos(data.scheduledVideos || []);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading scheduled videos:", error);
      setIsLoading(false);
    }
  };

  const handleScheduleVideo = async (videoIds: string[], childrenIds: string[], date: string) => {
    setIsScheduling(true);
    try {
      const response = await fetch('/api/scheduled-videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approvedVideoIds: videoIds,
          childrenIds,
          scheduledDate: date,
        }),
      });

      if (response.ok) {
        await loadScheduledVideos(); // Reload the list
      }
    } catch (error) {
      console.error("Error scheduling videos:", error);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleRemoveSchedule = async (scheduleId: string) => {
    try {
      const response = await fetch(`/api/scheduled-videos/${scheduleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadScheduledVideos(); // Reload the list
      }
    } catch (error) {
      console.error("Error removing schedule:", error);
    }
  };

  const filteredVideos = scheduledVideos.filter(video => video.scheduledDate === selectedDate);

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground">
            Schedule approved videos for specific dates and times
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <VideoIcon className="mr-2 h-4 w-4" />
          Schedule Video
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Date Picker */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </CardContent>
        </Card>

        {/* Scheduled Videos */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Videos for {new Date(selectedDate).toLocaleDateString()}</CardTitle>
              <CardDescription>
                Videos scheduled to appear on the kids' screen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredVideos.length === 0 ? (
                <div className="text-center py-8">
                  <VideoIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No videos scheduled</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by scheduling your first video for this date.
                  </p>
                  <div className="mt-6">
                    <Button onClick={() => setIsModalOpen(true)}>
                      <VideoIcon className="mr-2 h-4 w-4" />
                      Schedule Video
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredVideos.map((video) => (
                    <div
                      key={video.id}
                      className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-shrink-0">
                        <div className="h-16 w-24 bg-gray-200 rounded-md flex items-center justify-center">
                          <VideoIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {video.title}
                        </h3>
                        <div className="flex items-center mt-1 space-x-4">
                          <div className="flex items-center text-xs text-gray-500">
                            <VideoIcon className="mr-1 h-3 w-3" />
                            {video.duration}
                          </div>
                          <div className="flex items-center text-xs">
                            {video.isWatched ? (
                              <span className="text-green-600">✓ Watched</span>
                            ) : video.carriedOver ? (
                              <span className="text-orange-600">↪ Carried over</span>
                            ) : (
                              <span className="text-blue-600">📅 Available today</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center mt-2 space-x-2">
                          <Users className="h-3 w-3 text-gray-400" />
                          <div className="flex space-x-1">
                            {video.childrenNames.map((name) => (
                              <Badge key={name} variant="secondary" className="text-xs">
                                {name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 space-x-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRemoveSchedule(video.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Schedule Video Modal */}
      <ScheduleVideoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSchedule={handleScheduleVideo}
        isScheduling={isScheduling}
      />
    </div>
  );
}