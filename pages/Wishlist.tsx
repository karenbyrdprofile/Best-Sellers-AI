
import React, { useState, useEffect } from 'react';
import { Heart, Trash2, ExternalLink, ShoppingBag } from 'lucide-react';
import { getWishlist, removeFromWishlist } from '../services/wishlistService';
import { WishlistItem } from '../types';

export const Wishlist: React.FC = () => {
  const [items, setItems] = useState<WishlistItem[]>([]);

  const loadItems = () => {
    setItems(getWishlist());
  };

  useEffect(() => {
    loadItems();
    
    const handleUpdate = () => loadItems();
    window.addEventListener('wishlist-updated', handleUpdate);
    return () => window.removeEventListener('wishlist-updated', handleUpdate);
  }, []);

  const handleRemove = (id: string) => {
    removeFromWishlist(id);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 animate-fade-in">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl mb-4 shadow-lg shadow-red-100">
          <Heart className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Your Wishlist</h1>
        <p className="text-gray-500 max-w-lg mx-auto">
          Keep track of the products you love.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-2xl">
          <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Your wishlist is empty</h3>
          <p className="text-gray-500">Start chatting with Best-Sellers AI to find products to add!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900 mb-1">{item.name}</h3>
                <p className="text-xs text-gray-400">Added on {new Date(item.addedAt).toLocaleDateString()}</p>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <a 
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium transition-colors text-sm"
                >
                  <ExternalLink size={16} /> View on Amazon
                </a>
                <button 
                  onClick={() => handleRemove(item.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove from wishlist"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
