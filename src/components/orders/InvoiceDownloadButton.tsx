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

      // Check content type to determine how to handle the response
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('text/html')) {
        // Handle HTML response - open in new window for printing
        const htmlContent = await response.text();
        
        // Create a new window with the HTML content
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(htmlContent);
          newWindow.document.close();
          
          // Auto-print after a short delay
          setTimeout(() => {
            newWindow.print();
          }, 500);
        } else {
          // Fallback: download as HTML file
          const blob = new Blob([htmlContent], { type: 'text/html' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `invoice-${orderId}.html`;
          document.body.appendChild(link);
          link.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(link);
        }

        toast({
          title: "Invoice Generated",
          description: "Your invoice has been opened in a new window. Use Ctrl+P to save as PDF.",
        });
      } else {
        // Handle PDF response (legacy support)
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
      }

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
          Generate Invoice
        </>
      )}
    </Button>
  );
}
