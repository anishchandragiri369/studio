"use client";

import type { CartItem, Juice } from '@/lib/types';
import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (juice: Juice, quantity?: number) => void;
  removeFromCart: (juiceId: string) => void;
  updateQuantity: (juiceId: string, quantity: number) => void;
  clearCart: (showToast?: boolean) => void;
  getCartTotal: () => number;
  getItemCount: () => number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'elixrCart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { user, loading } = useAuth(); // Use 'loading' instead of 'authLoading'
  const { toast } = useToast();

  useEffect(() => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    }
  }, []);

  const saveCartToLocalStorage = useCallback((items: CartItem[]) => {
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
      const existingItem = prevItems.find(item => item.id === juice.id);
      let newItems;
      if (existingItem) {
        newItems = prevItems.map(item =>
          item.id === juice.id
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item
        );
      } else {
        newItems = [...prevItems, { ...juice, quantity: quantityToAdd }];
      }
      saveCartToLocalStorage(newItems);
      return newItems;
    });

    // Toast is now in JuiceCard for better UX
  };

  const removeFromCart = (juiceId: string) => {
    const itemToRemoveDetails = cartItems.find(item => item.id === juiceId);

    setCartItems(prevItems => {
      const newItems = prevItems.filter(item => item.id !== juiceId);
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

  const updateQuantity = (juiceId: string, quantity: number) => {
    setCartItems(prevItems => {
      let newItems;
      const itemToUpdate = prevItems.find(item => item.id === juiceId);
      if (!itemToUpdate) return prevItems; // Should not happen if UI is correct

      if (quantity <= 0) {
        newItems = prevItems.filter(item => item.id !== juiceId);
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
          item.id === juiceId ? { ...item, quantity } : item
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
  
  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
