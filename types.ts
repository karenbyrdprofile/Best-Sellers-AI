
export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isStreaming?: boolean;
  groundingMetadata?: any;
  isEdited?: boolean;
  suggestions?: string[];
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

export interface NavLink {
  label: string;
  path: string;
}

export interface Review {
  id: string;
  productName: string;
  rating: number;
  comment: string;
  userName: string;
  timestamp: number;
}

export interface WishlistItem {
  id: string;
  name: string;
  url: string;
  addedAt: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}