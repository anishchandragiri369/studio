"use client";
import React, { useEffect } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "gmpx-api-loader": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        "solution-channel"?: string;
        "api-key"?: string;
        "version"?: string;
        "libraries"?: string;
      };
    }
  }
}

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const GoogleMapsApiLoader = () => {
  useEffect(() => {
    if (!apiKey) {
      console.warn("Google Maps API key is missing. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment.");
    }
  }, []);
  
  return (
    <gmpx-api-loader
      solution-channel="GMP_QA_copilot"
      api-key={apiKey}
      version="beta"
      libraries="places,geometry,drawing"
    />
  );
};

export default GoogleMapsApiLoader;
