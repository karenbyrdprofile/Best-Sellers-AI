
import { ChatSession, Message } from '../types';

const STORAGE_KEY = 'bf_ai_chat_history';

export const getChatHistory = (): ChatSession[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load chat history", e);
    return [];
  }
};

export const getChat = (id: string): ChatSession | undefined => {
  const history = getChatHistory();
  return history.find(chat => chat.id === id);
};

export const saveChatSession = (id: string, messages: Message[], title?: string) => {
  const history = getChatHistory();
  const existingIndex = history.findIndex(chat => chat.id === id);
  
  // Determine title: Use provided, keep existing, or generate from first user message
  let finalTitle = title || 'New Chat';
  if (!title) {
    if (existingIndex >= 0) {
        finalTitle = history[existingIndex].title;
    } else {
        const firstUserMsg = messages.find(m => m.role === 'user');
        if (firstUserMsg) {
            finalTitle = firstUserMsg.text.slice(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '');
        }
    }
  } else if (existingIndex >= 0 && history[existingIndex].title !== 'New Chat' && title === 'New Chat') {
      // Don't overwrite a custom title with "New Chat"
      finalTitle = history[existingIndex].title;
  }

  const session: ChatSession = {
    id,
    title: finalTitle,
    messages,
    timestamp: Date.now()
  };

  let updatedHistory;
  if (existingIndex >= 0) {
    updatedHistory = [...history];
    updatedHistory[existingIndex] = session;
  } else {
    updatedHistory = [session, ...history];
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  window.dispatchEvent(new Event('chat-history-updated'));
};

export const deleteChatSession = (id: string) => {
  const history = getChatHistory();
  const updatedHistory = history.filter(chat => chat.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  window.dispatchEvent(new Event('chat-history-updated'));
};

export const clearChatHistory = () => {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('chat-history-updated'));
};
