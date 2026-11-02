import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Bookmark,
  Printer,
  Sparkles,
  BookOpen,
  ChevronRight,
  Info,
  CalendarDays,
  Plus,
  Edit,
  Trash2,
  Compass,
  ArrowRight,
  Check,
  Building2,
  X,
} from 'lucide-react';
import type {
  ClubItem,
  ClubEnrollment,
  DayOfWeek,
  ClubCategory,
  UserAccount,
  StudentProfile,
} from '../types';

interface Props {
  clubs: ClubItem[];
  enrollments?: ClubEnrollment[];
  currentUser: UserAccount | null;
  studentProfile?: StudentProfile | null;
  onEnroll?: (club: ClubItem) => void;
  onUnenroll?: (clubId: string) => void;
  onOpenLogin?: () => void;
  onOpenEditClub?: (club: ClubItem) => void;
  onOpenAddClub?: () => void;
  onDeleteClub?: (club: ClubItem) => void;
  onViewAttendees?: (club: ClubItem) => void;
  canManage?: boolean;
}

const DAYS_OF_WEEK: DayOfWeek[] = [
  'Dushanba',
  'Seshanba',
  'Chorshanba',
  'Payshanba',
  'Juma',
  'Shanba',
];

const CATEGORIES: ClubCategory[] = [
  'Tabiiy fanlar',
  'Kimyo va Biotexnologiya',
  'Oziq-ovqat va Texnologiya',
  'Muhandislik va Mexanika',
  'Iqtisodiyot va Biznes',
  'IT va Dasturlash',
  'Tillar',
  'Sport',
];

export const ClubsScheduleView: React.FC<Props> = ({
  clubs,
  enrollments = [],
  currentUser,
  studentProfile,
  onEnroll,
  onUnenroll,
  onOpenLogin,
  onOpenEditClub,
  onOpenAddClub,
  onDeleteClub,
  onViewAttendees,
  canManage = false,
}) => {
  // Sort clubs by orderNumber (#1 to #36)
  const sortedClubs = useMemo(() => {
    return [...clubs].sort((a, b) => (a.orderNumber || 999) - (b.orderNumber || 999));
  }, [clubs]);

  // Selected club for the single-club inspector card (defaults to first club if available)
  const [selectedClubId, setSelectedClubId] = useState<string>(
    sortedClubs[0]?.id || ''
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [modalClub, setModalClub] = useState<ClubItem | null>(null);

  // Keep selectedClub in sync if list loads/changes
  const selectedClub = useMemo(() => {
    return sortedClubs.find(c => c.id === selectedClubId) || sortedClubs[0] || null;
  }, [sortedClubs, selectedClubId]);

  // Set of club IDs the current user is enrolled in
  const myEnrolledClubIds = useMemo(() => {
    const ids = new Set<string>();
    if (!currentUser) return ids;

    enrollments
      .filter(e => e.studentId === currentUser.id && e.status !== 'Bekor qilingan')
      .forEach(e => ids.add(e.clubId));

    clubs.forEach(c => {
      if (Array.isArray(c.enrolledStudentIds) && c.enrolledStudentIds.includes(currentUser.id)) {
        ids.add(c.id);
      }
    });

    return ids;
  }, [currentUser, enrollments, clubs]);

  // Count clubs per day
  const clubsCountByDay = useMemo(() => {
    const counts: Record<DayOfWeek, number> = {
      Dushanba: 0,
      Seshanba: 0,
      Chorshanba: 0,
      Payshanba: 0,
      Juma: 0,
      Shanba: 0,
    };
    clubs.forEach(c => {
      DAYS_OF_WEEK.forEach(day => {
        const matchesSlot = c.slots?.some(s => s.dayOfWeek === day);
        const matchesText = c.scheduleDescription?.toLowerCase().includes(day.toLowerCase());
        if (matchesSlot || matchesText) {
          counts[day] += 1;
        }
      });
    });
    return counts;
  }, [clubs]);

  // Filter clubs based on search, day, and category
  const filteredClubs = useMemo(() => {
    return sortedClubs.filter(club => {
      // Day filter
      if (selectedDay !== 'all') {
        const matchesSlotDay = club.slots?.some(s => s.dayOfWeek === selectedDay);
        const matchesDescDay = club.scheduleDescription?.toLowerCase().includes(selectedDay.toLowerCase());
        if (!matchesSlotDay && !matchesDescDay) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && club.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = club.name.toLowerCase().includes(q);
        const matchesSup = club.supervisorName?.toLowerCase().includes(q);
        const matchesLoc = club.location?.toLowerCase().includes(q) || club.room?.toLowerCase().includes(q);
        const matchesCat = club.category?.toLowerCase().includes(q);
        const matchesDesc = club.description?.toLowerCase().includes(q);
        const matchesOrder = String(club.orderNumber || '').includes(q);
        if (!matchesName && !matchesSup && !matchesLoc && !matchesCat && !matchesDesc && !matchesOrder) {
          return false;
        }
      }

      return true;
    });
  }, [sortedClubs, selectedDay, selectedCategory, searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Tabiiy fanlar':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Kimyo va Biotexnologiya':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Oziq-ovqat va Texnologiya':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Muhandislik va Mexanika':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Iqtisodiyot va Biznes':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'IT va Dasturlash':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Tillar':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Sport':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const isEnrolledInSelected = selectedClub ? myEnrolledClubIds.has(selectedClub.id) : false;

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-semibold">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>2026/2027-o‘quv yili yagona jadvali</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Filial fan to‘garaklari jadvali
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed">
              To‘garakni tanlab uning o‘tkazilish kuni, vaqti va xonasini tezkor bilib oling yoki umumiy jadval orqali ko‘ring.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canManage && onOpenAddClub && (
              <button
                type="button"
                onClick={onOpenAddClub}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>To‘garak qo‘shish</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 backdrop-blur-xs transition-colors cursor-pointer"
              title="Jadvalni chop etish yoki PDF sifatida saqlash"
            >
              <Printer className="w-4 h-4" />
              <span>Chop etish (PDF)</span>
            </button>
          </div>
        </div>

        {/* Mini stats */}
        <div className="relative z-10 mt-4 pt-4 border-t border-white/10 flex items-center gap-4 sm:gap-8 text-xs text-blue-200 flex-wrap">
          <div>
            Jami to‘garaklar: <strong className="text-white font-bold">{clubs.length} ta</strong>
          </div>
          <div>
            Haftalik kunlar: <strong className="text-white font-bold">Dushanba – Shanba</strong>
          </div>
          <div>
            Mening a'zoligim:{' '}
            <strong className="text-emerald-300 font-bold">
              {currentUser ? `${myEnrolledClubIds.size} ta to‘garak` : "Ro‘yxatdan o‘tmagan"}
            </strong>
          </div>
        </div>
      </div>

      {/* 2. Interactive Single-Club Inspector ("Bitta to‘garakni tanlash") */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-blue-900/10 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-900" />
              <span>To‘garakni tanlang — dars kuni va xonasi</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Quyidagi ro‘yxatdan istalgan to‘garakni tanlang, uning o‘tkazilish vaqti va xonasi darhol ko‘rsatiladi:
            </p>
          </div>

          {/* Direct Dropdown Selector */}
          <div className="sm:w-72">
            <select
              value={selectedClub?.id || ''}
              onChange={e => setSelectedClubId(e.target.value)}
              aria-label="To‘garakni tanlang"
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-blue-900/30 bg-blue-50/40 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 cursor-pointer"
            >
              {sortedClubs.map(c => (
                <option key={c.id} value={c.id}>
                  №{c.orderNumber || '-'}. {c.name} ({c.scheduleDescription?.split('(')[0]?.trim() || c.location})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Club Inspector Details Card */}
        {selectedClub ? (
          <div className="bg-linear-to-br from-slate-50 to-blue-50/40 rounded-2xl p-4 sm:p-5 border border-blue-100/80">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-blue-900 text-white shadow-2xs">
                    №{selectedClub.orderNumber || 1}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${getCategoryBadgeClass(selectedClub.category)}`}>
                    {selectedClub.category}
                  </span>
                  {isEnrolledInSelected && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Siz a'zo bo‘lgansiz</span>
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                    {selectedClub.name}
                  </h4>
                  {selectedClub.description && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {selectedClub.description}
                    </p>
                  )}
                </div>

                {/* Main 3 Key Fields: Day/Time, Room, Supervisor */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* DARS O‘TKAZILISH VAQTI VA GRAFIGI */}
                  <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold mb-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-900" />
                      <span>Dars kuni va vaqti:</span>
                    </div>
                    <div className="text-sm font-black text-blue-950">
                      {selectedClub.scheduleDescription || 'Jadval ko‘rsatilmagan'}
                    </div>
                  </div>

                  {/* O‘TKAZILADIGAN JOYI (XONA/BINO) */}
                  <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold mb-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-600" />
                      <span>O‘tkazilish joyi:</span>
                    </div>
                    <div className="text-sm font-black text-slate-900">
                      {selectedClub.location || selectedClub.room || 'Filial binosi'}
                    </div>
                  </div>

                  {/* ILMIY RAHBAR / MAS'UL */}
                  <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold mb-1">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      <span>To‘garak rahbari:</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {selectedClub.supervisorName || 'Biriktirilmagan'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons for this selected club */}
              <div className="flex flex-row lg:flex-col items-center justify-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-200/80 lg:pl-5">
                {currentUser?.role === 'student' ? (
                  isEnrolledInSelected ? (
                    <button
                      type="button"
                      onClick={() => onUnenroll && onUnenroll(selectedClub.id)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold text-xs transition-colors cursor-pointer"
                    >
                      A'zolikdan chiqish
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onEnroll && onEnroll(selectedClub)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>To‘garakka a'zo bo‘lish</span>
                    </button>
                  )
                ) : !currentUser ? (
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    A'zo bo‘lish (Kirish)
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => setModalClub(selectedClub)}
                  className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Batafsil ma'lumot
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* 3. Yagona umumiy ixcham jadval (Unified Optimal Timetable) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Filters & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 space-y-3.5 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-900" />
                <span>Fan to‘garaklari yagona jadvali (Jami: {filteredClubs.length} ta)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Filtrlar orqali kunlar bo‘yicha ajrating yoki qidiruvdan foydalaning:
              </p>
            </div>

            {/* Search Input */}
            <div className="relative sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="To‘garak, xona yoki rahbar ismi..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Day Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-slate-200/60">
            <button
              type="button"
              onClick={() => setSelectedDay('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedDay === 'all'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Barcha kunlar ({clubs.length})
            </button>

            {DAYS_OF_WEEK.map(day => {
              const count = clubsCountByDay[day] || 0;
              const isSelected = selectedDay === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-900 text-white shadow-xs font-bold'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{day}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Compact Table */}
        <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 shadow-2xs z-10">
              <tr>
                <th className="py-3 px-3 sm:px-4 w-12 text-center">№</th>
                <th className="py-3 px-3 sm:px-4">To‘garak nomi</th>
                <th className="py-3 px-3 sm:px-4">Dars o‘tkazilish vaqti va davriyligi</th>
                <th className="py-3 px-3 sm:px-4">O‘tkaziladigan joyi</th>
                <th className="py-3 px-3 sm:px-4">Mas'ul rahbar</th>
                <th className="py-3 px-3 sm:px-4 text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClubs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-sm text-slate-700">To‘garak topilmadi</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Filtr yoki qidiruv so‘zini o‘zgartirib ko‘ring
                    </p>
                  </td>
                </tr>
              ) : (
                filteredClubs.map(club => {
                  const isSelected = selectedClub?.id === club.id;
                  const isEnrolled = myEnrolledClubIds.has(club.id);

                  return (
                    <tr
                      key={club.id}
                      onClick={() => setSelectedClubId(club.id)}
                      className={`transition-colors cursor-pointer group ${
                        isSelected
                          ? 'bg-blue-50/80 font-medium'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* № Order */}
                      <td className="py-2.5 px-3 sm:px-4 text-center font-bold text-slate-500 group-hover:text-blue-900">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${
                            isSelected
                              ? 'bg-blue-900 text-white font-black'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {club.orderNumber || '-'}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="py-2.5 px-3 sm:px-4">
                        <div className="font-bold text-slate-900 group-hover:text-blue-900 transition-colors flex items-center gap-1.5">
                          <span>{club.name}</span>
                          {isEnrolled && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                              A'zo
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {club.category}
                        </div>
                      </td>

                      {/* Schedule: Day & Time */}
                      <td className="py-2.5 px-3 sm:px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-950 border border-blue-200/80">
                          <Clock className="w-3 h-3 text-blue-900 shrink-0" />
                          <span>{club.scheduleDescription || 'Vaqti belgilanmagan'}</span>
                        </span>
                      </td>

                      {/* Location / Room */}
                      <td className="py-2.5 px-3 sm:px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold text-slate-800 bg-slate-100">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          <span>{club.location || club.room || 'Xona aniqlanadi'}</span>
                        </span>
                      </td>

                      {/* Supervisor */}
                      <td className="py-2.5 px-3 sm:px-4 text-xs font-medium text-slate-700">
                        {club.supervisorName || 'Biriktirilmagan'}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 sm:px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSelectedClubId(club.id)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 transition-colors cursor-pointer"
                            title="Yuqoridagi panelda ko‘rish"
                          >
                            Tanlash
                          </button>

                          {canManage && (
                            <>
                              {onOpenEditClub && (
                                <button
                                  type="button"
                                  onClick={() => onOpenEditClub(club)}
                                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-blue-900 transition-colors cursor-pointer"
                                  title="Tahrirlash"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {onDeleteClub && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteClub(club)}
                                  className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="O‘chirish"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>
            Ko‘rsatilmoqda: <strong>{filteredClubs.length}</strong> ta to‘garak (Jami: {clubs.length} ta)
          </span>
          <span className="text-[11px] text-slate-400">
            Jadval qatorini bosib uning batafsil vaqtini ko‘rishingiz mumkin
          </span>
        </div>
      </div>

      {/* 4. Modal Detail for a Club */}
      {modalClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-black bg-blue-900 text-white">
                    №{modalClub.orderNumber || 1}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getCategoryBadgeClass(modalClub.category)}`}>
                    {modalClub.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {modalClub.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalClub(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="bg-blue-50/60 rounded-xl p-3 border border-blue-100 space-y-1">
                <div className="text-slate-500 font-medium">Dars o‘tkazilish vaqti va grafigi:</div>
                <div className="text-base font-bold text-blue-950 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-900" />
                  <span>{modalClub.scheduleDescription}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                  <div className="text-slate-400 text-xs font-medium">O‘tkazilish joyi:</div>
                  <div className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{modalClub.location}</span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                  <div className="text-slate-400 text-xs font-medium">Mas'ul rahbar:</div>
                  <div className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                    <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>{modalClub.supervisorName || 'Mavjud emas'}</span>
                  </div>
                </div>
              </div>

              {modalClub.description && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                  <div className="text-slate-400 text-xs font-medium mb-1">Tavsif va maqsad:</div>
                  <p className="text-slate-700 text-xs leading-relaxed">
                    {modalClub.description}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalClub(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Yopish
              </button>

              {currentUser?.role === 'student' && (
                myEnrolledClubIds.has(modalClub.id) ? (
                  <button
                    type="button"
                    onClick={() => {
                      onUnenroll && onUnenroll(modalClub.id);
                      setModalClub(null);
                    }}
                    className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                  >
                    A'zolikdan chiqish
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onEnroll && onEnroll(modalClub);
                      setModalClub(null);
                    }}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl transition-colors shadow-xs"
                  >
                    A'zo bo‘lish
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
