
import { z } from 'zod';

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
  zipCode: z.string().min(1, { message: "ZIP / Postal code is required." }),
  country: z.string().min(1, { message: "Country is required." }),
});

export const editProfileSchema = z.object({
  fullName: z.string().min(1, { message: "Full name is required." }).optional(),
  // Supabase user_metadata usually stores avatar_url, not the file itself directly from a form like this.
  // For simplicity, we'll omit avatar direct upload here. It's a more complex feature.
  // avatarUrl: z.string().url({ message: "Invalid URL format." }).optional(), 
});
