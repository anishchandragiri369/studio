"use client";

import { MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { openWhatsApp } from '@/lib/social-utils';

interface WhatsAppLinkProps {
  className?: string;
  children?: React.ReactNode;
}

const WhatsAppLink = ({ className, children }: WhatsAppLinkProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openWhatsApp();
  };

  return (
    <Link 
      href="#" 
      onClick={handleClick}
      className={className}
    >
      {children || (
        <>
          <MessageCircle className="w-4 h-4" />
          <span>WhatsApp Order</span>
        </>
      )}
    </Link>
  );
};

export default WhatsAppLink;
