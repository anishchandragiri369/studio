"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, MapPin } from 'lucide-react';

interface AddressAutocompleteProps {
  onPlaceSelected: (placeDetails: {
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }) => void;
  apiKey: string | undefined;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({ onPlaceSelected, apiKey }) => {
  const autocompleteRef = useRef<any>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (!apiKey) return;
    if (!document.getElementById('google-maps-script')) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.onload = () => {
        const wcScript = document.createElement('script');
        wcScript.src = 'https://unpkg.com/@googlemaps/extended-component-library@latest/dist/index.umd.js';
        wcScript.async = true;
        wcScript.onload = () => setScriptLoaded(true);
        document.body.appendChild(wcScript);
      };
      document.body.appendChild(script);
    } else {
      setScriptLoaded(true);
    }
  }, [apiKey]);

  useEffect(() => {
    if (!apiKey || !scriptLoaded) return;
    const handler = (e: any) => {
      const place = e.target.value;
      if (!place) return;
      onPlaceSelected({
        addressLine1: place.displayName || '',
        city: place.addressComponents?.locality || '',
        state: place.addressComponents?.administrativeArea || '',
        zipCode: place.addressComponents?.postalCode || '',
        country: place.addressComponents?.country || '',
      });
    };
    const el = document.getElementById('google-place-autocomplete');
    if (el) {
      el.addEventListener('gmpx-placechange', handler);
      autocompleteRef.current = el;
    }
    return () => {
      if (autocompleteRef.current) {
        autocompleteRef.current.removeEventListener('gmpx-placechange', handler);
      }
    };
  }, [onPlaceSelected, apiKey, scriptLoaded]);

  if (!apiKey) {
    return (
      <Alert variant="default" className="mt-2 p-3 bg-muted/30 border-primary/30">
        <AlertTriangle className="h-4 w-4 !left-3 !top-3.5 text-primary/70" />
        <AlertTitle className="text-sm font-semibold">Address Autocomplete Disabled</AlertTitle>
        <AlertDescription className="text-xs">
          Please set the `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` environment variable and restart your server to enable this feature.
          Manual address entry is available below.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-1">
      <Label htmlFor="googleMapsSearch">Search Address (Google Maps)</Label>
      {scriptLoaded ? (
        <google-map-place-autocomplete
          id="google-place-autocomplete"
          style={{ width: '100%', display: 'block', marginBottom: 8 }}
          placeholder="Start typing your address..."
          types="address"
          componentRestrictions='{"country":["in"]}'
        ></google-map-place-autocomplete>
      ) : (
        <div className="p-2 text-xs text-muted-foreground">Loading Google Maps...</div>
      )}
      <Alert variant="default" className="mt-2 p-3 text-xs bg-muted/30 border-primary/30">
        <MapPin className="h-4 w-4 !left-3 !top-3.5 text-primary/70" />
        <AlertDescription>
          Selecting an address will attempt to auto-fill the fields below.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default AddressAutocomplete;
