"use client";

import { JUICES as FALLBACK_JUICES, TRADITIONAL_JUICE_CATEGORIES } from '@/lib/constants';
import JuiceCard from '@/components/menu/JuiceCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, Filter, Grid3X3, List, Sparkles, Star, ArrowRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import type { Juice } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import Image from 'next/image';
import Link from 'next/link';

function MenuPageContent() {
  const searchParams = useSearchParams();
  const categoryQuery = searchParams.get('category');

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [allJuices, setAllJuices] = useState<Juice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high' | 'popular'>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);

  const fetchJuices = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setAllJuices(FALLBACK_JUICES);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.from('juices').select('*');
      if (error) {
        setAllJuices(FALLBACK_JUICES);
      } else if (data) {
        const typedData = data.map((item: any) => ({
          ...item,
          price: Number(item.price) || 0,
          stockQuantity: Number(item.stock_quantity) ?? Number(item.stockQuantity) ?? 0,
        })) as Juice[];
        setAllJuices(typedData);
      }
    } catch (error) {
      setAllJuices(FALLBACK_JUICES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJuices();
  }, [fetchJuices]);

  useEffect(() => {
    if (categoryQuery) {
      setSelectedCategory(categoryQuery);
    }
  }, [categoryQuery]);

  useEffect(() => {
    document.title = selectedCategory 
      ? `${selectedCategory} Juices - Elixr` 
      : 'Fresh Juices - Elixr';
  }, [selectedCategory]);

  // Filtered and sorted juices
  const filteredJuices = useMemo(() => {
    let filtered = allJuices;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(juice => juice.category === selectedCategory);
    }    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(juice =>
        juice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (juice.description && juice.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
      default:
        // Keep original order or implement popularity logic
        break;
    }

    return filtered;
  }, [allJuices, selectedCategory, searchTerm, sortBy]);
  const categories = useMemo(() => {
    const categoryCount = allJuices.reduce((acc, juice) => {
      if (juice.category) {
        acc[juice.category] = (acc[juice.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return TRADITIONAL_JUICE_CATEGORIES.map(catName => ({
      name: catName,
      count: categoryCount[catName] || 0
    }));
  }, [allJuices]);
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-green-50 to-blue-50">
        <div className="glass-card rounded-2xl p-8 text-center animate-fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground mb-2">Loading our fresh juices...</p>
          <p className="text-sm text-muted-foreground/70">Preparing the perfect blend for you</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with World of Elixirs Background */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-green-900/20 to-blue-900/20"></div>
          <Image
            src="/images/Welcome-to-the-world-of-Elixirs_page.jpg"
            alt="Welcome to the world of Elixirs"
            fill
            sizes="100vw"
            className="object-cover opacity-30"
            priority
            quality={90}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/60"></div>
          
          {/* More Floating Elements */}
          <div className="absolute top-16 right-10 w-24 h-24 bg-gradient-to-r from-orange-500 to-red-500 rounded-full opacity-20 animate-float-ultra"></div>
          <div className="absolute bottom-20 left-16 w-20 h-20 bg-gradient-to-r from-green-500 to-teal-500 rounded-full opacity-20 animate-float-ultra" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-32 left-10 w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full opacity-15 animate-float-ultra" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-32 right-20 w-18 h-18 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full opacity-15 animate-float-ultra" style={{ animationDelay: '3s' }}></div>
          <div className="absolute top-40 right-32 w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-10 animate-float-ultra" style={{ animationDelay: '4s' }}></div>
          <div className="absolute bottom-16 left-32 w-14 h-14 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full opacity-12 animate-float-ultra" style={{ animationDelay: '5s' }}></div>
        </div>        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <div className="mb-8">
              <span className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-primary/30 to-accent/30 text-white text-sm font-medium border border-white/30 shadow-lg">
                <Sparkles className="w-5 h-5 mr-2" />
                Fresh Cold-Pressed Elixirs
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-headline font-bold gradient-text mb-8 animate-fade-in">
              {selectedCategory ? `${selectedCategory} Collection` : 'Our Fresh Elixirs'}
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground/90 mb-10 leading-relaxed animate-fade-in font-medium drop-shadow-md" style={{ animationDelay: '200ms' }}>
              {selectedCategory 
                ? `Discover our premium ${selectedCategory.toLowerCase()} selection, crafted with the finest ingredients`
                : 'Discover a world of flavor with our handcrafted elixirs, made from the freshest ingredients'
              }
            </p>

            {selectedCategory && (
              <Button asChild variant="outline" className="glass-card border-primary/30 text-primary hover:bg-primary/10 btn-hover-lift animate-fade-in shadow-lg" style={{ animationDelay: '400ms' }}>
                <Link href="/menu">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  View All Elixirs
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>      {/* Filters Section */}
      <section className="py-12 bg-background/95 backdrop-blur-sm border-b border-border/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="Search elixirs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 glass-card border-border/50 bg-card/80 h-12 rounded-xl shadow-soft focus:border-primary/50 transition-all"
              />
            </div>            {/* Controls */}
            <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-36 sm:w-44 glass-card border-border/50 bg-card/80 h-12 rounded-xl shadow-soft">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="glass-card border-border/20 bg-card/95">
                  <SelectItem value="popular">🔥 Most Popular</SelectItem>
                  <SelectItem value="name">📝 Name A-Z</SelectItem>
                  <SelectItem value="price-low">💰 Price: Low to High</SelectItem>
                  <SelectItem value="price-high">💎 Price: High to Low</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex rounded-xl glass-card border border-border/50 p-1 bg-card/80 shadow-soft">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-10 w-10 p-0 rounded-lg"
                  aria-label="Grid view"
                >
                  <Grid3X3 className="h-5 w-5" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-10 w-10 p-0 rounded-lg"
                  aria-label="List view"
                >
                  <List className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>          {/* Categories */}
          {!selectedCategory && (
            <div className="mt-8">
              <div className="flex flex-wrap gap-3">
                {categories.map((category, index) => (
                  <Badge
                    key={category.name}
                    variant="outline"
                    className="glass-card border-border/50 hover:bg-primary/10 hover:border-primary/50 cursor-pointer transition-all duration-300 animate-fade-in px-4 py-2 text-sm font-medium shadow-soft hover:shadow-lg rounded-full text-foreground hover:text-primary"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    {category.name} ({category.count})
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>      {/* Products Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          {filteredJuices.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-12">
                <div className="glass-card px-6 py-4 rounded-xl shadow-soft">
                  <p className="text-foreground/90 font-medium">
                    ✨ Showing <span className="text-primary font-bold">{filteredJuices.length}</span> elixir{filteredJuices.length !== 1 ? 's' : ''}
                    {selectedCategory && <span className="text-accent"> in {selectedCategory}</span>}
                    {searchTerm && <span className="text-secondary"> for "{searchTerm}"</span>}
                  </p>
                </div>
              </div>

              <div className={
                viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                  : "space-y-6"
              }>
                {filteredJuices.map((juice, index) => (
                  <div 
                    key={juice.id} 
                    className={`animate-fade-in hover:scale-105 transition-transform duration-300 ${viewMode === 'list' ? 'max-w-2xl mx-auto' : ''}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="card-premium rounded-2xl p-1 shadow-neon hover:shadow-glass-ultra transition-all duration-500">
                      <JuiceCard juice={juice} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <Card className="glass-hero border-white/20 p-16 text-center max-w-lg mx-auto shadow-ultra">
              <div className="animate-glow-pulse mb-6">
                <Search className="w-20 h-20 text-primary mx-auto" />
              </div>
              <h3 className="text-2xl font-bold mb-4 gradient-text">No elixrs found</h3>
              <p className="text-white/70 mb-6 text-lg">
                {searchTerm 
                  ? `No elixrs match "${searchTerm}"`
                  : selectedCategory 
                  ? `No elixrs available in ${selectedCategory}`
                  : "No elixrs available"
                }
              </p>
              {(searchTerm || selectedCategory) && (
                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory(null);
                  }}
                  variant="outline"
                  className="glass border-white/30 text-white hover:bg-white/20 shadow-ultra px-8 py-3 rounded-xl"
                >
                  ✨ Clear Filters
                </Button>
              )}
            </Card>
          )}
        </div>
      </section>      {/* Ultra HD Featured Categories */}
      {!selectedCategory && (
        <section className="py-24 bg-gradient-to-br from-background/80 via-primary/5 to-accent/5 bg-mesh-gradient">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-headline font-bold gradient-text-warm mb-6 neon-text">
                Shop by Category
              </h2>
              <p className="text-xl text-white/80 max-w-3xl mx-auto font-medium">
                Explore our carefully curated elixir categories, each crafted with premium ingredients
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categories.filter(cat => cat.count > 0).map((category, index) => (
                <Card 
                  key={category.name}
                  className="card-premium border-white/20 shadow-neon hover:shadow-glass-ultra group cursor-pointer transition-all duration-500 animate-fade-in overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => setSelectedCategory(category.name)}
                >
                  <CardContent className="p-8">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary via-accent to-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-glow-pulse">
                          <Star className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 animate-pulse"></div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-2xl group-hover:text-primary transition-colors duration-300 text-white mb-2">
                          {category.name}
                        </h3>
                        <p className="text-white/70 text-lg">
                          {category.count} premium elixir{category.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ArrowRight className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <MenuPageContent />
    </Suspense>
  );
}
