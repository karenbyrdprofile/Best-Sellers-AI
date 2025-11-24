

import React, { useState, useEffect } from 'react';
import { Heart, Copy, Check, Terminal } from 'lucide-react';
import { parseMarkdownLinks, extractProductName } from '../utils/textUtils';
import { isUrlInWishlist, toggleWishlist } from '../services/wishlistService';

interface MarkdownRendererProps {
  content: string;
  isUser?: boolean;
}

// Check if text is a generic Call-To-Action
const isGenericText = (text: string) => {
  const lower = text.toLowerCase();
  return (
    lower.includes('check') || 
    lower.includes('price') || 
    lower.includes('view') || 
    lower.includes('shop') || 
    lower.includes('buy') || 
    lower.includes('amazon') ||
    lower.includes('click') ||
    lower.includes('details') || 
    lower.includes('deal') ||
    lower.includes('here') ||
    lower === 'link'
  );
};

// Clean markdown link syntax from heading text to use as context
const cleanHeadingText = (text: string) => {
  const noLinks = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  return noLinks.replace(/^#+\s*/, '').replace(/^\d+\.\s*/, '').trim();
};

const WishlistAction: React.FC<{ name: string; url: string; size?: number }> = ({ name, url, size = 16 }) => {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isUrlInWishlist(url));
    const handleUpdate = () => setSaved(isUrlInWishlist(url));
    window.addEventListener('wishlist-updated', handleUpdate);
    return () => window.removeEventListener('wishlist-updated', handleUpdate);
  }, [url]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = toggleWishlist(name, url);
    setSaved(newState);
  };

  return (
    <button 
      onClick={handleToggle}
      className={`inline-flex items-center justify-center ml-2 p-1 rounded-full transition-all align-middle relative z-10 ${
        saved 
          ? 'text-red-500 bg-red-50' 
          : 'text-gray-300 hover:text-red-400 hover:bg-gray-50'
      }`}
      title={saved ? "Remove from Wishlist" : "Add to Wishlist"}
    >
      <Heart size={size} className={saved ? 'fill-current' : ''} />
    </button>
  );
};

const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 rounded-xl overflow-hidden border border-gray-200 bg-[#1e1e1e] shadow-md relative group">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-gray-700">
         <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
           <Terminal size={14} />
           <span className="uppercase tracking-wider">{language || 'TEXT'}</span>
         </div>
         <button 
           onClick={handleCopy} 
           className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-md hover:bg-gray-700"
           title="Copy code"
         >
           {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
         </button>
      </div>
      <div className="p-4 overflow-x-auto custom-scrollbar">
        <pre className="text-sm font-mono text-gray-200 leading-relaxed font-normal">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isUser = false }) => {
  // Parsing State
  const lines = content.split('\n');
  const blocks: { type: 'text' | 'table' | 'heading' | 'code'; content: string | string[]; level?: number; language?: string }[] = [];
  
  let currentBlock: any = null;
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // 1. Handle Code Blocks
    if (trimmedLine.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        if (currentBlock && currentBlock.type === 'code') {
          blocks.push(currentBlock);
          currentBlock = null;
        }
        inCodeBlock = false;
      } else {
        // Start of code block
        if (currentBlock) {
          blocks.push(currentBlock);
        }
        const lang = trimmedLine.slice(3).trim();
        currentBlock = {
          type: 'code',
          content: [],
          language: lang
        };
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      if (currentBlock && currentBlock.type === 'code') {
        currentBlock.content.push(line);
      }
      continue;
    }

    // 2. Handle Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2]
      });
      continue;
    }

    // 3. Handle Tables
    if (trimmedLine.startsWith('|')) {
      if (currentBlock && currentBlock.type === 'table') {
        currentBlock.content.push(line);
      } else {
        if (currentBlock) {
          blocks.push(currentBlock);
        }
        currentBlock = {
          type: 'table',
          content: [line]
        };
      }
      continue;
    }

    // 4. Default: Text Paragraphs
    if (currentBlock && currentBlock.type === 'text') {
       currentBlock.content.push(line);
    } else {
       if (currentBlock) {
         blocks.push(currentBlock);
       }
       currentBlock = {
         type: 'text',
         content: [line]
       };
    }
  }

  // Push remaining block
  if (currentBlock) {
    blocks.push(currentBlock);
  }

  // Rendering Helper: Formatted Text (Bold + Inline Code)
  const renderFormattedText = (text: string) => {
    // 1. Split by inline code `...`
    const codeParts = text.split(/(`[^`]+`)/g);
    return codeParts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`')) {
            const codeContent = part.slice(1, -1);
            if (!codeContent) return null;
            return <code key={i} className="bg-gray-100 text-pink-600 rounded px-1.5 py-0.5 font-mono text-[0.9em] font-medium border border-gray-200">{codeContent}</code>;
        }
        
        // 2. Split by bold **...**
        const boldParts = part.split(/(\*\*.*?\*\*)/g);
        return boldParts.map((subPart, j) => {
            if (subPart.startsWith('**') && subPart.endsWith('**')) {
                return <strong key={`${i}-${j}`} className="font-bold text-gray-900">{subPart.slice(2, -2)}</strong>;
            }
            return subPart;
        });
    });
  };

  // Rendering Helper: Rich Text (Links + Formatting + Images)
  const renderRichText = (text: string, keyPrefix: string, iconSize: number = 16, contextHeading?: string) => {
    const segments = parseMarkdownLinks(text);

    return (
      <React.Fragment key={keyPrefix}>
        {segments.map((segment, index) => {
          // Skip rendering images
          if (segment.type === 'image') {
            return null;
          }

          if (segment.type === 'link') {
            const urlName = segment.url ? extractProductName(segment.url) : null;
            let wishlistName = segment.content;
            
            if (urlName) {
               wishlistName = urlName;
            } else if (contextHeading && isGenericText(segment.content)) {
               wishlistName = contextHeading;
            }

            return (
              <span key={`${keyPrefix}-${index}`} className="inline-flex items-center align-middle">
                <a
                  href={segment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline hover:text-blue-700 transition-colors font-medium"
                >
                  {segment.content}
                </a>
                {!isUser && segment.url && (
                  <WishlistAction name={wishlistName} url={segment.url} size={iconSize} />
                )}
              </span>
            );
          }
          
          return (
             <span key={`${keyPrefix}-${index}`}>
                {renderFormattedText(segment.content)}
             </span>
          );
        })}
      </React.Fragment>
    );
  };

  const renderHeading = (text: string, level: number, key: string, contextHeading: string) => {
    const Tag = `h${level}` as React.ElementType;
    const cleanText = text.replace(/^#+\s/, '');

    const styles = {
      1: 'text-3xl sm:text-4xl font-extrabold mt-8 mb-4 text-gray-900 tracking-tight leading-tight border-b border-gray-100 pb-2',
      2: 'text-2xl sm:text-3xl font-bold mt-8 mb-4 text-gray-800 leading-snug tracking-tight',
      3: 'text-xl sm:text-2xl font-bold mt-6 mb-3 text-gray-800 leading-snug flex items-center gap-2',
      4: 'text-lg sm:text-xl font-semibold mt-5 mb-2 text-gray-800',
      5: 'text-base font-bold mt-4 mb-2 text-gray-700 uppercase tracking-wide',
      6: 'text-sm font-bold mt-4 mb-1 text-gray-600 uppercase tracking-wider border-l-4 border-gray-200 pl-2',
    }[level] || 'font-bold';

    return React.createElement(Tag, { className: styles, key }, renderRichText(cleanText, `h-content-${key}`, 24, contextHeading));
  };

  const renderText = (text: string, key: string, contextHeading?: string) => {
    if (text.trim() === '') return <div key={key} className="h-2"></div>;
    return (
      <div key={key} className="mb-3 last:mb-0 leading-7 text-gray-800 break-words">
        {renderRichText(text, key, 16, contextHeading)}
      </div>
    );
  };

  const renderTable = (rows: string[], blockIndex: number, contextHeading?: string) => {
    const cleanRow = (row: string) => row.trim().replace(/^\|/, '').replace(/\|$/, '');
    const splitRow = (row: string) => cleanRow(row).split('|').map(cell => cell.trim());

    const validRows = rows.filter(r => r.trim().length > 0);
    if (validRows.length < 2) return rows.map((r, i) => renderText(r, `t-${blockIndex}-${i}`, contextHeading));

    const headers = splitRow(validRows[0]);
    
    // Check if second row is a separator
    let dataRows = validRows.slice(1).map(splitRow);
    const potentialSeparator = dataRows[0];
    const isSeparator = potentialSeparator && potentialSeparator.every(cell => /^[-:| ]+$/.test(cell));
    
    if (isSeparator) {
        dataRows = dataRows.slice(1);
    }

    return (
      <div key={`table-${blockIndex}`} className="overflow-x-auto my-6 rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="p-4 font-bold whitespace-nowrap text-gray-800">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dataRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-blue-50/30 transition-colors">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="p-4 border-r border-gray-100 last:border-r-0 min-w-[140px] text-gray-700 align-top">
                    {renderRichText(cell, `td-${blockIndex}-${rowIndex}-${cellIndex}`, 16, contextHeading)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  let currentHeading = '';

  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          currentHeading = cleanHeadingText(block.content as string);
          return renderHeading(block.content as string, block.level || 1, `h-${index}`, currentHeading);
        }
        if (block.type === 'table') {
          return renderTable(block.content as string[], index, currentHeading);
        }
        if (block.type === 'code') {
          return <CodeBlock key={`code-${index}`} code={(block.content as string[]).join('\n')} language={block.language || ''} />;
        }
        return (block.content as string[]).map((line, i) => renderText(line, `b-${index}-${i}`, currentHeading));
      })}
    </>
  );
};
