/**
 * Utility functions for handling external links and social media
 */

export const WHATSAPP_NUMBER = "919704595252";
export const WHATSAPP_MESSAGE = "Hi! I'm interested in ordering fresh juices from Elixr. Can you help me?";

/**
 * Opens WhatsApp with smart app/web detection
 * @param customMessage - Optional custom message to send
 */
export const openWhatsApp = (customMessage?: string) => {
  const message = customMessage || WHATSAPP_MESSAGE;
  const encodedMessage = encodeURIComponent(message);
  
  // Detect if user is on mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Try to open WhatsApp app first
    const whatsappAppUrl = `whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${encodedMessage}`;
    const whatsappWebUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    
    try {
      window.location.href = whatsappAppUrl;
      
      // If the app doesn't open within 2 seconds, fallback to web
      setTimeout(() => {
        if (document.hasFocus()) {
          window.open(whatsappWebUrl, '_blank');
        }
      }, 2000);
    } catch (error) {
      // Fallback to web WhatsApp
      window.open(whatsappWebUrl, '_blank');
    }
  } else {
    // For desktop, always use web WhatsApp
    const whatsappWebUrl = `https://web.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodedMessage}`;
    window.open(whatsappWebUrl, '_blank');
  }
};

/**
 * Opens Instagram profile in new tab
 */
export const openInstagram = () => {
  window.open('https://www.instagram.com/elixr_healthy_sips', '_blank', 'noopener,noreferrer');
};
