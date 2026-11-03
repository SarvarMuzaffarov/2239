import React, { useState, useMemo, useEffect } from 'react';
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
  FileDown,
  GraduationCap,
  LayoutGrid,
  Table as TableIcon,
  Layers,
  ChevronDown,
  Copy,
  Share2,
} from 'lucide-react';
import type {
  ClubItem,
  ClubEnrollment,
  DayOfWeek,
  ClubCategory,
  UserAccount,
  StudentProfile,
} from '../types';
import { OFFICIAL_KAFEDRALAR } from '../data/initialClubsData';
import { getShareUrl, copyShareLink } from '../lib/shareUtils';

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
  onNotify?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

const DAYS_OF_WEEK: DayOfWeek[] = [
  'Dushanba',
  'Seshanba',
  'Chorshanba',
  'Payshanba',
  'Juma',
  'Shanba',
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
  onNotify,
}) => {
  // Sort clubs by orderNumber (#1 to #43)
  const sortedClubs = useMemo(() => {
    return [...clubs].sort((a, b) => (a.orderNumber || 999) - (b.orderNumber || 999));
  }, [clubs]);

  // Selected club for the single-club inspector card (defaults to first club if available)
  const [selectedClubId, setSelectedClubId] = useState<string>(
    sortedClubs[0]?.id || ''
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | 'all'>('all');
  const [selectedKafedra, setSelectedKafedra] = useState<string>('all');
  const [modalClub, setModalClub] = useState<ClubItem | null>(null);

  // Copy state feedback for section link
  const [copiedSectionLink, setCopiedSectionLink] = useState(false);

  // View mode: 'cards' is ideal for mobile phones, 'table' matches the official document
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Detect initial screen size to give mobile users 'cards' and desktop 'table' by default
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 768) {
        setViewMode('table');
      } else {
        setViewMode('cards');
      }
    }
  }, []);

  // Keep selectedClub in sync
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

  // Count clubs per kafedra
  const clubsCountByKafedra = useMemo(() => {
    const counts: Record<string, number> = {};
    OFFICIAL_KAFEDRALAR.forEach(k => {
      counts[k.name] = 0;
    });
    clubs.forEach(c => {
      if (c.department && counts[c.department] !== undefined) {
        counts[c.department] += 1;
      }
    });
    return counts;
  }, [clubs]);

  // Filter clubs based on search, day, and kafedra
  const filteredClubs = useMemo(() => {
    return sortedClubs.filter(club => {
      // Day filter
      if (selectedDay !== 'all') {
        const matchesSlotDay = club.slots?.some(s => s.dayOfWeek === selectedDay);
        const matchesDescDay = club.scheduleDescription?.toLowerCase().includes(selectedDay.toLowerCase());
        if (!matchesSlotDay && !matchesDescDay) return false;
      }

      // Kafedra filter
      if (selectedKafedra !== 'all' && club.department !== selectedKafedra) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = club.name.toLowerCase().includes(q);
        const matchesSup = club.supervisorName?.toLowerCase().includes(q);
        const matchesLoc = club.location?.toLowerCase().includes(q) || club.room?.toLowerCase().includes(q);
        const matchesKaf = club.department?.toLowerCase().includes(q);
        const matchesOrder = String(club.orderNumber || '').includes(q);
        const matchesSchedule = club.scheduleDescription?.toLowerCase().includes(q);
        if (!matchesName && !matchesSup && !matchesLoc && !matchesKaf && !matchesOrder && !matchesSchedule) {
          return false;
        }
      }

      return true;
    });
  }, [sortedClubs, selectedDay, selectedKafedra, searchQuery]);

  // Group filtered clubs by kafedra for organized document display
  const clubsGroupedByKafedra = useMemo(() => {
    const groups: { kafedraName: string; clubs: ClubItem[] }[] = [];
    OFFICIAL_KAFEDRALAR.forEach(k => {
      const matched = filteredClubs.filter(c => c.department === k.name);
      if (matched.length > 0) {
        groups.push({
          kafedraName: k.name,
          clubs: matched,
        });
      }
    });
    const others = filteredClubs.filter(c => !c.department || !OFFICIAL_KAFEDRALAR.some(k => k.name === c.department));
    if (others.length > 0) {
      groups.push({
        kafedraName: 'Boshqa to‘garaklar',
        clubs: others,
      });
    }
    return groups;
  }, [filteredClubs]);

  const handlePrint = () => {
    window.print();
  };

  // Section Direct URL (#togaraklar)
  const sectionShareUrl = useMemo(() => {
    return getShareUrl('togaraklar');
  }, []);

  const handleCopySectionLink = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const ok = await copyShareLink(sectionShareUrl);
    if (ok) {
      setCopiedSectionLink(true);
      if (onNotify) onNotify('success', 'To‘garaklar bo‘limi havolasi nusxalandi!');
      setTimeout(() => setCopiedSectionLink(false), 2500);
    } else {
      if (onNotify) onNotify('error', 'Havolani nusxalashda xatolik yuz berdi.');
    }
  };

  const isEnrolledInSelected = selectedClub ? myEnrolledClubIds.has(selectedClub.id) : false;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ========================================================================= */}
      {/* 1. OFFICIAL BANNER & HEADER */}
      {/* ========================================================================= */}
      <div className="bg-linear-to-r from-blue-950 via-indigo-950 to-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-7 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold">
                TKTI Yangiyer filiali
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-[11px] font-medium">
                2026/2027-o‘quv yili
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold">
                6 ta kafedra • 43 ta fan to‘garagi
              </span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white leading-snug">
              Fan to‘garaklari yagona umumlashtirilgan jadvali
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed max-w-2xl">
              Rasmiy tasdiqlangan grafik: to‘garakni tanlab uning haftalik dars vaqti, xonasi va rahbarini tezkor bilib oling.
            </p>
          </div>

          {/* Action buttons (Bo‘lim havolasi, Rasmiy PDF, Chop etish) */}
          <div className="flex items-center gap-2 flex-wrap pt-2 sm:pt-0">
            {/* Copy Section Link Button */}
            <button
              type="button"
              onClick={handleCopySectionLink}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer active:scale-95 ${
                copiedSectionLink
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
              }`}
              title="To‘garaklar bo‘limi to‘g‘ridan-to‘g‘ri havolasini nusxalash"
            >
              {copiedSectionLink ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-blue-200" />}
              <span>{copiedSectionLink ? 'Nusxalandi!' : 'Bo‘lim havolasi'}</span>
            </button>

            <a
              href="/assets/aistudio/TKTI_Yangiyer_43_togarak_yagona_jadval__94f4bb25.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-sm cursor-pointer"
              title="Rasmiy tasdiqlangan hujjatni PDF formatda yuklab olish"
            >
              <FileDown className="w-4 h-4 text-slate-950" />
              <span className="hidden sm:inline">Rasmiy PDF</span>
            </a>

            {canManage && onOpenAddClub && (
              <button
                type="button"
                onClick={onOpenAddClub}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">To‘garak qo‘shish</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 backdrop-blur-xs transition-colors cursor-pointer"
              title="Chop etish"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SECTION 1 OF DOC: KAFEDRALAR KESIMIDA UMUMIY KO‘RSATKICHLAR */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-900" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
              1. Kafedralar kesimida umumiy ko‘rsatkichlar (6 ta kafedra)
            </h3>
          </div>
          {selectedKafedra !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedKafedra('all')}
              className="text-[11px] font-bold text-blue-900 hover:underline"
            >
              Filtrni bekor qilish
            </button>
          )}
        </div>

        {/* 6 Kafedra Horizontal Scroll / Grid Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
          {OFFICIAL_KAFEDRALAR.map((k, idx) => {
            const isSelected = selectedKafedra === k.name;
            const currentCount = clubsCountByKafedra[k.name] ?? k.count;
            return (
              <button
                key={k.id}
                type="button"
                onClick={() => setSelectedKafedra(isSelected ? 'all' : k.name)}
                className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 active:scale-[0.98] ${
                  isSelected
                    ? 'bg-blue-900 text-white border-blue-900 shadow-sm ring-2 ring-blue-900/20'
                    : 'bg-slate-50/70 hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      isSelected ? 'bg-blue-800 text-white' : 'bg-slate-200/80 text-slate-700'
                    }`}
                  >
                    №{idx + 1}
                  </span>
                  <span
                    className={`text-xs font-black px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-amber-400 text-slate-950' : 'bg-blue-50 text-blue-950 font-bold'
                    }`}
                  >
                    {currentCount} ta
                  </span>
                </div>
                <div
                  className={`text-[11px] sm:text-xs font-bold line-clamp-2 leading-tight ${
                    isSelected ? 'text-white' : 'text-slate-900'
                  }`}
                  title={k.name}
                >
                  {k.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE SINGLE-CLUB INSPECTOR (TALABA UCHUN TEZKOR KO‘RISH) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-blue-900/10 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-blue-900" />
              <span>To‘garakni tanlang — dars kuni, soati va xonasi</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Quyidagi ro‘yxatdan tanlang, qaysi kuni va xonada bo‘lishi darhol ko‘rinadi:
            </p>
          </div>

          {/* Dropdown Selector (Mobile-optimized full width) */}
          <div className="w-full sm:w-80">
            <div className="relative">
              <select
                value={selectedClub?.id || ''}
                onChange={e => setSelectedClubId(e.target.value)}
                aria-label="To‘garakni tanlang"
                className="w-full pl-3 pr-8 py-2.5 rounded-xl border-2 border-blue-900/30 bg-blue-50/50 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 cursor-pointer appearance-none truncate"
              >
                {sortedClubs.map(c => (
                  <option key={c.id} value={c.id}>
                    №{c.orderNumber || '-'}. {c.name} — {c.scheduleDescription?.split('(')[0]?.trim()} ({c.location})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Selected Club Details Card (Touch-friendly for phones) */}
        {selectedClub && (
          <div className="bg-linear-to-br from-slate-50 to-blue-50/50 rounded-2xl p-4 sm:p-5 border border-blue-100">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-3 flex-1">
                {/* Badges row */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md text-xs font-black bg-blue-900 text-white shadow-2xs">
                    №{selectedClub.orderNumber || 1}
                  </span>
                  {selectedClub.department && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-900 border border-indigo-200">
                      {selectedClub.department}
                    </span>
                  )}
                  {isEnrolledInSelected && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Siz a'zo bo‘lgansiz</span>
                    </span>
                  )}
                </div>

                {/* Club Title */}
                <div>
                  <h4 className="text-base sm:text-xl font-black text-slate-900 leading-snug">
                    {selectedClub.name}
                  </h4>
                  {selectedClub.description && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {selectedClub.description}
                    </p>
                  )}
                </div>

                {/* 3 Prominent Highlights: Dars kuni/vaqti, Joyi, Rahbari */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {/* DARS KUNI VA VAQTI */}
                  <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold mb-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-900" />
                      <span>Dars kuni va vaqti:</span>
                    </div>
                    <div className="text-sm sm:text-base font-black text-blue-950 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-900 shrink-0 sm:hidden" />
                      <span>{selectedClub.scheduleDescription || 'Jadval ko‘rsatilmagan'}</span>
                    </div>
                  </div>

                  {/* O‘TKAZILADIGAN JOYI */}
                  <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold mb-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-600" />
                      <span>O‘tkazilish joyi (xona):</span>
                    </div>
                    <div className="text-sm sm:text-base font-black text-slate-900">
                      {selectedClub.location || selectedClub.room || 'Filial binosi'}
                    </div>
                  </div>

                  {/* TO‘GARAK RAHBARI */}
                  <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold mb-1">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      <span>To‘garak rahbari:</span>
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={selectedClub.supervisorName}>
                      {selectedClub.supervisorName || 'Biriktirilmagan'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
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
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs text-center"
                  >
                    A'zo bo‘lish (Kirish)
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => setModalClub(selectedClub)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer text-center"
                >
                  Batafsil ma'lumot
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. UNIFIED SCHEDULE SECTION (FILTERS, DAY TABS, CARDS & TABLE) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Top Control Bar: Search & View Mode Switch */}
        <div className="p-3 sm:p-5 border-b border-slate-200 space-y-3 bg-slate-50/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-900" />
                <span>2. Barcha to‘garaklarning yagona jadvali ({filteredClubs.length} ta)</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                {selectedKafedra !== 'all' ? `${selectedKafedra} kafedrasi bo‘yicha` : 'Barcha 6 ta kafedra to‘garaklari'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="To‘garak, xona yoki rahbar..."
                  className="w-full pl-9 pr-7 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-all placeholder:text-slate-400"
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

              {/* View Mode Toggle: Cards vs Table */}
              <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Kartalar ko‘rinishi (telefon uchun qulay)"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kartalar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Jadval ko‘rinishi (hujjat shaklida)"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Jadval</span>
                </button>
              </div>
            </div>
          </div>

          {/* Day Filter Pills (Swipeable horizontally on phones) */}
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

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: MOBILE-FRIENDLY CARDS VIEW (TALABALAR UCHUN QULAY) */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'cards' && (
          <div className="p-3 sm:p-5 space-y-6">
            {clubsGroupedByKafedra.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-sm text-slate-700">To‘garak topilmadi</p>
                <p className="text-xs text-slate-400 mt-1">Filtr yoki qidiruv so‘zini o‘zgartirib ko‘ring</p>
              </div>
            ) : (
              clubsGroupedByKafedra.map(group => (
                <div key={group.kafedraName} className="space-y-3">
                  {/* Kafedra Title Ribbon */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 font-bold text-xs sm:text-sm">
                    <GraduationCap className="w-4 h-4 text-blue-900 shrink-0" />
                    <span className="truncate uppercase tracking-wider">{group.kafedraName}</span>
                    <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-900 text-white">
                      {group.clubs.length} ta
                    </span>
                  </div>

                  {/* Cards Grid: 1 col on mobile, 2 col on tablet, 3 col on large */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.clubs.map(club => {
                      const isSelected = selectedClub?.id === club.id;
                      const isEnrolled = myEnrolledClubIds.has(club.id);

                      return (
                        <div
                          key={club.id}
                          onClick={() => setSelectedClubId(club.id)}
                          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 relative ${
                            isSelected
                              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-900/10 shadow-sm'
                              : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-2xs hover:shadow-sm'
                          }`}
                        >
                          <div className="space-y-2">
                            {/* Top badge row */}
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-black bg-blue-900 text-white">
                                №{club.orderNumber}
                              </span>

                              <div className="flex items-center gap-1">
                                {isEnrolled && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    A'zo
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                                  <span>{club.location}</span>
                                </span>
                              </div>
                            </div>

                            {/* Club Name */}
                            <h4 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                              {club.name}
                            </h4>

                            {/* Schedule Pill */}
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100/70 text-blue-950 border border-blue-200/60 w-full">
                              <Clock className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                              <span className="truncate">{club.scheduleDescription}</span>
                            </div>

                            {/* Supervisor Name */}
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 pt-0.5">
                              <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span className="truncate font-medium">
                                <strong className="text-slate-800">Rahbar:</strong> {club.supervisorName}
                              </span>
                            </div>
                          </div>

                          {/* Footer Action buttons */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setSelectedClubId(club.id)}
                              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            >
                              Tanlash
                            </button>

                            <div className="flex items-center gap-1.5">
                              {currentUser?.role === 'student' && (
                                isEnrolled ? (
                                  <button
                                    type="button"
                                    onClick={() => onUnenroll && onUnenroll(club.id)}
                                    className="px-2.5 py-1 text-xs font-bold rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
                                  >
                                    Chiqish
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => onEnroll && onEnroll(club)}
                                    className="px-3 py-1.5 text-xs font-bold rounded-lg text-white bg-blue-900 hover:bg-blue-800 transition-colors shadow-2xs"
                                  >
                                    A'zo bo‘lish
                                  </button>
                                )
                              )}

                              <button
                                type="button"
                                onClick={() => setModalClub(club)}
                                className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-blue-900 hover:bg-blue-50 transition-colors"
                              >
                                Batafsil
                              </button>

                              {canManage && (
                                <>
                                  {onOpenEditClub && (
                                    <button
                                      type="button"
                                      onClick={() => onOpenEditClub(club)}
                                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                                      title="Tahrirlash"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {onDeleteClub && (
                                    <button
                                      type="button"
                                      onClick={() => onDeleteClub(club)}
                                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                                      title="O‘chirish"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: OFFICIAL TABLE VIEW (HUJJAT BILAN BIR HIL JADVAL) */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="sticky top-0 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider shadow-sm z-20">
                <tr>
                  <th className="py-3 px-3 sm:px-4 w-12 text-center">№</th>
                  <th className="py-3 px-3 sm:px-4">To‘garak nomi</th>
                  <th className="py-3 px-3 sm:px-4">To‘garak rahbari</th>
                  <th className="py-3 px-3 sm:px-4">Dars kuni va vaqti (haftalik grafik)</th>
                  <th className="py-3 px-3 sm:px-4">O‘tkaziladigan joy (bino/xona)</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {clubsGroupedByKafedra.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-sm text-slate-700">To‘garak topilmadi</p>
                      <p className="text-xs text-slate-400 mt-1">Filtr yoki qidiruv so‘zini o‘zgartirib ko‘ring</p>
                    </td>
                  </tr>
                ) : (
                  clubsGroupedByKafedra.map(group => (
                    <React.Fragment key={group.kafedraName}>
                      {/* Kafedra Separator Row */}
                      <tr className="bg-slate-100/90 font-black text-slate-900 text-xs border-y-2 border-slate-300">
                        <td colSpan={6} className="py-2.5 px-3 sm:px-4 uppercase tracking-wider">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-blue-900" />
                              <span>{group.kafedraName} KAFEDRASI</span>
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-900 text-white">
                              {group.clubs.length} ta to‘garak
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Kafedra Clubs */}
                      {group.clubs.map(club => {
                        const isSelected = selectedClub?.id === club.id;
                        const isEnrolled = myEnrolledClubIds.has(club.id);

                        return (
                          <tr
                            key={club.id}
                            onClick={() => setSelectedClubId(club.id)}
                            className={`transition-colors cursor-pointer group ${
                              isSelected
                                ? 'bg-blue-50 font-medium'
                                : 'hover:bg-slate-50/80'
                            }`}
                          >
                            {/* № Order */}
                            <td className="py-2.5 px-3 sm:px-4 text-center font-bold text-slate-700">
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${
                                  isSelected
                                    ? 'bg-blue-900 text-white font-black'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {club.orderNumber}
                              </span>
                            </td>

                            {/* To‘garak nomi */}
                            <td className="py-2.5 px-3 sm:px-4">
                              <div className="font-bold text-slate-900 group-hover:text-blue-900 transition-colors flex items-center gap-1.5">
                                <span>{club.name}</span>
                                {isEnrolled && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                    A'zo
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* To‘garak rahbari */}
                            <td className="py-2.5 px-3 sm:px-4 text-xs font-semibold text-slate-800">
                              {club.supervisorName}
                            </td>

                            {/* Dars kuni va vaqti (haftalik grafik) */}
                            <td className="py-2.5 px-3 sm:px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-950 border border-blue-200">
                                <Clock className="w-3 h-3 text-blue-900 shrink-0" />
                                <span>{club.scheduleDescription}</span>
                              </span>
                            </td>

                            {/* O‘tkaziladigan joy (bino/xona) */}
                            <td className="py-2.5 px-3 sm:px-4">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold text-slate-800 bg-slate-100">
                                <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                                <span>{club.location}</span>
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-2.5 px-3 sm:px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedClubId(club.id)}
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 transition-colors cursor-pointer"
                                  title="Tanlash"
                                >
                                  Tanlash
                                </button>

                                {currentUser?.role === 'student' && (
                                  isEnrolled ? (
                                    <button
                                      type="button"
                                      onClick={() => onUnenroll && onUnenroll(club.id)}
                                      className="px-2 py-1 text-xs font-bold rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
                                    >
                                      Chiqish
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => onEnroll && onEnroll(club)}
                                      className="px-2.5 py-1 text-xs font-bold rounded-lg text-white bg-blue-900 hover:bg-blue-800 transition-colors shadow-2xs"
                                    >
                                      A'zo bo‘lish
                                    </button>
                                  )
                                )}

                                {canManage && (
                                  <>
                                    {onOpenEditClub && (
                                      <button
                                        type="button"
                                        onClick={() => onOpenEditClub(club)}
                                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-blue-900"
                                        title="Tahrirlash"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {onDeleteClub && (
                                      <button
                                        type="button"
                                        onClick={() => onDeleteClub(club)}
                                        className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
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
                      })}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Table/Cards Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Ko‘rsatilmoqda: <strong>{filteredClubs.length}</strong> ta to‘garak (Jami: 43 ta to‘garak, 6 ta kafedra)
          </span>
          <span className="text-[11px] text-slate-400">
            Bo‘lim havolasi: <code className="text-blue-900 font-mono font-bold">#togaraklar</code>
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL DETAIL POPUP */}
      {/* ========================================================================= */}
      {modalClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-xs font-black bg-blue-900 text-white">
                    №{modalClub.orderNumber}
                  </span>
                  {modalClub.department && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-900 border border-indigo-200">
                      {modalClub.department}
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
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
              <div className="bg-blue-50/70 rounded-xl p-3 border border-blue-100 space-y-1">
                <div className="text-slate-500 font-medium text-[11px]">Dars o‘tkazilish vaqti va grafigi:</div>
                <div className="text-sm sm:text-base font-bold text-blue-950 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-900" />
                  <span>{modalClub.scheduleDescription}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <div className="text-slate-400 text-[11px] font-medium">O‘tkazilish joyi:</div>
                  <div className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{modalClub.location}</span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <div className="text-slate-400 text-[11px] font-medium">Mas'ul rahbar:</div>
                  <div className="font-bold text-slate-900 flex items-center gap-1 mt-0.5 truncate" title={modalClub.supervisorName}>
                    <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate">{modalClub.supervisorName}</span>
                  </div>
                </div>
              </div>

              {modalClub.description && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <div className="text-slate-400 text-[11px] font-medium mb-1">Tavsif va yo‘nalish:</div>
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
