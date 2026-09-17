import React, { useState } from 'react';
import { X, ShieldAlert, AlertCircle, Ban } from 'lucide-react';
import { revokeCertificate } from '../../services/firestoreService';
import type { CertificateItem, UserAccount } from '../../types';

interface Props {
  isOpen: boolean;
  certificate: CertificateItem | null;
  actor: UserAccount;
  onSuccess: () => void;
  onClose: () => void;
}

export const RevokeCertificateModal: React.FC<Props> = ({
  isOpen,
  certificate,
  actor,
  onSuccess,
  onClose,
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !certificate) return null;

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!reason.trim()) {
      setError("Bekor qilish sababini ko‘rsatish shart!");
      return;
    }

    setLoading(true);
    try {
      await revokeCertificate(certificate.id, reason.trim(), {
        id: actor.id,
        fullName: actor.fullName,
        role: actor.role,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Bekor qilishda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-100 text-rose-800 rounded-xl">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Sertifikatni Bekor Qilish</h3>
              <p className="text-xs text-slate-500">Rasmiy maqomini REVOKED holatiga o‘tkazish</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 mb-4 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Hujjat ID:</span>
            <span className="font-mono font-bold text-rose-950">{certificate.certificateNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Talaba:</span>
            <span className="font-semibold text-slate-900">{certificate.studentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tadbir:</span>
            <span className="text-slate-800">{certificate.eventTitle}</span>
          </div>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed mb-4 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>Muhim:</strong> Sertifikat o‘chirilmaydi, balki ma’lumotlar bazasida <strong>REVOKED</strong> (Bekor qilingan) sifatida saqlanadi. QR-kod orqali tekshirilganda bekor qilinganligi ko‘rsatiladi.
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRevoke} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Bekor qilish sababi *
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Masalan: Ma’lumotlar noto‘g‘ri taqdim etilganligi yoki nizom talablari buzilganligi sababli bekor qilindi..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
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
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Ban className="w-3.5 h-3.5" />
              {loading ? "Jarayonda..." : "Sertifikatni bekor qilish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
