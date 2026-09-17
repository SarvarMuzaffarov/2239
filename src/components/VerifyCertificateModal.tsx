import React, { useState, useEffect } from 'react';
import { Search, CheckCircle2, XCircle, Award, Calendar, User, ShieldCheck, X, Download, Eye, Building2 } from 'lucide-react';
import { getCertificateByNumber } from '../services/firestoreService';
import type { CertificateItem } from '../types';
import { downloadCertificatePdf } from '../lib/certificateGenerator';
import { CertificatePreviewModal } from './CertificatePreviewModal';

interface Props {
  isOpen: boolean;
  initialCertId?: string;
  onClose: () => void;
}

export const VerifyCertificateModal: React.FC<Props> = ({
  isOpen,
  initialCertId = '',
  onClose,
}) => {
  const [certIdInput, setCertIdInput] = useState(initialCertId);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [certData, setCertData] = useState<CertificateItem | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (initialCertId) {
      setCertIdInput(initialCertId);
      performSearch(initialCertId);
    }
  }, [initialCertId]);

  const performSearch = async (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setErrorMessage('Iltimos, sertifikat yoki diplom raqamini kiriting.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSearched(true);
    setCertData(null);

    try {
      const result = await getCertificateByNumber(trimmed);
      if (result) {
        setCertData(result);
      } else {
        setErrorMessage(`"${trimmed}" raqamli sertifikat/diplom ma'lumotlar bazasidan topilmadi.`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Tekshirishda xatolik yuz berdi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(certIdInput);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Sertifikat / Diplomni tekshirish</h3>
                <p className="text-xs text-slate-500">QR-kod yoki unikal ID orqali rasmiy verifikatsiya</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="mb-6">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Diplom / Sertifikat ID raqami
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Masalan: CERT-2026-0001"
                value={certIdInput}
                onChange={e => setCertIdInput(e.target.value.toUpperCase())}
                className="w-full pl-4 pr-28 py-3 text-sm font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all font-bold text-emerald-950"
              />
              <button
                type="submit"
                disabled={isLoading || !certIdInput.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                {isLoading ? (
                  <span>Tekshirilmoqda...</span>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Tekshirish</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Verification Result */}
          {searched && !isLoading && (
            <div>
              {certData ? (
                <div
                  className={`p-5 rounded-2xl border ${
                    certData.isRevoked || certData.status === 'Bekor qilingan'
                      ? 'bg-rose-50/90 border-rose-200'
                      : 'bg-emerald-50/80 border-emerald-200'
                  }`}
                >
                  <div
                    className={`flex items-center justify-between gap-2 mb-4 pb-3 border-b ${
                      certData.isRevoked || certData.status === 'Bekor qilingan'
                        ? 'border-rose-200/80'
                        : 'border-emerald-200/60'
                    }`}
                  >
                    <div
                      className={`flex items-center gap-2 font-bold text-sm ${
                        certData.isRevoked || certData.status === 'Bekor qilingan'
                          ? 'text-rose-900'
                          : 'text-emerald-900'
                      }`}
                    >
                      {certData.isRevoked || certData.status === 'Bekor qilingan' ? (
                        <>
                          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                          <span>Hujjat bekor qilingan (REVOKED)</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span>Hujjat haqiqiy (VALID) va rasmiy tasdiqlangan</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          certData.isRevoked || certData.status === 'Bekor qilingan'
                            ? 'bg-rose-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {certData.isRevoked || certData.status === 'Bekor qilingan'
                          ? '🚫 BEKOR QILINGAN'
                          : '✅ VALID'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-white">
                        {certData.documentType === 'diplom' ? '🏆 DIPLOM' : '🎓 SERTIFIKAT'}
                      </span>
                    </div>
                  </div>

                  {certData.isRevoked || certData.status === 'Bekor qilingan' ? (
                    <div className="mb-4 p-3 rounded-xl bg-rose-100/80 border border-rose-200 text-xs text-rose-950">
                      <strong className="block font-bold mb-0.5">Bekor qilish sababi:</strong>
                      <p className="italic">{certData.revokeReason || 'Ma’muriyat qaroriga muvofiq bekor qilingan.'}</p>
                      {certData.revokedAt && (
                        <p className="mt-1 text-slate-700 text-xs">
                          Bekor qilingan sana: {new Date(certData.revokedAt).toLocaleString('uz-UZ')}
                        </p>
                      )}
                    </div>
                  ) : null}

                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex items-start gap-2.5 text-slate-700">
                      <User className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-500 text-xs block">Taqdirlangan talaba:</span>
                        <strong className="text-slate-950 text-base">{certData.studentName}</strong>
                        {certData.studentDirection && (
                          <span className="text-xs text-slate-600 block mt-0.5">{certData.studentDirection}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 text-slate-700">
                      <Award className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-500 text-xs block">Hujjat nomi / Tadbir:</span>
                        <span className="text-slate-900 font-semibold block">
                          {certData.title} {certData.subtitle ? `(${certData.subtitle})` : ''}
                        </span>
                        <span className="text-slate-700 text-xs block">
                          Tadbir: {certData.eventTitle}
                        </span>
                        {certData.nomination && (
                          <span className="text-emerald-800 font-medium text-xs block mt-0.5">
                            Nominatsiya: {certData.nomination}
                          </span>
                        )}
                      </div>
                    </div>

                    {certData.description && (
                      <div className="p-3 bg-white/80 rounded-xl border border-emerald-100 text-xs text-slate-700 leading-relaxed italic">
                        "{certData.description}"
                      </div>
                    )}

                    <div className="flex items-start gap-2.5 text-slate-700">
                      <Calendar className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-500 text-xs block">Berilgan sana:</span>
                        <span className="text-slate-800 font-medium">{certData.issueDate}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 text-slate-700">
                      <Building2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-500 text-xs block">Tasdiqlagan muassasa va rahbar:</span>
                        <span className="text-slate-800 text-xs font-semibold block">
                          {certData.organizationName || 'Toshkent kimyo-texnologiya instituti Yangiyer filiali'}
                        </span>
                        <span className="text-slate-600 text-xs block">
                          {certData.signatoryName || 'Xakimov Zafar Tulyaganovich'} — {certData.signatoryRole || 'TKTI Yangiyer filiali direktori'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-emerald-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900">
                      <div>
                        <span>ID: <code className="font-mono font-bold">{certData.certificateNumber}</code></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsPreviewOpen(true)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium shadow-2xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>Ko‘rish</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadCertificatePdf(certData)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF yuklab olish</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200/80 text-center">
                  <XCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                  <h4 className="text-sm font-semibold text-rose-900 mb-1">Sertifikat topilmadi</h4>
                  <p className="text-xs text-rose-700 leading-relaxed">
                    {errorMessage || "Kiritilgan ID bo'yicha hech qanday sertifikat mavjud emas. Iltimos, raqamni to'g'ri kiritganingizni tekshiring."}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Yopish
            </button>
          </div>
        </div>
      </div>

      {isPreviewOpen && certData && (
        <CertificatePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          certificate={certData}
        />
      )}
    </>
  );
};

