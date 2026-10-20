import React, { useState } from 'react';
import {
  X,
  UserPlus,
  User,
  Phone,
  GraduationCap,
  Users,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  Sparkles,
  Loader2,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { DirectionSelect } from './DirectionSelect';
import { SupervisorSelect } from './SupervisorSelect';
import { registerStudentByAdmin } from '../services/authService';
import { formatUzbekPhone } from '../lib/crypto';
import type { UserAccount, SupervisorProfile, StudentProfile } from '../types';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  supervisors: SupervisorProfile[];
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
  onStudentAdded?: (newStudent: StudentProfile) => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  supervisors,
  onNotify,
  onStudentAdded,
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [facultyOrField, setFacultyOrField] = useState('');
  const [course, setCourse] = useState<number>(1);
  const [group, setGroup] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [customSupervisorName, setCustomSupervisorName] = useState('');

  // Password options
  const [passwordMode, setPasswordMode] = useState<'auto' | 'custom'>('auto');
  const [customPassword, setCustomPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdResult, setCreatedResult] = useState<{
    student: StudentProfile;
    phone: string;
    initialPassword: string;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  // Phone input mask / formatter: formats as 9 digits
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.startsWith('998')) {
      raw = raw.slice(3);
    }
    raw = raw.slice(0, 9);

    if (!raw) {
      setPhone('');
      return;
    }

    let formatted = '+998';
    if (raw.length > 0) formatted += ` (${raw.slice(0, 2)}`;
    if (raw.length >= 2) formatted += `) ${raw.slice(2, 5)}`;
    if (raw.length >= 5) formatted += `-${raw.slice(5, 7)}`;
    if (raw.length >= 7) formatted += `-${raw.slice(7, 9)}`;

    setPhone(formatted);
  };

  const handleResetForm = () => {
    setFullName('');
    setPhone('');
    setFacultyOrField('');
    setCourse(1);
    setGroup('');
    setSupervisorId('');
    setCustomSupervisorName('');
    setPasswordMode('auto');
    setCustomPassword('');
    setShowPassword(false);
    setCreatedResult(null);
    setIsCopied(false);
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      onNotify('error', 'Iltimos, talabaning to‘liq F.I.Sh. familiya, ism va sharifini kiriting.');
      return;
    }

    const cleanPhoneDigits = phone.replace(/\D/g, '');
    if (cleanPhoneDigits.length < 9) {
      onNotify('error', 'Iltimos, 9 xonali O‘zbekiston telefon raqamini to‘liq kiriting.');
      return;
    }

    if (!facultyOrField.trim()) {
      onNotify('error', 'Iltimos, talabaning ta’lim yo‘nalishini tanlang.');
      return;
    }

    if (!group.trim()) {
      onNotify('error', 'Iltimos, akademik guruh raqamini kiriting (masalan: 210-21).');
      return;
    }

    if (passwordMode === 'custom' && !customPassword.trim()) {
      onNotify('error', 'Maxsus parol kiritish tanlangan, iltimos, parolni kiriting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerStudentByAdmin(currentUser, {
        fullName: fullName.trim(),
        phone: phone.trim(),
        course,
        group: group.trim().toUpperCase(),
        facultyOrField: facultyOrField.trim(),
        supervisorId: supervisorId || undefined,
        customSupervisorName: customSupervisorName.trim() || undefined,
        password: passwordMode === 'custom' ? customPassword.trim() : undefined,
      });

      onNotify('success', `Talaba «${result.student.fullName}» muvaffaqiyatli ro‘yxatga olindi!`);
      onStudentAdded?.(result.student);

      // Show credentials success view
      setCreatedResult({
        student: result.student,
        phone: result.user.phone,
        initialPassword: result.initialPassword,
      });
    } catch (err: any) {
      console.error('Error creating student:', err);
      onNotify('error', err.message || 'Talabani qo‘shishda xatolik yuz berdi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdResult) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const text = `🎓 «Iqtidorli Talabalar» platformasi uchun shaxsiy hisob ma'lumotlari:

👤 F.I.Sh: ${createdResult.student.fullName}
📞 Telefon (Login): ${formatUzbekPhone(createdResult.phone)}
🔑 Parol: ${createdResult.initialPassword}
🏢 Guruh: ${createdResult.student.group} (${createdResult.student.course}-kurs)

🌐 Kirish havolasi: ${origin}`;

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    onNotify('success', 'Talabaning hisob ma’lumotlari buferga nusxalandi! Telegram yoki SMS orqali yuborishingiz mumkin.');
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Yangi talaba qo‘shish"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white relative flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span>Yangi talaba qo‘shish</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                  Admin registratsiyasi
                </span>
              </h2>
              <p className="text-xs text-blue-200 mt-0.5">
                Talabani platforma va maʼlumotlar bazasiga kiritish hamda kirish akkauntini yaratish
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {createdResult ? (
            /* SUCCESS & CREDENTIALS VIEW */
            <div className="space-y-6 py-2">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
                <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-emerald-950">
                  Talaba muvaffaqiyatli qo‘shildi!
                </h3>
                <p className="text-xs text-emerald-800 mt-1 max-w-md mx-auto">
                  «{createdResult.student.fullName}» platforma ro‘yxatiga va xotira tizimiga to‘liq integratsiya qilindi.
                  Talaba darhol quyidagi maʼlumotlar bilan tizimga kira oladi:
                </p>
              </div>

              {/* Credentials Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="text-xs text-slate-500">Talaba F.I.Sh:</span>
                  <strong className="text-sm text-slate-900 font-bold">
                    {createdResult.student.fullName}
                  </strong>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="text-xs text-slate-500">Telefon raqami (Login):</span>
                  <strong className="text-sm font-mono text-blue-900 font-bold">
                    {formatUzbekPhone(createdResult.phone)}
                  </strong>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="text-xs text-slate-500">Boshlang‘ich parol:</span>
                  <span className="px-3 py-1 bg-amber-100 border border-amber-300 rounded-lg text-sm font-mono text-amber-950 font-bold select-all">
                    {createdResult.initialPassword}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                  <span>Yo‘nalish va Kurs:</span>
                  <span>
                    {createdResult.student.course}-kurs • {createdResult.student.group} guruhi
                  </span>
                </div>
              </div>

              {/* Action Buttons in Success View */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="w-full py-3 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Nusxalandi! (Talabaga yuborishga tayyor)</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-blue-200" />
                      <span>Talaba uchun hisob ma’lumotlarini nusxalash (SMS/Telegram)</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    + Yana boshqa talaba qo‘shish
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Tayyor (Yopish)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* REGISTRATION FORM VIEW */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 1. Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Talaba F.I.Sh. (Familiya, Ism, Sharif) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Abdullayev Temur Shavkat o‘g‘li"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              {/* 2. Phone Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Telefon raqami (Login sifatida ishlatiladi) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    placeholder="+998 (90) 123-45-67"
                    value={phone}
                    onChange={handlePhoneChange}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white font-mono transition-all font-medium"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Ushbu raqam orqali talaba platformaga kiradi.
                </span>
              </div>

              {/* 3. Direction / Mutaxassislik */}
              <div>
                <DirectionSelect
                  label="Ta’lim yo‘nalishi (18 ta rasmiy yo‘nalish) *"
                  required
                  value={facultyOrField}
                  onChange={setFacultyOrField}
                  placeholder="Rasmiy ta’lim yo‘nalishini tanlang..."
                />
              </div>

              {/* 4. Course and Group */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    O‘quv bosqichi (Kurs) *
                  </label>
                  <select
                    value={course}
                    onChange={(e) => setCourse(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all font-medium cursor-pointer"
                  >
                    <option value={1}>1-kurs</option>
                    <option value={2}>2-kurs</option>
                    <option value={3}>3-kurs</option>
                    <option value={4}>4-kurs</option>
                    <option value={5}>5-kurs / Magistratura</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Akademik guruh *
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="Masalan: 612-21 yoki TATU-102"
                      value={group}
                      onChange={(e) => setGroup(e.target.value.toUpperCase())}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white uppercase font-mono transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Supervisor assignment */}
              <div>
                <SupervisorSelect
                  id="add-student-supervisor"
                  label="Ilmiy rahbar biriktirish (Ixtiyoriy)"
                  supervisors={supervisors}
                  value={supervisorId}
                  onChange={(val) => {
                    setSupervisorId(val);
                    if (val && val !== 'other') setCustomSupervisorName('');
                  }}
                  allowUnassigned
                  unassignedOptionLabel="— Biriktirilmagan —"
                  allowOther
                  otherOptionLabel="Boshqa (Ro‘yxatda bo‘lmasa, qo‘lda kiritish)"
                  customSupervisorName={customSupervisorName}
                  placeholder="— Biriktirilmagan (Tanlash uchun bosing) —"
                />

                {(!supervisorId || supervisorId === 'other') && (
                  <div className="mt-2.5">
                    <input
                      type="text"
                      placeholder="Yoki ro‘yxatda yo‘q rahbar F.I.Sh. (ixtiyoriy)"
                      value={customSupervisorName}
                      onChange={(e) => setCustomSupervisorName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-800"
                    />
                  </div>
                )}
              </div>

              {/* 6. Password Options */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-900" />
                    <span>Kirish paroli</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Talaba ushbu parol orqali tizimga kiradi
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      passwordMode === 'auto'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="pwdMode"
                      checked={passwordMode === 'auto'}
                      onChange={() => setPasswordMode('auto')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Avtomatik xavfsiz parol</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      passwordMode === 'custom'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="pwdMode"
                      checked={passwordMode === 'custom'}
                      onChange={() => setPasswordMode('custom')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Maxsus parol kiritish</span>
                  </label>
                </div>

                {passwordMode === 'auto' ? (
                  <p className="text-[11px] text-slate-500 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-slate-200">
                    Tizim tomonidan tasodifiy xavfsiz parol (masalan: <code>Talaba2026@842</code>) yaratiladi va talaba qo‘shilgach, nusxa olishingiz uchun ko‘rsatiladi.
                  </p>
                ) : (
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={passwordMode === 'custom'}
                      placeholder="Kamida 6 belgi, bosh harf va son..."
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      className="w-full pr-10 pl-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Bekor qilish
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saqlanmoqda...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 text-blue-200" />
                      <span>Talabani ro‘yxatga olish</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
