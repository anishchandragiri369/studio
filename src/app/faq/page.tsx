import { Metadata } from 'next';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'FAQ - Elixr Juices',
  description: 'Frequently asked questions about Elixr Juices orders, delivery, and subscriptions',
};

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-12 mobile-container">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-headline font-bold gradient-text mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-muted-foreground">
            Find answers to common questions about our juices, orders, and delivery
          </p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-headline text-2xl gradient-text">Common Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>What are your delivery areas?</AccordionTrigger>
                <AccordionContent>
                  We currently deliver fresh juices across major cities. During checkout, you can enter your address to check if delivery is available in your area.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>How fresh are the juices?</AccordionTrigger>
                <AccordionContent>
                  All our juices are freshly prepared on the day of delivery using the finest ingredients. We recommend consuming them within 24-48 hours for the best taste and nutritional value.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>Can I modify or cancel my subscription?</AccordionTrigger>
                <AccordionContent>
                  Yes, you can modify or cancel your subscription at any time through your account dashboard. Changes will take effect from your next delivery cycle.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
                <AccordionContent>
                  We accept all major credit/debit cards, UPI, net banking, and popular digital wallets through our secure payment partner Cashfree.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>Do you offer refunds?</AccordionTrigger>
                <AccordionContent>
                  Yes, we offer refunds for orders that haven't been delivered or in case of quality issues. Please contact our support team within 24 hours of delivery for assistance.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>Are your juices organic?</AccordionTrigger>
                <AccordionContent>
                  We source the highest quality fruits and vegetables, with many of our ingredients being organic. Each product description includes details about sourcing and ingredients.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7">
                <AccordionTrigger>What if I'm not home during delivery?</AccordionTrigger>
                <AccordionContent>
                  Our delivery partners will attempt to contact you before delivery. If you're not available, we can arrange for a convenient redelivery time or leave the order with a trusted neighbor if specified.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8">
                <AccordionTrigger>How do I track my order?</AccordionTrigger>
                <AccordionContent>
                  Once your order is confirmed, you'll receive tracking information via email and SMS. You can also check your order status in your account dashboard.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <div className="mt-12 text-center">
          <Card className="glass-card p-6">
            <h3 className="font-headline text-xl mb-4">Still have questions?</h3>
            <p className="text-muted-foreground mb-4">
              Can't find what you're looking for? Our customer support team is here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:support@elixrjuices.com" className="btn btn-primary">
                Email Support
              </a>
              <a href="tel:+91-9876543210" className="btn btn-outline">
                Call Us
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
