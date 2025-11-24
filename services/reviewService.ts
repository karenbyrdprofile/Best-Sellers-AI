import { Review } from '../types';

const STORAGE_KEY = 'bf_ai_reviews';

export const getReviews = (): Review[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load reviews", e);
    return [];
  }
};

export const addReview = (reviewData: Omit<Review, 'id' | 'timestamp'>): Review => {
  const reviews = getReviews();
  const newReview: Review = {
    ...reviewData,
    id: Date.now().toString(),
    timestamp: Date.now(),
  };
  
  const updatedReviews = [newReview, ...reviews];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReviews));
  return newReview;
};

export const getReviewsSummary = (): string => {
  const reviews = getReviews();
  if (reviews.length === 0) return "";
  
  // Summarize last 20 reviews to keep context small
  const recentReviews = reviews.slice(0, 20);
  
  return `\n\n[USER REVIEWS DATABASE]
The following are real reviews submitted by users of this app. Use this information to provide social proof or specific user feedback when relevant to the user's query.
${recentReviews.map(r => `- Product: "${r.productName}" | Rating: ${r.rating}/5 | User: ${r.userName} | Comment: "${r.comment}"`).join('\n')}`;
};