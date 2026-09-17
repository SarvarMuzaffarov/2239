import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Users,
  Award,
  Calendar,
  FileText,
  Rocket,
  ShieldCheck,
  Search,
  ArrowRight,
  Clock,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ExternalLink,
  BookOpen,
  Filter,
  Eye,
  Building,
  Info,
  Layers,
  ChevronDown,
  Trophy,
  Star,
  Pencil,
} from 'lucide-react';
import type {
  StudentProfile,
  SupervisorProfile,
  ProjectOrStartup,
  Achievement,
  CertificateItem,
  EventItem,
  Announcement,
  UserAccount,
} from '../types';
import { hasPermission } from '../lib/permissions';

interface Props {
  students: StudentProfile[];
  supervisors: SupervisorProfile[];
  projects: ProjectOrStartup[];
  achievements: Achievement[];
  certificates: CertificateItem[];
  events: EventItem[];
  announcements: Announcement[];
  isLoading: boolean;
  currentUser: UserAccount | null;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenVerifyModal: (certId?: string) => void;
  onSelectDirection?: (direction: string) => void;
  onOpenEventDetail: (event: EventItem) => void;
  onOpenProjectDetail: (project: ProjectOrStartup) => void;
  onOpenAnnouncementDetail: (announcement: Announcement) => void;
  onOpenStudentProfile?: (studentId: string) => void;
  onOpenManageTopStudents?: () => void;
}

export const PublicLandingPage: React.FC<Props> = ({
  students,
  supervisors,
  projects,
  achievements,
  certificates,
  events,
  announcements,
  isLoading,
  currentUser,
  onOpenLogin,
  onOpenRegister,
  onOpenVerifyModal,
  onSelectDirection,
  onOpenEventDetail,
  onOpenProjectDetail,
  onOpenAnnouncementDetail,
  onOpenStudentProfile,
  onOpenManageTopStudents,
}) => {
  // Search & Filters
  const [eventFilter, setEventFilter] = useState<'all' | 'upcoming' | 'ongoing'>('all');
  const [achievementCategory, setAchievementCategory] = useState<string>('all');

  // Real Computed Statistics directly from live collections
  const stats = useMemo(() => {
    const approvedProjects = projects.filter(p => p.status === 'Tasdiqlangan');
    const startapCount = projects.filter(p => p.type === 'startap' && p.status === 'Tasdiqlangan').length;
    const loyihaCount = projects.filter(p => p.type === 'loyiha' && p.status === 'Tasdiqlangan').length;
    const approvedAchievements = achievements.filter(a => a.status === 'Tasdiqlangan');

    return {
      studentsCount: students.length,
      supervisorsCount: supervisors.length,
      projectsCount: loyihaCount,
      startupsCount: startapCount,
      totalApprovedProjects: approvedProjects.length,
      achievementsCount: approvedAchievements.length,
      certificatesCount: certificates.length,
      eventsCount: events.length,
    };
  }, [students, supervisors, projects, achievements, certificates, events]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (eventFilter === 'all') return events;
    if (eventFilter === 'upcoming') return events.filter(e => e.status === 'Rejalashtirilgan');
    if (eventFilter === 'ongoing') return events.filter(e => e.status === 'Davom etmoqda');
    return events;
  }, [events, eventFilter]);

  // Filtered Achievements (Approved only)
  const publicAchievements = useMemo(() => {
    const list = achievements.filter(a => a.status === 'Tasdiqlangan');
    if (achievementCategory === 'all') return list;
    return list.filter(a => a.category === achievementCategory);
  }, [achievements, achievementCategory]);

  // Top 3 Active Students designated by Admin
  const topActiveStudents = useMemo(() => {
    const designated = students.filter(s => s.isTopStudent && !s.isDeleted);
    return designated
      .sort((a, b) => (a.topStudentRank || 99) - (b.topStudentRank || 99))
      .slice(0, 3);
  }, [students]);

  const canManageTopStudents =
    currentUser?.role === 'superAdmin' ||
    (currentUser?.role === 'admin' && hasPermission(currentUser, 'students', 'edit'));

  return (
    <div className="w-full space-y-16 pb-16">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-b from-white via-slate-50 to-blue-50/40 border border-slate-200/80 shadow-xs p-6 sm:p-10 lg:p-14">
        {/* Subtle decorative background elements */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 rounded-full bg-blue-100/50 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-72 h-72 rounded-full bg-emerald-100/40 blur-3xl pointer-events-none" />
        
        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          {/* Institutional Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-900 text-xs font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Toshkent kimyo-texnologiya instituti Yangiyer filiali</span>
          </div>

          {/* Main Hero Headings */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              IQTIDORLI TALABALAR
            </h1>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-blue-900 tracking-tight">
              ILMIY VA INNOVATSION PLATFORMASI
            </h2>
          </div>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Iqtidorli yoshlarni aniqlash, qo‘llab-quvvatlash va ularning ilmiy, innovatsion hamda ijodiy faoliyatini rivojlantirish uchun yagona raqamli platforma.
          </p>

          {/* CTA Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {currentUser ? (
              <a
                href="#dashboard"
                onClick={e => {
                  e.preventDefault();
                  // Handled by parent view toggle
                  window.location.hash = '#dashboard';
                }}
                className="min-h-[44px] px-6 py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-sm shadow-xs transition-all flex items-center gap-2 active:scale-[0.99]"
              >
                <span>Mening kabinetim</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                className="min-h-[44px] px-6 py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-sm shadow-xs transition-all flex items-center gap-2 active:scale-[0.99]"
              >
                <span>Platformaga kirish</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <a
              href="#tadbirlar"
              className="min-h-[44px] px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-sm shadow-2xs transition-all flex items-center gap-2"
            >
              <Calendar className="w-4 h-4 text-blue-900" />
              <span>Tadbirlarni ko‘rish</span>
            </a>

            {!currentUser && (
              <button
                type="button"
                onClick={onOpenRegister}
                className="min-h-[44px] px-5 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-sm transition-all"
              >
                Ro‘yxatdan o‘tish
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. REAL STATISTICS SECTION */}
      {/* ========================================================================= */}
      <section id="statistika" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block">
              Rasmiy hisobot
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              Platforma real statistikasi
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Cloud Firestore real-time ma'lumotlari asosida
          </span>
        </div>

        {/* Dynamic Metric Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="bg-white p-4 rounded-2xl border border-slate-200 animate-pulse space-y-3"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-200" />
                <div className="h-6 w-12 bg-slate-200 rounded" />
                <div className="h-3 w-16 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
            {/* Students */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center mb-2">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {stats.studentsCount}
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Talaba</p>
              </div>
            </div>

            {/* Supervisors */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-purple-300 transition-all flex flex-col justify-between">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center mb-2">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {stats.supervisorsCount}
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Ilmiy rahbar</p>
              </div>
            </div>

            {/* Projects */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-2">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {stats.projectsCount}
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Loyiha</p>
              </div>
            </div>

            {/* Startups */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-amber-300 transition-all flex flex-col justify-between">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-2">
                <Rocket className="w-4 h-4" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {stats.startupsCount}
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Startap</p>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-rose-300 transition-all flex flex-col justify-between">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center mb-2">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {stats.achievementsCount}
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Yutuq</p>
              </div>
            </div>

            {/* Certificates */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-teal-300 transition-all flex flex-col justify-between">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center mb-2">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {stats.certificatesCount}
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Sertifikat</p>
              </div>
            </div>

            {/* Events */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 transition-all flex flex-col justify-between col-span-2 sm:col-span-1">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-900 flex items-center justify-center mb-2">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {stats.eventsCount}
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Tadbir</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 2.5. ENG FAOL TALABALAR (TOP-3) - ADMINLAR TOMONIDAN BELGILANADI */}
      {/* ========================================================================= */}
      <section id="faol-talabalar" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-600" />
                <span>Oliy e’tirof va iqtidor</span>
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Eng faol talabalar (Top-3)
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Universitet ma’muriyati tomonidan ilmiy, innovatsion va jamoat faoliyati bo‘yicha e’tirof etilgan yetakchi talabalar
            </p>
          </div>

          {canManageTopStudents && (
            <button
              type="button"
              onClick={onOpenManageTopStudents}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all self-start sm:self-auto cursor-pointer active:scale-[0.99]"
              title="Eng faol talabalarni belgilash yoki o‘zgartirish"
            >
              <Trophy className="w-4 h-4 text-slate-950" />
              <span>{topActiveStudents.length > 0 ? 'Top talabalarni tahrirlash' : 'Top talabalarni belgilash'}</span>
            </button>
          )}
        </div>

        {topActiveStudents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {topActiveStudents.map(st => {
              const rank = st.topStudentRank || 1;
              const supervisor = supervisors.find(s => s.id === st.supervisorId);
              const approvedAchCount = achievements.filter(
                a => a.studentId === st.id && a.status === 'Tasdiqlangan'
              ).length;
              const approvedProjCount = projects.filter(
                p => p.studentId === st.id && p.status === 'Tasdiqlangan'
              ).length;
              const certCount = certificates.filter(
                c => c.studentId === st.id || (c.studentName && c.studentName.toLowerCase() === st.fullName.toLowerCase())
              ).length;

              const isFirst = rank === 1;
              const isSecond = rank === 2;

              const borderStyle = isFirst
                ? 'border-amber-300 ring-1 ring-amber-400/20 bg-linear-to-b from-amber-50/50 via-white to-amber-50/20'
                : isSecond
                ? 'border-slate-300 ring-1 ring-slate-300/40 bg-linear-to-b from-slate-50/70 via-white to-slate-50/30'
                : 'border-amber-700/30 ring-1 ring-amber-700/10 bg-linear-to-b from-amber-900/5 via-white to-amber-900/5';

              const medalBadge = isFirst ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-linear-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-2xs">
                  <span>🥇 1-o‘rin</span>
                  <span className="opacity-80">• Yil talabasi</span>
                </span>
              ) : isSecond ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-linear-to-r from-slate-300 to-slate-200 text-slate-900 shadow-2xs">
                  <span>🥈 2-o‘rin</span>
                  <span className="opacity-80">• Yetakchi talaba</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-linear-to-r from-amber-700 to-amber-600 text-white shadow-2xs">
                  <span>🥉 3-o‘rin</span>
                  <span className="opacity-80">• Faol talaba</span>
                </span>
              );

              const avatarRing = isFirst
                ? 'ring-4 ring-amber-400/40'
                : isSecond
                ? 'ring-4 ring-slate-300'
                : 'ring-4 ring-amber-700/30';

              return (
                <div
                  key={st.id}
                  className={`rounded-3xl border ${borderStyle} p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative group`}
                >
                  <div className="space-y-4">
                    {/* Header: Medal and Course/Group */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {medalBadge}
                      <span className="text-[11px] font-mono text-slate-500 bg-white/90 px-2 py-0.5 rounded-md border border-slate-200/80">
                        {st.course}-kurs • {st.group}
                      </span>
                    </div>

                    {/* Student Info */}
                    <div className="flex items-center gap-4 pt-1">
                      <div
                        className={`w-16 h-16 rounded-2xl bg-blue-900 text-white font-black text-xl flex items-center justify-center shrink-0 overflow-hidden shadow-xs ${avatarRing}`}
                      >
                        {st.avatarUrl || st.photoURL ? (
                          <img
                            src={st.avatarUrl || st.photoURL}
                            alt={st.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (st.fullName || 'T').charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4
                          onClick={() => onOpenStudentProfile && onOpenStudentProfile(st.id)}
                          className="text-base sm:text-lg font-black text-slate-900 hover:text-blue-900 cursor-pointer transition-colors leading-snug line-clamp-1"
                          title={st.fullName}
                        >
                          {st.fullName}
                        </h4>
                        <p className="text-xs text-slate-600 truncate mt-0.5" title={st.facultyOrField}>
                          {st.facultyOrField}
                        </p>
                        {supervisor && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5" title={supervisor.fullName}>
                            Rahbar: <span className="font-semibold text-slate-700">{supervisor.fullName}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Admin citation / reason */}
                    {st.topStudentReason && (
                      <div className="p-3 rounded-2xl bg-white/95 border border-slate-200/90 text-xs text-slate-700 space-y-1 shadow-2xs">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>Ma’muriyat e’tirofi</span>
                        </div>
                        <p className="italic font-medium leading-relaxed text-slate-800">
                          “{st.topStudentReason}”
                        </p>
                      </div>
                    )}

                    {/* Activity summary pills */}
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="bg-white/95 border border-slate-200/80 rounded-xl p-2 shadow-2xs">
                        <p className="text-base font-black text-slate-900">{approvedAchCount}</p>
                        <p className="text-[10px] font-semibold text-slate-500">Yutuqlar</p>
                      </div>
                      <div className="bg-white/95 border border-slate-200/80 rounded-xl p-2 shadow-2xs">
                        <p className="text-base font-black text-slate-900">{approvedProjCount}</p>
                        <p className="text-[10px] font-semibold text-slate-500">Loyihalar</p>
                      </div>
                      <div className="bg-white/95 border border-slate-200/80 rounded-xl p-2 shadow-2xs">
                        <p className="text-base font-black text-slate-900">{certCount}</p>
                        <p className="text-[10px] font-semibold text-slate-500">Sertifikatlar</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Action */}
                  <div className="pt-4 mt-4 border-t border-slate-200/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenStudentProfile && onOpenStudentProfile(st.id)}
                      className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-blue-900 border border-slate-200/90 hover:border-blue-300 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
                    >
                      <span>To‘liq portfolioni ko‘rish</span>
                      <ChevronRight className="w-4 h-4 text-blue-900" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state for Top Students */
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 text-center space-y-4 shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-2xs">
              <Trophy className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h4 className="text-base sm:text-lg font-bold text-slate-900">
                Eng faol 3 ta talaba ma’muriyat tomonidan saralanmoqda
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Toshkent kimyo-texnologiya instituti Yangiyer filiali iqtidorli talabalari orasidan eng yuqori ilmiy natijaga erishgan 3 nafar talaba bu yerda rasman e’lon qilinadi.
              </p>
            </div>
            {canManageTopStudents && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenManageTopStudents}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Trophy className="w-4 h-4" />
                  <span>3 ta talabani hoziroq belgilash</span>
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. TADBIRLAR SECTION */}
      {/* ========================================================================= */}
      <section id="tadbirlar" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Ilmiy jarayonlar
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              Yaqin tadbirlar va tanlovlar
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Universitet konferensiyalari, seminarlar, olimpiadalar va startap tanlovlari
            </p>
          </div>

          {/* Event Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setEventFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                eventFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Barchasi ({events.length})
            </button>
            <button
              type="button"
              onClick={() => setEventFilter('upcoming')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                eventFilter === 'upcoming'
                  ? 'bg-white text-blue-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rejalashtirilgan
            </button>
            <button
              type="button"
              onClick={() => setEventFilter('ongoing')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                eventFilter === 'ongoing'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Davom etmoqda
            </button>
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map(event => {
              const participantCount = event.participantIds?.length || 0;
              const isUpcoming = event.status === 'Rejalashtirilgan';
              const isOngoing = event.status === 'Davom etmoqda';

              return (
                <div
                  key={event.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all p-5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Status & Date badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                          isOngoing
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isUpcoming
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {isOngoing && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
                        <span>{event.status}</span>
                      </span>

                      <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{event.date}</span>
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                      {event.title}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>

                    {/* Metadata items */}
                    <div className="space-y-1.5 pt-1 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Vaqt: {event.time || 'Belgilanmagan'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">Manzil: {event.location || 'Filial binosi'}</span>
                      </div>
                      {event.deadline && (
                        <div className="flex items-center gap-2 text-rose-600">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>Muddati: {event.deadline}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer with Buttons */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="text-xs text-slate-500">
                      <span>Ishtirokchilar: </span>
                      <strong className="text-slate-800 font-bold">{participantCount}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenEventDetail(event)}
                        className="px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        Batafsil
                      </button>

                      {currentUser?.role === 'student' ? (
                        <button
                          type="button"
                          onClick={() => onOpenEventDetail(event)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors"
                        >
                          Ro‘yxatdan o‘tish
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={onOpenLogin}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          title="Ro‘yxatdan o‘tish uchun tizimga kiring"
                        >
                          Qatnashish
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold">Ushbu holatda tadbirlar mavjud emas</p>
            <p className="text-xs text-slate-400 mt-1">Yangi tadbirlar e'lon qilinganda bu yerda ko‘rinadi</p>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 5. UMUMIY YUTUQLAR SECTION */}
      {/* ========================================================================= */}
      {achievements.length > 0 && (
        <section id="yutuqlar" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                  Muvaffaqiyatlar
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                Talabalar yutuqlari va e'tiroflar
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Respublika va xalqaro olimpiadalar, tanlovlar, ilmiy stipendiyalar
              </p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
              {['all', 'Olimpiada', 'Tanlov', 'Stipendiya', 'Konferensiya'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setAchievementCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg border transition-colors ${
                    achievementCategory === cat
                      ? 'bg-rose-50 text-rose-800 border-rose-200 font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat === 'all' ? 'Barchasi' : cat}
                </button>
              ))}
            </div>
          </div>

          {publicAchievements.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicAchievements.slice(0, 6).map(ach => (
                <div
                  key={ach.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        {ach.category}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{ach.date}</span>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug line-clamp-2">
                      {ach.title}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {ach.description}
                    </p>

                    <div className="text-xs text-slate-500 pt-1">
                      Talaba: <strong className="text-slate-800 font-semibold">{ach.studentName}</strong>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Tasdiqlangan</span>
                    </span>
                    {ach.fileUrl && (
                      <span className="text-[11px] text-blue-800 font-semibold flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        <span>Hujjat ilova qilingan</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
              <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">Ushbu toifada yutuqlar topilmadi</p>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* 8. PLATFORMA HAQIDA / UNIVERSITY HIGHLIGHTS */}
      {/* ========================================================================= */}
      <section id="haqida" className="space-y-6">
        <div className="border-b border-slate-200 pb-3">
          <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block">
            Raqamli ekotizim
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
            Platformaning asosiy imkoniyatlari
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Iqtidorli talabalar reyestri</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              18 ta yo‘nalish bo‘yicha talabalar faoliyatini tizimli qayd etish, kurslar va guruhlar bo‘yicha tahlil qilish.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Ilmiy ustoz-shogird tizimi</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kafedra ilmiy rahbarlari va talabalar o‘rtasidagi hamkorlik, loyihalarni onlayn taqrizlash va tasdiqlash.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Rocket className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Startap va innovatsiyalar</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kimyo-texnologiya, biotexnologiya va qishloq xo‘jaligi yo‘nalishlaridagi innovatsion loyihalarni qo‘llab-quvvatlash.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Elektron verifikatsiya</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              A4 Landscape formatdagi davlat andazasiga mos diplom va sertifikatlar, QR-kodli elektron tasdiqlash tizimi.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
