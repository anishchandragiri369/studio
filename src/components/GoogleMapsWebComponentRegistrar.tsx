"use client";

import { useEffect } from "react";

/**
 * Registers Google Maps Web Components on the client only.
 * Ensures no SSR/hydration errors by dynamically importing the library.
 */
export default function GoogleMapsWebComponentRegistrar() {
  useEffect(() => {
    // Dynamically import the Google Maps Extended Component Library only on the client
    import("@googlemaps/extended-component-library/api_loader.js");
    import("@googlemaps/extended-component-library/place_picker.js");
  }, []);
  return null;
}
