
import { JUICES } from '@/lib/constants';
import JuiceCard from '@/components/menu/JuiceCard';
import CustomDetoxCard from '@/components/detox/CustomDetoxCard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daily Detox Plans - Elixr',
  description: 'Recharge and reset with our specially designed daily detox plans.',
};

export default function DailyDetoxPage() {
  const detoxPlans = JUICES.filter(juice => juice.category === 'Detox Plans');
  const customDetoxPlan = detoxPlans.find(plan => plan.id === 'dtx0');
  const otherDetoxPlans = detoxPlans.filter(plan => plan.id !== 'dtx0');

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
      
      {/* Custom 1-Day Detox Plan */}
      {customDetoxPlan && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-center">Build Your Own Detox</h2>
          <div className="max-w-md mx-auto">
            <CustomDetoxCard detoxPlan={customDetoxPlan} />
          </div>
        </section>
      )}
      
      {/* Pre-designed Detox Plans */}
      {otherDetoxPlans.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-center">Pre-designed Plans</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {otherDetoxPlans.map((plan, index) => (
              <div key={plan.id} className="animate-slide-in-up" style={{ animationDelay: `${index * 100}ms`}}>
                <JuiceCard juice={plan} />
              </div>
            ))}
          </div>
        </section>
      )}
      
      {detoxPlans.length === 0 && (
        <p className="text-center text-muted-foreground text-lg">No detox plans available at the moment. Please check back later!</p>
      )}
    </div>
  );
}
