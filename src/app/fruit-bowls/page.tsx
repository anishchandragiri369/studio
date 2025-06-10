
import { JUICES } from '@/lib/constants';
import JuiceCard from '@/components/menu/JuiceCard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fresh Fruit Bowls - Elixr',
  description: 'Enjoy our delicious and healthy fruit bowls, packed with natural goodness.',
};

export default function FruitBowlsPage() {
  const fruitBowls = JUICES.filter(juice => juice.category === 'Fruit Bowls');

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4 animate-fade-in">
          Fresh Fruit Bowls
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in animation-delay-200">
          Start your day right or enjoy a healthy snack with our vibrant and nutritious fruit bowls.
        </p>
      </section>
      
      {fruitBowls.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {fruitBowls.map((bowl, index) => (
            <div key={bowl.id} className="animate-slide-in-up" style={{ animationDelay: `${index * 100}ms`}}>
              <JuiceCard juice={bowl} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground text-lg">No fruit bowls available at the moment. Please check back later!</p>
      )}
    </div>
  );
}
