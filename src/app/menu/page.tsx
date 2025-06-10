
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

export async function generateMetadata({ searchParams }: MenuPageProps): Promise<Metadata> {
  const categoryName = searchParams?.category ? decodeURIComponent(searchParams.category) : null;

  if (categoryName) {
    const categoryDetails = HOME_CATEGORIES.find(cat => cat.name === categoryName);
    return {
      title: `${categoryDetails ? categoryDetails.name : categoryName} Juices - Elixr`,
      description: `Explore our selection of ${categoryName.toLowerCase()} juices.`,
    };
  }

  return {
    title: 'Our Juices - Elixr',
    description: 'Explore our wide selection of fresh and delicious juices.',
  };
}

export default function MenuPage({ searchParams }: MenuPageProps) {
  const selectedCategory = searchParams?.category ? decodeURIComponent(searchParams.category) : null;

  let displayedJuices;
  let pageTitle = "Our Fresh Juices";
  let pageDescription = "Discover a world of flavor with our handcrafted juices, made from the freshest ingredients.";

  if (selectedCategory) {
    displayedJuices = JUICES.filter(juice => 
      juice.tags && juice.tags.includes(selectedCategory)
    );
    const categoryDetails = HOME_CATEGORIES.find(cat => cat.name === selectedCategory);
    pageTitle = categoryDetails ? `${categoryDetails.name}` : `${selectedCategory} Juices`;
    pageDescription = `Fresh and delicious juices for ${selectedCategory.toLowerCase()}.`;
  } else {
    displayedJuices = JUICES.filter(juice => 
      juice.category && TRADITIONAL_JUICE_CATEGORIES.includes(juice.category)
    );
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

    