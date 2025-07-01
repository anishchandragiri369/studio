"use client";

import React, { useRef, useState } from 'react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, MapPin } from 'lucide-react';

interface AddressAutocompleteProps {
  onPlaceSelected: (placeDetails: {
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    lat?: number;
    lng?: number;
    formattedAddress?: string;
  }) => void;
  apiKey: string | undefined;
}

const libraries: ('places')[] = ['places'];

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({ onPlaceSelected, apiKey }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || "",
    libraries,
    preventGoogleFontsLoading: true,
  });

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState("");

  const handleLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocompleteInstance;
  };

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.address_components) {
        const addressComponents = place.address_components;
        let streetNumber = '';
        let route = '';
        let city = '';
        let state = '';
        let postalCode = '';
        let country = '';

        addressComponents.forEach(component => {
          const types = component.types;
          if (types.includes('street_number')) streetNumber = component.long_name;
          if (types.includes('route')) route = component.long_name;
          if (types.includes('locality')) city = component.long_name;
          if (types.includes('administrative_area_level_1')) state = component.short_name;
          if (types.includes('postal_code')) postalCode = component.long_name;
          if (types.includes('country')) country = component.long_name;
        });
        
        const addressLine1 = `${streetNumber} ${route}`.trim();
        const typesToIgnoreInName = ['establishment', 'point_of_interest'];
        let lat = place.geometry?.location?.lat();
        let lng = place.geometry?.location?.lng();

        onPlaceSelected({
          addressLine1: addressLine1 || (place.name && !typesToIgnoreInName.some(t => place.types?.includes(t))) ? place.name || "" : "",
          city,
          state,
          zipCode: postalCode,
          country,
          lat,
          lng,
          formattedAddress: place.formatted_address || ""
        });
        setInputValue(place.formatted_address || ""); // Update input with formatted address
      } else {
        // If no address_components, could be a business or POI.
        // Try to use place.name if it's not a generic type that shouldn't be an address line.
        const typesToIgnoreInName = ['establishment', 'point_of_interest'];
        if (place.name && !typesToIgnoreInName.some(t => place.types?.includes(t))) {
             onPlaceSelected({
                addressLine1: place.name, city: "", state: "", zipCode: "", country: ""
            });
            setInputValue(place.name);
        } else {
             console.warn("Selected place does not have sufficient address details:", place);
        }
      }
    }
  };

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

  if (loadError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Map Error</AlertTitle>
        <AlertDescription>
          Could not load Google Maps Autocomplete. Please check your API key and network connection.
          Error: {loadError.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center space-x-2 p-4 border rounded-md">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading address search...</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Label htmlFor="googleMapsSearch">Search Address (Google Maps)</Label>
      <Autocomplete
        onLoad={handleLoad}
        onPlaceChanged={handlePlaceChanged}
        options={{
          types: ['address'],
          // Remove or adjust componentRestrictions for global search
        }}
      >
        <Input
          id="googleMapsSearch"
          placeholder="Start typing your address..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full"
          suppressHydrationWarning
        />
      </Autocomplete>
      <Alert variant="default" className="mt-2 p-3 text-xs bg-muted/30 border-primary/30">
        <MapPin className="h-4 w-4 !left-3 !top-3.5 text-primary/70" />
        <AlertDescription>
          Selecting an address will attempt to auto-fill the fields below and update the map.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default AddressAutocomplete;
