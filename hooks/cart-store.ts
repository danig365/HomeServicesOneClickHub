import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { CartItem, Service } from '@/types/service';

export const [CartProvider, useCart] = createContextHook(() => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const stored = await AsyncStorage.getItem('cart');
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCart = async (newItems: CartItem[]) => {
    try {
      await AsyncStorage.setItem('cart', JSON.stringify(newItems));
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
  };

  const addToCart = (service: Service, scheduledDate?: string) => {
    const existingIndex = items.findIndex(item => item.service.id === service.id);
    let newItems: CartItem[];
    
    if (existingIndex >= 0) {
      newItems = [...items];
      newItems[existingIndex].quantity += 1;
    } else {
      newItems = [...items, { service, quantity: 1, scheduledDate }];
    }
    
    setItems(newItems);
    saveCart(newItems);
  };

  const removeFromCart = (serviceId: string) => {
    const newItems = items.filter(item => item.service.id !== serviceId);
    setItems(newItems);
    saveCart(newItems);
  };

  const updateQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(serviceId);
      return;
    }
    
    const newItems = items.map(item =>
      item.service.id === serviceId ? { ...item, quantity } : item
    );
    setItems(newItems);
    saveCart(newItems);
  };

  const clearCart = () => {
    setItems([]);
    saveCart([]);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.service.price * item.quantity), 0);
  };

  const getItemCount = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  return {
    items,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getItemCount
  };
});