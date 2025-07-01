'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, ArrowLeft, Phone, Mail, MessageCircle } from 'lucide-react';
import Link from 'next/link';

function PaymentFailureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderAmount, setOrderAmount] = useState<string | null>(null);
  const [failureReason, setFailureReason] = useState<string | null>(null);

  useEffect(() => {
    // Extract order details from URL parameters
    const orderIdParam = searchParams.get('order_id');
    const amountParam = searchParams.get('amount');
    const reasonParam = searchParams.get('reason');
    
    setOrderId(orderIdParam);
    setOrderAmount(amountParam);
    setFailureReason(reasonParam);
  }, [searchParams]);

  const handleRetryPayment = () => {
    // Redirect back to checkout or cart
    router.push('/cart');
  };

  const handleContactSupport = () => {
    // Scroll to contact section or open contact modal
    const contactSection = document.getElementById('contact-support');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Main Failure Card */}
        <Card className="border-red-200 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-700">Payment Failed</CardTitle>
            <CardDescription className="text-gray-600">
              We couldn't process your payment. Don't worry, we're here to help!
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Order Details */}
            {orderId && (
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-2">Order Details</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Order ID:</span> #{orderId}</p>
                  {orderAmount && (
                    <p><span className="font-medium">Amount:</span> ₹{orderAmount}</p>
                  )}
                  {failureReason && (
                    <p><span className="font-medium">Reason:</span> {failureReason}</p>
                  )}
                </div>
              </div>
            )}

            {/* What Went Wrong */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-800 mb-2">What might have gone wrong?</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Insufficient funds in your account</li>
                <li>• Card expired or blocked</li>
                <li>• Network connectivity issues</li>
                <li>• Bank security restrictions</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handleRetryPayment}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => router.push('/menu')}
                className="w-full border-gray-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Support Card */}
        <Card id="contact-support" className="border-blue-200">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg text-blue-700">Need Help?</CardTitle>
            <CardDescription>
              Our support team is ready to assist you
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Contact Options */}
            <div className="grid grid-cols-1 gap-3">
              <a
                href="mailto:help@elixr.com"
                className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                <Mail className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-blue-900">Email Support</p>
                  <p className="text-sm text-blue-700">help@elixr.com</p>
                </div>
              </a>
              
              <a
                href="tel:+919876543210"
                className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
              >
                <Phone className="w-5 h-5 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-green-900">Call Us</p>
                  <p className="text-sm text-green-700">+91 98765 43210</p>
                </div>
              </a>
              
              <a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-green-900">WhatsApp</p>
                  <p className="text-sm text-green-700">Quick response</p>
                </div>
              </a>
            </div>

            {/* Support Hours */}
            <div className="text-center text-sm text-gray-600 pt-3 border-t">
              <p className="font-medium">Support Hours</p>
              <p>Monday - Saturday: 9 AM - 6 PM IST</p>
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="border-purple-200">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg text-purple-700">💡 Tips for Successful Payment</CardTitle>
          </CardHeader>
          
          <CardContent>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                Ensure your card has sufficient balance
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                Check if international transactions are enabled
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                Try using a different payment method
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                Use a stable internet connection
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                Disable VPN if you're using one
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Return Home Link */}
        <div className="text-center">
          <Link 
            href="/"
            className="text-orange-600 hover:text-orange-700 text-sm font-medium"
          >
            ← Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    }>
      <PaymentFailureContent />
    </Suspense>
  );
}
