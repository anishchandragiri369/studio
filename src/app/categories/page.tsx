"use client";

import React from 'react';
import { HOME_CATEGORIES, TRADITIONAL_JUICE_CATEGORIES } from '@/lib/constants';
import CategoryCard from '@/components/categories/CategoryCard';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Explore Our Categories
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover our carefully curated collection of healthy juices and fruit bowls, 
            organized by health benefits and flavor profiles.
          </p>
        </div>

        {/* Health-Focused Categories */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-foreground mb-8 text-center">
            Health-Focused Categories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
            {HOME_CATEGORIES.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>

        {/* Traditional Juice Categories */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-foreground mb-8 text-center">
            Traditional Juice Categories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRADITIONAL_JUICE_CATEGORIES.map((category) => (
              <Card key={category} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl text-primary group-hover:text-accent transition-colors">
                    {category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Link 
                    href={`/menu?category=${encodeURIComponent(category)}`}
                    className="inline-flex items-center text-sm text-muted-foreground group-hover:text-accent transition-colors"
                  >
                    Shop Now <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto bg-primary/5 border-primary/20">
            <CardContent className="p-8">
              <h3 className="text-2xl font-semibold text-primary mb-4">
                Can't Find What You're Looking For?
              </h3>
              <p className="text-muted-foreground mb-6">
                Browse our complete menu to see all available products and discover new favorites.
              </p>
              <Link
                href="/menu"
                className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                View All Products <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
