
"use client"; // Make it a client component

import { JUICES, TRADITIONAL_JUICE_CATEGORIES, HOME_CATEGORIES } from '@/lib/constants';
import JuiceCard from '@/components/menu/JuiceCard';
// import type { Metadata } from 'next'; // Removed as it cannot be exported from client component
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation'; // For client-side search params
import { useState, useEffect } from 'react';
import type { Juice } from '@/lib/types';

// Static metadata export is removed from client component.
// General metadata is handled by parent layouts or document.title can be set in useEffect.

export default function MenuPage() {
  const searchParams = useSearchParams();
  const categoryQuery = searchParams.get('category');

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [displayedJuices, setDisplayedJuices] = useState<Juice[]>([]);
  const [pageTitle, setPageTitle] = useState("Our Fresh Juices");
  const [pageDescription, setPageDescription] = useState("Discover a world of flavor with our handcrafted juices, made from the freshest ingredients.");

  useEffect(() => {
    const currentCategory = categoryQuery ? decodeURIComponent(categoryQuery) : null;
    setSelectedCategory(currentCategory);

    let title = "Our Fresh Juices";
    let description = "Discover a world of flavor with our handcrafted juices, made from the freshest ingredients.";
    let juicesToDisplay;

    if (currentCategory) {
      juicesToDisplay = JUICES.filter(juice =>
        juice.tags && juice.tags.includes(currentCategory)
      );
      const categoryDetails = HOME_CATEGORIES.find(cat => cat.name === currentCategory);
      title = categoryDetails ? `${categoryDetails.name}` : `${currentCategory} Juices`;
      description = `Fresh and delicious ${categoryDetails ? categoryDetails.name.toLowerCase() : currentCategory.toLowerCase()} juices.`;
      document.title = `${categoryDetails ? categoryDetails.name : currentCategory} - Elixr`;
    } else {
      juicesToDisplay = JUICES.filter(juice =>
        juice.category && TRADITIONAL_JUICE_CATEGORIES.includes(juice.category)
      );
      // Set default title for the base /menu route
      document.title = 'Our Juices - Elixr';
    }

    setDisplayedJuices(juicesToDisplay);
    setPageTitle(title);
    setPageDescription(description);

  }, [categoryQuery]);

  return (
    <div className="container mx-auto px-4 py-8">
      {selectedCategory && (
        <Button variant="outline" asChild className="mb-8">
          <Link href="/#categories">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Categories
          </Link>
        </Button>
      )}
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4 animate-fade-in">
          {pageTitle}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in animation-delay-200">
          {pageDescription}
        </p>
      </section>

      {displayedJuices.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {displayedJuices.map((juice, index) => (
            <div key={juice.id} className="animate-slide-in-up" style={{ animationDelay: `${index * 100}ms`}}>
              <JuiceCard juice={juice} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground mb-6">
            No juices found for {selectedCategory ? `"${selectedCategory}"` : 'this category'} at the moment.
          </p>
          <Button asChild>
            <Link href="/menu">View All Juices</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
