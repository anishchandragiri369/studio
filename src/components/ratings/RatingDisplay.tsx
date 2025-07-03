"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ThumbsUp, ThumbsDown, MessageCircle, Calendar, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface Rating {
  id: string;
  order_id: string;
  rating: number;
  quality_rating?: number;
  delivery_rating?: number;
  service_rating?: number;
  feedback_text: string;
  anonymous: boolean;
  helpful_count: number;
  created_at: string;
  orders?: {
    id: string;
    created_at: string;
    total_amount: number;
    items: any[];
  };
}

interface RatingDisplayProps {
  type?: 'recent' | 'top-rated' | 'most-helpful';
  limit?: number;
  showPagination?: boolean;
  juiceId?: string;
  className?: string;
}

export default function RatingDisplay({ 
  type = 'recent', 
  limit = 10, 
  showPagination = true,
  juiceId,
  className = '' 
}: RatingDisplayProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [userVotes, setUserVotes] = useState<{ [key: string]: boolean | null }>({});

  useEffect(() => {
    fetchRatings();
  }, [type, limit, offset, juiceId]);

  const fetchRatings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type,
        limit: limit.toString(),
        offset: offset.toString(),
        ...(juiceId && { juiceId }),
        includeAnonymous: 'true'
      });

      const response = await fetch(`/api/ratings/list?${params}`);
      const result = await response.json();

      if (response.ok) {
        setRatings(offset === 0 ? result.data.ratings : [...ratings, ...result.data.ratings]);
        setStatistics(result.data.statistics);
        setHasMore(result.data.pagination.hasMore);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
      toast({
        title: "Error",
        description: "Failed to load ratings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHelpfulVote = async (ratingId: string, isHelpful: boolean) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to vote on ratings.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/ratings/helpful', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ratingId,
          userId: user.id,
          isHelpful
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setUserVotes(prev => ({ ...prev, [ratingId]: isHelpful }));
        
        // Update helpful count in the local state
        setRatings(prev => prev.map(rating => 
          rating.id === ratingId 
            ? { ...rating, helpful_count: rating.helpful_count + (isHelpful ? 1 : -1) }
            : rating
        ));

        toast({
          title: "Vote Recorded",
          description: result.message,
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error voting on rating:', error);
      toast({
        title: "Error",
        description: "Failed to record vote.",
        variant: "destructive",
      });
    }
  };

  const renderStars = (rating: number, size: string = 'w-4 h-4') => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingText = (rating: number) => {
    if (rating === 5) return 'Excellent';
    if (rating === 4) return 'Good';
    if (rating === 3) return 'Average';
    if (rating === 2) return 'Poor';
    return 'Very Poor';
  };

  const loadMore = () => {
    setOffset(prev => prev + limit);
  };

  if (loading && offset === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-3 bg-muted rounded w-1/3"></div>
                <div className="h-16 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Statistics Overview */}
      {statistics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Customer Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {renderStars(Math.round(statistics.averageRating), 'w-6 h-6')}
                  <span className="text-2xl font-bold">{statistics.averageRating}</span>
                  <span className="text-muted-foreground">
                    ({statistics.totalRatings} reviews)
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-2">{star}</span>
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <Progress 
                      value={(statistics.ratingDistribution[star] / statistics.totalRatings) * 100} 
                      className="flex-1 h-2"
                    />
                    <span className="w-8 text-right">
                      {statistics.ratingDistribution[star]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ratings List */}
      <div className="space-y-4">
        {ratings.map((rating) => (
          <Card key={rating.id}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Rating Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {renderStars(rating.rating)}
                      <Badge variant="secondary">
                        {getRatingText(rating.rating)}
                      </Badge>
                    </div>
                    
                    {/* Category Ratings */}
                    {(rating.quality_rating || rating.delivery_rating || rating.service_rating) && (
                      <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                        {rating.quality_rating && (
                          <div className="flex items-center gap-1">
                            <span>Quality:</span>
                            {renderStars(rating.quality_rating, 'w-3 h-3')}
                          </div>
                        )}
                        {rating.delivery_rating && (
                          <div className="flex items-center gap-1">
                            <span>Delivery:</span>
                            {renderStars(rating.delivery_rating, 'w-3 h-3')}
                          </div>
                        )}
                        {rating.service_rating && (
                          <div className="flex items-center gap-1">
                            <span>Service:</span>
                            {renderStars(rating.service_rating, 'w-3 h-3')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {rating.anonymous ? (
                        <>
                          <User className="w-3 h-3" />
                          <span>Anonymous</span>
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3" />
                          <span>Verified Customer</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDistanceToNow(new Date(rating.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>

                {/* Feedback Text */}
                {rating.feedback_text && (
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-sm leading-relaxed">{rating.feedback_text}</p>
                  </div>
                )}

                {/* Order Info */}
                {rating.orders && (
                  <div className="text-xs text-muted-foreground">
                    Order #{rating.order_id.slice(-8)} • ₹{rating.orders.total_amount} • 
                    {rating.orders.items?.length || 0} item(s)
                  </div>
                )}

                {/* Helpfulness Voting */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">
                      Was this review helpful?
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleHelpfulVote(rating.id, true)}
                        disabled={!user || userVotes[rating.id] === true}
                        className="h-7 px-2"
                      >
                        <ThumbsUp className="w-3 h-3 mr-1" />
                        Yes
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleHelpfulVote(rating.id, false)}
                        disabled={!user || userVotes[rating.id] === false}
                        className="h-7 px-2"
                      >
                        <ThumbsDown className="w-3 h-3 mr-1" />
                        No
                      </Button>
                    </div>
                  </div>
                  
                  {rating.helpful_count > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {rating.helpful_count} people found this helpful
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      {showPagination && hasMore && (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More Reviews'}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && ratings.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Reviews Yet</h3>
            <p className="text-muted-foreground">
              Be the first to share your experience!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
