import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck
} from 'lucide-react';
import type { EventItem, StudentProfile, UserAccount } from '../types';
import { registerStudentForEvent, unregisterStudentFromEvent } from '../services/firestoreService';

interface Props {
  isOpen: boolean;
  event: EventItem | null;
  currentUser: UserAccount | null;
  studentProfile: StudentProfile | null;
  onClose: () => void;
  onOpenLogin: () => void;
  onNotify: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const PublicEventModal: React.FC<Props> = ({
  isOpen,
  event,
  currentUser,
  studentProfile,
  onClose,
  onOpenLogin,
  onNotify,
}) => {
  const [isRegistering, setIsRegistering] = useState(false);

  if (!isOpen || !event) return null;

  const isStudent = currentUser?.role === 'student';
  const isRegistered = Boolean(
    studentProfile?.id && event.participantIds?.includes(studentProfile.id)
  );

  const handleToggleRegistration = async () => {
    if (!currentUser) {
      onClose();
      onOpenLogin();
      return;
    }

    if (!isStudent || !studentProfile) {
      onNotify('error', 'Faqat talabalar tadbirlarga ro‘yxatdan o‘tishi mumkin.');
      return;
    }

    setIsRegistering(true);
    try {
      if (isRegistered) {
        await unregisterStudentFromEvent(event.id, studentProfile.id);
        onNotify('info', 'Tadbirga ro‘yxatdan o‘tish bekor qilindi.');
      } else {
        await registerStudentForEvent(event.id, studentProfile.id, studentProfile);
        onNotify('success', 'Tadbirga muvaffaqiyatli ro‘yxatdan o‘tdingiz!');
      }
      onClose();
    } catch (err: any) {
      onNotify('error', err.message || 'Xatolik yuz berdi.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-900 border border-blue-100">
              {event.status}
            </span>
            <h3 className="text-xl font-bold text-slate-900 leading-snug">{event.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Key Facts */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 block font-semibold">Tadbir sanasi</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Calendar className="w-3.5 h-3.5 text-blue-900" />
                <span>{event.date}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 block font-semibold">Boshlanish vaqti</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Clock className="w-3.5 h-3.5 text-blue-900" />
                <span>{event.time || 'Belgilanmagan'}</span>
              </div>
            </div>

            <div className="space-y-1 col-span-2">
              <span className="text-slate-400 block font-semibold">O‘tkazilish manzili</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{event.location || 'TKTI Yangiyer filiali binosi'}</span>
              </div>
            </div>

            {event.deadline && (
              <div className="space-y-1 col-span-2 text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                <span className="text-rose-500 block text-[11px] font-semibold">
                  Ro‘yxatdan o‘tishning oxirgi muddati
                </span>
                <div className="flex items-center gap-1.5 font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{event.deadline}</span>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tadbir haqida batafsil ma'lumot
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Participants */}
          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <span>Ro‘yxatdan o‘tgan talabalar:</span>
            </div>
            <span className="font-bold text-slate-900">
              {event.participantIds?.length || 0} nafar
            </span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Yopish
          </button>

          {currentUser ? (
            isStudent ? (
              <button
                type="button"
                disabled={isRegistering}
                onClick={handleToggleRegistration}
                className={`w-full sm:w-auto px-5 py-2.5 text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 ${
                  isRegistered
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-blue-900 hover:bg-blue-800 text-white'
                }`}
              >
                {isRegistering ? (
                  <span>Yuklanmoqda...</span>
                ) : isRegistered ? (
                  <span>Ro‘yxatdan o‘tishni bekor qilish</span>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Tadbirga ro‘yxatdan o‘tish</span>
                  </>
                )}
              </button>
            ) : (
              <span className="text-xs text-slate-500">
                (Faqat talabalar hisobidan ro‘yxatdan o‘tiladi)
              </span>
            )
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold rounded-xl bg-blue-900 hover:bg-blue-800 text-white transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <span>Ro‘yxatdan o‘tish uchun kiring</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
