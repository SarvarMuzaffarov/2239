/**
 * Deep-linking and Social Share Utilities
 * Provides reliable shareable links for Telegram, clipboard copy, and browser history sync.
 */

export type ShareEntityType =
  | 'event'
  | 'announcement'
  | 'project'
  | 'student'
  | 'direction'
  | 'verify'
  | 'section';

/**
 * Returns a universal, permanent public URL for any entity or section.
 * Works flawlessly across Telegram, WhatsApp, SMS, and direct browser visits.
 */
export function getShareUrl(type: ShareEntityType, idOrSlug?: string): string {
  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : '';

  if (!idOrSlug) {
    return `${origin}/#${type}`;
  }

  const encodedId = encodeURIComponent(idOrSlug.trim());

  switch (type) {
    case 'event':
      return `${origin}/#event/${encodedId}`;
    case 'announcement':
      return `${origin}/#announcement/${encodedId}`;
    case 'project':
      return `${origin}/#project/${encodedId}`;
    case 'student':
      return `${origin}/#student/${encodedId}`;
    case 'direction':
      return `${origin}/#direction/${encodedId}`;
    case 'verify':
      return `${origin}/#verify/${encodedId}`;
    case 'section':
      return `${origin}/#${encodedId}`;
    default:
      return `${origin}/#${type}/${encodedId}`;
  }
}

/**
 * Copies the link to the user's clipboard safely and returns a boolean success status.
 */
export async function copyShareLink(url: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch (err) {
    console.warn('Clipboard API error, trying fallback:', err);
  }

  // Fallback for older browsers / iframe restrictions
  try {
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback clipboard copy failed:', err);
    return false;
  }
}

export interface TelegramShareOptions {
  title: string;
  url: string;
  category?: string;
  details?: string[];
  extraText?: string;
}

/**
 * Opens Telegram Web / Telegram Desktop share dialog with nicely formatted message.
 */
export function shareToTelegram(options: TelegramShareOptions): void {
  const lines: string[] = [];

  if (options.category) {
    lines.push(`📌 ${options.category.toUpperCase()}`);
    lines.push('');
  }

  lines.push(`📢 ${options.title}`);

  if (options.details && options.details.length > 0) {
    lines.push('');
    for (const d of options.details) {
      if (d && d.trim()) {
        lines.push(d.trim());
      }
    }
  }

  if (options.extraText && options.extraText.trim()) {
    lines.push('');
    lines.push(options.extraText.trim());
  }

  lines.push('');
  lines.push('🏛 Toshkent kimyo-texnologiya instituti Yangiyer filiali');
  lines.push('🎓 Iqtidorli talabalar ilmiy-innovatsion platformasi');
  lines.push('👉 Batafsil ma\'lumot va ro‘yxatdan o‘tish:');

  const fullText = lines.join('\n');
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(options.url)}&text=${encodeURIComponent(fullText)}`;

  if (typeof window !== 'undefined') {
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
  }
}
