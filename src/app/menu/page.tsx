
import { JUICES, TRADITIONAL_JUICE_CATEGORIES, HOME_CATEGORIES } from '@/lib/constants';
import JuiceCard from '@/components/menu/JuiceCard';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface MenuPageProps {
  searchParams?: {
    category?: string;
  };
}

// Replaced dynamic generateMetadata with a static metadata object
export const metadata: Metadata = {
  title: 'Our Juices - Elixr',
  description: 'Explore our wide selection of fresh and delicious juices. Filter by category to find your perfect blend!',
};

export default function MenuPage({ searchParams }: MenuPageProps) {
  const selectedCategory = searchParams?.category ? decodeURIComponent(searchParams.category) : null;

  let displayedJuices;
  let pageTitle = "Our Fresh Juices"; // This H1 title can still be dynamic
  let pageDescription = "Discover a world of flavor with our handcrafted juices, made from the freshest ingredients.";

  if (selectedCategory) {
    displayedJuices = JUICES.filter(juice => 
      juice.tags && juice.tags.includes(selectedCategory)
    );
    const categoryDetails = HOME_CATEGORIES.find(cat => cat.name === selectedCategory);
    pageTitle = categoryDetails ? `${categoryDetails.name}` : `${selectedCategory} Juices`;
    pageDescription = `Fresh and delicious ${categoryDetails ? categoryDetails.name.toLowerCase() : selectedCategory.toLowerCase()} juices.`;
    
    // Update document title on client-side if category is selected
    if (typeof window !== 'undefined') {
        document.title = `${categoryDetails ? categoryDetails.name : selectedCategory} - Elixr`;
    }

  } else {
    displayedJuices = JUICES.filter(juice => 
      juice.category && TRADITIONAL_JUICE_CATEGORIES.includes(juice.category)
    );
    // Reset document title for the main menu page
     if (typeof window !== 'undefined') {
        document.title = 'Our Juices - Elixr';
    }
  }


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
