"use client";
import { useEffect, useState } from "react";
import GoogleMapsApiLoader from "./GoogleMapsApiLoader";

export default function GoogleMapsApiLoaderWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only render the loader after mounting to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return <GoogleMapsApiLoader />;
}
