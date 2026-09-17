import React, { useState } from 'react';
import { X, Award, Save, AlertCircle, Check } from 'lucide-react';
import { updateCertificateDetails } from '../../services/firestoreService';
import type { CertificateItem, UserAccount } from '../../types';

interface Props {
  isOpen: boolean;
  certificate: CertificateItem | null;
  actor: UserAccount;
  onSuccess: () => void;
  onClose: () => void;
}

export const CertificateEditModal: React.FC<Props> = ({
  isOpen,
  certificate,
  actor,
  onSuccess,
  onClose,
}) => {
  if (!isOpen || !certificate) return null;

  const [certNumber, setCertNumber] = useState(certificate.certificateNumber || '');
  const [docType, setDocType] = useState<'diplom' | 'sertifikat'>(certificate.documentType || 'sertifikat');
  const [title, setTitle] = useState(certificate.title || '');
  const [subtitle, setSubtitle] = useState(certificate.subtitle || '');
  const [studentName, setStudentName] = useState(certificate.studentName || '');
  const [studentDirection, setStudentDirection] = useState(certificate.studentDirection || '');
  const [eventTitle, setEventTitle] = useState(certificate.eventTitle || '');
  const [competitionName, setCompetitionName] = useState(certificate.competitionName || '');
  const [nomination, setNomination] = useState(certificate.nomination || '');
  const [description, setDescription] = useState(certificate.description || '');
  const [issueDate, setIssueDate] = useState(certificate.issueDate || '');
  const [signatoryName, setSignatoryName] = useState(certificate.signatoryName || 'Xakimov Zafar Tulyaganovich');
  const [signatoryRole, setSignatoryRole] = useState(certificate.signatoryRole || 'TKTI Yangiyer filiali direktori');
  const [confirmationText, setConfirmationText] = useState(certificate.confirmationText || '');
  const [footerText, setFooterText] = useState(certificate.footerText || '');
  const [status, setStatus] = useState(certificate.status || 'Tasdiqlangan');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!studentName.trim()) {
      setError("Talaba F.I.Sh. kiritilishi shart!");
      return;
    }

    setLoading(true);
    try {
      await updateCertificateDetails(
        certificate.id,
        {
          certificateNumber: certNumber.trim().toUpperCase(),
          documentType: docType,
          title: title.trim(),
          subtitle: subtitle.trim(),
          studentName: studentName.trim(),
          studentDirection: studentDirection.trim(),
          eventTitle: eventTitle.trim(),
          competitionName: competitionName.trim(),
          nomination: nomination.trim(),
          description: description.trim(),
          issueDate: issueDate.trim(),
          signatoryName: signatoryName.trim(),
          signatoryRole: signatoryRole.trim(),
          confirmationText: confirmationText.trim(),
          footerText: footerText.trim(),
          status,
        },
        { id: actor.id, fullName: actor.fullName, role: actor.role }
      );

      setSuccessMsg("Sertifikat ma'lumotlari muvaffaqiyatli saqlandi!");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Sertifikatni saqlashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-150 my-8">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Sertifikat / Diplomni Tahrirlash</h3>
              <p className="text-xs text-slate-500">
                Hujjat ID: <code className="font-mono text-emerald-950 font-bold">{certificate.certificateNumber}</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hujjat Raqami (ID) *
              </label>
              <input
                type="text"
                required
                value={certNumber}
                onChange={e => setCertNumber(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hujjat turi *
              </label>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              >
                <option value="sertifikat">🎓 Sertifikat</option>
                <option value="diplom">🏆 Diplom</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Taqdirlanuvchi talaba (F.I.Sh.) *
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ta’lim yo‘nalishi
              </label>
              <input
                type="text"
                value={studentDirection}
                onChange={e => setStudentDirection(e.target.value)}
                placeholder="Masalan: Kimyoviy texnologiya (ishlab chiqarish turlari bo‘yicha)"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hujjat sarlavhasi *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Masalan: SERTIFIKAT"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hujjat ost sarlavhasi (I darajali, Faol ishtirokchi)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                placeholder="Masalan: I DARAJALI DIPLOM"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tadbir / Konferensiya nomi
              </label>
              <input
                type="text"
                value={eventTitle}
                onChange={e => setEventTitle(e.target.value)}
                placeholder="Masalan: Yosh olimlar ilmiy-amaliy anjumani"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nominatsiya / Yo‘nalish
              </label>
              <input
                type="text"
                value={nomination}
                onChange={e => setNomination(e.target.value)}
                placeholder="Masalan: Eng yaxshi innovatsion loyiha"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Asosiy taqdirlash matni (Tavsif)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Taqdirlash sababi va erishilgan natija..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Berilgan sana *
              </label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={e => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hujjat holati
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              >
                <option value="Tasdiqlangan">🟢 Tasdiqlangan (Valid)</option>
                <option value="Kutilmoqda">🟡 Kutilmoqda</option>
                <option value="Rad etilgan">🔴 Rad etilgan</option>
                <option value="Bekor qilingan">🚫 Bekor qilingan (Revoked)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Imzolovchi rahbar F.I.Sh.
              </label>
              <input
                type="text"
                value={signatoryName}
                onChange={e => setSignatoryName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Imzolovchi rahbar lavozimi
              </label>
              <input
                type="text"
                value={signatoryRole}
                onChange={e => setSignatoryRole(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {loading ? "Saqlanmoqda..." : "O‘zgarishlarni saqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
