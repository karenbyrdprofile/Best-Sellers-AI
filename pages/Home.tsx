import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, Mic, MicOff, AlertCircle, Sparkles, ArrowUp, Plug, Unplug } from 'lucide-react';
import { MessageBubble } from '../components/MessageBubble';
import { getGeminiChat, startChatWithHistory, resetChat } from '../services/geminiService';
import { saveChatSession, getChat } from '../services/chatHistoryService';
import { Message } from '../types';
import { GenerateContentResponse, Chat } from '@google/genai';
import { useLocation, useNavigate } from 'react-router-dom';
import { searchAmazonProducts, checkBackendConnection, AmazonProduct } from '../services/amazonPaApi';

// Type definition for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'model',
  text: "# 👋 Hi there! I'm your AI Shopping Assistant.\n\nI find products with the **highest sales on Amazon last month** 📈 that also have **high reviews and ratings** ⭐.\n\nI check for \"bought in past month\" data to make sure you get what's actually trending right now, along with honest pros & cons.\n\nWhat are you looking for today?",
  suggestions: [
    "🔥 Best selling air fryers",
    "💻 Top laptops with high sales",
    "🎧 Popular headphones 5k+ sold",
    "🎁 Trending gifts for men"
  ],
  timestamp: Date.now()
};

export const Home: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string>(Date.now().toString());
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
    // Check Backend Connection on Mount
    checkBackendConnection().then(isConnected => {
        setIsBackendConnected(isConnected);
        if (isConnected) {
            console.log("🟢 Connected to Amazon PA-API Backend");
        } else {
            console.log("🔴 Amazon Backend disconnected (Using pure AI mode)");
        }
    });
  }, []);

  // Initialize Chat based on URL param or create new
  useEffect(() => {
    const urlChatId = searchParams.get('chatId');
    const query = searchParams.get('q');

    if (urlChatId) {
      const savedChat = getChat(urlChatId);
      if (savedChat) {
        setChatId(savedChat.id);
        setMessages(savedChat.messages);
        setIsLoading(false);
        // Start chat without search first, let the first user interaction trigger search if needed
        startChatWithHistory(savedChat.messages);
      } else if (urlChatId === chatId && messages.length > 1) {
          // Keep current state
      } else {
        navigate('/', { replace: true });
      }
    } else if (query) {
       const newId = Date.now().toString();
       setIsLoading(false); 
       setChatId(newId);
       setMessages([WELCOME_MESSAGE]);
       resetChat();
       handleSend(query);
       navigate(`/?chatId=${newId}`, { replace: true });
    } else {
       if (messages.length > 1 && !urlChatId) {
          const newId = Date.now().toString();
          setChatId(newId);
          setMessages([WELCOME_MESSAGE]);
          resetChat();
       }
    }
  }, [searchParams.get('chatId'), searchParams.get('q')]);

  useEffect(() => {
    if (messages.length > 1) { 
      saveChatSession(chatId, messages);
    }
  }, [messages, chatId]);

  const processResponse = async (
    createChatFn: (enableSearch: boolean) => Chat, 
    userMsgText: string, 
    hiddenContext?: string
  ) => {
      const aiMsgId = (Date.now() + 1).toString();
      let fullText = '';
      let foundMetadata: any = null;

      // Add placeholder message
      setMessages(prev => [...prev, {
        id: aiMsgId,
        role: 'model',
        text: '',
        timestamp: Date.now(),
        isStreaming: true
      }]);

      const messageToSend = hiddenContext 
        ? `${userMsgText}\n\n${hiddenContext}` 
        : userMsgText;

      // Helper for the streaming loop
      const streamResponse = async (chatInstance: Chat) => {
        const result = await chatInstance.sendMessageStream({ message: messageToSend });
        for await (const chunk of result) {
            const c = chunk as GenerateContentResponse;
            const text = c.text;
            const metadata = c.candidates?.[0]?.groundingMetadata;

            if (metadata) { foundMetadata = metadata; }

            if (text) {
                fullText += text;
                setMessages(prev => prev.map(msg => 
                    msg.id === aiMsgId ? { 
                      ...msg, 
                      text: fullText,
                      groundingMetadata: foundMetadata || msg.groundingMetadata 
                    } : msg
                ));
            } else if (foundMetadata) {
              setMessages(prev => prev.map(msg => 
                    msg.id === aiMsgId ? { ...msg, groundingMetadata: foundMetadata } : msg
                ));
            }
        }
      };

      try {
        // Attempt 1: Try with Search Enabled (Default)
        const chatWithSearch = createChatFn(true);
        await streamResponse(chatWithSearch);
      } catch (error: any) {
        console.warn("Attempt 1 (Search) failed:", error);
        
        // Fallback: Always try without search if the first attempt fails.
        // This is the most robust way to handle tool/permission errors.
        console.log("⚠️ Fallback: Retrying without Google Search tool...");
        
        try {
           // Reset text for the retry
           fullText = ''; 
           const chatWithoutSearch = createChatFn(false);
           await streamResponse(chatWithoutSearch);
        } catch (retryError: any) {
           console.error("Attempt 2 (No-Search) failed:", retryError);
           handleError(retryError, aiMsgId);
           return;
        }
      }
      
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg
      ));
      
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleError = (error: any, msgId: string) => {
    let errorMessage = error?.message || error?.toString() || "Unknown error";
    
    // Clean up generic prefixes often added by SDKs or browsers
    if (errorMessage.includes("GoogleGenAIError")) {
        errorMessage = errorMessage.replace(/GoogleGenAIError:\s*/, '');
    }

    let friendlyError = `I encountered an issue connecting to the AI service.\n\n\`${errorMessage}\``;

    if (errorMessage.includes("API key not valid") || errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("400")) {
        friendlyError = "**API Key Error**: The provided API key is invalid or restricted.\n\n" +
                        "**Fix:** Go to Google Cloud Console > Credentials. Edit this API Key and ensure **Referrer Restrictions** include your website URL:\n" +
                        "`https://bestsellersai.pages.dev`\n\n" + 
                        "Also ensure the **Generative Language API** is enabled.";
    } else if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        friendlyError = "**Connection Blocked**: The browser could not connect to Google's AI server.\n\n" +
                        "**Possible Causes:**\n" +
                        "1. **Ad Blocker**: Extensions like uBlock Origin often block AI API requests. Try disabling it for this site.\n" +
                        "2. **API Key Restrictions**: If you set 'HTTP Referrer' restrictions, ensure `https://bestsellersai.pages.dev` (and `http://localhost:5173` if testing locally) are explicitly allowed.\n" +
                        "3. **Network Firewall**: Your network (office/school) might be blocking `generativelanguage.googleapis.com`.";
    }

    setMessages(prev => prev.map(msg => 
        msg.id === msgId ? { 
            ...msg, 
            isStreaming: false, 
            text: `⚠️ **Connection Error**\n\n${friendlyError}` 
        } : msg
    ));
    setIsLoading(false);
  };

  const handleSend = async (textOverride?: string) => {
    const userText = textOverride || inputValue.trim();
    if (!userText) return;
    if (!textOverride && isLoading) return;

    // Check for API Key first
    if (!process.env.API_KEY) {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'user',
            text: userText,
            timestamp: Date.now()
        }, {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: "⚠️ **Configuration Error**\n\nNo API Key found. Please set the `API_KEY` environment variable.",
            timestamp: Date.now()
        }]);
        setInputValue('');
        return;
    }

    setInputValue('');
    if (inputRef.current) inputRef.current.style.height = '44px';
    setIsLoading(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMsg]);

    try {
      let hiddenContext = '';
      if (userText.length > 3) {
        try {
          const amazonProducts = await searchAmazonProducts(userText);
          if (amazonProducts && amazonProducts.length > 0) {
            const dataStr = amazonProducts.map(p => 
              `- Product: ${p.title}\n  Price: ${p.price}\n  Image: ${p.image}\n  URL: ${p.url}\n  Features: ${p.features.slice(0,3).join(', ')}`
            ).join('\n\n');
            hiddenContext = `[SYSTEM: VERIFIED AMAZON API DATA FOUND]\nUse the following REAL-TIME data to answer. Prefer this data for price/image accuracy.\n\n${dataStr}`;
          }
        } catch (err) {
          console.warn("Failed to fetch from Amazon Backend", err);
        }
      }

      // We pass a function to create the chat, allowing the processor to choose parameters (like enableSearch)
      const createChatSession = (enableSearch: boolean) => {
          if (textOverride || messages.length <= 1) {
             resetChat();
             return getGeminiChat(enableSearch);
          } else {
             return startChatWithHistory(messages, enableSearch);
          }
      };
      
      await processResponse(createChatSession, userText, hiddenContext);
      
    } catch (error) {
       setIsLoading(false);
       console.error(error);
    }
  };

  const handleVoiceInput = async () => {
    setVoiceError(null);
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("Browser not supported. Please use Chrome/Edge/Safari.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.onstart = () => { setIsListening(true); setVoiceError(null); };
      recognition.onresult = (event: any) => {
        setInputValue(prev => prev ? `${prev} ${event.results[0][0].transcript}` : event.results[0][0].transcript);
      };
      recognition.onerror = (event: any) => {
        setIsListening(false);
        setVoiceError("Voice input failed. Please check permissions.");
      };
      recognition.onend = () => { setIsListening(false); };
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      setVoiceError("Could not start voice input.");
      setIsListening(false);
    }
  };

  const handleEdit = async (id: string, newText: string) => {
    if (isLoading) return;
    const messageIndex = messages.findIndex(m => m.id === id);
    if (messageIndex === -1) return;
    
    if (!process.env.API_KEY) {
        alert("No API Key configured.");
        return;
    }

    setIsLoading(true);
    const history = messages.slice(0, messageIndex);
    setMessages([...history, { id, role: 'user', text: newText, timestamp: Date.now(), isEdited: true }]);
    
    const createChatSession = (enableSearch: boolean) => {
        return startChatWithHistory(messages.slice(0, messageIndex), enableSearch);
    };

    await processResponse(createChatSession, newText);
  };

  const handleRegenerate = async (modelMsgId: string) => {
    if (isLoading) return;
    const modelMsgIndex = messages.findIndex(m => m.id === modelMsgId);
    if (modelMsgIndex === -1) return;
    const userMsg = messages[modelMsgIndex - 1];
    if (userMsg?.role !== 'user') return;
    
    if (!process.env.API_KEY) {
        alert("No API Key configured.");
        return;
    }

    setIsLoading(true);
    const history = messages.slice(0, modelMsgIndex);
    setMessages(history);
    
    const createChatSession = (enableSearch: boolean) => {
        return startChatWithHistory(history.slice(0, -1), enableSearch);
    };

    await processResponse(createChatSession, userMsg.text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value);
      e.target.style.height = 'auto';
      e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  return (
    <div className="flex flex-col h-full relative max-w-5xl mx-auto w-full">
        {/* Connection Status Indicator */}
        <div className="absolute top-2 right-4 z-20 hidden md:flex items-center gap-1.5 bg-white/80 backdrop-blur px-2 py-1 rounded-full text-[10px] font-medium border border-gray-100 shadow-sm transition-opacity">
           {isBackendConnected ? (
               <>
                 <Plug size={12} className="text-green-500" />
                 <span className="text-green-600">Amazon API Active</span>
               </>
           ) : (
               <>
                 <Unplug size={12} className="text-red-400" />
                 <span className="text-gray-400">Pure AI Mode</span>
               </>
           )}
        </div>

        {/* Chat Area */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0 px-4 pb-4 pt-6 scroll-smooth">
            <div className="max-w-3xl mx-auto">
                {messages.map((msg) => (
                    <MessageBubble 
                      key={msg.id} 
                      message={msg} 
                      onEdit={msg.role === 'user' ? handleEdit : undefined}
                      onRegenerate={msg.role === 'model' ? handleRegenerate : undefined}
                      onSuggestionClick={(text) => { setInputValue(text); inputRef.current?.focus(); }}
                    />
                ))}
                {isLoading && messages[messages.length - 1].role === 'user' && (
                    <div className="flex justify-start mb-6 animate-fade-in">
                         <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-sm flex-shrink-0">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-white px-5 py-3 rounded-2xl rounded-tl-none border border-gray-200 flex items-center shadow-sm">
                                 <div className="flex gap-1.5">
                                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                 </div>
                            </div>
                         </div>
                    </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
            </div>
        </div>

        {/* Input Area */}
        <div className="flex-none px-4 pb-6 pt-2 bg-white relative z-10 w-full max-w-3xl mx-auto">
            {voiceError && (
              <div className="absolute -top-12 left-0 right-0 flex justify-center z-20 px-4">
                <div className="bg-red-50 text-red-600 text-sm py-2 px-4 rounded-lg border border-red-100 shadow-sm flex items-center gap-2 animate-fade-in">
                  <AlertCircle size={16} />
                  {voiceError}
                </div>
              </div>
            )}
            
            <div className="relative flex items-end w-full p-2 bg-white rounded-[26px] border border-gray-200 shadow-sm focus-within:shadow-md focus-within:border-gray-300 transition-all">
                <button
                  onClick={handleVoiceInput}
                  className={`rounded-full transition-all duration-200 flex-shrink-0 flex items-center justify-center mb-1 ml-1 ${
                    isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-black hover:bg-gray-100'
                  } ${voiceError ? 'text-red-400' : ''}`}
                  disabled={isLoading}
                  style={{ width: '36px', height: '36px' }}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>

                <textarea 
                    ref={inputRef}
                    className="flex-1 max-h-[200px] min-h-[44px] py-3 px-3 bg-transparent border-0 text-gray-900 placeholder-gray-500 focus:ring-0 focus:outline-none resize-none leading-6 text-[16px]"
                    placeholder="Ask anything..."
                    value={inputValue}
                    onChange={handleInputResize}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    rows={1}
                    style={{ height: '44px' }} 
                />
                
                <button 
                    onClick={() => handleSend()}
                    disabled={isLoading || !inputValue.trim()}
                    className={`rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-200 mb-1 mr-1 ${
                        isLoading || !inputValue.trim() ? 'bg-[#e5e5e5] text-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'
                    }`}
                    style={{ width: '36px', height: '36px' }}
                >
                    <ArrowUp size={18} strokeWidth={2.5} />
                </button>
            </div>
            <div className="text-center mt-2">
                <p className="text-[11px] text-gray-500">
                    As an Amazon Associate, I earn from qualifying purchases. Prices are estimates.
                </p>
            </div>
        </div>
    </div>
  );
};