import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Phone, Mail, MapPin, Send } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us - Elixir',
  description: 'Get in touch with Elixir for support, inquiries, or feedback.',
};

export default function ContactPage() {
  // This would be a server action in a real app
  async function handleSubmit(formData: FormData) {
    'use server';
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');
    console.log('Form submitted:', { name, email, message });
    // Here you would typically send an email or save to a database
    // For now, we just log it.
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4 animate-fade-in">
          Get In Touch
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in animation-delay-200">
          We&apos;d love to hear from you! Whether you have a question, feedback, or just want to say hello.
        </p>
      </section>

      <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-start">
        <Card className="shadow-xl animate-slide-in-up">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-center md:text-left">Send us a Message</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className="font-medium">Full Name</Label>
                <Input type="text" id="name" name="name" placeholder="John Doe" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="email" className="font-medium">Email Address</Label>
                <Input type="email" id="email" name="email" placeholder="you@example.com" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="message" className="font-medium">Message</Label>
                <Textarea id="message" name="message" placeholder="Your message here..." rows={5} required className="mt-1" />
              </div>
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-3">
                <Send className="mr-2 h-5 w-5" /> Send Message
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-8 animate-slide-in-up animation-delay-200">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold">Phone</h3>
                  <a href="tel:+1234567890" className="text-muted-foreground hover:text-primary transition-colors">+1 (234) 567-890</a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <a href="mailto:support@elixir.com" className="text-muted-foreground hover:text-primary transition-colors">support@elixir.com</a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold">Address</h3>
                  <p className="text-muted-foreground">123 Juice Street, Flavor Town, CA 90210</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Business Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-muted-foreground">
              <p><span className="font-medium text-foreground">Monday - Friday:</span> 9:00 AM - 6:00 PM</p>
              <p><span className="font-medium text-foreground">Saturday:</span> 10:00 AM - 4:00 PM</p>
              <p><span className="font-medium text-foreground">Sunday:</span> Closed</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
