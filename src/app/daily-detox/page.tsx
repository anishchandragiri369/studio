
import { JUICES } from '@/lib/constants';
import JuiceCard from '@/components/menu/JuiceCard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daily Detox Plans - Elixr',
  description: 'Recharge and reset with our specially designed daily detox plans.',
};

export default function DailyDetoxPage() {
  const detoxPlans = JUICES.filter(juice => juice.category === 'Detox Plans');

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4 animate-fade-in">
          Daily Detox Plans
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in animation-delay-200">
          Nourish your body and mind with our curated detox plans, made from the freshest ingredients.
        </p>
      </section>
      
      {detoxPlans.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {detoxPlans.map((plan, index) => (
            <div key={plan.id} className="animate-slide-in-up" style={{ animationDelay: `${index * 100}ms`}}>
              <JuiceCard juice={plan} />
            </div>
          ))}
        </div>
      ) : (
         <p className="text-center text-muted-foreground text-lg">No detox plans available at the moment. Please check back later!</p>
      )}
    </div>
  );
}
