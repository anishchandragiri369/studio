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
    // @ts-ignore
    const windowGoogle = window.google;
    // @ts-ignore
    const maps = window.google?.maps;
    // @ts-ignore
    const infoWindow = window.google?.maps?.InfoWindow;
    
    // Enhanced check for mobile compatibility
    if (typeof window !== 'undefined' && windowGoogle && maps && infoWindow) {
      // Additional mobile-specific checks
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        // Ensure essential mobile features are available
        // @ts-ignore
        const placesService = window.google?.maps?.places?.PlacesService;
        if (!placesService) {
          console.log('Google Maps Places service not ready for mobile');
          return false;
        }
      }
      
      console.log('Google Maps API is ready for', isMobile ? 'mobile' : 'desktop');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking Google Maps readiness:', error);
    return false;
  }
};

let pollInterval: NodeJS.Timeout | null = null;
let timeoutId: NodeJS.Timeout | null = null;

const initializeGoogleMaps = () => {
  if (globalState.isLoaded || globalState.isLoading) {
    return;
  }

  globalState.isLoading = true;
  notify();

  // Check if already loaded
  if (checkGoogleMapsReady()) {
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
    window.removeEventListener('google-maps-error', handleDirectApiError);
  };

  // Listen for direct API loader event and error event
  const handleDirectApiReady = () => {
    if (checkGoogleMapsReady()) {
      globalState.isLoaded = true;
      globalState.isLoading = false;
      globalState.error = null;
      notify();
      cleanup();
    }
  };

  const handleDirectApiError = (event: any) => {
    globalState.isLoaded = false;
    globalState.isLoading = false;
    globalState.error = 'Failed to load Google Maps API. Please check your internet connection and try again.';
    notify();
    cleanup();
  };

  window.addEventListener('google-maps-loaded', handleDirectApiReady);
  window.addEventListener('google-maps-error', handleDirectApiError);

  // Simple polling approach - more reliable than events
  pollInterval = setInterval(() => {
    if (checkGoogleMapsReady()) {
      globalState.isLoaded = true;
      globalState.isLoading = false;
      globalState.error = null;
      notify();
      cleanup();
    }
  }, 1000); // Check every 1 second

  // Increase timeout for mobile devices since they may load slower
  const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const timeout = isMobile ? 15000 : 8000; // 15s for mobile, 8s for desktop
  
  timeoutId = setTimeout(() => {
    globalState.isLoaded = false;
    globalState.isLoading = false;
    globalState.error = `Google Maps API loading timed out after ${timeout/1000}s. Please check your internet connection and API key.`;
    notify();
    cleanup();
  }, timeout);
};

export const useGoogleMapsApi = () => {
  const [state, setState] = useState<GoogleMapsApiState>(globalState);

  useEffect(() => {
    // Subscribe to global state changes
    subscribers.add(setState);

    // Initialize if not already done
    if (typeof window !== 'undefined') {
      // Longer delay for mobile devices to ensure DOM stability
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const delay = isMobile ? 300 : 100;
      
      setTimeout(() => {
        initializeGoogleMaps();
      }, delay);
    }

    return () => {
      subscribers.delete(setState);
    };
  }, []);

  return state;
};
