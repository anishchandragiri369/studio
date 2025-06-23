"use client";
import { useEffect } from 'react';

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function DirectGoogleMapsLoader() {
  useEffect(() => {
    if (typeof window === 'undefined' || !apiKey) {
      console.warn('DirectGoogleMapsLoader: API key missing or not on client side');
      return;
    }

    // Check if already loaded
    // @ts-ignore
    if (window.google?.maps) {
      console.log('DirectGoogleMapsLoader: Google Maps already loaded');
      return;
    }

    console.log('DirectGoogleMapsLoader: Loading Google Maps API directly...');

    // Create the script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    // @ts-ignore
    window.initGoogleMaps = () => {
      console.log('DirectGoogleMapsLoader: Google Maps loaded successfully!');
      // @ts-ignore
      console.log('DirectGoogleMapsLoader: Google Maps version:', window.google?.maps?.version);
      
      // Dispatch a custom event to notify components
      window.dispatchEvent(new CustomEvent('google-maps-loaded'));
    };

    script.onerror = (error) => {
      console.error('DirectGoogleMapsLoader: Failed to load Google Maps:', error);
    };

    // Add to document
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
      document.head.removeChild(script);
    };
  }, []);

  return null; // This component doesn't render anything
}
