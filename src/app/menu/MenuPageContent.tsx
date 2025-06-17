"use client";
import { JUICES as FALLBACK_JUICES, TRADITIONAL_JUICE_CATEGORIES, HOME_CATEGORIES } from '@/lib/constants';
import JuiceCard from '@/components/menu/JuiceCard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import type { Juice } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import Image from 'next/image';

export default function MenuPageContent() {
  const searchParams = useSearchParams();
  const categoryQuery = searchParams.get('category');

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [allJuices, setAllJuices] = useState<Juice[]>([]);
  const [displayedJuices, setDisplayedJuices] = useState<Juice[]>([]);
  const [pageTitle, setPageTitle] = useState("Our Fresh Juices");
  const [pageDescription, setPageDescription] = useState("Discover a world of flavor with our handcrafted juices, made from the freshest ingredients.");
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchJuices = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      console.warn("MenuPage: Supabase is not configured. Falling back to local constants for juices.");
      setAllJuices(FALLBACK_JUICES);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase.from('juices').select('*');
      if (error) {
        console.error("Error fetching juices from Supabase:", error);
        setFetchError(`Failed to load juices from the database: ${error.message}. Displaying sample data.`);
        setAllJuices(FALLBACK_JUICES);
      } else if (data) {
        const typedData = data.map((item: any) => ({
          ...item,
          price: Number(item.price) || 0,
          stockQuantity: Number(item.stock_quantity) ?? Number(item.stockQuantity) ?? 0,
          tags: Array.isArray(item.tags) ? item.tags : (typeof item.tags === 'string' ? item.tags.split(',') : []),
        })) as Juice[];
        setAllJuices(typedData);
      } else {
        setAllJuices([]);
      }
    } catch (e: any) {
      console.error("Unexpected error during juice fetch:", e);
      setFetchError(`An unexpected error occurred: ${e.message}. Displaying sample data.`);
      setAllJuices(FALLBACK_JUICES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJuices();
  }, [fetchJuices]);

  useEffect(() => {
    const currentCategory = categoryQuery ? decodeURIComponent(categoryQuery) : null;
    setSelectedCategory(currentCategory);
    let title = "Our Fresh Juices";
    let description = "Discover a world of flavor with our handcrafted juices, made from the freshest ingredients.";
    let juicesToDisplay: Juice[];
    if (currentCategory) {
      juicesToDisplay = allJuices.filter(juice =>
        juice.tags && juice.tags.map(tag => tag.toLowerCase()).includes(currentCategory.toLowerCase())
      );
      const categoryDetails = HOME_CATEGORIES.find(cat => cat.name.toLowerCase() === currentCategory.toLowerCase());
      title = categoryDetails ? `${categoryDetails.name}` : `${currentCategory} Juices`;
      description = `Fresh and delicious ${categoryDetails ? categoryDetails.name.toLowerCase() : currentCategory.toLowerCase()} juices.`;
      document.title = `${categoryDetails ? categoryDetails.name : currentCategory} - Elixr`;
    } else {
      juicesToDisplay = allJuices.filter(juice =>
        juice.category && TRADITIONAL_JUICE_CATEGORIES.map(c => c.toLowerCase()).includes(juice.category.toLowerCase())
      );
      document.title = 'Our Juices - Elixr';
    }
    setDisplayedJuices(juicesToDisplay);
    setPageTitle(title);
    setPageDescription(description);
  }, [categoryQuery, allJuices]);

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 z-0">
        <Image src="/images/fruit-bowl-custom.jpg" alt="Juice menu background" fill className="object-cover opacity-40 blur pointer-events-none select-none" priority />
        <div className="absolute inset-0 bg-gradient-to-br from-lime-100/80 via-green-50/80 to-yellow-100/80 mix-blend-multiply" />
      </div>
      <div className="relative z-10">
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
        {fetchError && (
          <Alert variant="destructive" className="mb-8 max-w-2xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Database Error</AlertTitle>
            <AlertDescription>{fetchError}</AlertDescription>
          </Alert>
        )}
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Loading juices...</p>
          </div>
        ) : displayedJuices.length > 0 ? (
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
              No juices found for {selectedCategory ? `"${selectedCategory}"` : 'this view'}.
              {allJuices.length === 0 && !fetchError && " It seems our juice list is empty at the moment!"}
            </p>
            {selectedCategory && (
              <Button asChild>
                <Link href="/menu">View All Juices</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
