import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingBag, MessageCircle, Star, Heart, Info, ExternalLink, ChevronDown, ChevronRight, MessageSquare, Trash2, History, Sparkles, Bookmark, Edit, Settings } from 'lucide-react';
import { APP_NAME, NAV_LINKS, AMAZON_CATEGORIES, AMAZON_SHOP_LINK } from '../constants';
import { getChatHistory, deleteChatSession } from '../services/chatHistoryService';
import { getSavedQueries, removeQuery, SavedQuery } from '../services/savedQueryService';
import { ChatSession } from '../types';
import { SettingsModal } from './SettingsModal';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [recentChats, setRecentChats] = useState<ChatSession[]>([]);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get current chat ID from URL if present
  const query = new URLSearchParams(location.search);
  const currentChatId = query.get('chatId');

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Load chat history and saved queries
  useEffect(() => {
    setRecentChats(getChatHistory());
    setSavedQueries(getSavedQueries());
    
    const handleHistoryUpdate = () => {
      setRecentChats(getChatHistory());
    };

    const handleSavedQueriesUpdate = () => {
      setSavedQueries(getSavedQueries());
    };

    window.addEventListener('chat-history-updated', handleHistoryUpdate);
    window.addEventListener('saved-queries-updated', handleSavedQueriesUpdate);
    
    return () => {
      window.removeEventListener('chat-history-updated', handleHistoryUpdate);
      window.removeEventListener('saved-queries-updated', handleSavedQueriesUpdate);
    };
  }, []);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => 
        prev.includes(categoryName) 
            ? prev.filter(c => c !== categoryName) 
            : [...prev, categoryName]
    );
  };

  const handleSubcategoryClick = (category: string, subcategory: string) => {
    navigate(`/?q=${encodeURIComponent(`Best selling ${subcategory} in ${category}`)}`);
    setIsMobileMenuOpen(false);
  };

  const handleSavedQueryClick = (text: string) => {
    navigate(`/?q=${encodeURIComponent(text)}`);
    setIsMobileMenuOpen(false);
  };

  const handleDeleteSavedQuery = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeQuery(id);
  };

  const handleNewChat = () => {
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const handleChatClick = (chatId: string) => {
    navigate(`/?chatId=${chatId}`);
    setIsMobileMenuOpen(false);
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    e.preventDefault();
    deleteChatSession(chatId);
    if (currentChatId === chatId) {
      navigate('/');
    }
  };

  const getIcon = (path: string) => {
    const size = 20; // Slightly larger for Material 3 feel
    switch (path) {
      case '/': return <MessageCircle size={size} />;
      case '/reviews': return <Star size={size} />;
      case '/wishlist': return <Heart size={size} />;
      case '/about': return <Info size={size} />;
      default: return null;
    }
  };

  // Defined as a variable instead of a component to prevent remounting/scroll reset issues
  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#f0f4f9]"> {/* Gemini Sidebar Background */}
      {/* Header */}
      <div className="p-4 pb-2 flex-shrink-0">
        <div className="flex items-center justify-between mb-6 px-2 group">
           {/* Logo Area - minimal */}
           <Link to="/" className="flex items-center gap-2 text-[#444746] hover:text-black transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
             <Sparkles className="w-5 h-5 text-blue-600" />
             <span className="font-medium text-lg tracking-tight">
               {APP_NAME}
             </span>
           </Link>
           
           {/* Mobile Close Button */}
           <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-[#444746]">
             <X size={24} />
           </button>
        </div>

        {/* New Chat Button */}
        <button 
          onClick={handleNewChat}
          className="flex items-center gap-3 w-full px-4 py-3 bg-[#dfe4ea] hover:bg-[#d3d7db] rounded-full text-sm text-[#444746] transition-colors shadow-sm mb-2"
        >
          <Edit size={18} />
          <span className="font-medium">New chat</span>
        </button>
      </div>

      {/* Scroll Area */}
      <div className="flex-1 relative min-h-0">
        <div 
          ref={sidebarScrollRef}
          className="absolute inset-0 overflow-y-auto px-3 pb-2"
        >
          
          {/* Saved Queries Section */}
          {savedQueries.length > 0 && (
            <div className="py-2 mb-2">
               <div className="text-[11px] font-bold text-[#444746] px-4 py-2 flex items-center justify-between">
                  <span>Saved</span>
                  <span className="bg-blue-100 text-blue-700 py-0.5 px-1.5 rounded text-[10px] min-w-[20px] text-center">{savedQueries.length}</span>
               </div>
               <div className="space-y-1">
                 {savedQueries.map(query => (
                   <div 
                     key={query.id}
                     onClick={() => handleSavedQueryClick(query.text)}
                     className="group flex items-center justify-between px-4 py-2 text-sm text-[#444746] hover:bg-[#e1e5ea] rounded-full cursor-pointer transition-colors"
                   >
                     <div className="flex items-center gap-3 overflow-hidden">
                        <Bookmark size={16} className="flex-shrink-0 text-yellow-500 fill-yellow-500" />
                        <span className="truncate">{query.text}</span>
                     </div>
                     <button
                        onClick={(e) => handleDeleteSavedQuery(e, query.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 text-gray-500 transition-all"
                        title="Remove"
                     >
                       <Trash2 size={14} />
                     </button>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {/* Recent Chats Section */}
          {recentChats.length > 0 && (
            <div className="py-2 mb-2">
               <div className="text-[11px] font-bold text-[#444746] px-4 py-2">
                  Recent
               </div>
               <div className="space-y-1">
                 {recentChats.map(chat => (
                   <div 
                     key={chat.id}
                     onClick={() => handleChatClick(chat.id)}
                     className={`group flex items-center justify-between px-4 py-2 text-sm rounded-full cursor-pointer transition-colors ${
                       currentChatId === chat.id 
                          ? 'bg-[#c2e7ff] text-[#001d35] font-medium' // Gemini Active State
                          : 'text-[#444746] hover:bg-[#e1e5ea]'
                     }`}
                   >
                     <div className="flex items-center gap-3 overflow-hidden">
                        <MessageSquare size={16} className="flex-shrink-0 opacity-70" />
                        <span className="truncate">{chat.title}</span>
                     </div>
                     <button
                        onClick={(e) => handleDeleteChat(e, chat.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 text-gray-500 transition-all"
                        title="Delete Chat"
                     >
                       <Trash2 size={14} />
                     </button>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {/* Categories Section */}
          <div className="py-2">
             <div className="text-[11px] font-bold text-[#444746] px-4 py-2">
                Categories
             </div>
             <div className="space-y-1">
               {AMAZON_CATEGORIES.map(cat => {
                  const isExpanded = expandedCategories.includes(cat.name);
                  return (
                    <div key={cat.name}>
                       <button
                          onClick={() => toggleCategory(cat.name)}
                          className={`w-full flex items-center justify-between px-4 py-2 text-sm text-[#444746] hover:bg-[#e1e5ea] rounded-full transition-colors group ${isExpanded ? 'bg-[#e1e5ea]' : ''}`}
                       >
                          <span className="truncate">{cat.name}</span>
                          {isExpanded ? <ChevronDown size={16} className="opacity-70" /> : <ChevronRight size={16} className="opacity-70" />}
                       </button>
                       {isExpanded && (
                          <div className="pl-4 py-1 space-y-1 mt-1">
                            {cat.subcategories.map(sub => (
                              <button
                                key={sub}
                                onClick={() => handleSubcategoryClick(cat.name, sub)}
                                className="w-full text-left px-4 py-2 text-xs text-[#444746] hover:bg-[#c2e7ff] hover:text-[#001d35] rounded-full truncate transition-colors border-l-2 border-gray-200 ml-2"
                              >
                                {sub}
                              </button>
                            ))}
                          </div>
                       )}
                    </div>
                  );
               })}
             </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="flex-shrink-0 bg-[#f0f4f9] pt-2 pb-4 px-3">
        
        {/* Main Navigation */}
        <div className="space-y-1 mb-4">
          {NAV_LINKS.filter(l => l.path !== '/').map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-sm transition-colors ${
                location.pathname === link.path 
                  ? 'bg-[#c2e7ff] text-[#001d35] font-medium' 
                  : 'text-[#444746] hover:bg-[#e1e5ea]'
              }`}
            >
              {getIcon(link.path)}
              <span>{link.label}</span>
            </Link>
          ))}
          
          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm transition-colors text-[#444746] hover:bg-[#e1e5ea]"
          >
             <Settings size={20} />
             <span>Settings</span>
          </button>
        </div>

        {/* Shop Button */}
        <div className="px-2 mb-3">
          <a 
            href={AMAZON_SHOP_LINK} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-md rounded-full transition-all"
          >
            <ShoppingBag size={18} />
            <span>Shop Amazon</span>
          </a>
        </div>

        {/* Links */}
        <div className="px-4 flex items-center gap-3 text-[11px] text-[#444746]">
             <Link to="/privacy" className="hover:underline">Privacy</Link>
             <span>•</span>
             <Link to="/terms" className="hover:underline">Terms</Link>
        </div>
      </div>
    </div>
  );

  const isChatPage = location.pathname === '/';

  return (
    <div className="flex h-[100dvh] bg-white overflow-hidden font-sans text-[#1f1f1f]">
      
      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:relative z-50 h-full bg-[#f0f4f9] border-r border-white md:border-none w-[280px] flex-shrink-0 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {sidebarContent}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        
        {/* Mobile Header - Clean Gemini Style */}
        <header className="md:hidden flex items-center justify-between px-4 h-16 bg-white flex-shrink-0 z-30">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-[#444746] hover:bg-[#f0f4f9] rounded-full transition-colors"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-2" onClick={handleNewChat}>
             <Sparkles className="w-5 h-5 text-blue-600" />
             <span className="font-medium text-lg text-[#444746]">{APP_NAME}</span>
          </div>
          
          <button 
            onClick={handleNewChat}
            className="p-2 -mr-2 text-[#444746] hover:bg-[#f0f4f9] rounded-full transition-colors"
          >
            <Edit size={24} />
          </button>
        </header>

        {/* Content Container */}
        <div className="flex-1 relative w-full overflow-hidden">
          <div className={`absolute inset-0 ${isChatPage ? 'overflow-hidden' : 'overflow-y-auto'}`}>
             {children}
          </div>
        </div>

      </main>
    </div>
  );
};