import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Trophy,
  Award,
  Sparkles,
  Search,
  CheckCircle2,
  Trash2,
  User,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';
import type {
  UserAccount,
  StudentProfile,
  SupervisorProfile,
  ProjectOrStartup,
  Achievement,
  TopStudentAssignment,
} from '../types';
import { saveTopActiveStudents } from '../services/firestoreService';
import { hasPermission } from '../lib/permissions';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  students: StudentProfile[];
  supervisors: SupervisorProfile[];
  projects: ProjectOrStartup[];
  achievements: Achievement[];
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

interface SlotState {
  studentId: string;
  reason: string;
}

export const TopStudentsManageModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  students,
  supervisors,
  projects,
  achievements,
  onNotify,
}) => {
  const [slot1, setSlot1] = useState<SlotState>({ studentId: '', reason: '' });
  const [slot2, setSlot2] = useState<SlotState>({ studentId: '', reason: '' });
  const [slot3, setSlot3] = useState<SlotState>({ studentId: '', reason: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQueries, setSearchQueries] = useState<{ [key: number]: string }>({
    1: '',
    2: '',
    3: '',
  });

  // Only active (non-deleted) students
  const activeStudents = useMemo(() => {
    return students.filter(s => !s.isDeleted);
  }, [students]);

  // Pre-fill existing top students when modal opens
  useEffect(() => {
    if (isOpen) {
      const top1 = activeStudents.find(s => s.isTopStudent && s.topStudentRank === 1);
      const top2 = activeStudents.find(s => s.isTopStudent && s.topStudentRank === 2);
      const top3 = activeStudents.find(s => s.isTopStudent && s.topStudentRank === 3);

      setSlot1({
        studentId: top1 ? top1.id : '',
        reason: top1?.topStudentReason || '',
      });
      setSlot2({
        studentId: top2 ? top2.id : '',
        reason: top2?.topStudentReason || '',
      });
      setSlot3({
        studentId: top3 ? top3.id : '',
        reason: top3?.topStudentReason || '',
      });
      setSearchQueries({ 1: '', 2: '', 3: '' });
    }
  }, [isOpen, activeStudents]);

  // Compute student accomplishment scores for auto-recommendation
  const studentScores = useMemo(() => {
    const scores = new Map<string, { totalApproved: number; achievementsCount: number; projectsCount: number }>();

    activeStudents.forEach(st => {
      const stAch = achievements.filter(a => a.studentId === st.id && a.status === 'Tasdiqlangan').length;
      const stProj = projects.filter(p => p.studentId === st.id && p.status === 'Tasdiqlangan').length;
      scores.set(st.id, {
        totalApproved: stAch * 2 + stProj * 3,
        achievementsCount: stAch,
        projectsCount: stProj,
      });
    });

    return scores;
  }, [activeStudents, achievements, projects]);

  if (!isOpen) return null;

  // Check admin authorization
  const canManage =
    currentUser?.role === 'superAdmin' ||
    (currentUser?.role === 'admin' && hasPermission(currentUser, 'students', 'edit'));

  if (!canManage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Ruxsat cheklangan</h3>
          <p className="text-xs text-slate-600">
            Bosh sahifadagi eng faol talabalarni faqat vakolatli administratorlar belgilashi mumkin.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold"
          >
            Yopish
          </button>
        </div>
      </div>
    );
  }

  // Auto-fill top 3 students based on achievements and projects
  const handleAutoSuggest = () => {
    const sorted = [...activeStudents].sort((a, b) => {
      const scoreA = studentScores.get(a.id)?.totalApproved || 0;
      const scoreB = studentScores.get(b.id)?.totalApproved || 0;
      return scoreB - scoreA;
    });

    if (sorted.length === 0) {
      onNotify('info', 'Tizimda talabalar mavjud emas.');
      return;
    }

    const first = sorted[0];
    const second = sorted[1];
    const third = sorted[2];

    const generateReason = (st?: StudentProfile) => {
      if (!st) return '';
      const sc = studentScores.get(st.id);
      const parts: string[] = [];
      if (sc && sc.achievementsCount > 0) parts.push(`${sc.achievementsCount} ta tasdiqlangan yutuq`);
      if (sc && sc.projectsCount > 0) parts.push(`${sc.projectsCount} ta ilmiy loyiha/startap`);
      return parts.length > 0 ? parts.join(', ') : 'Faol va iqtidorli talaba';
    };

    setSlot1({
      studentId: first ? first.id : '',
      reason: first ? generateReason(first) : '',
    });
    setSlot2({
      studentId: second ? second.id : '',
      reason: second ? generateReason(second) : '',
    });
    setSlot3({
      studentId: third ? third.id : '',
      reason: third ? generateReason(third) : '',
    });

    onNotify('success', 'Eng ko‘p natijaga erishgan talabalar avtomatik tanlandi.');
  };

  const handleSave = async () => {
    // Validate duplicates
    const selectedIds = [slot1.studentId, slot2.studentId, slot3.studentId].filter(Boolean);
    const uniqueIds = new Set(selectedIds);
    if (selectedIds.length !== uniqueIds.size) {
      onNotify('error', 'Bir xil talabani bir nechta o‘ringa tanlab bo‘lmaydi. Har bir o‘ringa alohida talaba tanlang.');
      return;
    }

    try {
      setIsSubmitting(true);
      const assignments: TopStudentAssignment[] = [];

      if (slot1.studentId) {
        assignments.push({
          studentId: slot1.studentId,
          rank: 1,
          reason: slot1.reason || '1-o‘rin: Oliy faollik va yutuqlar',
        });
      }
      if (slot2.studentId) {
        assignments.push({
          studentId: slot2.studentId,
          rank: 2,
          reason: slot2.reason || '2-o‘rin: Namunali ilmiy izlanishlar',
        });
      }
      if (slot3.studentId) {
        assignments.push({
          studentId: slot3.studentId,
          rank: 3,
          reason: slot3.reason || '3-o‘rin: Faol tashabbuskor talaba',
        });
      }

      await saveTopActiveStudents(assignments, activeStudents, {
        id: currentUser.id,
        fullName: currentUser.fullName || 'Admin',
        role: currentUser.role,
      });

      onNotify('success', 'Bosh sahifadagi eng faol talabalar muvaffaqiyatli saqlandi.');
      onClose();
    } catch (err: any) {
      console.error('Error saving top students:', err);
      onNotify('error', err.message || 'Saqlashda xatolik yuz berdi. Qayta urinib ko‘ring.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to render student selection slot
  const renderSlot = (
    rank: number,
    state: SlotState,
    setState: React.Dispatch<React.SetStateAction<SlotState>>,
    badgeColor: string,
    titleUz: string,
    medalEmoji: string
  ) => {
    const selectedStudent = activeStudents.find(s => s.id === state.studentId);
    const supervisor = supervisors.find(sup => sup.id === selectedStudent?.supervisorId);
    const searchQuery = searchQueries[rank] || '';

    // Filter students for the dropdown
    const availableStudents = activeStudents.filter(s => {
      // Don't show students selected in other slots
      const otherSelected = [
        rank !== 1 ? slot1.studentId : null,
        rank !== 2 ? slot2.studentId : null,
        rank !== 3 ? slot3.studentId : null,
      ].filter(Boolean);

      if (otherSelected.includes(s.id)) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.group.toLowerCase().includes(q) ||
        (s.facultyOrField && s.facultyOrField.toLowerCase().includes(q))
      );
    });

    return (
      <div className={`p-4 rounded-2xl border ${state.studentId ? badgeColor : 'border-slate-200 bg-slate-50/60'} space-y-3 transition-all`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{medalEmoji}</span>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{titleUz}</h4>
              <p className="text-[11px] text-slate-500">Bosh sahifada #{rank} o‘rinda aks etadi</p>
            </div>
          </div>

          {state.studentId && (
            <button
              type="button"
              onClick={() => setState({ studentId: '', reason: '' })}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors"
              title="Talabani bekor qilish"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>O‘chirish</span>
            </button>
          )}
        </div>

        {/* Selected Student Card */}
        {selectedStudent ? (
          <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-blue-900 text-white font-bold flex items-center justify-center text-sm shrink-0 overflow-hidden shadow-2xs">
                {selectedStudent.avatarUrl || selectedStudent.photoURL ? (
                  <img
                    src={selectedStudent.avatarUrl || selectedStudent.photoURL}
                    alt={selectedStudent.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (selectedStudent.fullName || 'T').charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <h5 className="text-sm font-bold text-slate-900 truncate">
                  {selectedStudent.fullName}
                </h5>
                <p className="text-xs text-slate-500 truncate">
                  {selectedStudent.facultyOrField} • {selectedStudent.course}-kurs, {selectedStudent.group}
                </p>
                {supervisor && (
                  <p className="text-[11px] text-slate-400 truncate">
                    Rahbar: {supervisor.fullName}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setState(prev => ({ ...prev, studentId: '' }))}
              className="text-xs font-semibold text-blue-900 hover:underline shrink-0"
            >
              O‘zgartirish
            </button>
          </div>
        ) : (
          /* Student Selector Dropdown / Search */
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQueries(prev => ({ ...prev, [rank]: e.target.value }))}
                placeholder="Talaba ismi yoki guruhi bo‘yicha qidiring..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <select
              value={state.studentId}
              onChange={e => {
                const chosenId = e.target.value;
                const chosen = activeStudents.find(s => s.id === chosenId);
                const defaultReason = chosen
                  ? `${chosen.course}-kurs iqtidorli talabasi, faol ilmiy izlanuvchi`
                  : '';
                setState({
                  studentId: chosenId,
                  reason: defaultReason,
                });
              }}
              className="w-full px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="">-- Talabani tanlang ({availableStudents.length} ta mavjud) --</option>
              {availableStudents.map(st => {
                const sc = studentScores.get(st.id);
                return (
                  <option key={st.id} value={st.id}>
                    {st.fullName} ({st.course}-kurs, {st.group}) — {st.facultyOrField} {sc && sc.achievementsCount > 0 ? `[${sc.achievementsCount} yutuq]` : ''}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Reason / Citation Input */}
        {state.studentId && (
          <div className="space-y-1 pt-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
              <span>E’tirof matni / Asosiy yutug‘i (Bosh sahifada ko‘rinadi):</span>
              <span className="text-[10px] text-slate-400">ixtiyoriy</span>
            </label>
            <input
              type="text"
              value={state.reason}
              onChange={e => setState(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Masalan: Xalqaro olimpiada g‘olibi, 2 ta startap muallifi"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
              maxLength={120}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-start justify-between gap-3 bg-linear-to-r from-amber-50/50 via-white to-blue-50/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold tracking-wide uppercase mb-1">
                <Sparkles className="w-3 h-3 text-amber-700" />
                <span>Bosh sahifa boshqaruvi</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Eng faol 3 ta talabani belgilash
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Faqat administratorlar tomonidan tanlanadi va bosh sahifada alohida faxrli o‘rinda aks etadi.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Quick Info & Auto-Suggest Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl">
            <div className="text-xs text-blue-950 space-y-0.5">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                <span>Tezkor tavsiya imkoniyati</span>
              </p>
              <p className="text-slate-600 text-[11px]">
                Talabalarning tasdiqlangan ilmiy maqolalari, yutuqlari va startaplari hisobiga ko‘ra avtomatik tanlashingiz mumkin.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAutoSuggest}
              className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shrink-0 shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Avto-tavsiya qilish</span>
            </button>
          </div>

          {/* Slots List */}
          <div className="space-y-3.5">
            {renderSlot(
              1,
              slot1,
              setSlot1,
              'border-amber-300 bg-amber-50/40',
              '1-o‘rin (Oltin) — Eng faol talaba',
              '🥇'
            )}

            {renderSlot(
              2,
              slot2,
              setSlot2,
              'border-slate-300 bg-slate-100/50',
              '2-o‘rin (Kumush) — Yetakchi talaba',
              '🥈'
            )}

            {renderSlot(
              3,
              slot3,
              setSlot3,
              'border-amber-700/20 bg-amber-50/20',
              '3-o‘rin (Bronza) — Tashabbuskor talaba',
              '🥉'
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-white text-slate-700 font-semibold text-xs transition-colors"
          >
            Bekor qilish
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Saqlanmoqda...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Bosh sahifada e’lon qilish</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
