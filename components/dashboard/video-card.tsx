"use client";

import { useState, memo, useCallback } from "react";
import Image from "next/image";
import { Play, Clock, User, ThumbsUp, Eye, Loader2, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface VideoCardProps {
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
  onApprove: (video: any) => void;
  isApproving?: boolean;
}

function VideoCard({ video, onApprove, isApproving = false }: VideoCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const formatViewCount = useCallback((count: string) => {
    const num = parseInt(count);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return count;
  }, []);

  const formatPublishedDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  }, []);

  const getCategoryVariant = useCallback((category: string) => {
    const variants = {
      education: 'default',
      science: 'secondary', 
      entertainment: 'outline',
      music: 'secondary',
      sports: 'outline',
      arts: 'secondary',
      stories: 'outline',
    };
    return variants[category as keyof typeof variants] || 'secondary';
  }, []);

  const handleApprove = useCallback(() => {
    onApprove(video);
  }, [onApprove, video]);

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoading(false);
  }, []);

  return (
    <Card className="bg-background hover:border-primary transition-all duration-200 hover:shadow-md overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted/20">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        <Image
          src={imageError ? video.thumbnail : (video.highResThumbnail || video.thumbnail)}
          alt={video.title}
          fill
          className={`object-cover transition-opacity duration-200 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Duration overlay */}
        <div className="absolute bottom-2 right-2 bg-black/75 text-white px-2 py-1 rounded text-sm font-medium">
          <Clock className="h-3 w-3 inline mr-1" />
          {video.duration}
        </div>

        {/* Category badge */}
        <div className="absolute top-2 left-2">
          <Badge variant={getCategoryVariant(video.category) as any} className="text-xs">
            {video.category}
          </Badge>
        </div>

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 bg-black/20">
          <div className="bg-background/90 rounded-full p-3">
            <Play className="h-6 w-6 text-foreground ml-0.5" />
          </div>
        </div>
      </div>
      
      {/* Content */}
      <CardContent className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2 leading-tight">
          {video.title}
        </h3>
        
        {/* Channel and metadata */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <div className="flex items-center">
            <User className="h-3 w-3 mr-1" />
            <span className="truncate">{video.channelName}</span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              <span>{formatViewCount(video.viewCount)} views</span>
            </div>
            <span>{formatPublishedDate(video.publishedAt)}</span>
          </div>
        </div>
        
        {/* AI Summary */}
        <Card className="bg-primary/5 border-primary/20 mb-4">
          <CardContent className="p-3">
            <h4 className="text-sm font-semibold text-foreground mb-1">Video Summary:</h4>
            <p className="text-sm text-foreground line-clamp-3">{video.summary}</p>
          </CardContent>
        </Card>
        
        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary p-0 h-auto">
            <a
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Preview
            </a>
          </Button>
          
          <Button
            onClick={handleApprove}
            disabled={isApproving}
            size="sm"
            className="flex-shrink-0"
          >
            {isApproving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ThumbsUp className="h-4 w-4 mr-2" />
            )}
            {isApproving ? "Approving..." : "Approve"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(VideoCard);