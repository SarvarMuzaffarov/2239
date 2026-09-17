import React from 'react';
import { X, Calendar, User, Bell } from 'lucide-react';
import type { Announcement } from '../types';

interface Props {
  isOpen: boolean;
  announcement: Announcement | null;
  onClose: () => void;
}

export const PublicAnnouncementModal: React.FC<Props> = ({
  isOpen,
  announcement,
  onClose,
}) => {
  if (!isOpen || !announcement) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden my-8">
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

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Sana: {announcement.date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>{announcement.createdByName || 'Ma\'muriyat'}</span>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {announcement.content}
          </div>
        </div>

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
