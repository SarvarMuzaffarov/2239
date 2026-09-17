import React, { useState } from 'react';
import { X, GraduationCap, Save, AlertCircle, Check } from 'lucide-react';
import { updateStudentProfileFull } from '../../services/firestoreService';
import { OFFICIAL_DIRECTIONS } from '../../constants/directions';
import type { StudentProfile, SupervisorProfile, UserAccount } from '../../types';

interface Props {
  isOpen: boolean;
  student: StudentProfile | null;
  supervisors: SupervisorProfile[];
  actor: UserAccount;
  onSuccess: () => void;
  onClose: () => void;
}

export const StudentEditModal: React.FC<Props> = ({
  isOpen,
  student,
  supervisors,
  actor,
  onSuccess,
  onClose,
}) => {
  if (!isOpen || !student) return null;

  const [fullName, setFullName] = useState(student.fullName || '');
  const [phone, setPhone] = useState(student.phone || '');
  const [course, setCourse] = useState<number>(student.course || 1);
  const [group, setGroup] = useState(student.group || '');
  const [direction, setDirection] = useState(student.facultyOrField || OFFICIAL_DIRECTIONS[0]);
  const [supervisorId, setSupervisorId] = useState(student.supervisorId || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!fullName.trim()) {
      setError("Talaba F.I.Sh. kiritilishi shart!");
      return;
    }

    setLoading(true);
    try {
      const selectedSup = supervisors.find(s => s.id === supervisorId);
      await updateStudentProfileFull(
        student.id,
        {
          userId: student.userId,
          fullName: fullName.trim(),
          phone: phone.trim(),
          course: Number(course),
          group: group.trim(),
          facultyOrField: direction.trim(),
          supervisorId: supervisorId,
          customSupervisorName: selectedSup ? selectedSup.fullName : student.customSupervisorName,
        },
        { id: actor.id, fullName: actor.fullName, role: actor.role }
      );

      setSuccessMsg("Talaba ma'lumotlari muvaffaqiyatli yangilandi!");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150 my-8">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Talaba Ma’lumotlarini Tahrirlash</h3>
              <p className="text-xs text-slate-500">ID: {student.id}</p>
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              F.I.Sh. (To‘liq ism-familiya) *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Telefon raqam</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Guruh</label>
              <input
                type="text"
                value={group}
                onChange={e => setGroup(e.target.value)}
                placeholder="Masalan: 121-22"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kurs</label>
              <select
                value={course}
                onChange={e => setCourse(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              >
                <option value={1}>1-kurs</option>
                <option value={2}>2-kurs</option>
                <option value={3}>3-kurs</option>
                <option value={4}>4-kurs</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ilmiy rahbar</label>
              <select
                value={supervisorId}
                onChange={e => setSupervisorId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-medium"
              >
                <option value="">Biriktirilmagan</option>
                {supervisors.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.position || 'Rahbar'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ta’lim yo‘nalishi *
            </label>
            <select
              value={direction}
              onChange={e => setDirection(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white leading-relaxed"
            >
              {OFFICIAL_DIRECTIONS.map(dir => (
                <option key={dir} value={dir}>
                  {dir}
                </option>
              ))}
            </select>
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
              {loading ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
