"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Clock, User, Eye, Play, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface VideoDetailModalProps {
  video: {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    highResThumbnail: string;
    channelName: string;
    duration: string;
    publishedAt: string;
    viewCount: string;
    category: string;
    summary: string;
  };
  childId: string;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (video: any) => void;
  isApproving?: boolean;
  isApprovedVideo?: boolean;
}

export default function VideoDetailModal({
  video,
  childId,
  isOpen,
  onClose,
  onApprove,
  isApproving = false,
  isApprovedVideo = false
}: VideoDetailModalProps) {
  const [summary, setSummary] = useState(video.summary || '');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  const formatViewCount = (count: string) => {
    const num = parseInt(count);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return count;
  };

  const formatPublishedDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  };

  const generateSummary = async () => {
    if (isGeneratingSummary) return;
    
    setIsGeneratingSummary(true);
    setSummaryError('');
    
    try {
      const response = await fetch('/api/videos/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoTitle: video.title,
          videoDescription: video.description,
          childId: childId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummaryError('Failed to generate summary. Please try again.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-background max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-foreground">Video Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="overflow-auto max-h-[calc(90vh-120px)]">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Video Thumbnail */}
              <div className="space-y-4">
                <div className="relative aspect-video bg-muted/20 rounded-lg overflow-hidden">
                  <Image
                    src={video.highResThumbnail || video.thumbnail}
                    alt={video.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  
                  {/* Duration overlay */}
                  <div className="absolute bottom-3 right-3 bg-black/75 text-white px-3 py-1 rounded text-sm font-medium">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {video.duration}
                  </div>

                  {/* Category badge */}
                  <div className="absolute top-3 left-3">
                    <Badge variant="secondary" className="text-xs">
                      {video.category}
                    </Badge>
                  </div>

                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="bg-background/90 rounded-full p-4">
                      <Play className="h-8 w-8 text-foreground ml-1" />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-3">
                  <Button variant="outline" asChild className="flex-1">
                    <a
                      href={`https://www.youtube.com/watch?v=${video.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Watch on YouTube
                    </a>
                  </Button>
                  
                  {!isApprovedVideo && (
                    <Button
                      onClick={() => onApprove(video)}
                      disabled={isApproving}
                      className="flex-1"
                    >
                      {isApproving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      {isApproving ? "Approving..." : "Approve Video"}
                    </Button>
                  )}
                </div>
              </div>

              {/* Video Information */}
              <div className="space-y-4">
                {/* Title */}
                <h3 className="text-xl font-semibold text-foreground leading-tight">
                  {video.title}
                </h3>
                
                {/* Channel and metadata */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    <span>{video.channelName}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      <span>{formatViewCount(video.viewCount)} views</span>
                    </div>
                    <span>{formatPublishedDate(video.publishedAt)}</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Description</h4>
                  <div className="bg-muted/20 p-4 rounded-lg max-h-40 overflow-y-auto">
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {video.description || 'No description available.'}
                    </p>
                  </div>
                </div>

                {/* AI Summary Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-foreground">AI Summary</h4>
                    {!summary && (
                      <Button
                        onClick={generateSummary}
                        disabled={isGeneratingSummary}
                        size="sm"
                        variant="outline"
                      >
                        {isGeneratingSummary ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        {isGeneratingSummary ? 'Generating...' : 'Generate Summary'}
                      </Button>
                    )}
                  </div>
                  
                  <div className="bg-primary/5 border-primary/20 border p-4 rounded-lg">
                    {summary ? (
                      <p className="text-sm text-foreground">{summary}</p>
                    ) : summaryError ? (
                      <div className="text-center">
                        <p className="text-sm text-destructive mb-2">{summaryError}</p>
                        <Button
                          onClick={generateSummary}
                          disabled={isGeneratingSummary}
                          size="sm"
                          variant="outline"
                        >
                          Try Again
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center">
                        Click "Generate Summary" to get an AI-powered overview of this video's content.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}