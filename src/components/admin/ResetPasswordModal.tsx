import React, { useState } from 'react';
import { X, KeyRound, Eye, EyeOff, ShieldAlert, Sparkles, Check, AlertCircle } from 'lucide-react';
import { resetUserPassword } from '../../services/authService';
import { validatePasswordStrength } from '../../lib/crypto';
import type { UserAccount, UserRole } from '../../types';

interface Props {
  isOpen: boolean;
  targetUser: {
    id: string;
    fullName: string;
    phone: string;
    role: UserRole;
  } | null;
  actor: UserAccount;
  onSuccess: () => void;
  onClose: () => void;
}

export const ResetPasswordModal: React.FC<Props> = ({
  isOpen,
  targetUser,
  actor,
  onSuccess,
  onClose,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !targetUser) return null;

  const passwordStrength = validatePasswordStrength(newPassword);

  const generateRandomPassword = () => {
    // Generate secure 12-character password with letters, numbers, and special chars
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnpqrstuvwxyz';
    const digits = '23456789';
    const special = '!@#$%&*';
    
    let res = '';
    res += upper.charAt(Math.floor(Math.random() * upper.length));
    res += lower.charAt(Math.floor(Math.random() * lower.length));
    res += digits.charAt(Math.floor(Math.random() * digits.length));
    res += special.charAt(Math.floor(Math.random() * special.length));
    
    const all = upper + lower + digits + special;
    for (let i = 0; i < 8; i++) {
      res += all.charAt(Math.floor(Math.random() * all.length));
    }
    
    // Shuffle
    const shuffled = res.split('').sort(() => 0.5 - Math.random()).join('');
    setNewPassword(shuffled);
    setConfirmPassword(shuffled);
    setShowPassword(true);
    setError('');
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      setError(validation.errors.join(' '));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Parollar bir-biriga mos kelmadi!");
      return;
    }

    setLoading(true);
    try {
      await resetUserPassword(
        targetUser.id,
        newPassword,
        {
          id: actor.id,
          fullName: actor.fullName,
          role: actor.role,
        },
        targetUser.phone,
        targetUser.fullName,
        targetUser.role
      );

      setSuccessMsg("Parol muvaffaqiyatli yangilandi va xavfsiz shifrlab saqlandi!");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Parolni yangilashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Parolni Yangilash</h3>
              <p className="text-xs text-slate-500">Xavfsiz parolni qayta tiklash</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 mb-4 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Foydalanuvchi:</span>
            <span className="font-bold text-slate-900">{targetUser.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Telefon raqam:</span>
            <span className="font-mono text-slate-800">{targetUser.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Roli:</span>
            <span className="font-semibold text-emerald-800 uppercase">{targetUser.role}</span>
          </div>
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

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">Yangi parol</label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-medium inline-flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Generatsiya qilish
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Kamida 8 ta belgi, harf va raqam"
                required
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPassword && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full flex-1 transition-all ${passwordStrength.score >= 1 ? (passwordStrength.score >= 3 ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-rose-500'}`} />
                  <div className={`h-full flex-1 transition-all ${passwordStrength.score >= 2 ? (passwordStrength.score >= 3 ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-slate-200'}`} />
                  <div className={`h-full flex-1 transition-all ${passwordStrength.score >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  <div className={`h-full flex-1 transition-all ${passwordStrength.score >= 4 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>Talab: kamida 8 ta belgi, harf va raqam</span>
                  <span className={passwordStrength.isValid ? 'text-emerald-700 font-semibold' : 'text-amber-700'}>
                    {passwordStrength.score <= 1 ? 'Oddiy' : passwordStrength.score === 2 ? 'O‘rtacha' : passwordStrength.score === 3 ? 'Yaxshi' : 'Kuchli'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Yangi parolni takrorlang
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Parolni qayta kiriting"
              required
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong>Xavfsizlik talabi:</strong> Parol PBKDF2 va SHA-256 bilan tuzlangan holda shifrlanadi. Parollar hech qachon ochiq matn (plain-text) ko‘rinishida saqlanmaydi.
            </div>
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
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs"
            >
              {loading ? "Yangilanmoqda..." : "Parolni yangilash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
