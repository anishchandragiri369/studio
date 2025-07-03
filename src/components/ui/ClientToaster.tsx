"use client";

import { useEffect, useState } from 'react';
import { Toaster } from './toaster';

const ClientToaster = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render anything on the server or before hydration
  if (!isMounted) {
    return null;
  }

  return <Toaster />;
};

export default ClientToaster;
