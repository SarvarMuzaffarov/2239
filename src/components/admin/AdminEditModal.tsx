import React, { useState } from 'react';
import { X, UserCheck, ShieldAlert, KeyRound, Sliders, AlertCircle, Check, CheckCircle2 } from 'lucide-react';
import { createAdminUserWithPermissions, updateAdminProfile } from '../../services/authService';
import { validatePasswordStrength } from '../../lib/crypto';
import { AdminPermissionsModal } from './AdminPermissionsModal';
import { getFullAdminPermissions } from '../../lib/permissions';
import type { UserAccount, AdminPermissions } from '../../types';

interface Props {
  isOpen: boolean;
  adminToEdit?: UserAccount | null;
  actor: UserAccount;
  onSuccess: () => void;
  onClose: () => void;
}

export const AdminEditModal: React.FC<Props> = ({
  isOpen,
  adminToEdit,
  actor,
  onSuccess,
  onClose,
}) => {
  const isEditing = !!adminToEdit;

  const [fullName, setFullName] = useState(adminToEdit?.fullName || '');
  const [phone, setPhone] = useState(adminToEdit?.phone || '+998');
  const [email, setEmail] = useState(adminToEdit?.email || '');
  const [login, setLogin] = useState(adminToEdit?.login || '');
  const [position, setPosition] = useState(adminToEdit?.position || 'Boshqaruvchi admin');
  const [role, setRole] = useState<'admin' | 'superAdmin'>(
    adminToEdit?.role === 'superAdmin' ? 'superAdmin' : 'admin'
  );
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(adminToEdit ? adminToEdit.isActive : true);
  const [permissions, setPermissions] = useState<AdminPermissions>(
    adminToEdit?.permissions || getFullAdminPermissions()
  );

  const [isPermsModalOpen, setIsPermsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!fullName.trim()) {
      setError("Admin F.I.Sh. kiritilishi shart!");
      return;
    }

    if (!isEditing) {
      const pwdCheck = validatePasswordStrength(password);
      if (!pwdCheck.isValid) {
        setError("Admin paroli xavfsizlik talablariga javob bermaydi: " + pwdCheck.errors.join(' '));
        return;
      }
    }

    setLoading(true);
    try {
      if (isEditing && adminToEdit) {
        await updateAdminProfile(
          adminToEdit.id,
          {
            fullName,
            phone,
            email,
            login,
            position,
            role,
            isActive,
            permissions,
          },
          { id: actor.id, fullName: actor.fullName, role: actor.role }
        );
        setSuccessMsg("Admin ma'lumotlari muvaffaqiyatli saqlandi!");
      } else {
        await createAdminUserWithPermissions(
          {
            fullName,
            phone,
            email,
            login,
            position,
            role,
            password,
            permissions,
          },
          { id: actor.id, fullName: actor.fullName, role: actor.role }
        );
        setSuccessMsg("Yangi admin muvaffaqiyatli qo'shildi!");
      }

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 animate-in fade-in zoom-in-95 duration-150 my-8">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isEditing ? "Admin Ma'lumotlarini Tahrirlash" : "Yangi Admin Qo'shish"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isEditing ? "Mavjud admin hisobini boshqarish" : "Super Admin tomonidan yangi admin tayinlash"}
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
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  F.I.Sh. (To‘liq ism-familiya) *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Masalan: Aliyev Vali G'aniyevich"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telefon raqami (Login) *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Elektron pochta (Email)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@tkti-yangiyer.uz"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lavozimi / Bo‘limi
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={e => setPosition(e.target.value)}
                  placeholder="Masalan: Iqtidorli talabalar koordinatori"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tizimdagi roli *
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-semibold"
                >
                  <option value="admin">Admin (Ruxsatlar asosida)</option>
                  <option value="superAdmin">Super Admin (To‘liq cheksiz nazorat)</option>
                </select>
              </div>

              {!isEditing && (
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Boshlang‘ich parol *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
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
                        const shuffled = res.split('').sort(() => 0.5 - Math.random()).join('');
                        setPassword(shuffled);
                        setError('');
                      }}
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold"
                    >
                      Tasodifiy kuchli parol generatsiya qilish
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Kamida 8 ta belgi, harf va raqam"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-mono"
                  />
                  {password && (
                    <div className="mt-1.5 space-y-1">
                      <div className="flex gap-1 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full flex-1 transition-all ${
                            validatePasswordStrength(password).score >= 1 ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <div
                          className={`h-full flex-1 transition-all ${
                            validatePasswordStrength(password).score >= 2 ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        />
                        <div
                          className={`h-full flex-1 transition-all ${
                            validatePasswordStrength(password).score >= 3 ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        />
                        <div
                          className={`h-full flex-1 transition-all ${
                            validatePasswordStrength(password).score >= 4 ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {validatePasswordStrength(password).isValid ? (
                          <span className="text-emerald-700 font-semibold">Parol xavfsizlik talablariga to‘liq mos keladi.</span>
                        ) : (
                          <span className="text-amber-700">Kamida 8 ta belgi, harf va raqam bo‘lishi lozim.</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {isEditing && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hisob holati
                  </label>
                  <select
                    value={isActive ? 'active' : 'blocked'}
                    onChange={e => setIsActive(e.target.value === 'active')}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-semibold"
                  >
                    <option value="active">🟢 Faol</option>
                    <option value="blocked">🔴 Bloklangan</option>
                  </select>
                </div>
              )}
            </div>

            {/* Permission configuration button */}
            {role === 'admin' && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Modulli ruxsatlar (RBAC)</span>
                  <span className="text-[11px] text-slate-500">
                    Admin qaysi bo‘limlarni ko‘rishi va tahrirlashi mumkinligini belgilang
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPermsModalOpen(true)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs"
                >
                  <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                  Ruxsatlar matritsasi
                </button>
              </div>
            )}

            {role === 'superAdmin' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Diqqat:</strong> Super Admin roli tizimdagi barcha ma’lumotlar, audit loglari, boshqa adminlar va sozlamalarni to‘liq nazorat qila oladi.
                </div>
              </div>
            )}

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
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs"
              >
                {loading ? "Saqlanmoqda..." : isEditing ? "O‘zgarishlarni saqlash" : "Adminni qo‘shish"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <AdminPermissionsModal
        isOpen={isPermsModalOpen}
        adminName={fullName || 'Yangi admin'}
        initialPermissions={permissions}
        onSave={updated => setPermissions(updated)}
        onClose={() => setIsPermsModalOpen(false)}
      />
    </>
  );
};
