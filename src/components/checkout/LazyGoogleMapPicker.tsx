"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import GoogleMapPicker with no SSR
const GoogleMapPicker = dynamic(() => import('./GoogleMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[270px] border-2 border-border/50 bg-muted/30 rounded-lg flex items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading Maps...</span>
      </div>
    </div>
  ),
});

interface LazyGoogleMapPickerProps {
  location?: { lat: number; lng: number };
  mapId?: string;
  onPlaceSelected?: (place: {
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    formattedAddress?: string;
    lat?: number;
    lng?: number;
  }) => void;
  forceLoad?: boolean; // Allow parent to force loading
  autoLoadOnDesktop?: boolean; // Auto-load on desktop
}

export default function LazyGoogleMapPicker({ 
  location, 
  mapId, 
  onPlaceSelected, 
  forceLoad = false,
  autoLoadOnDesktop = true 
}: LazyGoogleMapPickerProps) {
  const [shouldLoadMaps, setShouldLoadMaps] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Detect mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
      const isMobileDevice = mobileKeywords.some(keyword => userAgent.includes(keyword)) || 
                           window.innerWidth <= 768;
      
      setIsMobile(isMobileDevice);
      
      // Auto-load on desktop if enabled
      if (!isMobileDevice && autoLoadOnDesktop) {
        setShouldLoadMaps(true);
      }
    };

    checkMobile();
    
    // Listen for resize events to handle orientation changes
    const handleResize = () => {
      const wasDesktop = !isMobile;
      checkMobile();
      
      // If switching from mobile to desktop, auto-load maps
      if (wasDesktop && !isMobile && autoLoadOnDesktop && !shouldLoadMaps) {
        setShouldLoadMaps(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [autoLoadOnDesktop, isMobile, shouldLoadMaps]);

  // Force load when parent requests it
  useEffect(() => {
    if (forceLoad && !shouldLoadMaps) {
      setShouldLoadMaps(true);
    }
  }, [forceLoad, shouldLoadMaps]);

  const handleLoadMaps = () => {
    setShouldLoadMaps(true);
  };

  if (!mounted) {
    return (
      <div className="min-h-[270px] border-2 border-border/50 bg-muted/30 rounded-lg flex items-center justify-center">
        <div className="text-muted-foreground">Initializing...</div>
      </div>
    );
  }

  // Show load button for mobile or when maps haven't been loaded yet
  if (!shouldLoadMaps && (isMobile || !autoLoadOnDesktop)) {
    return (
      <div className="min-h-[270px] border-2 border-border/50 bg-muted/30 rounded-lg flex flex-col items-center justify-center gap-4 p-6">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-primary mx-auto mb-2" />
          <h3 className="font-medium text-foreground mb-2">Interactive Address Selection</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {isMobile 
              ? "Tap to load the interactive map for precise address selection"
              : "Click to load Google Maps for address selection"
            }
          </p>
          <Button 
            onClick={handleLoadMaps}
            variant="outline"
            className="gap-2"
          >
            <MapPin className="h-4 w-4" />
            Load Interactive Map
          </Button>
        </div>
        <div className="text-xs text-muted-foreground text-center">
          <p>You can also fill the address fields manually below</p>
        </div>
      </div>
    );
  }

  // Render the actual map component
  return (
    <div className="maps-container">
      <GoogleMapPicker
        location={location}
        mapId={mapId}
        onPlaceSelected={onPlaceSelected}
      />
    </div>
  );
}
