"use client";

import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { openWhatsApp } from '@/lib/social-utils';
import { useState, useEffect } from 'react';

const WhatsAppFloatingButton = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until hydration is complete
  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
      <Button
        onClick={() => openWhatsApp()}
        className="bg-green-500 hover:bg-green-600 text-white rounded-full w-12 h-12 sm:w-14 sm:h-14 shadow-lg hover:shadow-xl transition-all duration-300 animate-bounce-gentle group"
        size="icon"
        aria-label="Contact us on WhatsApp"
        suppressHydrationWarning
      >
        <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 group-hover:scale-110 transition-transform" />
      </Button>
      
      {/* Tooltip */}
      <div className="absolute bottom-14 sm:bottom-16 right-0 glass-card px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
        <p className="text-sm font-medium">Order on WhatsApp</p>
        <div className="absolute -bottom-1 right-4 w-2 h-2 bg-white rotate-45 border-r border-b border-border/20"></div>
      </div>
    </div>
  );
};

export default WhatsAppFloatingButton;
