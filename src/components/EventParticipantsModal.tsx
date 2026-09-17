import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  Calendar,
  MapPin,
  Clock,
  User,
  Phone,
  Download,
  CheckCircle2,
  XCircle,
  FolderGit2,
  AlertCircle,
} from 'lucide-react';
import type { EventItem, StudentProfile, SupervisorProfile, EventRegistration, UserAccount } from '../types';
import {
  subscribeEventRegistrations,
  getEventRegistrations,
  updateEventRegistrationStatus,
} from '../services/firestoreService';
import { exportEventParticipantsToExcel } from '../lib/excelExport';
import { canonicalizeDirection } from '../constants/directions';
import { EmptyState } from './EmptyState';

interface EventParticipantsModalProps {
  isOpen: boolean;
  event: EventItem | null;
  students: StudentProfile[];
  supervisors: SupervisorProfile[];
  currentUser?: UserAccount | null;
  onClose: () => void;
  onOpenStudentProfile: (studentId: string) => void;
  onNotify?: (type: 'success' | 'error' | 'info', msg: string) => void;
}

const PAGE_SIZE = 8;

export const EventParticipantsModal: React.FC<EventParticipantsModalProps> = ({
  isOpen,
  event,
  students,
  supervisors,
  currentUser,
  onClose,
  onOpenStudentProfile,
  onNotify,
}) => {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  // Reject modal state
  const [rejectingRegId, setRejectingRegId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [isRejectSubmitting, setIsRejectSubmitting] = useState(false);

  // Real-time listener for event registrations
  useEffect(() => {
    if (!isOpen || !event?.id) {
      setRegistrations([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setCurrentPage(1);
    setSearchQuery('');

    // First load fallback/current data once
    getEventRegistrations(event.id, students).then(initial => {
      setRegistrations(initial);
      setIsLoading(false);
    });

    // Attach real-time listener for live updates
    const unsubscribe = subscribeEventRegistrations(event.id, updatedList => {
      if (updatedList.length > 0) {
        setRegistrations(updatedList);
      } else if (event.participantIds && event.participantIds.length > 0) {
        // If event doc has legacy participantIds
        const fallback = event.participantIds.map(sid => {
          const st = students.find(s => s.id === sid);
          return {
            id: `${event.id}_${sid}`,
            eventId: event.id,
            studentId: sid,
            registeredAt: event.createdAt || new Date().toISOString(),
            status: 'Tasdiqlangan' as const,
            studentName: st?.fullName,
            studentPhone: st?.phone,
            studentCourse: st?.course,
            studentGroup: st?.group,
            studentFaculty: st?.facultyOrField,
          };
        });
        setRegistrations(fallback);
      } else {
        setRegistrations([]);
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, event?.id, students]);

  if (!isOpen || !event) return null;

  // Handle Excel Export
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await exportEventParticipantsToExcel(event.id, event.title, [event], supervisors);
      onNotify?.('success', 'Ishtirokchilar ro‘yxati Excel faylga muvaffaqiyatli yuklandi.');
    } catch (err: any) {
      onNotify?.('error', err.message || 'Excel eksport qilishda xatolik yuz berdi.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Status Change
  const handleApprove = async (regId: string) => {
    if (!currentUser) return;
    try {
      await updateEventRegistrationStatus(regId, 'Tasdiqlangan', '', currentUser);
      onNotify?.('success', 'Ariza muvaffaqiyatli tasdiqlandi.');
    } catch (err: any) {
      onNotify?.('error', err.message || 'Xatolik yuz berdi.');
    }
  };

  const handleConfirmReject = async () => {
    if (!currentUser || !rejectingRegId) return;
    try {
      setIsRejectSubmitting(true);
      await updateEventRegistrationStatus(
        rejectingRegId,
        'Rad etilgan',
        rejectionReasonInput,
        currentUser
      );
      onNotify?.('info', 'Ariza rad etildi va izoh saqlandi.');
      setRejectingRegId(null);
      setRejectionReasonInput('');
    } catch (err: any) {
      onNotify?.('error', err.message || 'Xatolik yuz berdi.');
    } finally {
      setIsRejectSubmitting(false);
    }
  };

  // Resolve student details for each registration
  const enrichedParticipants = registrations.map(reg => {
    const student = students.find(s => s.id === reg.studentId);
    const supervisor = student?.supervisorId
      ? supervisors.find(sup => sup.id === student.supervisorId)
      : null;

    return {
      registration: reg,
      studentId: reg.studentId,
      fullName: student?.fullName || reg.studentName || 'Noma\'lum talaba',
      phone: student?.phone || reg.studentPhone || '',
      course: student?.course || reg.studentCourse || 1,
      group: student?.group || reg.studentGroup || '—',
      facultyOrField: canonicalizeDirection(student?.facultyOrField || reg.studentFaculty) || student?.facultyOrField || reg.studentFaculty || '—',
      supervisorName: supervisor?.fullName || student?.customSupervisorName || reg.supervisorName || 'Biriktirilmagan',
      avatarUrl: student?.avatarUrl || student?.photoURL,
      registeredAt: reg.registeredAt,
      projectTitle: reg.projectTitle,
      projectDescription: reg.projectDescription,
      applicationStatus: reg.applicationStatus || reg.status || 'Kutilmoqda',
      rejectionReason: reg.rejectionReason,
    };
  });

  // Filter by search query (F.I.Sh., yo'nalish, guruh, loyiha)
  const filteredParticipants = enrichedParticipants.filter(p => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      p.fullName.toLowerCase().includes(query) ||
      p.facultyOrField.toLowerCase().includes(query) ||
      p.group.toLowerCase().includes(query) ||
      p.supervisorName.toLowerCase().includes(query) ||
      (p.projectTitle && p.projectTitle.toLowerCase().includes(query))
    );
  });

  // Pagination calculation
  const totalItems = filteredParticipants.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * PAGE_SIZE;
  const paginatedList = filteredParticipants.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div
      id="event-participants-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="event-participants-modal"
        className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900">
                <Users className="w-3.5 h-3.5" />
                <span>{registrations.length} ishtirokchi</span>
              </span>
              <span className="text-xs text-slate-500 font-medium">
                • Real-time Firestore ro‘yxati
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
              {event.title}
            </h2>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {event.date} {event.time && `(${event.time})`}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {event.location}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportExcel}
              disabled={isExporting || registrations.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
              title="Excel formatida yuklab olish"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isExporting ? 'Yuklanmoqda...' : 'Excel yuklash'}</span>
            </button>
            <button
              id="close-event-participants-modal-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
              title="Yopish"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar & Stats */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="event-participants-search-input"
              type="text"
              placeholder="F.I.Sh, yo‘nalish, guruh yoki loyiha bo‘yicha qidirish..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>
          <div className="text-xs text-slate-500 shrink-0 font-medium">
            Jami: <strong className="text-slate-900">{filteredParticipants.length}</strong> nafar ishtirokchi
          </div>
        </div>

        {/* Body: Participant Cards List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Ishtirokchilar ro‘yxati yuklanmoqda...</p>
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="py-8">
              <EmptyState
                title={
                  searchQuery.trim()
                    ? "Qidiruv bo‘yicha ishtirokchi topilmadi"
                    : "Bu tadbirga hali hech kim ro‘yxatdan o‘tmagan."
                }
                description={
                  searchQuery.trim()
                    ? "Iltimos, boshqa kalit so‘z orqali qidirib ko‘ring."
                    : "Talabalar o‘z kabinetlaridan ushbu tadbirga ro‘yxatdan o‘tganda ular avtomatik real-time paydo bo‘ladi."
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {paginatedList.map(participant => (
                <div
                  key={participant.registration.id || participant.studentId}
                  id={`participant-card-${participant.studentId}`}
                  className="bg-slate-50/70 hover:bg-blue-50/40 rounded-2xl border border-slate-200 hover:border-blue-300 p-4 transition-all duration-150 flex flex-col justify-between shadow-2xs hover:shadow-xs space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0 overflow-hidden">
                        {participant.avatarUrl ? (
                          <img
                            src={participant.avatarUrl}
                            alt={participant.fullName}
                            loading="lazy"
                            className="w-full h-full object-cover"
                            onError={e => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          participant.fullName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {participant.fullName}
                          </h4>
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-900 rounded-md shrink-0">
                            {participant.course}-kurs
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {participant.facultyOrField}
                        </p>
                      </div>
                    </div>

                    {/* Competition Project Badge (if registered with a project) */}
                    {participant.projectTitle && (
                      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold flex items-center gap-1">
                            <FolderGit2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            Loyiha: {participant.projectTitle}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              participant.applicationStatus === 'Tasdiqlangan'
                                ? 'bg-emerald-100 text-emerald-800'
                                : participant.applicationStatus === 'Rad etilgan'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {participant.applicationStatus}
                          </span>
                        </div>
                        {participant.rejectionReason && (
                          <p className="text-[11px] text-rose-700 italic">
                            Sabab: {participant.rejectionReason}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="bg-white rounded-xl p-2.5 border border-slate-100 text-xs space-y-1 text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Guruh:</span>
                        <strong className="font-mono text-slate-800">{participant.group}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Ilmiy rahbar:</span>
                        <span className="font-medium text-slate-800 text-right truncate max-w-[170px]" title={participant.supervisorName}>
                          {participant.supervisorName}
                        </span>
                      </div>
                      {participant.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Aloqa:</span>
                          <span className="font-mono text-slate-700">{participant.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(participant.registeredAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Admin / Manager actions for projects */}
                      {(currentUser?.role === 'admin' || currentUser?.role === 'superAdmin') && participant.projectTitle && (
                        <>
                          {participant.applicationStatus !== 'Tasdiqlangan' && (
                            <button
                              onClick={() => handleApprove(participant.registration.id)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
                              title="Arizani tasdiqlash"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Tasdiqlash</span>
                            </button>
                          )}
                          {participant.applicationStatus !== 'Rad etilgan' && (
                            <button
                              onClick={() => {
                                setRejectingRegId(participant.registration.id);
                                setRejectionReasonInput('');
                              }}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
                              title="Arizani rad etish"
                            >
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Rad etish</span>
                            </button>
                          )}
                        </>
                      )}

                      <button
                        type="button"
                        id={`view-profile-btn-${participant.studentId}`}
                        onClick={e => {
                          e.stopPropagation();
                          onOpenStudentProfile(participant.studentId);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-900 bg-white hover:bg-blue-100/70 border border-blue-200 rounded-lg transition-colors"
                      >
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

        {/* Rejection Modal Overlay */}
        {rejectingRegId && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold text-sm">Tanlov arizasini rad etish</h3>
              </div>
              <p className="text-xs text-slate-600">
                Iltimos, talabaga arizasi nima sababdan rad etilganini tushuntiruvchi izoh kiriting.
              </p>
              <textarea
                value={rejectionReasonInput}
                onChange={e => setRejectionReasonInput(e.target.value)}
                placeholder="Rad etish sababi (masalan: loyiha mavzusi tanlov yo'nalishiga mos kelmadi)..."
                rows={3}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingRegId(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  disabled={isRejectSubmitting}
                  onClick={handleConfirmReject}
                  className="px-4 py-1.5 text-xs bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white rounded-xl font-semibold shadow-xs"
                >
                  {isRejectSubmitting ? 'Saqlanmoqda...' : 'Rad etish'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer: Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2 text-xs">
            <div className="text-slate-500">
              Sahifa <strong className="text-slate-900">{validCurrentPage}</strong> / {totalPages}
            </div>

            <div className="flex items-center gap-2">
              <button
                id="event-participants-prev-page-btn"
                disabled={validCurrentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors font-semibold"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Oldingi</span>
              </button>

              <button
                id="event-participants-next-page-btn"
                disabled={validCurrentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors font-semibold"
              >
                <span>Keyingi</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

