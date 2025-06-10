
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

