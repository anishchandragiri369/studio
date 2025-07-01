import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Price formatting utility
export function formatPrice(
  price: number | string | null | undefined
): string {
  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice < 0) {
    return "₹0.00";
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(numPrice);
}

// Date formatting utility
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) {
    return "Invalid Date";
  }
  return dateObj.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Order ID generation
export function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `ELX${timestamp}${random}`.toUpperCase();
}

// Email validation
export function validateEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Phone number validation (Indian format)
export function isValidPhoneNumber(phone: string | null | undefined): boolean {
  if (!phone || typeof phone !== "string") return false;
  const cleanPhone = phone.replace(/\D/g, "");
  return /^(\+91|91|0)?[6-9]\d{9}$/.test(cleanPhone);
}

// Calculate delivery date (skip weekends)
export function calculateDeliveryDate(orderDate: Date = new Date()): Date {
  const deliveryDate = new Date(orderDate);
  deliveryDate.setDate(deliveryDate.getDate() + 1); // Next day delivery

  // Skip weekends
  while (deliveryDate.getDay() === 0 || deliveryDate.getDay() === 6) {
    deliveryDate.setDate(deliveryDate.getDate() + 1);
  }

  return deliveryDate;
}

// Calculate subscription price with discounts
export function calculateSubscriptionPrice(subscriptionData: {
  items: { price: number }[];
  duration: number;
  plan: string;
}): { daily: number; total: number; discount: number } {
  const dailyPrice = subscriptionData.items.reduce(
    (sum, item) => sum + item.price,
    0
  );
  let total = dailyPrice * subscriptionData.duration;
  let discount = 0;

  // Apply discounts for longer subscriptions
  if (subscriptionData.duration >= 90) {
    discount = 0.2; // 20% discount for 90+ days
  } else if (subscriptionData.duration >= 30) {
    discount = 0.1; // 10% discount for 30+ days
  }

  total = total * (1 - discount);

  return {
    daily: dailyPrice,
    total: Math.round(total),
    discount: discount * 100,
  };
}
