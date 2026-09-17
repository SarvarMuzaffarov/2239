import React, { useState } from 'react';
import {
  User,
  Users,
  FolderGit2,
  Rocket,
  Trophy,
  FileText,
  Phone,
  Mail,
  Building,
  GraduationCap,
  Calendar,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { EmptyState } from './EmptyState';
import { ProfilePhotoUploader } from './ProfilePhotoUploader';
import {
  updateSupervisorSelfProfilePhoto,
  updateProjectStatus,
  updateAchievementStatus,
} from '../services/firestoreService';
import { generateStudentPortfolioPdf } from '../lib/portfolioGenerator';
import { DirectionSelect } from './DirectionSelect';
import { canonicalizeDirection } from '../constants/directions';
import { Search } from 'lucide-react';
import type {
  UserAccount,
  SupervisorProfile,
  StudentProfile,
  ProjectOrStartup,
  Achievement,
  CertificateItem,
  EventItem,
} from '../types';

interface Props {
  currentUser: UserAccount;
  supervisors: SupervisorProfile[];
  students: StudentProfile[];
  projects: ProjectOrStartup[];
  achievements: Achievement[];
  certificates?: CertificateItem[];
  events?: EventItem[];
  onNotify?: (type: 'success' | 'error' | 'info', msg: string) => void;
  onOpenPdf: (url: string, name?: string, size?: number, title?: string) => void;
  onOpenStudentProfile?: (studentId: string) => void;
  onUpdateCurrentUser?: (updated: UserAccount) => void;
}

type TabType = 'profile' | 'students' | 'projects' | 'startups' | 'achievements';

export const SupervisorDashboard: React.FC<Props> = ({
  currentUser,
  supervisors = [],
  students = [],
  projects = [],
  achievements = [],
  certificates = [],
  events = [],
  onNotify,
  onOpenPdf,
  onOpenStudentProfile,
  onUpdateCurrentUser,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('students');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [generatingPortfolioStudentId, setGeneratingPortfolioStudentId] = useState<string | null>(null);

  // Reject modal state
  const [rejectModalItem, setRejectModalItem] = useState<{
    id: string;
    type: 'project' | 'achievement';
    title: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [isRejectSubmitting, setIsRejectSubmitting] = useState(false);

  // Match supervisor by id, userId or phone
  const myProfile = supervisors.find(
    s => s.id === currentUser.id || s.userId === currentUser.id || s.phone === currentUser.phone
  );

  const effectivePhotoUrl =
    myProfile?.avatarUrl ||
    myProfile?.photoURL ||
    currentUser.avatarUrl ||
    currentUser.photoURL;

  const supervisorId = myProfile?.id || '';

  // Assigned students to this supervisor
  const myStudents = students.filter(s => s.supervisorId === supervisorId);
  const myStudentIds = new Set(myStudents.map(s => s.id));

  // Search & direction filter for supervisor's students
  const [studentSearch, setStudentSearch] = useState('');
  const [studentDirectionFilter, setStudentDirectionFilter] = useState('all');

  const filteredMyStudents = myStudents.filter(student => {
    const canonical = canonicalizeDirection(student.facultyOrField);
    if (studentDirectionFilter !== 'all' && canonical !== studentDirectionFilter && student.facultyOrField !== studentDirectionFilter) {
      return false;
    }
    if (studentSearch.trim()) {
      const q = studentSearch.trim().toLowerCase();
      const matchName = student.fullName.toLowerCase().includes(q);
      const matchPhone = student.phone.toLowerCase().includes(q);
      const matchGroup = (student.group || '').toLowerCase().includes(q);
      const matchDir = canonical.toLowerCase().includes(q);
      return matchName || matchPhone || matchGroup || matchDir;
    }
    return true;
  });

  // Projects and achievements by assigned students
  const myProjects = projects.filter(
    p => p.type === 'loyiha' && (p.supervisorId === supervisorId || myStudentIds.has(p.studentId))
  );
  const myStartups = projects.filter(
    p => p.type === 'startap' && (p.supervisorId === supervisorId || myStudentIds.has(p.studentId))
  );
  const myAchievements = achievements.filter(a => myStudentIds.has(a.studentId));

  const handleApproveProject = async (proj: ProjectOrStartup) => {
    setActionLoadingId(proj.id);
    try {
      await updateProjectStatus(
        proj.id,
        'Tasdiqlangan',
        'Ilmiy rahbar tomonidan ma’qullandi',
        { id: currentUser.id, fullName: currentUser.fullName, role: 'supervisor' }
      );
      onNotify?.('success', `«${proj.title}» muvaffaqiyatli tasdiqlandi!`);
    } catch (err: any) {
      onNotify?.('error', err.message || 'Loyihani tasdiqlashda xatolik.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApproveAchievement = async (ach: Achievement) => {
    setActionLoadingId(ach.id);
    try {
      await updateAchievementStatus(
        ach.id,
        'Tasdiqlangan',
        'Ilmiy rahbar tomonidan ma’qullandi',
        { id: currentUser.id, fullName: currentUser.fullName, role: 'supervisor' }
      );
      onNotify?.('success', `«${ach.title}» yutug‘i tasdiqlandi!`);
    } catch (err: any) {
      onNotify?.('error', err.message || 'Yutuqni tasdiqlashda xatolik.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenRejectModal = (id: string, type: 'project' | 'achievement', title: string) => {
    setRejectModalItem({ id, type, title });
    setRejectReason('');
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalItem) return;
    setIsRejectSubmitting(true);
    try {
      if (rejectModalItem.type === 'project') {
        await updateProjectStatus(
          rejectModalItem.id,
          'Rad etilgan',
          rejectReason.trim() || 'Ilmiy talablarga to‘liq javob bermadi',
          { id: currentUser.id, fullName: currentUser.fullName, role: 'supervisor' }
        );
      } else {
        await updateAchievementStatus(
          rejectModalItem.id,
          'Rad etilgan',
          rejectReason.trim() || 'Tasdiqlovchi hujjat yetarli emas',
          { id: currentUser.id, fullName: currentUser.fullName, role: 'supervisor' }
        );
      }
      onNotify?.('info', `«${rejectModalItem.title}» rad etildi.`);
      setRejectModalItem(null);
    } catch (err: any) {
      onNotify?.('error', err.message || 'Rad etishda xatolik yuz berdi.');
    } finally {
      setIsRejectSubmitting(false);
    }
  };

  const handleDownloadStudentPortfolio = async (student: StudentProfile) => {
    setGeneratingPortfolioStudentId(student.id);
    try {
      const studentProjects = projects.filter(p => p.studentId === student.id && p.type === 'loyiha');
      const studentStartups = projects.filter(p => p.studentId === student.id && p.type === 'startap');
      const studentAchievements = achievements.filter(a => a.studentId === student.id);
      const studentCertificates = (certificates || []).filter(c => c.studentId === student.id);
      const studentEvents = (events || []).filter(e => e.participantIds?.includes(student.id));

      await generateStudentPortfolioPdf({
        student,
        supervisor: myProfile,
        projects: studentProjects,
        startups: studentStartups,
        achievements: studentAchievements,
        certificates: studentCertificates,
        events: studentEvents,
      });
      onNotify?.('success', `${student.fullName} portfoliosi (PDF) muvaffaqiyatli shakllantirildi!`);
    } catch (err: any) {
      onNotify?.('error', err.message || 'Portfolio PDF shakllantirishda xatolik.');
    } finally {
      setGeneratingPortfolioStudentId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-900 text-white flex items-center justify-center text-xl font-bold shadow-xs overflow-hidden shrink-0">
            {effectivePhotoUrl ? (
              <img
                src={effectivePhotoUrl}
                alt={currentUser.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              currentUser.fullName.charAt(0)
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{currentUser.fullName}</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-purple-100 text-purple-800 rounded-lg">
                Ilmiy rahbar
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {myProfile?.position || 'O‘qituvchi / Ilmiy xodim'} • {myProfile?.department || 'Kafedra'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <div className="text-center px-3 border-r border-slate-200">
            <span className="text-xs text-slate-500 block">Talabalar</span>
            <strong className="text-lg text-slate-900">{myStudents.length}</strong>
          </div>
          <div className="text-center px-3 border-r border-slate-200">
            <span className="text-xs text-slate-500 block">Loyihalar</span>
            <strong className="text-lg text-slate-900">{myProjects.length}</strong>
          </div>
          <div className="text-center px-3">
            <span className="text-xs text-slate-500 block">Yutuqlar</span>
            <strong className="text-lg text-slate-900">{myAchievements.length}</strong>
          </div>
        </div>
      </div>

      {/* Mobile Tab Select Dropdown (< sm screens) */}
      <div className="sm:hidden">
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
          Bo‘limni tanlang:
        </label>
        <div className="relative">
          <select
            value={activeTab}
            onChange={e => setActiveTab(e.target.value as TabType)}
            className="w-full min-h-[44px] px-3.5 py-2.5 text-base bg-white border border-slate-200 rounded-xl font-medium text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-purple-900"
          >
            <option value="students">👥 Biriktirilgan talabalar ({myStudents.length})</option>
            <option value="projects">📂 Talabalar loyihalari ({myProjects.length})</option>
            <option value="startups">🚀 Startaplar ({myStartups.length})</option>
            <option value="achievements">🏆 Yutuqlar ({myAchievements.length})</option>
            <option value="profile">👤 Profil ma'lumotlarim</option>
          </select>
        </div>
      </div>

      {/* Tabs (tablets & desktop) */}
      <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
        {[
          { id: 'students', label: `Biriktirilgan talabalar (${myStudents.length})`, icon: Users },
          { id: 'projects', label: `Talabalar loyihalari (${myProjects.length})`, icon: FolderGit2 },
          { id: 'startups', label: `Startaplar (${myStartups.length})`, icon: Rocket },
          { id: 'achievements', label: `Yutuqlar (${myAchievements.length})`, icon: Trophy },
          { id: 'profile', label: 'Profil ma\'lumotlarim', icon: User },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`min-h-[44px] flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: STUDENTS */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Menga biriktirilgan iqtidorli talabalar</h2>
              <p className="text-xs text-slate-500">Sizning ilmiy rahbarligingiz ostida faoliyat yuritayotgan talabalar ro‘yxati.</p>
            </div>
          </div>

          {/* Filter and Search controls */}
          {myStudents.length > 0 && (
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  placeholder="Talaba F.I.Sh., telefon yoki guruhi bo‘yicha qidiring..."
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-900"
                />
              </div>

              <div>
                <DirectionSelect
                  id="supervisor-student-direction-filter"
                  value={studentDirectionFilter}
                  onChange={setStudentDirectionFilter}
                  showAllOption
                  allOptionLabel="Barcha yo‘nalishlar"
                  placeholder="Yo‘nalish bo‘yicha saralash..."
                />
              </div>
            </div>
          )}

          {myStudents.length === 0 ? (
            <EmptyState
              title="Biriktirilgan talabalar yo'q"
              description="Hozircha sizga biriktirilgan talabalar mavjud emas. Talabalar ro'yxatdan o'tganda yoki admin biriktirganda shu yerda ko'rinadi."
            />
          ) : filteredMyStudents.length === 0 ? (
            <EmptyState
              title="Mos talaba topilmadi"
              description="Qidiruv yoki tanlangan yo‘nalish bo‘yicha biriktirilgan talaba topilmadi."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMyStudents.map(student => (
                <div key={student.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                        {student.avatarUrl || student.photoURL ? (
                          <img
                            src={student.avatarUrl || student.photoURL}
                            alt={student.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          student.fullName.charAt(0)
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{student.fullName}</h3>
                        <p className="text-xs text-slate-500 font-mono">{student.phone}</p>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                      <div className="break-words">Yo‘nalish: <strong>{canonicalizeDirection(student.facultyOrField) || student.facultyOrField || "Ko'rsatilmagan"}</strong></div>
                      <div>Kurs va guruh: <strong>{student.course}-kurs, {student.group}</strong></div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-400">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDownloadStudentPortfolio(student)}
                        disabled={generatingPortfolioStudentId === student.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                        title="Talaba portfoliosini PDF yuklab olish"
                      >
                        {generatingPortfolioStudentId === student.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>Portfolio (PDF)</span>
                      </button>

                      <button
                        type="button"
                        id={`supervisor-view-student-${student.id}`}
                        onClick={() => onOpenStudentProfile?.(student.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Profil</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROJECTS */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Talabalarimning ilmiy loyihalari</h2>
            <p className="text-xs text-slate-500">Sizning ilmiy rahbarligingiz ostidagi talabalar tomonidan topshirilgan loyihalar.</p>
          </div>

          {myProjects.length === 0 ? (
            <EmptyState title="Loyihalar mavjud emas" description="Talabalaringiz hali ilmiy loyiha taqdim etishmagan." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myProjects.map(proj => (
                <div key={proj.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-base font-bold text-slate-900">{proj.title}</h3>
                      <span
                        className={`px-2.5 py-0.5 text-xs font-semibold rounded-md flex items-center gap-1 shrink-0 ${
                          proj.status === 'Tasdiqlangan'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : proj.status === 'Rad etilgan'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {proj.status === 'Tasdiqlangan' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : proj.status === 'Rad etilgan' ? (
                          <XCircle className="w-3 h-3 text-rose-600" />
                        ) : (
                          <Clock className="w-3 h-3 text-amber-600" />
                        )}
                        <span>{proj.status}</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-3 line-clamp-3">{proj.description}</p>
                    <div className="space-y-1 text-xs text-slate-500 mb-3">
                      <div>Talaba: <strong className="text-slate-900">{proj.studentName}</strong></div>
                      <div>Yo‘nalish: {proj.field}</div>
                      <div>Mualliflar: {proj.authorNames}</div>
                    </div>
                    {proj.reviewNotes && (
                      <div className="mb-3 text-xs bg-slate-50 p-2.5 rounded-xl text-slate-600 border border-slate-200">
                        <span className="font-semibold text-slate-700">Izoh: </span>{proj.reviewNotes}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    {proj.fileUrl ? (
                      <button
                        onClick={() => onOpenPdf(proj.fileDataUrl || proj.fileUrl!, proj.fileName, proj.fileSize, proj.title)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-red-600" />
                        <span>PDF</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">PDF yo‘q</span>
                    )}

                    <div className="flex items-center gap-1.5">
                      {proj.status !== 'Tasdiqlangan' && (
                        <button
                          type="button"
                          onClick={() => handleApproveProject(proj)}
                          disabled={actionLoadingId === proj.id}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                        >
                          {actionLoadingId === proj.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Tasdiqlash</span>
                        </button>
                      )}
                      {proj.status !== 'Rad etilgan' && (
                        <button
                          type="button"
                          onClick={() => handleOpenRejectModal(proj.id, 'project', proj.title)}
                          disabled={actionLoadingId === proj.id}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Rad etish</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STARTUPS */}
      {activeTab === 'startups' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Talabalar startaplari</h2>
            <p className="text-xs text-slate-500">Talabalaringiz tomonidan ishlab chiqilayotgan startap tashabbuslari.</p>
          </div>

          {myStartups.length === 0 ? (
            <EmptyState title="Startaplar mavjud emas" description="Talabalaringiz tomonidan startaplar yuklanmagan." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myStartups.map(item => (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                      <span
                        className={`px-2.5 py-0.5 text-xs font-semibold rounded-md flex items-center gap-1 shrink-0 ${
                          item.status === 'Tasdiqlangan'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : item.status === 'Rad etilgan'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {item.status === 'Tasdiqlangan' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : item.status === 'Rad etilgan' ? (
                          <XCircle className="w-3 h-3 text-rose-600" />
                        ) : (
                          <Clock className="w-3 h-3 text-amber-600" />
                        )}
                        <span>{item.status}</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-3 line-clamp-3">{item.description}</p>
                    <div className="space-y-1 text-xs text-slate-500 mb-3">
                      <div>Muallif talaba: <strong className="text-slate-900">{item.studentName}</strong></div>
                      <div>Soha: {item.field}</div>
                    </div>
                    {item.reviewNotes && (
                      <div className="mb-3 text-xs bg-slate-50 p-2.5 rounded-xl text-slate-600 border border-slate-200">
                        <span className="font-semibold text-slate-700">Izoh: </span>{item.reviewNotes}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    {item.fileUrl ? (
                      <button
                        onClick={() => onOpenPdf(item.fileDataUrl || item.fileUrl!, item.fileName, item.fileSize, item.title)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-red-600" />
                        <span>PDF</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">PDF yo‘q</span>
                    )}

                    <div className="flex items-center gap-1.5">
                      {item.status !== 'Tasdiqlangan' && (
                        <button
                          type="button"
                          onClick={() => handleApproveProject(item)}
                          disabled={actionLoadingId === item.id}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                        >
                          {actionLoadingId === item.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Tasdiqlash</span>
                        </button>
                      )}
                      {item.status !== 'Rad etilgan' && (
                        <button
                          type="button"
                          onClick={() => handleOpenRejectModal(item.id, 'project', item.title)}
                          disabled={actionLoadingId === item.id}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Rad etish</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ACHIEVEMENTS */}
      {activeTab === 'achievements' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Talabalar yutuqlari</h2>
            <p className="text-xs text-slate-500">Talabalaringiz erishgan tanlov, olimpiada va musobaqa natijalari.</p>
          </div>

          {myAchievements.length === 0 ? (
            <EmptyState title="Yutuqlar mavjud emas" description="Talabalaringiz hali yutuq yuklamagan." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myAchievements.map(ach => (
                <div key={ach.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-50 text-amber-800 rounded-md border border-amber-200">
                        {ach.category}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 text-xs font-semibold rounded-md flex items-center gap-1 shrink-0 ${
                          ach.status === 'Tasdiqlangan'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : ach.status === 'Rad etilgan'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {ach.status === 'Tasdiqlangan' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : ach.status === 'Rad etilgan' ? (
                          <XCircle className="w-3 h-3 text-rose-600" />
                        ) : (
                          <Clock className="w-3 h-3 text-amber-600" />
                        )}
                        <span>{ach.status}</span>
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">{ach.title}</h3>
                    <p className="text-xs text-slate-600 mb-2 line-clamp-2">{ach.description}</p>
                    <p className="text-xs text-slate-500 mb-2">Talaba: <strong className="text-slate-900">{ach.studentName}</strong></p>
                    {ach.reviewNotes && (
                      <div className="mb-2 text-xs bg-slate-50 p-2 rounded-lg text-slate-600 border border-slate-200">
                        <span className="font-semibold text-slate-700">Izoh: </span>{ach.reviewNotes}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 mt-3 flex flex-wrap items-center justify-between gap-2">
                    {ach.fileUrl ? (
                      <button
                        onClick={() => onOpenPdf(ach.fileDataUrl || ach.fileUrl!, ach.fileName, ach.fileSize, ach.title)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-red-600" />
                        <span>PDF</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">PDF yo‘q</span>
                    )}

                    <div className="flex items-center gap-1.5">
                      {ach.status !== 'Tasdiqlangan' && (
                        <button
                          type="button"
                          onClick={() => handleApproveAchievement(ach)}
                          disabled={actionLoadingId === ach.id}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                        >
                          {actionLoadingId === ach.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Tasdiqlash</span>
                        </button>
                      )}
                      {ach.status !== 'Rad etilgan' && (
                        <button
                          type="button"
                          onClick={() => handleOpenRejectModal(ach.id, 'achievement', ach.title)}
                          disabled={actionLoadingId === ach.id}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Rad etish</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-2xl">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Ilmiy rahbar rasmiy anketasi</h2>

          {/* Profil rasmi yuklash/o'chirish */}
          <div className="mb-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
              Profil rasmi
            </h3>
            <ProfilePhotoUploader
              currentPhotoUrl={effectivePhotoUrl}
              userName={currentUser.fullName}
              userId={currentUser.id}
              canEdit={true}
              onPhotoUploaded={async url => {
                await updateSupervisorSelfProfilePhoto(
                  myProfile?.id || currentUser.id,
                  currentUser.id,
                  url,
                  currentUser
                );
                onUpdateCurrentUser?.({
                  ...currentUser,
                  avatarUrl: url,
                  photoURL: url,
                });
              }}
              onPhotoDeleted={async () => {
                await updateSupervisorSelfProfilePhoto(
                  myProfile?.id || currentUser.id,
                  currentUser.id,
                  '',
                  currentUser
                );
                onUpdateCurrentUser?.({
                  ...currentUser,
                  avatarUrl: '',
                  photoURL: '',
                });
              }}
              onNotify={onNotify}
              size="lg"
            />
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 block">F.I.Sh.</span>
              <span className="text-base font-bold text-slate-900">{currentUser.fullName}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 block">Telefon raqami</span>
                <span className="text-sm font-mono font-semibold text-slate-900">{currentUser.phone}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 block">Elektron pochta</span>
                <span className="text-sm font-semibold text-slate-900">{myProfile?.email || 'Kiritilmagan'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 block">Lavozimi</span>
                <span className="text-sm font-semibold text-slate-900">{myProfile?.position || 'Kafedra o‘qituvchisi'}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 block">Ilmiy darajasi</span>
                <span className="text-sm font-semibold text-slate-900">{myProfile?.academicDegree || 'Magistr / PhD / DSc'}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 block">Kafedra / Bo‘lim</span>
              <span className="text-sm font-semibold text-slate-900">{myProfile?.department || 'Kafedra belgilanmagan'}</span>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <XCircle className="w-5 h-5" />
                <h3 className="font-bold text-slate-900">Rad etish sababi</h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                disabled={isRejectSubmitting}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              «<strong className="text-slate-900">{rejectModalItem.title}</strong>» nomli {rejectModalItem.type === 'project' ? 'loyiha/startap' : 'yutuq'}ni rad etish sababini kiriting:
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sabab yoki tavsiya (ixtiyoriy)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Masalan: Maqola/hujjat to‘liq emas, qayta ko‘rib chiqilsin..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalItem(null)}
                  disabled={isRejectSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isRejectSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isRejectSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                  <span>Rad etishni tasdiqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
