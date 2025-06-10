
import { JUICES, TRADITIONAL_JUICE_CATEGORIES } from '@/lib/constants';
import JuiceCard from '@/components/menu/JuiceCard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Juices - Elixr',
  description: 'Explore our wide selection of fresh and delicious juices.',
};

export default function MenuPage() {
  const traditionalJuices = JUICES.filter(juice => 
    juice.category && TRADITIONAL_JUICE_CATEGORIES.includes(juice.category)
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4 animate-fade-in">
          Our Fresh Juices
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in animation-delay-200">
          Discover a world of flavor with our handcrafted juices, made from the freshest ingredients.
        </p>
      </section>

      {/* TODO: Add filtering/sorting options here if needed */}
      
      {traditionalJuices.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {traditionalJuices.map((juice, index) => (
            <div key={juice.id} className="animate-slide-in-up" style={{ animationDelay: `${index * 100}ms`}}>
              <JuiceCard juice={juice} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground text-lg">No juices available at the moment. Please check back later!</p>
      )}
    </div>
  );
}
