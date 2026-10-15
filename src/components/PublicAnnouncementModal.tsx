import React, { useState } from 'react';
import { X, Calendar, User, Bell, Send, Copy, Check, Share2 } from 'lucide-react';
import type { Announcement } from '../types';
import { getShareUrl, shareToTelegram, copyShareLink } from '../lib/shareUtils';
import { AutoLinkedText } from './AutoLinkedText';

interface Props {
  isOpen: boolean;
  announcement: Announcement | null;
  onClose: () => void;
  onNotify?: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const PublicAnnouncementModal: React.FC<Props> = ({
  isOpen,
  announcement,
  onClose,
  onNotify,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !announcement) return null;

  const shareUrl = getShareUrl('announcement', announcement.id);

  const handleCopyLink = async () => {
    const success = await copyShareLink(shareUrl);
    if (success) {
      setCopiedLink(true);
      if (onNotify) {
        onNotify('success', 'E\'lonning to‘g‘ridan-to‘g‘ri havolasi nusxalandi!');
      }
      setTimeout(() => setCopiedLink(false), 2500);
    } else if (onNotify) {
      onNotify('error', 'Havolani nusxalashda xatolik yuz berdi.');
    }
  };

  const handleShareTelegram = () => {
    shareToTelegram({
      title: announcement.title,
      url: shareUrl,
      category: `E'lon (${announcement.audience || 'Umumiy'})`,
      details: [
        `📅 Sana: ${announcement.date}`,
        `👤 Muallif: ${announcement.createdByName || 'Filial ma\'muriyati'}`,
      ],
      extraText: announcement.content ? announcement.content.slice(0, 200) + '...' : '',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-900 border border-blue-100">
              {announcement.audience || 'Umumiy e\'lon'}
            </span>
            <h3 className="text-lg font-bold text-slate-900 leading-snug">
              {announcement.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-900" />
              <span>Sana: {announcement.date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{announcement.createdByName || 'Ma\'muriyat'}</span>
            </div>
          </div>

          <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
            <AutoLinkedText
              text={announcement.content}
              className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line block"
            />
          </div>

          {/* Deep link & Telegram Share Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50/70 to-blue-50/70 border border-sky-100/90 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
                <Share2 className="w-3.5 h-3.5 text-sky-700" />
                <span>E'lon havolasini ulashish</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Telegram kanal yoki guruhlar uchun</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div
                className="flex-1 px-3 py-2 bg-white rounded-xl border border-slate-200 text-[11px] font-mono text-slate-600 truncate select-all"
                title={shareUrl}
              >
                {shareUrl}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    copiedLink
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                  title="Havoladan nusxa olish"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                  <span>{copiedLink ? 'Nusxalandi!' : 'Nusxalash'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareTelegram}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
                  title="Telegramga yuborish"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Telegramda ulashish</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition-colors shadow-2xs"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
