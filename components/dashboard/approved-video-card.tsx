"use client";

import { useState, memo, useCallback } from "react";
import Image from "next/image";
import { Play, Clock, User, Eye, Loader2, ExternalLink, Sparkles, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ApprovedVideoCardProps {
  video: {
    id: string;
    youtubeId: string;
    title: string;
    description?: string;
    thumbnail: string;
    channelName: string;
    duration: string;
    summary: string;
    watched: boolean;
    createdAt: Date;
  };
  childId: string;
  onRemove: (videoId: string) => void;
  onShowDetails: (video: any) => void;
  isRemoving?: boolean;
}

function ApprovedVideoCard({ video, childId, onRemove, onShowDetails, isRemoving = false }: ApprovedVideoCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const formatApprovedDate = useCallback((dateString: Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Approved 1 day ago';
    if (diffDays < 7) return `Approved ${diffDays} days ago`;
    if (diffDays < 30) return `Approved ${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `Approved ${Math.ceil(diffDays / 30)} months ago`;
    return `Approved ${Math.ceil(diffDays / 365)} years ago`;
  }, []);

  const handleRemove = useCallback(() => {
    onRemove(video.id);
  }, [onRemove, video.id]);

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
          src={video.thumbnail}
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

        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <Badge 
            variant={video.watched ? "default" : "secondary"}
            className={video.watched ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"}
          >
            {video.watched ? 'Watched' : 'Not watched'}
          </Badge>
        </div>

        {/* Remove button */}
        <div className="absolute top-2 right-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isRemoving}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 p-2 rounded-full h-auto bg-background/80 backdrop-blur-sm"
            title="Remove approval"
          >
            {isRemoving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
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
            <span className="text-xs">{formatApprovedDate(video.createdAt)}</span>
          </div>
        </div>
        
        {/* Summary Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mb-4"
          onClick={() => onShowDetails(video)}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          View Details & Generate Summary
        </Button>
        
        {/* Actions */}
        <div className="flex items-center justify-center">
          <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary p-0 h-auto">
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
  );
}

export default memo(ApprovedVideoCard);