
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import type { HomeCategory } from '@/lib/constants';
import { ArrowRight } from 'lucide-react';

interface CategoryCardProps {
  category: HomeCategory;
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  return (
    <Link href={category.href} className="block group">
      <Card className="w-60 h-full flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:-translate-y-1">
        <div className="relative w-full aspect-[3/2]"> {/* Landscape aspect ratio */}
          <Image
            src={category.image}
            alt={category.name}
            fill
            sizes="(max-width: 768px) 50vw, 240px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={category.dataAiHint}
          />
        </div>
        <CardContent className="p-4 flex-grow flex flex-col justify-between">
          <CardTitle className="font-headline text-lg text-primary mb-2 group-hover:text-accent transition-colors">
            {category.name}
          </CardTitle>
          <p className="text-xs text-muted-foreground group-hover:text-accent transition-colors flex items-center">
            Shop Now <ArrowRight className="ml-1 h-3 w-3" />
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CategoryCard;
