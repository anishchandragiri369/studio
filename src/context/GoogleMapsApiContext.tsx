"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface GoogleMapsApiContextType {
  isLoaded: boolean;
}

const GoogleMapsApiContext = createContext<GoogleMapsApiContextType | undefined>(undefined);

export const GoogleMapsApiProvider = ({ children }: { children: ReactNode }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Poll for the Google Maps API to be loaded
    const pollApi = setInterval(() => {
      if (typeof window !== 'undefined' && window.google && window.google.maps) {
        setIsLoaded(true);
        clearInterval(pollApi);
      }
    }, 100); // Poll every 100ms

    return () => clearInterval(pollApi);
  }, []);

  return (
    <GoogleMapsApiContext.Provider value={{ isLoaded }}>
      {children}
    </GoogleMapsApiContext.Provider>
  );
};

export const useGoogleMapsApi = () => {
  const context = useContext(GoogleMapsApiContext);
  if (context === undefined) {
    throw new Error('useGoogleMapsApi must be used within a GoogleMapsApiProvider');
  }
  return context;
};
