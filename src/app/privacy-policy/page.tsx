import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Shield, Eye, Lock, FileText, Mail, Phone } from 'lucide-react';
import Image from 'next/image';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-green-900/20 to-blue-900/20"></div>
          <Image
            src="/images/Welcome-to-the-world-of-Elixirs_page.jpg"
            alt="Privacy Policy"
            fill
            sizes="100vw"
            className="object-cover opacity-20"
            priority
            quality={90}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/60"></div>
          
          {/* Floating Elements */}
          <div className="absolute top-16 right-10 w-16 h-16 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full opacity-30 animate-float"></div>
          <div className="absolute bottom-20 left-16 w-12 h-12 bg-gradient-to-r from-secondary/20 to-primary/20 rounded-full opacity-25 animate-float" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <Button variant="outline" asChild className="mb-6 glass-card border-0 btn-hover-lift">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>

          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-headline font-bold mb-6" style={{ 
              background: "linear-gradient(135deg, #1f2937 0%, #374151 25%, #0f172a 50%, #1e293b 75%, #0c1821 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              Privacy Policy
            </h1>
            
            <p className="text-xl text-foreground/80 mb-8 font-medium">
              Your privacy is important to us. Learn how we collect, use, and protect your information.
            </p>
            
            <p className="text-sm text-muted-foreground">
              Last Updated: December 2024
            </p>
          </div>
        </div>
      </section>

      {/* Privacy Policy Content */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-8">
            
            {/* Introduction */}
            <Card className="glass-card border-0 shadow-soft">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Eye className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold">Our Commitment</h2>
                </div>
                <p className="text-foreground/80 leading-relaxed">
                  ElixR ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and disclose your personal information when you access our website and use our services.
                </p>
              </CardContent>
            </Card>

            {/* Information We Collect */}
            <Card className="glass-card border-0 shadow-soft">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold">Information We Collect</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-primary">Personal Data</h3>
                    <p className="text-foreground/80">
                      We may ask you to provide personally identifiable information, such as your name, email address, phone number, and delivery address when you place an order, subscribe to our service, or contact us.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-primary">Usage Data</h3>
                    <p className="text-foreground/80">
                      We collect information about how you access and use our website, including your IP address, browser type, pages visited, and the time and date of your visit.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-primary">Cookies and Tracking Technologies</h3>
                    <p className="text-foreground/80">
                      We use cookies and similar technologies to improve your browsing experience, analyze site traffic, and personalize content.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How We Use Your Information */}
            <Card className="glass-card border-0 shadow-soft">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">How We Use Your Information</h2>
                <ul className="space-y-2 text-foreground/80">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    To provide, maintain, and improve our services.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    To process your orders and manage your account.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    To send you updates, promotional materials, and marketing communications (you may opt out at any time).
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    To analyze usage trends and enhance user experience.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    To comply with legal obligations.
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Information Sharing */}
            <Card className="glass-card border-0 shadow-soft">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Information Sharing and Disclosure</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-primary">Service Providers</h3>
                    <p className="text-foreground/80">
                      We may share your information with third-party service providers who help us with payment processing, order fulfillment, marketing, and other business functions. These providers are obligated to maintain the confidentiality and security of your information.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-primary">Legal Compliance</h3>
                    <p className="text-foreground/80">
                      We may disclose your information when required to do so by law or in response to a legal request.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-primary">Business Transfers</h3>
                    <p className="text-foreground/80">
                      In the event of a merger, acquisition, or asset sale, your personal information may be transferred to the new owner.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Security */}
            <Card className="glass-card border-0 shadow-soft">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold">Data Security</h2>
                </div>
                <p className="text-foreground/80 leading-relaxed">
                  We take the security of your data seriously and implement appropriate technical and organizational measures to protect your personal information from unauthorized access, disclosure, or alteration. However, no method of transmission over the Internet is completely secure.
                </p>
              </CardContent>
            </Card>

            {/* Shopping Policy */}
            <Card className="glass-card border-0 shadow-soft">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Shopping Policy</h2>
                <p className="text-foreground/80 leading-relaxed mb-4">
                  At ElixR, we strive to provide a seamless shopping experience. Once you place an order, you will receive a confirmation email with the details. We accept secure online payments via major credit cards, debit cards, UPI, and digital wallets.
                </p>
                <p className="text-foreground/80 leading-relaxed">
                  Orders are processed and delivered within 24 hours on scheduled delivery cycles. If you need to make changes or cancel an order, please contact us within 1 hour of placing it. Our website provides real-time order tracking and updates, and we are committed to protecting your personal data as detailed in our Privacy Policy.
                </p>
              </CardContent>
            </Card>

            {/* Subscription Policy */}
            <Card className="glass-card border-0 shadow-soft">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Subscription Policy</h2>
                <p className="text-foreground/80 leading-relaxed mb-6">
                  At ElixR, our subscription service is designed to deliver a curated selection of our premium detox drinks directly to you on a regular schedule.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-primary">Subscription Options</h3>
                    <ul className="space-y-2 text-foreground/80 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                        <strong>Standard Category Subscription:</strong> Select from our pre-defined drink categories, and we will deliver the corresponding beverages on schedule.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                        <strong>Customized Subscription:</strong> Tailor your monthly subscription by choosing your preferred juices from our menu.
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-primary">Subscription Terms</h3>
                    <ul className="space-y-2 text-foreground/80 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                        All subscriptions are prepaid.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                        You may pause your subscription at any time with 24 hours notice before next delivery.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                        Subscription can be reactivated within 3 months from pause date.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                        Mid-cycle cancellations are non-refundable unless due to our error.
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card className="glass-card border-0 shadow-soft">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
                <p className="text-foreground/80 mb-6">
                  If you have any questions or concerns about this Privacy Policy, please contact us:
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <a href="mailto:admin@elixr.in" className="text-primary hover:text-primary/80 transition-colors">
                      admin@elixr.in
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <div className="text-foreground/80">
                      <a href="tel:+919704595252" className="text-primary hover:text-primary/80 transition-colors mr-4">
                        9704595252
                      </a>
                      <a href="tel:+919704591133" className="text-primary hover:text-primary/80 transition-colors">
                        9704591133
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-foreground/60">
                    <strong>Produced By:</strong> Kathyva Naturals Pvt Ltd
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Children's Privacy & Changes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass-card border-0 shadow-soft">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-3">Children's Privacy</h3>
                  <p className="text-foreground/80 text-sm leading-relaxed">
                    Our services are not directed to individuals under the age of 18, and we do not knowingly collect personal data from children.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="glass-card border-0 shadow-soft">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-3">Policy Changes</h3>
                  <p className="text-foreground/80 text-sm leading-relaxed">
                    We may update this Privacy Policy periodically. Changes will be posted on this page with an updated effective date.
                  </p>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
