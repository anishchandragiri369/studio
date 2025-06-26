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
      console.log('Google Maps API is ready');
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
  };

  // Listen for direct API loader event
  const handleDirectApiReady = () => {
    if (checkGoogleMapsReady()) {
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
    if (checkGoogleMapsReady()) {
      globalState.isLoaded = true;
      globalState.isLoading = false;
      globalState.error = null;
      notify();
      cleanup();
    }
  }, 1000); // Check every 1 second

  // Reduce timeout to 8 seconds since we have direct loading now
  timeoutId = setTimeout(() => {
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
      subscribers.delete(setState);
    };
  }, []);

  return state;
};
