
import { z } from 'zod';
import { validatePincode } from './pincodeValidation';

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export const signUpSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"], // path of error
});

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});

export const checkoutAddressSchema = z.object({
  email: z.string().email({ message: "Invalid email address is required." }),
  mobileNumber: z.string().optional(),
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().optional(),
  addressLine1: z.string().min(1, { message: "Street address is required." }),
  addressLine2: z.string().optional(),
  city: z.string().min(1, { message: "City is required." }),
  state: z.string().min(1, { message: "State / Province is required." }),
  zipCode: z.string()
    .min(1, { message: "Pincode is required." })
    .regex(/^\d{6}$/, { message: "Please enter a valid 6-digit pincode." })
    .refine((pincode) => {
      const validation = validatePincode(pincode);
      return validation.isServiceable;
    }, {
      message: "Sorry, we don't deliver to this pincode yet. Please contact us for delivery updates!"
    }),
  country: z.string().min(1, { message: "Country is required." }),
});

export const editProfileSchema = z.object({
  fullName: z.string().min(1, { message: "Full name is required." }).optional(),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }).optional().or(z.literal('')),
  confirmNewPassword: z.string().optional().or(z.literal('')),
}).refine(data => {
  // If newPassword is provided and not empty, confirmNewPassword must match.
  if (data.newPassword && data.newPassword.length > 0) {
    return data.newPassword === data.confirmNewPassword;
  }
  // If newPassword is not provided or empty, no validation needed for confirmNewPassword regarding matching.
  return true;
}, {
  message: "New passwords don't match.",
  path: ["confirmNewPassword"],
}).refine(data => {
  // If newPassword is provided but too short (and not empty), this will be caught by its own min(6)
  // This refinement specifically checks: if confirmNewPassword is provided but newPassword is not (or vice-versa, though less likely with UI)
  if (data.newPassword && !data.confirmNewPassword && data.newPassword.length > 0) {
    return false; // Requires confirm if new is set
  }
  if (!data.newPassword && data.confirmNewPassword) {
    return false; // Requires new if confirm is set
  }
  return true;
}, {
    message: "Both password fields are required if changing password.",
    path: ["newPassword"] // Could also be confirmNewPassword, depending on which field to highlight
});

// Zod schema for the add product form
export const addProductFormSchema = z.object({
  name: z.string().min(1, { message: "Product name is required." }),
  description: z.string().optional(),
  flavor: z.string().optional(),
  price: z.preprocess( // Preprocess to convert string to number if needed
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().positive({ message: "Price must be a positive number." })
  ),
  imageUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')), // Optional and can be empty string
  dataAiHint: z.string().max(50, "Hint too long").optional(), // Example constraint
  category: z.string().min(1, { message: "Category is required." }),
  tags: z.string().optional(), // Will be processed into an array of strings
  stockQuantity: z.preprocess( // Preprocess to convert string to number
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().nonnegative({ message: "Stock must be a non-negative integer." })
  ),
});

    