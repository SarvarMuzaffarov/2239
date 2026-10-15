import React from 'react';
import { ExternalLink, Send } from 'lucide-react';

interface AutoLinkedTextProps {
  text: string;
  className?: string;
  linkClassName?: string;
}

/**
 * Parses plain text and converts any web URLs (http, https, www, t.me, @telegram)
 * into real, clickable, secure hyperlinks.
 */
export const AutoLinkedText: React.FC<AutoLinkedTextProps> = ({
  text,
  className = '',
  linkClassName = '',
}) => {
  if (!text) return null;

  // Regex matches:
  // 1) http:// or https:// URLs
  // 2) www. URLs
  // 3) t.me/... Telegram URLs
  // 4) @username Telegram handles
  // 5) Common domains ending with .uz, .edu, .gov, .org, .com
  const urlRegex = /(https?:\/\/[^\s<>"'\])]+|www\.[a-zA-Z0-9-]+\.[^\s<>"'\])]+|t\.me\/[a-zA-Z0-9_+/]+|@[a-zA-Z0-9_]{3,32}|(?:[a-zA-Z0-9-]+\.)+(?:uz|com|org|edu|gov|net|io)(?:\/[^\s<>"'\])]*)?)/gi;

  const parts = text.split(urlRegex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (!part) return null;

        // Reset regex state for match test
        urlRegex.lastIndex = 0;
        const isUrl = urlRegex.test(part);
        urlRegex.lastIndex = 0;

        if (isUrl) {
          let href = part;
          let isTelegramHandle = false;

          // Normalize protocol
          if (part.startsWith('@')) {
            isTelegramHandle = true;
            href = `https://t.me/${part.slice(1)}`;
          } else if (part.startsWith('www.')) {
            href = `https://${part}`;
          } else if (part.startsWith('t.me/')) {
            href = `https://${part}`;
          } else if (!part.startsWith('http://') && !part.startsWith('https://')) {
            href = `https://${part}`;
          }

          // Clean trailing punctuation attached to sentence ends (.,;:!?)"'\]>
          const trailingMatch = href.match(/([.,;:!?)"'\]>]+)$/);
          let cleanHref = href;
          let trailingPunctuation = '';
          if (trailingMatch) {
            trailingPunctuation = trailingMatch[0];
            cleanHref = href.slice(0, -trailingPunctuation.length);
          }

          const displayLabel = part.slice(0, part.length - trailingPunctuation.length);

          return (
            <React.Fragment key={index}>
              <a
                href={cleanHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => {
                  e.stopPropagation();
                }}
                className={`inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-3 decoration-blue-300 hover:decoration-blue-700 hover:bg-blue-50/70 px-1 py-0.5 rounded transition-all cursor-pointer break-all ${linkClassName}`}
                title={`Havolani ochish: ${cleanHref}`}
              >
                <span>{displayLabel}</span>
                {isTelegramHandle || cleanHref.includes('t.me') ? (
                  <Send className="w-3 h-3 inline-block shrink-0 opacity-75 ml-0.5 text-sky-600" />
                ) : (
                  <ExternalLink className="w-3 h-3 inline-block shrink-0 opacity-75 ml-0.5 text-blue-600" />
                )}
              </a>
              {trailingPunctuation}
            </React.Fragment>
          );
        }

        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
};
