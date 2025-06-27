"use client";
import { useEffect } from 'react';

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function DirectGoogleMapsLoader() {
  useEffect(() => {
    if (typeof window === 'undefined' || !apiKey) {
      console.warn('DirectGoogleMapsLoader: API key missing or not in browser environment');
      return;
    }

    // Check if already loaded
    // @ts-ignore
    if (window.google?.maps) {
      console.log('DirectGoogleMapsLoader: Google Maps already loaded');
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('DirectGoogleMapsLoader: Google Maps script already loading');
      return;
    }

    console.log('DirectGoogleMapsLoader: Loading Google Maps API...');

    // Create the script element with proper async loading
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&loading=async&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    script.id = 'google-maps-script'; // Add ID for easier detection

    // @ts-ignore
    window.initGoogleMaps = () => {
      console.log('DirectGoogleMapsLoader: Google Maps API loaded successfully');
      // Dispatch a custom event to notify components
      window.dispatchEvent(new CustomEvent('google-maps-loaded'));
    };

    script.onload = () => {
      console.log('DirectGoogleMapsLoader: Script loaded, waiting for API initialization...');
    };

    script.onerror = (error) => {
      console.error('DirectGoogleMapsLoader: Failed to load Google Maps script:', error);
      // Dispatch error event
      window.dispatchEvent(new CustomEvent('google-maps-error', { detail: error }));
    };

    // Add to document
    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script and callback
      const scriptToRemove = document.getElementById('google-maps-script');
      if (scriptToRemove) {
        document.head.removeChild(scriptToRemove);
      }
      // @ts-ignore
      if (window.initGoogleMaps) {
        // @ts-ignore
        delete window.initGoogleMaps;
      }
    };
  }, []);

  return null; // This component doesn't render anything
}
