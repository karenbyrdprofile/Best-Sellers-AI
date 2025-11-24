import React, { useState, useEffect, useRef } from 'react';
import { User, Sparkles, Copy, Check, Pencil, X, Save, Globe, Search, ExternalLink, Info, RefreshCw, Share, Star, ShoppingBag } from 'lucide-react';
import { Message } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ShareModal } from './ShareModal';
import { isQuerySaved, toggleSavedQuery } from '../services/savedQueryService';
import { AFFILIATE_TAG } from '../constants';
import { cleanProductQuery, extractProductHeaders } from '../utils/textUtils';

interface MessageBubbleProps {
  message: Message;
  onEdit?: (id: string, newText: string) => void;
  onRegenerate?: (id: string) => void;
  onSuggestionClick?: (text: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onEdit, onRegenerate, onSuggestionClick }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [copiedSuggestionIndex, setCopiedSuggestionIndex] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const isUser = message.role === 'user';
  const isWelcome = message.id === 'welcome';

  useEffect(() => {
    if (isUser) {
      setIsSaved(isQuerySaved(message.text));
      
      const handleUpdate = () => {
         setIsSaved(isQuerySaved(message.text));
      };
      
      window.addEventListener('saved-queries-updated', handleUpdate);
      return () => window.removeEventListener('saved-queries-updated', handleUpdate);
    }
  }, [message.text, isUser]);

  // Auto-resize textarea when editing
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editText, isEditing]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleToggleSave = () => {
    toggleSavedQuery(message.text);
    // State update handled by event listener in useEffect
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate(message.id);
    }
  };

  const handleCopySuggestion = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedSuggestionIndex(index);
    setTimeout(() => setCopiedSuggestionIndex(null), 2000);
  };

  const handleEditSave = () => {
    if (editText.trim() !== message.text && onEdit) {
      onEdit(message.id, editText);
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditText(message.text);
    setIsEditing(false);
  };

  // Prepare Search Sources
  // Filter out all e-commerce sites (including Amazon) to prioritize showing reviews, news, and blogs in the Sources section
  const EXCLUDED_DOMAINS = [
    'amazon', 'amzn', 'walmart', 'ebay', 'target', 'bestbuy', 'newegg', 
    'wayfair', 'costco', 'homedepot', 'lowes', 'aliexpress', 'temu', 
    'rakuten', 'macys', 'kohls', 'etsy', 'zappos', 'chewy', 'overstock',
    'shein', 'flipkart', 'dickssportinggoods', 'bhphotovideo', 'ikea',
    'sephora', 'ulta', 'nike', 'adidas', 'gamestop', 'staples', 'officedepot',
    'microcenter', 'adorama', 'banggood', 'gearbest', 'dhgate'
  ];
  
  const searchSources = message.groundingMetadata?.groundingChunks
    ? message.groundingMetadata.groundingChunks
        .filter((c: any) => {
           if (!c.web?.uri) return false;
           const hostname = new URL(c.web.uri).hostname.toLowerCase();
           return !EXCLUDED_DOMAINS.some(domain => hostname.includes(domain));
        })
        .map((c: any) => ({
            uri: c.web.uri,
            title: c.web.title,
            hostname: new URL(c.web.uri).hostname.replace(/^www\./, '')
        }))
    : [];

  const uniqueSources = Array.from(new Map(searchSources.map((s: any) => [s.uri, s])).values());
  
  // Real-time Search Logic: Combine Extracted Products (from text) + Web Search Queries (from metadata)
  
  // 1. Extract product names directly from the response text (Highest priority)
  const extractedProducts = extractProductHeaders(message.text);

  // 2. Clean and Deduplicate Web Search Queries (Grounding data)
  // We only include these if they provide value over extracted products
  const rawQueries = message.groundingMetadata?.webSearchQueries || [];
  const processedQueries = rawQueries
      .map((q: string) => cleanProductQuery(q))
      .filter((q: string) => q && q.length > 2); // Filter empty/short

  // 3. Combine Strategy
  // Start with explicitly extracted product names
  let allTerms = [...extractedProducts];
  
  // Add processed search queries ONLY if they are likely unique products and not generic categories
  // If we have no extracted products, we are more lenient with processed queries
  const hasExtracted = extractedProducts.length > 0;
  
  processedQueries.forEach((q: string) => {
     // Check if this query is already covered by an extracted product
     // e.g. if extracted has "Sony WH-1000XM5", don't add "Sony WH-1000XM5 headphones"
     const isDuplicate = allTerms.some(t => 
        t.toLowerCase().includes(q.toLowerCase()) || 
        q.toLowerCase().includes(t.toLowerCase())
     );
     
     if (!isDuplicate) {
         // If we have extracted products, skip queries that look like generic categories (single words, or no numbers)
         // unless it's a known brand pattern. This helps reduce "Best headphones" noise.
         if (hasExtracted) {
            // Heuristic: Products often have numbers or are multi-word specific names
            // If it's very short or looks generic, skip it
            if (q.split(' ').length > 1) {
                allTerms.push(q);
            }
         } else {
             // If nothing extracted, show everything we found
             allTerms.push(q);
         }
     }
  });
  
  // 4. Final Deduplication (case-insensitive)
  const uniqueQueries = allTerms.filter((item, index) => {
     return allTerms.findIndex(t => t.toLowerCase() === item.toLowerCase()) === index;
  });

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-8 animate-fade-in group`}>
      {isUser ? (
        // ================= USER MESSAGE LAYOUT =================
        <div className="flex flex-col items-end max-w-[85%] md:max-w-[75%]">
           <div className={`${isEditing ? 'bg-[#f0f4f9] p-2' : 'bg-[#f4f4f5] px-5 py-3.5'} text-[#0d0d0d] rounded-[26px] text-base leading-7 relative w-full border border-transparent transition-all duration-200`}>
             {isEditing ? (
               <div className="w-full bg-[#f0f4f9] rounded-2xl p-2">
                 <textarea 
                   ref={textareaRef}
                   value={editText}
                   onChange={(e) => setEditText(e.target.value)}
                   className="w-full bg-white text-gray-900 p-4 rounded-2xl border-2 border-blue-500 focus:outline-none focus:ring-0 resize-none min-h-[100px] text-base leading-relaxed shadow-sm font-normal overflow-hidden"
                   autoFocus
                 />
                 <div className="flex justify-center gap-3 mt-4 mb-2">
                   <button 
                     onClick={handleEditSave}
                     className="px-6 py-2.5 bg-black text-white rounded-full text-sm font-medium flex items-center gap-2 hover:bg-gray-900 transition-colors shadow-sm"
                   >
                     <Save size={16} /> Save
                   </button>
                   <button 
                     onClick={handleEditCancel}
                     className="px-6 py-2.5 bg-[#e5e7eb] text-gray-700 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-[#d1d5db] transition-colors"
                   >
                     <X size={16} /> Cancel
                   </button>
                 </div>
               </div>
             ) : (
               <div className="prose prose-slate max-w-none">
                  <MarkdownRenderer content={message.text} isUser={true} />
               </div>
             )}
           </div>
           
           {/* User Actions */}
           {!isEditing && !message.isStreaming && (
            <div className="flex items-center gap-2 mt-1 mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
               {onEdit && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    title="Edit message"
                  >
                    <Pencil size={14} />
                  </button>
               )}
               <button 
                  onClick={handleToggleSave}
                  className={`p-1.5 rounded-md transition-colors ${isSaved ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100'}`}
                  title={isSaved ? "Remove from saved" : "Save search"}
               >
                  <Star size={14} className={isSaved ? 'fill-current' : ''} />
               </button>
               <button 
                  onClick={handleCopy}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  title="Copy text"
               >
                  {isCopied ? <Check size={14} /> : <Copy size={14} />}
               </button>
            </div>
           )}
        </div>
      ) : (
        // ================= MODEL MESSAGE LAYOUT =================
        // Flex Column: Icon on Top, Content Below
        <div className="flex flex-col items-start w-full max-w-none">
           
           {/* AI Icon Header - Positioned above the content */}
           <div className="flex items-center gap-2 mb-2 select-none">
               <div className={`w-6 h-6 flex items-center justify-center ${message.isStreaming ? 'animate-pulse' : ''}`}>
                  <Sparkles size={24} className={`${message.isStreaming ? 'text-blue-600' : 'text-[#4285f4]'} fill-blue-50`} />
               </div>
               <span className={`text-sm font-medium ${
                 message.isStreaming 
                   ? 'bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer' 
                   : 'text-gray-500'
               }`}>
                 Best-Sellers AI
               </span>
           </div>

           {/* Content Area - No bubble background, just clean text */}
           <div className="w-full pl-0 text-[#1f1f1f] text-base leading-relaxed">
             
             <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-p:text-[#1f1f1f] prose-a:text-blue-600">
                <MarkdownRenderer content={message.text} isUser={false} />
             </div>

             {/* Suggestions (Welcome Message) */}
             {message.suggestions && message.suggestions.length > 0 && (
               <div className="mt-6 space-y-2">
                 {message.suggestions.map((suggestion, index) => (
                   <div key={index} className="flex items-center justify-between p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all group/item cursor-pointer shadow-sm" onClick={() => onSuggestionClick?.(suggestion)}>
                     <span className="text-sm text-gray-700 font-medium text-left flex-1 hover:text-blue-600 flex items-center gap-2">
                        {suggestion}
                     </span>
                     <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopySuggestion(suggestion, index);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                        title="Copy text"
                      >
                        {copiedSuggestionIndex === index ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                   </div>
                 ))}
               </div>
             )}

             {/* Grounding Sources & Real-time Search */}
             {!isEditing && (uniqueSources.length > 0 || uniqueQueries.length > 0) && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  
                  {/* Search Queries - Showing Extracted Products */}
                  {uniqueQueries.length > 0 && (
                     <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                           <Search size={12} /> Real-time Search
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {uniqueQueries.map((productQuery: string, idx: number) => {
                             return (
                               <a 
                                 key={idx} 
                                 href={`https://www.amazon.com/s?k=${encodeURIComponent(productQuery)}&tag=${AFFILIATE_TAG}`}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 hover:bg-[#FF9900]/10 hover:text-[#FF9900] hover:border-[#FF9900]/30 transition-all decoration-0"
                               >
                                  <ShoppingBag size={10} className="opacity-50" />
                                  <span>{productQuery}</span>
                               </a>
                             );
                          })}
                        </div>
                     </div>
                  )}

                  {/* Sources Cards */}
                  {uniqueSources.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <Globe size={12} /> Sources
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        {uniqueSources.map((source: any, i: number) => (
                            <a 
                              key={i} 
                              href={source.uri} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-blue-300 transition-all group/link text-left relative"
                            >
                              <div className="mt-0.5 bg-blue-50 p-1.5 rounded-lg text-blue-600 flex-shrink-0">
                                 <ExternalLink size={14} />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <div className="text-sm font-semibold text-gray-800 truncate group-hover/link:text-blue-700 pr-4">
                                    {source.title || source.hostname}
                                 </div>
                                 <div className="text-xs text-gray-400 truncate mt-0.5 font-medium">
                                    {source.hostname}
                                 </div>
                              </div>
                            </a>
                        ))}
                      </div>
                    </>
                  )}
                </div>
             )}
           </div>

           {/* Model Actions (Copy, Try Again, Share) */}
           {!isWelcome && !message.isStreaming && (
             <div className="mt-2 flex items-center gap-2">
                <button 
                  onClick={handleCopy}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  title="Copy text"
                >
                  {isCopied ? <Check size={16} /> : <Copy size={16} />}
                </button>

                {onRegenerate && (
                  <button 
                    onClick={handleRegenerate}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    title="Try Again"
                  >
                    <RefreshCw size={16} />
                  </button>
                )}

                <button 
                  onClick={handleShare}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  title="Share"
                >
                  <Share size={16} />
                </button>
             </div>
           )}
        </div>
      )}

      {/* Share Modal */}
      <ShareModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
        url={window.location.href}
        text={message.text}
      />
    </div>
  );
};