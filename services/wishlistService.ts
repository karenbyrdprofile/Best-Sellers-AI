
import { WishlistItem } from '../types';

const STORAGE_KEY = 'bf_ai_wishlist';

export const getWishlist = (): WishlistItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load wishlist", e);
    return [];
  }
};

export const addToWishlist = (name: string, url: string): WishlistItem => {
  const items = getWishlist();
  const newItem: WishlistItem = {
    id: Date.now().toString(),
    name,
    url,
    addedAt: Date.now(),
  };
  
  const updatedItems = [newItem, ...items];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
  
  // Dispatch event for UI updates if needed
  window.dispatchEvent(new Event('wishlist-updated'));
  
  return newItem;
};

export const removeFromWishlist = (id: string) => {
  const items = getWishlist();
  const updatedItems = items.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
  window.dispatchEvent(new Event('wishlist-updated'));
};

export const removeFromWishlistByUrl = (url: string) => {
  const items = getWishlist();
  const updatedItems = items.filter(item => item.url !== url);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
  window.dispatchEvent(new Event('wishlist-updated'));
};

export const isUrlInWishlist = (url: string): boolean => {
  const items = getWishlist();
  return items.some(item => item.url === url);
};

export const toggleWishlist = (name: string, url: string): boolean => {
  if (isUrlInWishlist(url)) {
    removeFromWishlistByUrl(url);
    return false;
  } else {
    addToWishlist(name, url);
    return true;
  }
};
