import type { Metadata, Viewport } from 'next';
import './globals.css';
import '@/styles/mobile.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import WhatsAppFloatingButton from '@/components/shared/WhatsAppFloatingButton';
import SessionValidator from '@/components/auth/SessionValidator';
import AppClientProviders from './AppClientProviders';
import GoogleMapsApiLoaderWrapper from '@/components/GoogleMapsApiLoaderWrapper';
import DirectGoogleMapsLoader from '@/components/DirectGoogleMapsLoader';

export const metadata: Metadata = {
  title: 'Elixr - Fresh Juices Delivered',
  description: 'Discover a variety of fresh juices and subscription plans. Healthy, delicious, and convenient.',
  keywords: ['juice', 'fresh juice', 'subscription', 'healthy drinks', 'juice delivery'],
};

export const viewport: Viewport = {
  themeColor: '#F2994A', // Primary color
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {  return (    <html lang="en" suppressHydrationWarning><head><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet" /><script type="module" src="https://unpkg.com/@googlemaps/extended-component-library@latest" async></script></head><body className="font-body antialiased flex flex-col min-h-screen"><DirectGoogleMapsLoader /><GoogleMapsApiLoaderWrapper /><AppClientProviders><CartProvider><AuthProvider><SessionValidator /><Navbar /><main className="flex-1">{children}</main><Footer /><WhatsAppFloatingButton /><Toaster /></AuthProvider></CartProvider></AppClientProviders></body></html>
  );
}
