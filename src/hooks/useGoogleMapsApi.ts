"use client";
import { useState, useEffect } from 'react';

interface GoogleMapsApiState {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
}

// Global state to prevent multiple API loading attempts
let globalState: GoogleMapsApiState = {
  isLoaded: false,
  isLoading: false,
  error: null
};

let subscribers: Set<(state: GoogleMapsApiState) => void> = new Set();

const notify = () => {
  subscribers.forEach(callback => callback(globalState));
};

const checkGoogleMapsReady = (): boolean => {
  try {
    console.log('=== Checking Google Maps readiness ===');
    
    // @ts-ignore
    const windowGoogle = window.google;
    // @ts-ignore
    const maps = window.google?.maps;
    // @ts-ignore
    const infoWindow = window.google?.maps?.InfoWindow;
    // @ts-ignore
    const places = window.google?.maps?.places;
    // @ts-ignore
    const customElements = window.customElements;
    
    console.log('Google object:', windowGoogle);
    console.log('Maps object:', maps);
    console.log('InfoWindow constructor:', infoWindow);
    console.log('Places object:', places);
    console.log('CustomElements:', customElements);
    
    if (customElements) {
      // @ts-ignore
      console.log('gmpx-place-picker registered:', !!window.customElements.get('gmpx-place-picker'));
      // @ts-ignore
      console.log('gmp-map registered:', !!window.customElements.get('gmp-map'));
    }

    // Very basic check - just need Google Maps API
    const isReady = !!(windowGoogle && maps && typeof infoWindow === 'function');
    console.log('Is ready:', isReady);
    console.log('=== End readiness check ===');
    
    return isReady;
  } catch (error) {
    console.error('Error checking Google Maps readiness:', error);
    return false;
  }
};

let pollInterval: NodeJS.Timeout | null = null;
let timeoutId: NodeJS.Timeout | null = null;

const initializeGoogleMaps = () => {
  if (globalState.isLoaded || globalState.isLoading) {
    console.log('Google Maps already loaded or loading:', globalState);
    return;
  }

  console.log('Starting Google Maps initialization...');
  globalState.isLoading = true;
  notify();

  // Check if already loaded
  if (checkGoogleMapsReady()) {
    console.log('Google Maps API already ready!');
    globalState.isLoaded = true;
    globalState.isLoading = false;
    notify();
    return;
  }

  const cleanup = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    window.removeEventListener('google-maps-loaded', handleDirectApiReady);
  };

  // Listen for direct API loader event
  const handleDirectApiReady = () => {
    console.log('Direct Google Maps API loaded event received');
    if (checkGoogleMapsReady()) {
      console.log('Google Maps API is now ready via direct loader!');
      globalState.isLoaded = true;
      globalState.isLoading = false;
      globalState.error = null;
      notify();
      cleanup();
    }
  };

  window.addEventListener('google-maps-loaded', handleDirectApiReady);

  // Simple polling approach - more reliable than events
  pollInterval = setInterval(() => {
    console.log('Polling for Google Maps API...');
    if (checkGoogleMapsReady()) {
      console.log('Google Maps API is now ready via polling!');
      globalState.isLoaded = true;
      globalState.isLoading = false;
      globalState.error = null;
      notify();
      cleanup();
    }
  }, 1000); // Check every 1 second

  // Reduce timeout to 8 seconds since we have direct loading now
  timeoutId = setTimeout(() => {
    console.warn('Google Maps API loading timed out after 8 seconds');
    globalState.isLoaded = false;
    globalState.isLoading = false;
    globalState.error = 'Google Maps API loading timed out. Please check your internet connection and API key.';
    notify();
    cleanup();
  }, 8000);
};

export const useGoogleMapsApi = () => {
  const [state, setState] = useState<GoogleMapsApiState>(globalState);

  useEffect(() => {
    console.log('useGoogleMapsApi hook mounted');
    
    // Subscribe to global state changes
    subscribers.add(setState);

    // Initialize if not already done
    if (typeof window !== 'undefined') {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        initializeGoogleMaps();
      }, 100);
    }

    return () => {
      console.log('useGoogleMapsApi hook unmounted');
      subscribers.delete(setState);
    };
  }, []);

  return state;
};
