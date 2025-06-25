import { Button } from '@/components/ui/button';
import { JUICES, SUBSCRIPTION_PLANS, HOME_CATEGORIES } from '@/lib/constants';
import JuiceCard from '@/components/menu/JuiceCard';
import Link from 'next/link';
import Image from 'next/image';
import WhatsAppLink from '@/components/shared/WhatsAppLink';
import { ArrowRight, Gift, Sparkles, Users, Instagram, MessageCircle, Star, Zap, Leaf, Heart, Shield, Clock, Truck } from 'lucide-react';
import JuiceRecommenderClient from '@/components/recommendations/JuiceRecommenderClient';
import SubscriptionOptionCard from '@/components/subscriptions/SubscriptionOptionCard';
import CategoryScroller from '@/components/categories/CategoryScroller';
import { Card, CardContent } from '@/components/ui/card';

// Instagram posts data
const instagramPosts = [
  { type: 'image', image: '/images/insta1.jpg', link: 'https://instagram.com/p/abc123' },
  { type: 'video', video: '/videos/instavid1.mp4', link: 'https://instagram.com/p/xyz789' },
  { type: 'image', image: '/images/insta2.jpg', link: 'https://instagram.com/p/def456' },
  { type: 'video', video: '/videos/instavid2.mp4', link: 'https://instagram.com/p/uvw456' },
  { image: '/images/insta3.jpg', link: 'https://instagram.com/p/ghi789' },
  { image: '/images/insta4.jpg', link: 'https://instagram.com/p/jkl012' },
  { image: '/images/insta5.jpg', link: 'https://instagram.com/p/mno345' },
  { image: '/images/insta6.jpg', link: 'https://instagram.com/p/pqr678' },
  { image: '/images/insta7.jpg', link: 'https://instagram.com/p/stu901' },
  { image: '/images/insta8.jpg', link: 'https://instagram.com/p/vwx234' },
  { image: '/images/insta9.jpg', link: 'https://instagram.com/p/yz1234' },
  { image: '/images/insta10.jpg', link: 'https://instagram.com/p/abc567' },
  { image: '/images/insta11.jpg', link: 'https://instagram.com/p/def890' },
  { image: '/images/insta12.jpg', link: 'https://instagram.com/p/ghi345' },
];

export default function HomePage() {
  const featuredJuices = JUICES.slice(0, 8);
  const weeklyKickstarterPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'weekly');
  const monthlyWellnessPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'monthly');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section - Glassmorphic Design */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Ultra HD Background with multiple layers */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-purple-900/20 to-blue-900/20"></div>
          <Image
            src="/images/Welcome-to-the-world-of-elixirs_page.jpg"
            alt="Welcome to the world of elixrs"
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
            quality={90}
          />          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40"></div>
            {/* Enhanced Floating Bubbles - More variety and quantity */}
          {/* Large bubbles */}
          <div className="absolute top-16 left-16 w-24 h-24 bg-gradient-to-r from-orange-500 to-red-500 rounded-full opacity-20 animate-float-ultra"></div>
          <div className="absolute top-32 right-20 w-20 h-20 bg-gradient-to-r from-green-500 to-teal-500 rounded-full opacity-20 animate-float-ultra-slow" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-32 left-24 w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full opacity-20 animate-float-drift" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-40 right-32 w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full opacity-20 animate-float-ultra-fast" style={{ animationDelay: '3s' }}></div>
          
          {/* Medium bubbles */}
          <div className="absolute top-1/4 left-1/3 w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-15 animate-float-drift" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-1/3 right-1/4 w-18 h-18 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full opacity-15 animate-float-ultra-slow" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute bottom-1/4 left-1/2 w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full opacity-15 animate-float-ultra" style={{ animationDelay: '2.5s' }}></div>
          <div className="absolute bottom-1/3 right-1/3 w-20 h-20 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full opacity-15 animate-float-ultra-fast" style={{ animationDelay: '3.5s' }}></div>
          
          {/* Small bubbles */}
          <div className="absolute top-20 left-1/2 w-8 h-8 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full opacity-25 animate-float-ultra-fast" style={{ animationDelay: '0.2s' }}></div>
          <div className="absolute top-3/4 left-20 w-10 h-10 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full opacity-25 animate-float-drift" style={{ animationDelay: '1.2s' }}></div>
          <div className="absolute top-1/2 right-16 w-6 h-6 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full opacity-25 animate-float-ultra" style={{ animationDelay: '2.2s' }}></div>
          <div className="absolute bottom-20 left-3/4 w-12 h-12 bg-gradient-to-r from-lime-400 to-green-400 rounded-full opacity-25 animate-float-ultra-slow" style={{ animationDelay: '3.2s' }}></div>
          <div className="absolute top-40 right-40 w-8 h-8 bg-gradient-to-r from-orange-400 to-red-400 rounded-full opacity-25 animate-float-ultra-fast" style={{ animationDelay: '4s' }}></div>
          <div className="absolute bottom-60 right-60 w-14 h-14 bg-gradient-to-r from-sky-400 to-blue-400 rounded-full opacity-25 animate-float-drift" style={{ animationDelay: '4.5s' }}></div>
          
          {/* Extra small decorative bubbles */}
          <div className="absolute top-1/4 left-10 w-4 h-4 bg-gradient-to-r from-pink-300 to-rose-300 rounded-full opacity-30 animate-float-ultra-fast" style={{ animationDelay: '0.8s' }}></div>
          <div className="absolute top-3/4 right-10 w-6 h-6 bg-gradient-to-r from-green-300 to-emerald-300 rounded-full opacity-30 animate-float-ultra" style={{ animationDelay: '1.8s' }}></div>
          <div className="absolute bottom-1/4 left-40 w-5 h-5 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-full opacity-30 animate-float-drift" style={{ animationDelay: '2.8s' }}></div>
          <div className="absolute top-60 left-80 w-7 h-7 bg-gradient-to-r from-yellow-300 to-amber-300 rounded-full opacity-30 animate-float-ultra-slow" style={{ animationDelay: '3.8s' }}></div>
          <div className="absolute bottom-3/4 right-1/2 w-4 h-4 bg-gradient-to-r from-purple-300 to-violet-300 rounded-full opacity-30 animate-float-ultra-fast" style={{ animationDelay: '4.8s' }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-3xl mx-auto text-center">
            {/* Tagline and Premium Badge */}
            <div className="mb-4">
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-primary/50 to-accent/50 text-white text-sm font-medium mb-4 border border-white/50">
                <Zap className="w-4 h-4 mr-2" />
                Premium Cold-Pressed elixrs
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-headline font-bold mb-6 leading-tight">
              <span className="gradient-text">Taste the Freshness</span><br />
              {/* <span className="gradient-text">Freshness</span> */}
            </h1>
            
            <p className="text-xl md:text-2xl text-black/80 max-w-3xl mx-auto mb-8 leading-relaxed font-medium drop-shadow-md">
              Experience the ultimate fusion of taste and wellness with our 
              <br className="hidden md:block" />
              <span className="text-orange-900 font-semibold">handcrafted elixrs</span> delivered fresh to your door.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
              <Button 
                asChild 
                size="lg" 
                className="bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-700 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
              >
                <Link href="/menu">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Explore elixrs
                </Link>
              </Button>
              
              <Button 
                asChild 
                variant="outline" 
                size="lg" 
                className="border-2 border-white/40 bg-grey/05 backdrop-blur-sm hover:bg-white/10 text-black px-8 py-4 text-lg rounded-xl hover:shadow-lg transition-all duration-300 font-semibold"
              >
                <Link href="/subscriptions">
                  <Gift className="mr-2 h-5 w-5" />
                  Premium Plans
                </Link>
              </Button>
            </div>            {/* Social Proof */}
            <div className="flex items-center justify-center gap-6 text-base text-white/90">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="font-bold text-yellow-300">4.9/5</span>
                <span>rating</span>
              </div>
              <div className="w-px h-5 bg-white/30"></div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-blue-300">15,000+</span>
                <span>happy customers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions Bar */}
      <section className="bg-white/80 backdrop-blur-sm border-b border-border/50 py-4">        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-8 text-sm">
            <WhatsAppLink className="flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Order</span>
            </WhatsAppLink>
            <div className="w-px h-4 bg-border"></div>
            <Link href="https://www.instagram.com/elixr_healthy_sips" className="flex items-center gap-2 text-pink-600 hover:text-pink-700 transition-colors" target="_blank" rel="noopener noreferrer">
              <Instagram className="w-4 h-4" />
              <span>Follow Us</span>
            </Link>
            <div className="w-px h-4 bg-border"></div>
            <span className="flex items-center gap-2 text-muted-foreground">
              <Truck className="w-4 h-4" />
              <span>Free Delivery Above ₹500</span>
            </span>
          </div>
        </div>
      </section>      {/* Categories Section */}
      <section className="py-5 bg-gradient-to-br from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block pb-4 w-full">
              <h2 className="text-3xl md:text-5xl font-headline font-bold mb-4 leading-[1.3] pb-2 inline-block" style={{ 
                background: "linear-gradient(135deg, #1f2937 0%, #374151 25%, #0f172a 50%, #1e293b 75%, #0c1821 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}>
                Shop by Category
              </h2>
            </div>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "#374151", fontWeight: "500" }}>
              Find the perfect juice for your wellness journey
            </p>
          </div>
          <CategoryScroller categories={HOME_CATEGORIES} />
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-4 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-headline font-bold gradient-text mb-4 leading-tight" style={{ lineHeight: 1.20 }}>
              Zero Sugar Fruit Juice From ₹120
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our most popular cold-pressed juices, crafted with love and delivered fresh
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredJuices.map((juice, index) => (
              <div 
                key={juice.id} 
                className="animate-fade-in" 
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <JuiceCard juice={juice} />
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button asChild size="lg" variant="outline" className="btn-hover-lift">
              <Link href="/menu">
                View All Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Subscription Plans */}
      {(weeklyKickstarterPlan || monthlyWellnessPlan) && (
        <section className="py-16 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-headline font-bold mb-4" style={{ 
                background: "linear-gradient(135deg, #1f2937 0%, #374151 25%, #0f172a 50%, #1e293b 75%, #0c1821 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}>
                Our Subscription Plans
              </h2>
              <p className="text-lg max-w-3xl mx-auto" style={{ color: "#374151", fontWeight: "500" }}>
                At ElixR, we believe in making fresh, nutritious juices a seamless part of your daily routine. 
                Our subscription plans are designed to bring you the best of health with convenience.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {weeklyKickstarterPlan && (
                <div className="animate-fade-in">
                  <SubscriptionOptionCard plan={weeklyKickstarterPlan} />
                </div>
              )}
              {monthlyWellnessPlan && (
                <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                  <SubscriptionOptionCard plan={monthlyWellnessPlan} isFeatured />
                </div>
              )}
            </div>
            
            <div className="text-center mt-12">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 btn-hover-lift">
                <Link href="/subscriptions">
                  Explore All Plans
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Quality Features */}
      <section className="py-16 bg-gradient-to-br from-muted/30 to-background">        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-headline font-bold mb-4" style={{ 
              background: "linear-gradient(135deg, #1f2937 0%, #374151 25%, #0f172a 50%, #1e293b 75%, #0c1821 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              High Standard Quality And Taste
            </h2>
            <p className="text-lg max-w-3xl mx-auto" style={{ color: "#374151", fontWeight: "500" }}>
              We follow hygienic and natural processes to maintain freshness and flavor 
              without adding artificial additives to get that natural fruit drink feeling.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="glass-card text-center p-8">
              <CardContent className="pt-6">
                <Leaf className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Rich Protein</h3>
                <p className="text-muted-foreground">
                  Packed with natural proteins from fresh fruits and vegetables
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card text-center p-8">
              <CardContent className="pt-6">
                <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Body Care</h3>
                <p className="text-muted-foreground">
                  Nourish your body with essential vitamins and minerals
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card text-center p-8">
              <CardContent className="pt-6">
                <Shield className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">0% Trans Fat</h3>
                <p className="text-muted-foreground">
                  Pure, natural ingredients with no artificial additives
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Recommendations Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-headline font-bold mb-4" style={{ 
              background: "linear-gradient(135deg, #1f2937 0%, #374151 25%, #0f172a 50%, #1e293b 75%, #0c1821 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              Personalized Just for You
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "#374151", fontWeight: "500" }}>
              Let our AI help you discover the perfect juice combinations for your taste and health goals
            </p>
          </div>
          <JuiceRecommenderClient />
        </div>
      </section>

      {/* Instagram Feed */}
      <section className="py-16 bg-gradient-to-br from-muted/20 to-background">
        <div className="container mx-auto px-4">          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-headline font-bold mb-4" style={{ 
              background: "linear-gradient(135deg, #1f2937 0%, #374151 25%, #0f172a 50%, #1e293b 75%, #0c1821 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              View Our Cool Stories
            </h2>
            <Link 
              href="https://www.instagram.com/elixr_healthy_sips" 
              className="inline-flex items-center text-primary hover:text-primary/80 text-lg font-medium transition-colors"
              target="_blank" rel="noopener noreferrer"
            >
              <Instagram className="w-5 h-5 mr-2" />
              @elixr_healthy_sips
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {instagramPosts.map((post, i) => (
              <a
                key={i}
                href={post.link}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl glass-card animate-fade-in overflow-hidden"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {post.type === 'image' && post.image ? (
                  <Image
                    src={post.image}
                    alt={`Instagram post ${i + 1}`}
                    fill
                    className="object-cover w-full h-full"
                  />
                ) : post.type === 'video' && post.video ? (
                  <video
                    src={post.video}
                    className="object-cover w-full h-full"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : null}
              </a>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Button asChild variant="outline" className="btn-hover-lift">
              <Link href="https://www.instagram.com/elixr_healthy_sips" target="_blank" rel="noopener noreferrer">
                <Instagram className="mr-2 h-4 w-4" />
                Follow Us on Instagram
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Our Subscriptions */}
      <section className="py-8 bg-background border-t border-border/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <h3 className="text-2xl font-bold text-center mb-4">Why Choose Our Subscriptions?</h3>
          <p className="text-center text-muted-foreground mb-6">Experience the convenience and benefits of regular juice delivery</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <h4 className="font-semibold mb-2">Never Run Out</h4>
              <p className="text-sm text-muted-foreground">Automatic deliveries ensure you always have fresh juices on hand</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Health Benefits</h4>
              <p className="text-sm text-muted-foreground">Consistent nutrition with carefully planned juice combinations</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Save Money</h4>
              <p className="text-sm text-muted-foreground">Special subscription pricing with exclusive member discounts</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
