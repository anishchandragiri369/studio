"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, Clock, Award } from 'lucide-react';
import RatingDisplay from '@/components/ratings/RatingDisplay';
import Link from 'next/link';

export default function ReviewsPage() {
  const [currentTab, setCurrentTab] = useState('recent');

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customer Reviews</h1>
            <p className="text-muted-foreground">
              See what our customers are saying about their Elixr experience
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/menu">Shop Now</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold">4.8</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
                <p className="text-2xl font-bold">2,847</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">5-Star Reviews</p>
                <p className="text-2xl font-bold">78%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">+156</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Categories */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent Reviews
          </TabsTrigger>
          <TabsTrigger value="top-rated" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Top Rated
          </TabsTrigger>
          <TabsTrigger value="most-helpful" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Most Helpful
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Customer Reviews
              </CardTitle>
              <CardDescription>
                Latest feedback from our valued customers
              </CardDescription>
            </CardHeader>
          </Card>
          
          <RatingDisplay 
            type="recent" 
            limit={10}
            showPagination={true}
          />
        </TabsContent>

        <TabsContent value="top-rated" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Top Rated Experiences
              </CardTitle>
              <CardDescription>
                Our highest-rated orders and customer experiences
              </CardDescription>
            </CardHeader>
          </Card>
          
          <RatingDisplay 
            type="top-rated" 
            limit={10}
            showPagination={true}
          />
        </TabsContent>

        <TabsContent value="most-helpful" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-500" />
                Most Helpful Reviews
              </CardTitle>
              <CardDescription>
                Reviews that other customers found most valuable
              </CardDescription>
            </CardHeader>
          </Card>
          
          <RatingDisplay 
            type="most-helpful" 
            limit={10}
            showPagination={true}
          />
        </TabsContent>
      </Tabs>

      {/* Features Section */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <Star className="w-8 h-8 text-yellow-500 mx-auto" />
              <h3 className="font-semibold">Verified Reviews</h3>
              <p className="text-sm text-muted-foreground">
                All reviews are from verified customers who have made purchases
              </p>
            </div>
            
            <div className="space-y-2">
              <Award className="w-8 h-8 text-blue-500 mx-auto" />
              <h3 className="font-semibold">Earn Rewards</h3>
              <p className="text-sm text-muted-foreground">
                Get 5 reward points for every review you write
              </p>
            </div>
            
            <div className="space-y-2">
              <TrendingUp className="w-8 h-8 text-green-500 mx-auto" />
              <h3 className="font-semibold">Help Others</h3>
              <p className="text-sm text-muted-foreground">
                Your feedback helps other customers make informed decisions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0">
        <CardContent className="p-6 text-center space-y-4">
          <h3 className="text-xl font-semibold">Share Your Experience</h3>
          <p className="text-muted-foreground">
            Have you tried our juices? We'd love to hear about your experience!
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/account">View My Orders</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/menu">Shop Fresh Juices</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
