import { Button } from '@/components/ui/button';
import { JUICES, SUBSCRIPTION_PLANS, HOME_CATEGORIES } from '@/lib/constants';
import JuiceCard from '@/components/menu/JuiceCard';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Gift, Sparkles, Users } from 'lucide-react';
import JuiceRecommenderClient from '@/components/recommendations/JuiceRecommenderClient';
import SubscriptionOptionCard from '@/components/subscriptions/SubscriptionOptionCard';
import CategoryScroller from '@/components/categories/CategoryScroller'; // Import the new component

export default function HomePage() {
  const featuredJuices = JUICES.slice(0, 4); // Show first 4 juices as featured
  const weeklyKickstarterPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'sub1');
  const monthlyWellnessPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'sub2');

  return (
    <div className="flex flex-col">
      {/* Hero Section with Fruits Theme */}
      <section className="relative bg-gradient-to-br from-yellow-100 via-orange-50 to-lime-100 py-10 md:py-16 text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/Welcome-to-the-world-of-Elixirs_page.jpg"
            alt="Fruits background"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1920px"
            className="object-cover object-center opacity-100 pointer-events-none select-none"
            priority
          />
          <div className="absolute inset-0 bg-black/5" aria-hidden="true"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <h1
            className="text-5xl md:text-7xl font-headline font-bold mb-4 animate-fade-in drop-shadow-lg"
            style={{
              background: 'linear-gradient(90deg, #2e7d32 0%, #fb8c00 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent',
              display: 'inline-block',
            }}
          >
            Taste the Freshness.
          </h1>
          <p className="text-xl md:text-2xl text-black max-w-3xl mx-auto mb-6 animate-fade-in-shadow-lg">
            Discover vibrant, delicious juices made from the finest ingredients, delivered right to your door.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 animate-fade-in animation-delay-600">
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6 shadow-lg transform hover:scale-105 transition-transform">
              <Link href="/menu">Explore Our Juices <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 shadow-lg border-primary text-primary hover:bg-primary/10 hover:text-primary transform hover:scale-105 transition-transform">
              <Link href="/subscriptions">View Subscriptions</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* New Categories Section */}
      <section className="py-8 bg-muted/20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-headline text-center text-gray-800 dark:text-gray-200 mb-6">
            Shop by Category
          </h2>
          <CategoryScroller categories={HOME_CATEGORIES} />
        </div>
      </section>

      {/* Featured Juices Section */}
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-headline text-center text-gray-800 dark:text-gray-200 mb-6">
            Our Most Popular Blends
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {featuredJuices.map((juice, index) => (
              <div key={juice.id} className="animate-slide-in-up" style={{ animationDelay: `${index * 100}ms`}}>
                <JuiceCard juice={juice} />
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button asChild variant="link" className="text-primary text-lg hover:underline">
              <Link href="/menu">See All Juices <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Featured Subscription Section */}
      {(weeklyKickstarterPlan || monthlyWellnessPlan) && (
        <section className="py-10 bg-primary/10">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-headline text-center text-primary mb-3">
              Stay Refreshed, Effortlessly
            </h2>
            <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
              Choose a plan that suits you. Our popular Weekly Kickstarter is perfect for a consistent boost!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
              {weeklyKickstarterPlan && (
                <div className="animate-slide-in-up">
                  <SubscriptionOptionCard plan={weeklyKickstarterPlan} isFeatured />
                </div>
              )}
              {monthlyWellnessPlan && (
                 <div className="animate-slide-in-up animation-delay-200">
                  <SubscriptionOptionCard plan={monthlyWellnessPlan} />
                </div>
              )}
            </div>
            <div className="text-center mt-10">
              <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/10">
                <Link href="/subscriptions">Explore All Subscription Plans</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* How It Works / Features Section */}
      <section className="py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-headline text-center text-gray-800 dark:text-gray-200 mb-6">Why Choose Elixr?</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6 bg-card rounded-lg shadow-md animate-slide-in-up">
              <Gift className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold font-headline mb-2">Freshly Made</h3>
              <p className="text-muted-foreground text-sm">Crafted with the freshest fruits and vegetables for maximum flavor and nutrition.</p>
            </div>
            <div className="p-6 bg-card rounded-lg shadow-md animate-slide-in-up animation-delay-200">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold font-headline mb-2">Flexible Subscriptions</h3>
              <p className="text-muted-foreground text-sm">Choose weekly or monthly plans. Pause, skip, or cancel anytime.</p>
            </div>
            <div className="p-6 bg-card rounded-lg shadow-md animate-slide-in-up animation-delay-400">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold font-headline mb-2">AI-Powered</h3>
              <p className="text-muted-foreground text-sm">Get personalized juice recommendations and create unique recipes with our AI tools.</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Recommendation Section */}
      <section className="py-10">
        <div className="container mx-auto px-4">
           <div className="max-w-3xl mx-auto">
             <JuiceRecommenderClient />
           </div>
        </div>
      </section>
      
      {/* Call to Action (Recipe Creator) */}
      <section className="py-12 bg-accent/10 text-center">
         <div className="container mx-auto px-4">
            <Sparkles className="h-16 w-16 text-accent mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-headline text-accent mb-4">
                Become a Juice Mixologist!
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
                Got some favorite flavors in mind? Use our AI Recipe Creator to invent your own unique juice blend.
            </p>
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6 shadow-lg transform hover:scale-105 transition-transform">
              <Link href="/recipe-creator">Create My Recipe <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
         </div>
      </section>
    </div>
  );
}
