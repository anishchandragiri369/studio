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
      toast({
        title: "Added to cart!",
        description: `${juice.name} has been added to your cart.`,
      });
      return newItems;
    });
  };

  const removeFromCart = (juiceId: string) => {
    setCartItems(prevItems => {
      const itemToRemove = prevItems.find(item => item.id === juiceId);
      const newItems = prevItems.filter(item => item.id !== juiceId);
      saveCartToLocalStorage(newItems);
      if (itemToRemove) {
        toast({
          title: "Removed from cart",
          description: `${itemToRemove.name} has been removed from your cart.`,
          variant: "destructive"
        });
      }
      return newItems;
    });
  };

  const updateQuantity = (juiceId: string, quantity: number) => {
    setCartItems(prevItems => {
      if (quantity <= 0) {
        return prevItems.filter(item => item.id !== juiceId);
      }
      const newItems = prevItems.map(item =>
        item.id === juiceId ? { ...item, quantity } : item
      );
      saveCartToLocalStorage(newItems);
      return newItems;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    saveCartToLocalStorage([]);
    toast({
      title: "Cart Cleared",
      description: "Your shopping cart has been emptied.",
    });
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };
  
  // Debounce localStorage writes slightly if performance becomes an issue
  // For now, direct saves are fine for typical cart sizes

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
