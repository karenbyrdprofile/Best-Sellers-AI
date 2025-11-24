
export interface SavedQuery {
  id: string;
  text: string;
  timestamp: number;
}

const STORAGE_KEY = 'bf_ai_saved_queries';

export const getSavedQueries = (): SavedQuery[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load saved queries", e);
    return [];
  }
};

export const saveQuery = (text: string): SavedQuery => {
  const queries = getSavedQueries();
  const cleanText = text.trim();
  
  // Check duplicates (case-insensitive)
  const existing = queries.find(q => q.text.toLowerCase() === cleanText.toLowerCase());
  if (existing) return existing;

  const newQuery: SavedQuery = {
    id: Date.now().toString(),
    text: cleanText,
    timestamp: Date.now()
  };

  const updated = [newQuery, ...queries];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('saved-queries-updated'));
  return newQuery;
};

export const removeQuery = (id: string) => {
  const queries = getSavedQueries();
  const updated = queries.filter(q => q.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('saved-queries-updated'));
};

export const removeQueryByText = (text: string) => {
  const queries = getSavedQueries();
  const updated = queries.filter(q => q.text.toLowerCase() !== text.trim().toLowerCase());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('saved-queries-updated'));
};

export const isQuerySaved = (text: string): boolean => {
   const queries = getSavedQueries();
   return queries.some(q => q.text.toLowerCase() === text.trim().toLowerCase());
};

export const toggleSavedQuery = (text: string): boolean => {
  if (isQuerySaved(text)) {
    removeQueryByText(text);
    return false;
  } else {
    saveQuery(text);
    return true;
  }
};
