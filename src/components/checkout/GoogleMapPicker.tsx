"use client";

import { useEffect, useState, useRef } from "react";
import { useGoogleMapsApi } from "@/hooks/useGoogleMapsApi";

// Add custom elements to the JSX namespace for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmpx-place-picker': any;
      'gmp-map': any;
      'gmp-advanced-marker': any;
    }
  }
}

interface GoogleMapPickerProps {
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
}

export default function GoogleMapPicker({ location, mapId, onPlaceSelected }: GoogleMapPickerProps) {
  const [mounted, setMounted] = useState(false);
  const { isLoaded, isLoading, error } = useGoogleMapsApi();
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const placePickerRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!mounted || !isLoaded || !mapRef.current || !markerRef.current || !placePickerRef.current) return;

    // Now that the component is mounted, API is ready, and refs are available, set up map and event listeners
    const map = mapRef.current;
    const marker = markerRef.current;
    const placePicker = placePickerRef.current;

    // Wait for innerMap to be available
    const initializeMap = () => {
      // @ts-ignore
      if (!map.innerMap) return false;

      const isValidLocation = location && typeof location.lat === 'number' && isFinite(location.lat) && typeof location.lng === 'number' && isFinite(location.lng);
      const defaultLocation = { lat: 17.385044, lng: 78.486671 }; // Hyderabad
      const center = isValidLocation ? location : defaultLocation;
      
      // @ts-ignore
      map.center = center;
      // @ts-ignore
      map.zoom = 17;
      // @ts-ignore
      marker.position = center;
      // @ts-ignore
      const infowindow = new window.google.maps.InfoWindow();
      // @ts-ignore
      map.innerMap.setOptions({ mapTypeControl: false });      const handlePlaceChange = () => {
        console.log('=== Place change event fired ===');
        // @ts-ignore
        const place = placePicker.value;
        console.log('Selected place:', place);
        
        // Check if the place is being cleared (e.g., when clicking the X button)
        if (!place) {
          console.log('Place cleared/empty - resetting map to default location');
          // Reset to default location without showing error
          const defaultLocation = { lat: 17.385044, lng: 78.486671 }; // Hyderabad
          // @ts-ignore
          map.center = defaultLocation;
          // @ts-ignore
          map.zoom = 17;
          // @ts-ignore
          marker.position = defaultLocation;
          infowindow.close();
          
          // Clear the form by calling the callback with empty data
          if (onPlaceSelected) {
            console.log('Calling onPlaceSelected with cleared data...');
            onPlaceSelected({
              addressLine1: "",
              city: "",
              state: "",
              zipCode: "",
              country: "",
              formattedAddress: "",
              lat: undefined,
              lng: undefined,
            });
          }
          return;
        }
        
        // Check if place has valid location data
        if (!place.location) {
          console.warn('Place exists but has no location data:', place);
          // Only show alert if there's actually a meaningful displayName and it's not just clearing
          // Also check if the place has a displayName that indicates a real search attempt
          const hasRealSearchTerm = place.displayName && 
                                   place.displayName.trim() !== '' && 
                                   place.displayName !== 'undefined' &&
                                   place.displayName.length > 2; // Avoid single characters or very short inputs
          
          if (hasRealSearchTerm) {
            window.alert(
              "No details available for input: '" + place.displayName + "'"
            );
          } else {
            console.log('Ignoring place without meaningful displayName or clearing action');
          }
          
          infowindow.close();
          // @ts-ignore
          marker.position = null;
          return;
        }

        console.log('Place details:', {
          displayName: place.displayName,
          formattedAddress: place.formattedAddress,
          location: place.location,
          addressComponents: place.addressComponents
        });

        if (place.viewport) {
          // @ts-ignore
          map.innerMap.fitBounds(place.viewport);
        } else {
          // @ts-ignore
          map.center = place.location;
          // @ts-ignore
          map.zoom = 17;
        }
        // @ts-ignore
        marker.position = place.location;
        infowindow.setContent(
          `<strong>${place.displayName}</strong><br><span>${place.formattedAddress}</span>`
        );
        // @ts-ignore
        infowindow.open(map.innerMap, marker);

        // Call the callback with address details if provided
        if (onPlaceSelected && place) {
          console.log('Calling onPlaceSelected callback...');
          // Safely access address components
          const addressComponents = place.addressComponents || [];
          const getAddressComponent = (type: string) =>
            addressComponents.find((comp: any) => comp.types.includes(type))?.longText || "";

          // Access lat/lng directly as numbers (based on component library types)
          const lat = place.location?.lat;
          const lng = place.location?.lng;

          const addressData = {
            addressLine1: place.displayName || "",
            city: getAddressComponent('locality'),
            state: getAddressComponent('administrative_area_level_1'),
            zipCode: getAddressComponent('postal_code'),
            country: getAddressComponent('country'),
            formattedAddress: place.formattedAddress || "",
            lat: typeof lat === 'number' ? lat : undefined, // Ensure lat is number or undefined
            lng: typeof lng === 'number' ? lng : undefined, // Ensure lng is number or undefined
          };

          console.log('Address data to be sent:', addressData);
          onPlaceSelected(addressData);
          console.log('onPlaceSelected callback completed');
        } else {
          console.warn('onPlaceSelected callback not provided or place is null');
        }
      };

      placePicker.addEventListener('gmpx-placechange', handlePlaceChange);

      // Cleanup event listener on unmount or when dependencies change
      return () => {
        placePicker.removeEventListener('gmpx-placechange', handlePlaceChange);
      };
    };

    // Try to initialize the map immediately
    initializeMap();

    // If innerMap is not yet available, set up a mutation observer as a fallback
    const observer = new MutationObserver(() => {
      if (initializeMap()) {
        observer.disconnect(); // Stop observing once initialized
      }
    });

    // Observe the map element for changes
    observer.observe(map, { attributes: true, childList: true, subtree: true });

    // Cleanup observer on unmount
    return () => {
      observer.disconnect();
    };

  }, [mounted, isLoaded, location, mapId, onPlaceSelected]);  if (!mounted) {
    return (
      <div style={{ minHeight: 420, border: '2px solid #e5e7eb', background: '#f8fafc', borderRadius: 8, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Initializing...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: 420, border: '2px solid #e5e7eb', background: '#f8fafc', borderRadius: 8, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'red' }}>Error loading Google Maps: {error}</div>
      </div>
    );
  }

  if (isLoading || !isLoaded) {
    return (
      <div style={{ minHeight: 420, border: '2px solid #e5e7eb', background: '#f8fafc', borderRadius: 8, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading Google Maps...</div>
      </div>
    );
  }

  console.log('GoogleMapPicker rendering components');
  return (
    <div style={{ minHeight: 420, border: '2px solid #e5e7eb', background: '#f8fafc', borderRadius: 8, marginTop: 8 }}>
      {/* Only render the map and picker when API is ready */}
      <gmpx-place-picker ref={placePickerRef} style={{ width: "100%", marginBottom: 8 }}></gmpx-place-picker>
      <gmp-map ref={mapRef} style={{ width: "100%", height: 400, background: '#e0e7ef', borderRadius: 8 }} map-id={mapId}>
        <gmp-advanced-marker ref={markerRef}></gmp-advanced-marker>
      </gmp-map>
    </div>
  );
}