import type { Metadata } from 'next';
import FruitBowlSubscriptionsPageContent from './FruitBowlSubscriptionsPageContent';

export const metadata: Metadata = {
  title: 'Fruit Bowl Subscriptions - Elixr',
  description: 'Subscribe to fresh, nutritious fruit bowls delivered to your doorstep. Choose from weekly or monthly plans for healthy eating made easy.',
  keywords: 'fruit bowl subscription, healthy breakfast, fresh fruits, meal delivery, weekly fruit bowls, monthly fruit bowls',
};

export default function FruitBowlSubscriptionsPage() {
  return <FruitBowlSubscriptionsPageContent />;
}
