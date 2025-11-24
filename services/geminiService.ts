import { GoogleGenAI, Chat, Content } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { getReviewsSummary } from "./reviewService";
import { Message } from "../types";

let chatSession: Chat | null = null;

const getSystemInstructionWithReviews = (baseInstruction: string) => {
  const reviews = getReviewsSummary();
  if (!reviews) return baseInstruction;
  return `${baseInstruction}\n${reviews}`;
};

export const getGeminiChat = (enableSearch: boolean = true): Chat => {
  // If we have a session and the search preference matches, return it.
  // Note: We can't easily check the config of the existing session, so if enableSearch is false (fallback),
  // we force a new session creation to ensure tools are removed.
  if (chatSession && enableSearch) return chatSession;

  const apiKey = (process.env.API_KEY || '').trim();
  const ai = new GoogleGenAI({ apiKey });
  
  // Conditionally add tools
  const tools = enableSearch ? [{ googleSearch: {} }] : undefined;
  
  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      tools: tools,
      systemInstruction: getSystemInstructionWithReviews(SYSTEM_INSTRUCTION),
      temperature: 0, // Set to 0 for maximum factuality
      topK: 40,
      topP: 0.95,
    },
  });

  return chatSession;
};

export const startChatWithHistory = (history: Message[], enableSearch: boolean = true): Chat => {
  const apiKey = (process.env.API_KEY || '').trim();
  const ai = new GoogleGenAI({ apiKey });

  // Filter out messages with empty text or invalid roles to prevent 400 Bad Request errors
  const validHistory = history.filter(msg => 
    msg.text && 
    msg.text.trim().length > 0 && 
    (msg.role === 'user' || msg.role === 'model')
  );

  // Convert internal Message format to SDK Content format
  const sdkHistory: Content[] = validHistory.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  const tools = enableSearch ? [{ googleSearch: {} }] : undefined;

  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    history: sdkHistory,
    config: {
      tools: tools,
      systemInstruction: getSystemInstructionWithReviews(SYSTEM_INSTRUCTION),
      temperature: 0, // Set to 0 for maximum factuality
      topK: 40,
      topP: 0.95,
    },
  });

  return chatSession;
};

export const resetChat = () => {
  chatSession = null;
};