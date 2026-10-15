import React, { useState } from 'react';
import {
  X,
  FileText,
  Rocket,
  CheckCircle2,
  Calendar,
  Building,
  Users,
  ExternalLink,
  Download,
  Send,
  Copy,
  Check,
  Share2
} from 'lucide-react';
import type { ProjectOrStartup } from '../types';
import { getShareUrl, shareToTelegram, copyShareLink } from '../lib/shareUtils';
import { AutoLinkedText } from './AutoLinkedText';

interface Props {
  isOpen: boolean;
  project: ProjectOrStartup | null;
  onClose: () => void;
  onOpenPdf?: (url: string, name?: string, size?: number, title?: string) => void;
  onNotify?: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const PublicProjectModal: React.FC<Props> = ({
  isOpen,
  project,
  onClose,
  onOpenPdf,
  onNotify,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !project) return null;

  const isStartup = project.type === 'startap';
  const shareUrl = getShareUrl('project', project.id);

  const handleCopyLink = async () => {
    const success = await copyShareLink(shareUrl);
    if (success) {
      setCopiedLink(true);
      if (onNotify) {
        onNotify('success', 'Loyiha havolasi nusxalandi!');
      }
      setTimeout(() => setCopiedLink(false), 2500);
    } else if (onNotify) {
      onNotify('error', 'Havolani nusxalashda xatolik yuz berdi.');
    }
  };

  const handleShareTelegram = () => {
    shareToTelegram({
      title: project.title,
      url: shareUrl,
      category: isStartup ? 'Startap ishlanma' : 'Ilmiy tadqiqot loyihasi',
      details: [
        `🎓 Yo‘nalish: ${project.field || 'TKTI Yangiyer filiali'}`,
        `👥 Muallif: ${project.authorNames || project.studentName || 'Talabalar'}`,
        `✅ Holati: ${project.status || 'Tasdiqlangan'}`,
      ],
      extraText: project.description ? project.description.slice(0, 180) + '...' : '',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                  isStartup
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}
              >
                {isStartup ? 'Startap ishlanma' : 'Ilmiy tadqiqot loyihasi'}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Tasdiqlangan</span>
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 leading-snug">
              {project.title}
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

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Metadata Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 block font-semibold">Ta'lim yo‘nalishi</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Building className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                <span>{project.field || 'Belgilanmagan'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 block font-semibold">Mualliflar</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Users className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>{project.authorNames || project.studentName}</span>
              </div>
            </div>

            <div className="space-y-1 sm:col-span-2 pt-1 border-t border-slate-200/60">
              <span className="text-slate-400 block font-semibold">Yaratilgan sana</span>
              <div className="flex items-center gap-1.5 font-mono text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{project.createdAt ? project.createdAt.slice(0, 10) : '—'}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Loyiha tavsifi va maqsadi
            </h4>
            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              <AutoLinkedText text={project.description} />
            </div>
          </div>

          {/* Attached Document (if public fileUrl exists) */}
          {project.fileUrl && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {project.fileName || 'Loyiha hujjati (PDF)'}
                  </p>
                  <p className="text-[10px] text-slate-500">Ilova qilingan rasmiy fayl</p>
                </div>
              </div>

              {onOpenPdf ? (
                <button
                  type="button"
                  onClick={() =>
                    onOpenPdf(
                      project.fileUrl!,
                      project.fileName || project.title,
                      project.fileSize,
                      project.title
                    )
                  }
                  className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer"
                >
                  Ko‘rish
                </button>
              ) : (
                <a
                  href={project.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors inline-flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Yuklab olish</span>
                </a>
              )}
            </div>
          )}

          {/* Deep link & Telegram Share Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50/70 to-blue-50/70 border border-sky-100/90 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
                <Share2 className="w-3.5 h-3.5 text-sky-700" />
                <span>Loyiha havolasini ulashish</span>
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
