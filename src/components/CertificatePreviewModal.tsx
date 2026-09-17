import React from 'react';
import { X, Award, Download, ShieldCheck } from 'lucide-react';
import type { CertificateItem } from '../types';
import { CertificateLivePreview } from './CertificateLivePreview';
import { downloadCertificatePdf } from '../lib/certificateGenerator';

interface CertificatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: CertificateItem | null;
}

export const CertificatePreviewModal: React.FC<CertificatePreviewModalProps> = ({
  isOpen,
  onClose,
  certificate,
}) => {
  if (!isOpen || !certificate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>{certificate.title || 'Diplom'}</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                  {certificate.certificateNumber}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Talaba: <strong className="text-slate-200">{certificate.studentName}</strong> • Sana: {certificate.issueDate}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            title="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 bg-slate-950">
          <CertificateLivePreview
            data={certificate}
            onDownload={() => downloadCertificatePdf(certificate)}
            showActions={true}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Rasmiy QR-kodli elektron verifikatsiya orqali tasdiqlangan hujjat</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
