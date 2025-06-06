import { Metadata } from 'next';
import RecipeCreatorClient from '@/components/recipe-creator/RecipeCreatorClient';

export const metadata: Metadata = {
  title: 'AI Recipe Creator - Elixr',
  description: 'Generate unique juice recipes based on your favorite flavors using AI.',
};

export default function RecipeCreatorPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4 animate-fade-in">
          AI Juice Recipe Creator
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in animation-delay-200">
          Unleash your creativity or discover new combinations! Tell our AI the flavors you love, and get a custom juice recipe in seconds.
        </p>
      </section>
      <RecipeCreatorClient />
    </div>
  );
}
