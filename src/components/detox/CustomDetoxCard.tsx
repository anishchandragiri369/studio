'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings, Star, Clock, Users } from 'lucide-react';
import Image from 'next/image';
import OneDayDetoxBuilder from './OneDayDetoxBuilder';
import type { Juice } from '@/lib/types';

interface CustomDetoxCardProps {
  detoxPlan: Juice;
}

export default function CustomDetoxCard({ detoxPlan }: CustomDetoxCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Card className="overflow-hidden group hover:shadow-lg transition-shadow duration-300">
        <div className="relative h-64 overflow-hidden bg-white flex items-center justify-center">
          <Image
            src={detoxPlan.image}
            alt={detoxPlan.name}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-300 object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Premium Badge */}
          <Badge className="absolute top-3 left-3 bg-gradient-to-r from-primary to-accent text-white border-0">
            <Settings className="w-3 h-3 mr-1" />
            Customizable
          </Badge>
          
          {/* Features overlay */}
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>1 Day</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>5+ Juices</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                <span>2+ Bowls</span>
              </div>
            </div>
          </div>
        </div>
        
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{detoxPlan.name}</CardTitle>
              <p className="text-sm text-muted-foreground mb-3">
                {detoxPlan.description}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {detoxPlan.tags?.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Starting from</p>
              <p className="text-2xl font-bold text-primary">₹{detoxPlan.price.toFixed(2)}</p>
            </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                  <Settings className="w-4 h-4 mr-2" />
                  Customize Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl w-[95vw] max-h-[85vh] overflow-y-auto p-0">
                <DialogHeader className="p-6 pb-4 sticky top-0 bg-background border-b z-10">
                  <DialogTitle className="text-xl md:text-2xl">Build Your 1-Day Detox Plan</DialogTitle>
                </DialogHeader>
                <div className="px-2">
                  <OneDayDetoxBuilder onClose={() => setIsDialogOpen(false)} />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
