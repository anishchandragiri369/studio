
"use client";

import type { CartItem, Juice } from '@/lib/types';
import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (juice: Juice, quantity?: number) => void;
  removeFromCart: (juiceId: string) => void;
  updateQuantity: (juiceId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getItemCount: () => number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'juiceBoxCart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
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

    setTimeout(() => {
      toast({
        title: "Added to cart!",
        description: `${juice.name} has been added to your cart.`,
      });
    }, 0);
  };

  const removeFromCart = (juiceId: string) => {
    const itemToRemoveDetails = cartItems.find(item => item.id === juiceId);

    setCartItems(prevItems => {
      const newItems = prevItems.filter(item => item.id !== juiceId);
      if (newItems.length < prevItems.length) { // Check if something was actually removed
        saveCartToLocalStorage(newItems);
      }
      return newItems;
    });

    if (itemToRemoveDetails) {
      setTimeout(() => {
        toast({
          title: "Removed from cart",
          description: `${itemToRemoveDetails.name} has been removed from your cart.`,
          variant: "destructive"
        });
      }, 0);
    }
  };

  const updateQuantity = (juiceId: string, quantity: number) => {
    setCartItems(prevItems => {
      let newItems;
      if (quantity <= 0) {
        // If quantity becomes 0 or less, consider removing the item or decide behavior.
        // For now, just filter out. If toast on remove is desired, logic similar to removeFromCart is needed.
        newItems = prevItems.filter(item => item.id !== juiceId);
      } else {
        newItems = prevItems.map(item =>
          item.id === juiceId ? { ...item, quantity } : item
        );
      }
      saveCartToLocalStorage(newItems);
      return newItems;
    });
  };

  const clearCart = () => {
    const hadItems = cartItems.length > 0;
    setCartItems([]);
    saveCartToLocalStorage([]);

    if (hadItems) { // Optional: only toast if there was something to clear. Original did not have this.
      setTimeout(() => {
        toast({
          title: "Cart Cleared",
          description: "Your shopping cart has been emptied.",
        });
      }, 0);
    } else { // If cart was already empty, original toast might still be desired or not.
            // For minimal change to fix error, let's keep the original behavior to always toast.
            // Reverting to always toast unless specified.
      setTimeout(() => {
        toast({
          title: "Cart Cleared",
          description: "Your shopping cart has been emptied.",
        });
      }, 0);
    }
  };


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
