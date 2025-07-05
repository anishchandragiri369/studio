"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InvoiceDownloadButtonProps {
  orderId: string;
  userId?: string;
  email?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export default function InvoiceDownloadButton({
  orderId,
  userId,
  email,
  disabled = false,
  variant = 'outline',
  size = 'sm',
  className = ''
}: InvoiceDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const downloadInvoice = async () => {
    if (isGenerating || disabled) return;

    setIsGenerating(true);

    try {
      // Use GET request for direct download
      const params = new URLSearchParams();
      params.append('orderId', orderId);
      
      if (userId) {
        params.append('userId', userId);
      }
      
      if (email) {
        params.append('email', email);
      }

      const response = await fetch(`/api/orders/invoice?${params.toString()}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate invoice');
      }

      // Create blob from response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast({
        title: "Invoice Downloaded",
        description: "Your invoice has been successfully downloaded.",
      });

    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={downloadInvoice}
      disabled={disabled || isGenerating}
      variant={variant}
      size={size}
      className={className}
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Download Invoice
        </>
      )}
    </Button>
  );
}
