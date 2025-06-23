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
    console.log('[GoogleMapsApiLoader] Component mounted');
    console.log('[GoogleMapsApiLoader] API Key:', apiKey ? 'Present (length: ' + apiKey.length + ')' : 'Missing');
    
    if (!apiKey) {
      console.warn("Google Maps API key is missing. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment.");
    }

    // Test if the API key works by loading the API directly
    if (apiKey && typeof window !== 'undefined') {
      const testScript = document.createElement('script');
      testScript.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=testGoogleMapsCallback`;
      testScript.async = true;
      testScript.defer = true;
      
      // @ts-ignore
      window.testGoogleMapsCallback = () => {
        console.log('[GoogleMapsApiLoader] Direct API test successful - Google Maps loaded');
        // @ts-ignore
        console.log('[GoogleMapsApiLoader] Google Maps version:', window.google?.maps?.version);
      };
      
      testScript.onerror = (error) => {
        console.error('[GoogleMapsApiLoader] Direct API test failed:', error);
      };
      
      // Don't add the test script to avoid conflicts, just log the URL
      console.log('[GoogleMapsApiLoader] Would test with URL:', testScript.src);
    }
  }, []);
  return (
    <>
      {/* Debug info */}
      <div style={{ display: 'none' }} id="google-maps-debug">
        API Key: {apiKey ? 'Present' : 'Missing'}
      </div>
      <gmpx-api-loader
        solution-channel="GMP_QA_copilot"
        api-key={apiKey}
        version="beta"
        libraries="places,geometry,drawing"
      />
    </>
  );
};

export default GoogleMapsApiLoader;
