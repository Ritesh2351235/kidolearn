"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Users, VideoIcon, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ApprovedVideo {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelName: string;
  duration: string;
  summary: string;
  child: {
    id: string;
    name: string;
  };
}

interface Child {
  id: string;
  name: string;
  birthday: Date;
  interests: string[];
}

interface ScheduleVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (videoIds: string[], childrenIds: string[], date: string) => Promise<void>;
  isScheduling?: boolean;
}

export default function ScheduleVideoModal({
  isOpen,
  onClose,
  onSchedule,
  isScheduling = false
}: ScheduleVideoModalProps) {
  const [approvedVideos, setApprovedVideos] = useState<ApprovedVideo[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);

  // Load approved videos and children
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load approved videos
      const videosResponse = await fetch('/api/approved-videos');
      if (videosResponse.ok) {
        const videosData = await videosResponse.json();
        setApprovedVideos(videosData.approvedVideos || []);
      }

      // Load children
      const childrenResponse = await fetch('/api/children');
      if (childrenResponse.ok) {
        const childrenData = await childrenResponse.json();
        setChildren(childrenData.children || []);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setIsLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (selectedVideoIds.length === 0 || selectedChildrenIds.length === 0 || !selectedDate) {
      return;
    }

    try {
      await onSchedule(selectedVideoIds, selectedChildrenIds, selectedDate);
      
      // Reset form
      setSelectedVideoIds([]);
      setSelectedChildrenIds([]);
      setSelectedDate(new Date().toISOString().split('T')[0]);
      
      onClose();
    } catch (error) {
      console.error("Error scheduling video:", error);
    }
  };

  const toggleChildSelection = (childId: string) => {
    setSelectedChildrenIds(prev => 
      prev.includes(childId) 
        ? prev.filter(id => id !== childId)
        : [...prev, childId]
    );
  };

  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideoIds(prev => 
      prev.includes(videoId)
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const selectedVideos = approvedVideos.filter(v => selectedVideoIds.includes(v.id));

  const selectAllVideos = () => {
    setSelectedVideoIds(approvedVideos.map(v => v.id));
  };

  const clearAllVideos = () => {
    setSelectedVideoIds([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-background max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-foreground">Schedule Video</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="overflow-auto max-h-[calc(90vh-120px)]">
          <CardContent className="p-6 space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading...</span>
              </div>
            ) : (
              <>
                {/* Step 1: Select Videos */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold flex items-center">
                      <VideoIcon className="mr-2 h-5 w-5" />
                      Select Videos ({selectedVideoIds.length} selected)
                    </h3>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllVideos}
                        disabled={selectedVideoIds.length === approvedVideos.length}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAllVideos}
                        disabled={selectedVideoIds.length === 0}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto">
                    {approvedVideos.map((video) => (
                      <div
                        key={video.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors relative ${
                          selectedVideoIds.includes(video.id)
                            ? 'border-primary bg-primary/5' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => toggleVideoSelection(video.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-12 w-16 bg-gray-200 rounded flex items-center justify-center">
                              <VideoIcon className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {video.title}
                            </h4>
                            <p className="text-xs text-gray-500">{video.channelName}</p>
                            <p className="text-xs text-gray-500">For: {video.child.name}</p>
                          </div>
                          {selectedVideoIds.includes(video.id) && (
                            <div className="absolute top-2 right-2 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center">
                              <span className="text-xs">✓</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedVideoIds.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>{selectedVideoIds.length}</strong> video{selectedVideoIds.length !== 1 ? 's' : ''} selected for scheduling
                      </p>
                    </div>
                  )}
                </div>

                {/* Step 2: Select Children */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Select Children
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {children.map((child) => (
                      <div
                        key={child.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedChildrenIds.includes(child.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => toggleChildSelection(child.id)}
                      >
                        <div className="text-center">
                          <h4 className="text-sm font-medium">{child.name}</h4>
                          <p className="text-xs text-gray-500">
                            Age {Math.floor((Date.now() - new Date(child.birthday).getTime()) / (365.25 * 24 * 60 * 60 * 1000))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 3: Select Date */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    Select Date
                  </h3>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Videos will be available for the entire day. Kids can choose when to watch them.
                  </p>
                </div>

                {/* Summary */}
                {selectedVideos.length > 0 && selectedChildrenIds.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Schedule Summary</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Videos:</strong> {selectedVideos.length} video{selectedVideos.length !== 1 ? 's' : ''} selected</p>
                      {selectedVideos.length <= 3 ? (
                        <div className="ml-4">
                          {selectedVideos.map(video => (
                            <p key={video.id} className="text-gray-600">• {video.title}</p>
                          ))}
                        </div>
                      ) : (
                        <div className="ml-4">
                          {selectedVideos.slice(0, 2).map(video => (
                            <p key={video.id} className="text-gray-600">• {video.title}</p>
                          ))}
                          <p className="text-gray-600">• ... and {selectedVideos.length - 2} more videos</p>
                        </div>
                      )}
                      <p><strong>Children:</strong> {selectedChildrenIds.map(id => children.find(c => c.id === id)?.name).join(', ')}</p>
                      <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}</p>
                      <p><strong>Availability:</strong> All day - kids can watch anytime</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSchedule}
                    disabled={selectedVideoIds.length === 0 || selectedChildrenIds.length === 0 || !selectedDate || isScheduling}
                  >
                    {isScheduling ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Calendar className="h-4 w-4 mr-2" />
                    )}
                    {isScheduling ? "Scheduling..." : `Schedule ${selectedVideoIds.length} Video${selectedVideoIds.length !== 1 ? 's' : ''}`}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </div>
      </Card>
    </div>
  );
}