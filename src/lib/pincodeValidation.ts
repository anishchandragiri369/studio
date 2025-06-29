import hyderabadPincodes from '../../sql/hyderabad_pincodes.json';

export interface ServiceableArea {
  pincode: string;
  area: string;
}

// Load serviceable pincodes
export const serviceablePincodes: ServiceableArea[] = hyderabadPincodes;

// Get all serviceable pincode numbers as array
export const serviceablePincodeCodes = serviceablePincodes.map(item => item.pincode);

/**
 * Check if a pincode is serviceable in Hyderabad
 * @param pincode - The pincode to validate
 * @returns Object with validation result and area info
 */
export function validatePincode(pincode: string): {
  isServiceable: boolean;
  area?: string;
  message: string;
} {
  // Clean the pincode (remove spaces, ensure 6 digits)
  const cleanPincode = pincode.replace(/\s/g, '').trim();
  
  // Basic format validation
  if (!/^\d{6}$/.test(cleanPincode)) {
    return {
      isServiceable: false,
      message: 'Please enter a valid 6-digit pincode'
    };
  }
  
  // Check if pincode is in serviceable areas
  const serviceableArea = serviceablePincodes.find(area => area.pincode === cleanPincode);
  
  if (serviceableArea) {
    return {
      isServiceable: true,
      area: serviceableArea.area,
      message: `Great! We deliver to ${serviceableArea.area}`
    };
  }
  
  return {
    isServiceable: false,
    message: 'Sorry, we don\'t deliver to this area yet. We\'ll be expanding soon!'
  };
}

/**
 * Get area name for a given pincode
 * @param pincode - The pincode to look up
 * @returns Area name or null if not found
 */
export function getAreaByPincode(pincode: string): string | null {
  const cleanPincode = pincode.replace(/\s/g, '').trim();
  const serviceableArea = serviceablePincodes.find(area => area.pincode === cleanPincode);
  return serviceableArea?.area || null;
}

/**
 * Get contact info for non-serviceable areas
 */
export const getContactInfo = () => ({
  whatsapp: '+91-9704595252', // Replace with your actual WhatsApp number
  email: 'support@elixr.com',
  message: 'Contact us on WhatsApp for delivery updates in your area!'
});
