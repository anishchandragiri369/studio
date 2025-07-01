"use client";

import type { Juice } from '@/lib/types';
import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';

// Updated CartItem to include type discriminator
interface RegularCartItem extends Omit<Juice, 'id'> {
  id: string;
  quantity: number;
  type: 'regular';
}

// Add subscription item type
interface SubscriptionCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'subscription';
  subscriptionData: {
    planId: string;
    planName: string;
    planFrequency: string;
    subscriptionDuration: number;
    basePrice: number;
    selectedJuices: { juiceId: string; quantity: number }[];
  };
  image?: string;
}

// Updated cart item type to include both regular and subscription items
type UnifiedCartItem = RegularCartItem | SubscriptionCartItem;

interface CartContextType {
  cartItems: UnifiedCartItem[];
  addToCart: (juice: Juice, quantity?: number) => void;
  addSubscriptionToCart: (subscriptionData: SubscriptionCartItem['subscriptionData']) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: (showToast?: boolean) => void;
  getCartTotal: () => number;
  getItemCount: () => number;
  getRegularItems: () => RegularCartItem[];
  getSubscriptionItems: () => SubscriptionCartItem[];
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'elixrCart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<UnifiedCartItem[]>([]);
  const { user, loading } = useAuth(); // Use 'loading' instead of 'authLoading'
  const { toast } = useToast();

  useEffect(() => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    }
  }, []);

  const saveCartToLocalStorage = useCallback((items: UnifiedCartItem[]) => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, []);
  
  // Effect to clear cart when authentication state is resolved and no user is logged in
  useEffect(() => {
    if (!loading && !user) {
      clearCart(false); // Clear cart without toast if user logs out or session ends
    }
  }, [user, loading, saveCartToLocalStorage]); // Update dependencies to use 'loading'

  const addToCart = (juice: Juice, quantityToAdd: number = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === juice.id && item.type === 'regular') as RegularCartItem;
      let newItems;
      if (existingItem) {
        newItems = prevItems.map(item =>
          item.id === juice.id && item.type === 'regular'
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item
        );
      } else {
        const newCartItem: RegularCartItem = { ...juice, quantity: quantityToAdd, type: 'regular' };
        newItems = [...prevItems, newCartItem];
      }
      saveCartToLocalStorage(newItems);
      return newItems;
    });

    // Toast is now in JuiceCard for better UX
  };

  const addSubscriptionToCart = (subscriptionData: SubscriptionCartItem['subscriptionData']) => {
    const subscriptionItem: SubscriptionCartItem = {
      id: `subscription-${subscriptionData.planId}-${Date.now()}`,
      name: subscriptionData.planName,
      price: subscriptionData.basePrice || 0, // Use basePrice instead of planPrice
      quantity: 1,
      type: 'subscription',
      subscriptionData,
      image: '/images/subscription-icon.jpg' // You can customize this
    };

    setCartItems(prevItems => {
      const newItems = [...prevItems, subscriptionItem];
      saveCartToLocalStorage(newItems);
      return newItems;
    });

    toast({
      title: "Subscription added to cart",
      description: `${subscriptionData.planName} has been added to your cart.`,
    });
  };

  const removeFromCart = (itemId: string) => {
    const itemToRemoveDetails = cartItems.find(item => item.id === itemId);

    setCartItems(prevItems => {
      const newItems = prevItems.filter(item => item.id !== itemId);
      if (newItems.length < prevItems.length) { 
        saveCartToLocalStorage(newItems);
      }
      return newItems;
    });

    if (itemToRemoveDetails) {
      setTimeout(() => {
        toast({
          title: "Removed from cart",
          description: `${itemToRemoveDetails.name} has been removed.`,
          variant: "destructive"
        });
      }, 0);
    }
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    setCartItems(prevItems => {
      let newItems;
      const itemToUpdate = prevItems.find(item => item.id === itemId);
      if (!itemToUpdate) return prevItems; // Should not happen if UI is correct

      if (quantity <= 0) {
        newItems = prevItems.filter(item => item.id !== itemId);
        if (itemToUpdate) { // Only show toast if item was actually removed
             setTimeout(() => {
                toast({
                    title: "Item Removed",
                    description: `${itemToUpdate.name} removed from cart as quantity reached 0.`,
                    variant: "destructive",
                });
            }, 0);
        }
      } else {
        newItems = prevItems.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        );
      }
      saveCartToLocalStorage(newItems);
      return newItems;
    });
  };

  const clearCart = useCallback((showToast = true) => {
    const hadItems = cartItems.length > 0;
    setCartItems([]);
    saveCartToLocalStorage([]); // Pass empty array here

    if (showToast && hadItems) { // Only show toast if there were items to clear
      setTimeout(() => {
        toast({
          title: "Cart Cleared",
          description: "Your shopping cart has been emptied.",
        });
      }, 0);
    }
  }, [cartItems, saveCartToLocalStorage, toast]); // Added dependencies


  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const getRegularItems = () => {
    return cartItems.filter((item): item is RegularCartItem => item.type === 'regular');
  };

  const getSubscriptionItems = () => {
    return cartItems.filter((item): item is SubscriptionCartItem => item.type === 'subscription');
  };
  
  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        addSubscriptionToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getItemCount,
        getRegularItems,
        getSubscriptionItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
