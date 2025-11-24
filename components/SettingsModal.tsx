import React, { useState, useEffect } from 'react';
import { X, Save, Key, AlertCircle, CheckCircle, Lock } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [keys, setKeys] = useState({
    accessKey: '',
    secretKey: '',
    partnerTag: ''
  });
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    if (isOpen) {
      setKeys({
        accessKey: localStorage.getItem('amazon_access_key') || '',
        secretKey: localStorage.getItem('amazon_secret_key') || '',
        partnerTag: localStorage.getItem('amazon_partner_tag') || 'samsulalam08-20'
      });
      setStatus('idle');
    }
  }, [isOpen]);

  const handleSave = () => {
    setStatus('saving');
    localStorage.setItem('amazon_access_key', keys.accessKey.trim());
    localStorage.setItem('amazon_secret_key', keys.secretKey.trim());
    localStorage.setItem('amazon_partner_tag', keys.partnerTag.trim());
    
    setTimeout(() => {
      setStatus('saved');
      setTimeout(() => {
         onClose();
      }, 800);
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100 border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pl-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 text-gray-800">
             <Key size={18} className="text-orange-500" />
             <h3 className="font-bold text-lg">Amazon API Settings</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-blue-50 p-3 rounded-lg flex gap-3 items-start border border-blue-100">
             <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
             <p className="text-xs text-blue-800 leading-relaxed">
               These keys allow the AI to fetch <strong>Real-Time</strong> prices and images from Amazon. Keys are stored locally in your browser and sent only to your local backend proxy.
             </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Access Key</label>
              <input 
                type="text" 
                value={keys.accessKey}
                onChange={e => setKeys({...keys, accessKey: e.target.value})}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm font-mono transition-all"
                placeholder="AKIA..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Secret Key</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={keys.secretKey}
                  onChange={e => setKeys({...keys, secretKey: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm font-mono transition-all pr-10"
                  placeholder="Secret Key..."
                />
                <Lock size={14} className="absolute right-3 top-3.5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Partner Tag</label>
              <input 
                type="text" 
                value={keys.partnerTag}
                onChange={e => setKeys({...keys, partnerTag: e.target.value})}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm font-mono transition-all"
                placeholder="tag-20"
              />
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={status !== 'idle'}
            className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
              status === 'saved' 
                ? 'bg-green-500 text-white' 
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {status === 'saved' ? (
              <>
                <CheckCircle size={18} /> Saved Successfully
              </>
            ) : (
              <>
                <Save size={18} /> Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};