"use client";

import { useEffect, useRef } from "react";

interface GoogleMapPickerProps {
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

export default function GoogleMapPicker({ onPlaceSelected }: GoogleMapPickerProps) {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    function tryInit() {
      // Check if scripts and elements are loaded
      if (
        typeof window === "undefined" ||
        !window.customElements ||
        !window.google ||
        !window.google.maps
      ) {
        setTimeout(tryInit, 300);
        return;
      }
      window.customElements.whenDefined('gmp-map').then(() => {
        const map = document.querySelector('gmp-map');
        const marker = document.querySelector('gmp-advanced-marker');
        const placePicker = document.querySelector('gmpx-place-picker');
        if (!map || !marker || !placePicker) {
          setTimeout(tryInit, 300);
          return;
        }
        // @ts-ignore
        if (!map.innerMap) {
          setTimeout(tryInit, 300);
          return;
        }
        // @ts-ignore
        const infowindow = new window.google.maps.InfoWindow();
        // @ts-ignore
        map.innerMap.setOptions({ mapTypeControl: false });
        placePicker.addEventListener('gmpx-placechange', () => {
          // @ts-ignore
          const place = placePicker.value;
          if (!place || !place.location) {
            window.alert(
              "No details available for input: '" + (place?.name || "") + "'"
            );
            infowindow.close();
            // @ts-ignore
            marker.position = null;
            return;
          }
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
            onPlaceSelected({
              addressLine1: place.displayName || "",
              city: place.addressComponents?.locality || "",
              state: place.addressComponents?.administrativeArea || "",
              zipCode: place.addressComponents?.postalCode || "",
              country: place.addressComponents?.country || "",
              formattedAddress: place.formattedAddress || "",
              lat: place.location?.lat,
              lng: place.location?.lng,
            });
          }
        });
      });
    }
    tryInit();
  }, [onPlaceSelected]);

  // Load Google Maps JS API and Web Components loader
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("google-maps-script")) return;
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => {
      const wcScript = document.createElement("script");
      wcScript.src = "https://unpkg.com/@googlemaps/extended-component-library@latest/dist/index.umd.js";
      wcScript.async = true;
      document.body.appendChild(wcScript);
    };
    document.body.appendChild(script);
  }, []);

  return (
    <div>
      <gmpx-place-picker style={{ width: "100%", marginBottom: 8 }}></gmpx-place-picker>
      <gmp-map style={{ width: "100%", height: 400 }}>
        <gmp-advanced-marker></gmp-advanced-marker>
      </gmp-map>
    </div>
  );
}
