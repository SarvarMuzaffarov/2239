import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, User, Clock, Layers, Save, Check } from 'lucide-react';
import type { ClubItem, DayOfWeek, ClubCategory } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clubData: Partial<ClubItem>) => Promise<void>;
  clubToEdit?: ClubItem | null;
}

const CATEGORIES: ClubCategory[] = [
  'Tabiiy fanlar',
  'Kimyo va Biotexnologiya',
  'Oziq-ovqat va Texnologiya',
  'Muhandislik va Mexanika',
  'Iqtisodiyot va Biznes',
  'IT va Dasturlash',
  'Tillar',
  'Sport',
  'Boshqa',
];

const DAYS: DayOfWeek[] = [
  'Dushanba',
  'Seshanba',
  'Chorshanba',
  'Payshanba',
  'Juma',
  'Shanba',
];

export const ClubManageModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  clubToEdit,
}) => {
  const [orderNumber, setOrderNumber] = useState<number>(1);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ClubCategory>('Tabiiy fanlar');
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [supervisorName, setSupervisorName] = useState('');
  const [location, setLocation] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('Seshanba');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('15:20');
  const [frequency, setFrequency] = useState('haftalik');
  const [capacity, setCapacity] = useState<number>(25);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Faol' | 'Rejalashtirilgan' | 'Tugatilgan'>('Faol');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clubToEdit) {
      setOrderNumber(clubToEdit.orderNumber || 1);
      setName(clubToEdit.name || '');
      setCategory(clubToEdit.category || 'Tabiiy fanlar');
      setAcademicYear(clubToEdit.academicYear || '2026/2027');
      setSupervisorName(clubToEdit.supervisorName || '');
      setLocation(clubToEdit.location || '');
      setDescription(clubToEdit.description || '');
      setCapacity(clubToEdit.capacity || 25);
      setStatus(clubToEdit.status || 'Faol');

      if (clubToEdit.slots && clubToEdit.slots.length > 0) {
        const slot = clubToEdit.slots[0];
        setDayOfWeek(slot.dayOfWeek || 'Seshanba');
        setStartTime(slot.startTime || '14:00');
        setEndTime(slot.endTime || '15:20');
        setFrequency(slot.frequency || 'haftalik');
      }
    } else {
      setOrderNumber(37);
      setName('');
      setCategory('Tabiiy fanlar');
      setAcademicYear('2026/2027');
      setSupervisorName('');
      setLocation('114-xona');
      setDayOfWeek('Seshanba');
      setStartTime('14:00');
      setEndTime('15:20');
      setFrequency('haftalik');
      setCapacity(25);
      setDescription('');
      setStatus('Faol');
    }
    setError(null);
  }, [clubToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("To‘garak nomini kiriting.");
      return;
    }
    if (!location.trim()) {
      setError("O‘tkaziladigan xona yoki bino nomini kiriting.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const scheduleDescription = `${dayOfWeek}, ${startTime} (${frequency})`;

    const clubPayload: Partial<ClubItem> = {
      orderNumber: Number(orderNumber) || 1,
      name: name.trim(),
      category,
      academicYear,
      supervisorName: supervisorName.trim() || 'Kafedra o‘qituvchisi',
      location: location.trim(),
      room: location.trim(),
      scheduleDescription,
      slots: [
        {
          dayOfWeek,
          startTime,
          endTime,
          room: location.trim(),
          frequency,
        },
      ],
      capacity: Number(capacity) || 25,
      description: description.trim(),
      status,
    };

    try {
      await onSave(clubPayload);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Saqlashda xatolik yuz berdi.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-black text-slate-900">
              {clubToEdit ? "To‘garakni tahrirlash" : "Yangi to‘garak qo‘shish"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              2026/2027-o‘quv yili fan to‘garaklari yagona jadvali
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tartib raqami (#)
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={orderNumber}
                onChange={e => setOrderNumber(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900/20 text-sm font-semibold"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                To‘garak nomi *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Masalan: Yosh biologlar (U. G‘ofurova)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900/20 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Yo‘nalish / Kategoriya
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ClubCategory)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900/20 text-sm bg-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                To‘garak rahbari / O‘qituvchi
              </label>
              <input
                type="text"
                value={supervisorName}
                onChange={e => setSupervisorName(e.target.value)}
                placeholder="F.I.SH. yoki kafedra nomi"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900/20 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hafta kuni
              </label>
              <select
                value={dayOfWeek}
                onChange={e => setDayOfWeek(e.target.value as DayOfWeek)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900/20 text-sm bg-white font-medium"
              >
                {DAYS.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Boshlanish vaqti
              </label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900/20 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                O‘tkazilish joyi (xona) *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="114-xona, Texnopark, Sport zali"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900/20 text-sm font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Davriyligi
              </label>
              <input
                type="text"
                value={frequency}
                onChange={e => setFrequency(e.target.value)}
                placeholder="haftalik, 2 haftada bir"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900/20 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sig‘im (max talabalar)
              </label>
              <input
                type="number"
                min="5"
                max="100"
                value={capacity}
                onChange={e => setCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900/20 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Holati
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900/20 text-sm bg-white font-medium"
              >
                <option value="Faol">Faol</option>
                <option value="Rejalashtirilgan">Rejalashtirilgan</option>
                <option value="Tugatilgan">Tugatilgan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              To‘garak tavsifi va dasturi
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="To‘garakda nimalar o‘rganiladi, talabalar qanday amaliy ko‘nikmalarga ega bo‘ladi..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900/20 text-sm"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saqlanmoqda..." : "Saqlash"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
