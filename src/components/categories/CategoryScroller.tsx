
"use client";

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CategoryCard from './CategoryCard';
import type { HomeCategory } from '@/lib/constants';

interface CategoryScrollerProps {
  categories: HomeCategory[];
}

const CategoryScroller = ({ categories }: CategoryScrollerProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300; // Adjust scroll amount as needed
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <div
        ref={scrollContainerRef}
        className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide" // scrollbar-hide is a common utility, ensure it's defined or use Tailwind's native scrollbar utilities
      >
        {categories.map((category, index) => (
          <div key={category.id} className="flex-shrink-0 animate-slide-in-up" style={{ animationDelay: `${index * 100}ms`}}>
            <CategoryCard category={category} />
          </div>
        ))}
      </div>
      {categories.length > 5 && ( // Only show buttons if there are more than 5 categories to scroll
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background transform -translate-x-2 md:-translate-x-4 opacity-80 hover:opacity-100"
            onClick={() => scroll('left')}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background transform translate-x-2 md:translate-x-4 opacity-80 hover:opacity-100"
            onClick={() => scroll('right')}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}
    </div>
  );
};

export default CategoryScroller;
