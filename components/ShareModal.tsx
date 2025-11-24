import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Check, Info, Linkedin, Facebook, Twitter } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  text: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, url, text }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareLinks = [
    {
      name: 'LinkedIn',
      icon: <Linkedin size={24} className="text-white" />,
      bg: 'bg-[#0077b5]',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    },
    {
      name: 'Facebook',
      icon: <Facebook size={24} className="text-white" />,
      bg: 'bg-[#1877f2]',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    },
    {
      name: 'X',
      icon: <Twitter size={24} className="text-white" />,
      bg: 'bg-black',
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text.substring(0, 100) + '...')}`
    },
    {
      name: 'Reddit',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
        </svg>
      ),
      bg: 'bg-[#ff4500]',
      href: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text.substring(0, 100))}`
    }
  ];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pl-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Share response</h3>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Link Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 bg-[#f0f4f9] p-2 pl-4 rounded-full border border-transparent focus-within:border-blue-500 focus-within:bg-white transition-colors">
              <div className="flex-1 min-w-0">
                 <input 
                   type="text" 
                   readOnly
                   value={url}
                   className="w-full bg-transparent border-none focus:ring-0 text-sm text-gray-600 truncate outline-none"
                 />
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-[#0b57d0] hover:bg-[#0b57d0]/90 text-white text-sm font-medium rounded-full transition-colors flex-shrink-0"
              >
                {isCopied ? <Check size={16} /> : <Copy size={16} />}
                <span>{isCopied ? 'Copied' : 'Copy link'}</span>
              </button>
            </div>
            
            <div className="flex items-start gap-2 text-xs text-gray-500 px-2">
               <Info size={14} className="mt-0.5 flex-shrink-0" />
               <p>Public links can be reshared. Share responsibly, delete anytime. If sharing with third-parties, their policies apply.</p>
            </div>
          </div>

          {/* Social Icons */}
          <div className="flex items-center justify-around pt-2 pb-2">
             {shareLinks.map((link) => (
               <a
                 key={link.name}
                 href={link.href}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="flex flex-col items-center gap-2 group"
               >
                 <div className={`w-12 h-12 ${link.bg} rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                    {link.icon}
                 </div>
                 <span className="text-xs font-medium text-gray-600">{link.name}</span>
               </a>
             ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
