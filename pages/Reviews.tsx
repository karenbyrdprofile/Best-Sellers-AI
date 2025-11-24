import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, PlusCircle, User } from 'lucide-react';
import { addReview, getReviews } from '../services/reviewService';
import { Review } from '../types';

export const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    productName: '',
    rating: 5,
    comment: '',
    userName: ''
  });

  useEffect(() => {
    setReviews(getReviews());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName || !formData.comment || !formData.userName) return;

    const newReview = addReview(formData);
    setReviews(prev => [newReview, ...prev]);
    setFormData({ productName: '', rating: 5, comment: '', userName: '' });
    setIsFormOpen(false);
  };

  const renderStars = (count: number) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} className={`${i < count ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-8 animate-fade-in">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl mb-4 shadow-lg shadow-orange-100">
          <Star className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Community Reviews</h1>
        <p className="text-gray-500 max-w-lg mx-auto">
          See what other users are buying and share your own experiences to help the AI make better recommendations.
        </p>
      </div>

      {/* Add Review Button */}
      <div className="flex justify-center mb-8">
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all shadow-md ${
            isFormOpen ? 'bg-gray-200 text-gray-700' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
          }`}
        >
           {isFormOpen ? 'Cancel Review' : <><PlusCircle size={18} /> Write a Review</>}
        </button>
      </div>

      {/* Review Form */}
      {isFormOpen && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xl mb-10 animate-fade-in">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Rate a Product</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input 
                  required
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Sony WH-1000XM5"
                  value={formData.productName}
                  onChange={e => setFormData({...formData, productName: e.target.value})}
                />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                 <input 
                  required
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Jane Doe"
                  value={formData.userName}
                  onChange={e => setFormData({...formData, userName: e.target.value})}
                />
              </div>
            </div>
            
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
               <div className="flex gap-4">
                 {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      type="button"
                      key={star} 
                      onClick={() => setFormData({...formData, rating: star})}
                      className={`p-2 rounded-lg transition-colors ${formData.rating >= star ? 'bg-yellow-50 text-yellow-500' : 'bg-gray-100 text-gray-400'}`}
                    >
                       <Star size={24} className={formData.rating >= star ? 'fill-current' : ''} />
                    </button>
                 ))}
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Review</label>
              <textarea 
                required
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                placeholder="What did you like or dislike about this product?"
                value={formData.comment}
                onChange={e => setFormData({...formData, comment: e.target.value})}
              />
            </div>

            <button 
              type="submit" 
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submit Review
            </button>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="grid gap-4">
        {reviews.length === 0 ? (
           <div className="text-center py-10 bg-white border border-dashed border-gray-300 rounded-2xl">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No reviews yet. Be the first to share your experience!</p>
           </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                 <div>
                    <h3 className="font-bold text-lg text-gray-900">{review.productName}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                       <span className="flex items-center gap-1"><User size={12} /> {review.userName}</span>
                       <span>•</span>
                       <span>{new Date(review.timestamp).toLocaleDateString()}</span>
                    </div>
                 </div>
                 <div className="bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                    {renderStars(review.rating)}
                 </div>
              </div>
              <p className="text-gray-700 leading-relaxed">"{review.comment}"</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};