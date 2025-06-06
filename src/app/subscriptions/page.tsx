import { SUBSCRIPTION_PLANS, MOCK_USER_TASTE_PREFERENCES, MOCK_USER_CONSUMPTION_HABITS, AVAILABLE_JUICE_NAMES_FOR_AI } from '@/lib/constants';
import SubscriptionOptionCard from '@/components/subscriptions/SubscriptionOptionCard';
import { Metadata } from 'next';
import AISubscriptionRecommender from '@/components/subscriptions/AISubscriptionRecommender'; // To be created

export const metadata: Metadata = {
  title: 'Juice Subscriptions - JuiceBox',
  description: 'Choose from our flexible weekly and monthly juice subscription plans.',
};

export default function SubscriptionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4 animate-fade-in">
          Juice Subscriptions
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in animation-delay-200">
          Never run out of your favorite juices! Choose a plan that fits your lifestyle and get fresh juices delivered regularly.
        </p>
      </section>

      <section className="mb-16">
        <h2 className="text-3xl font-headline text-center mb-8">Our Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SUBSCRIPTION_PLANS.map((plan, index) => (
             <div key={plan.id} className="animate-slide-in-up" style={{ animationDelay: `${index * 100}ms`}}>
              <SubscriptionOptionCard plan={plan} isFeatured={index === 0} /> {/* Highlight the first plan as example */}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-card p-8 rounded-lg shadow-xl">
        <h2 className="text-3xl font-headline text-center mb-6 text-primary">Need Help Choosing?</h2>
        <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
          Let our AI assistant suggest a personalized subscription plan based on your preferences!
        </p>
        <AISubscriptionRecommender
          tastePreferences={MOCK_USER_TASTE_PREFERENCES}
          consumptionHabits={MOCK_USER_CONSUMPTION_HABITS}
          availableJuiceFlavors={AVAILABLE_JUICE_NAMES_FOR_AI}
        />
      </section>
    </div>
  );
}
