import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Megaphone,
  CheckCheck,
  X,
  AlertCircle,
  FileText,
  Calendar,
} from 'lucide-react';
import type {
  UserAccount,
  Announcement,
  ProjectOrStartup,
  Achievement,
  EventItem,
  StudentProfile,
  SupervisorProfile,
} from '../types';
import { getDeadlineInfo } from '../lib/deadlineHelper';

export interface NotificationItem {
  id: string;
  type: 'announcement' | 'project_approved' | 'project_rejected' | 'achievement_approved' | 'achievement_rejected' | 'pending_review' | 'deadline';
  title: string;
  message: string;
  timestamp: string;
  linkText?: string;
  isImportant?: boolean;
}

interface Props {
  currentUser: UserAccount | null;
  announcements?: Announcement[];
  projects?: ProjectOrStartup[];
  achievements?: Achievement[];
  events?: EventItem[];
  students?: StudentProfile[];
  supervisors?: SupervisorProfile[];
}

export const NotificationCenter: React.FC<Props> = ({
  currentUser,
  announcements = [],
  projects = [],
  achievements = [],
  events = [],
  students = [],
  supervisors = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    if (!currentUser) return new Set();
    try {
      const saved = localStorage.getItem(`read_notifications_${currentUser.id}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'announcements' | 'status'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Sync readIds to localStorage
  const markAsRead = (id: string) => {
    if (!currentUser) return;
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(`read_notifications_${currentUser.id}`, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const markAllAsRead = () => {
    if (!currentUser) return;
    const allIds = notifications.map(n => n.id);
    setReadIds(new Set(allIds));
    try {
      localStorage.setItem(`read_notifications_${currentUser.id}`, JSON.stringify(allIds));
    } catch {}
  };

  // Compile relevant notifications
  const notifications = useMemo<NotificationItem[]>(() => {
    if (!currentUser) return [];
    const items: NotificationItem[] = [];

    // 1. Announcements (for everyone)
    announcements.forEach(ann => {
      items.push({
        id: `ann_${ann.id}`,
        type: 'announcement',
        title: ann.title,
        message: ann.content,
        timestamp: ann.createdAt || new Date().toISOString(),
        isImportant: ann.isImportant,
      });
    });

    // 2. Student-specific updates
    if (currentUser.role === 'student') {
      const myStudent = students.find(
        s => s.id === currentUser.id || s.userId === currentUser.id || s.phone === currentUser.phone
      );
      const studentId = myStudent?.id || currentUser.id;

      // Projects reviewed
      projects
        .filter(p => p.studentId === studentId)
        .forEach(p => {
          if (p.status === 'Tasdiqlangan') {
            items.push({
              id: `proj_appr_${p.id}_${p.updatedAt || p.reviewedAt || 'appr'}`,
              type: 'project_approved',
              title: `«${p.title}» tasdiqlandi!`,
              message: p.reviewNotes ? `Izoh: ${p.reviewNotes}` : 'Loyihangiz ilmiy rahbar/admin tomonidan ma’qullandi.',
              timestamp: p.reviewedAt || p.updatedAt || p.createdAt,
            });
          } else if (p.status === 'Rad etilgan') {
            items.push({
              id: `proj_rej_${p.id}_${p.updatedAt || p.reviewedAt || 'rej'}`,
              type: 'project_rejected',
              title: `«${p.title}» rad etildi`,
              message: p.reviewNotes ? `Sabab: ${p.reviewNotes}` : 'Loyihangiz talablarga javob bermadi.',
              timestamp: p.reviewedAt || p.updatedAt || p.createdAt,
            });
          }
        });

      // Achievements reviewed
      achievements
        .filter(a => a.studentId === studentId)
        .forEach(a => {
          if (a.status === 'Tasdiqlangan') {
            items.push({
              id: `ach_appr_${a.id}_${a.updatedAt || 'appr'}`,
              type: 'achievement_approved',
              title: `«${a.title}» yutug‘ingiz tasdiqlandi!`,
              message: a.reviewNotes ? `Izoh: ${a.reviewNotes}` : 'Yutuq portfoliosi muvaffaqiyatli qabul qilindi.',
              timestamp: a.reviewedAt || a.updatedAt || a.createdAt,
            });
          } else if (a.status === 'Rad etilgan') {
            items.push({
              id: `ach_rej_${a.id}_${a.updatedAt || 'rej'}`,
              type: 'achievement_rejected',
              title: `«${a.title}» yutug‘ingiz rad etildi`,
              message: a.reviewNotes ? `Sabab: ${a.reviewNotes}` : 'Tasdiqlovchi hujjat yetarli emas.',
              timestamp: a.reviewedAt || a.updatedAt || a.createdAt,
            });
          }
        });

      // Upcoming deadlines for events
      events.forEach(evt => {
        if (evt.deadline) {
          const dlInfo = getDeadlineInfo(evt.deadline);
          if (dlInfo.hasDeadline && !dlInfo.isExpired && dlInfo.daysRemaining !== undefined && dlInfo.daysRemaining <= 3) {
            items.push({
              id: `deadline_${evt.id}_${evt.deadline}`,
              type: 'deadline',
              title: `Muddat yaqinlashmoqda: «${evt.title}»`,
              message: `Ariza topshirish muddati: ${dlInfo.text}`,
              timestamp: evt.createdAt || new Date().toISOString(),
              isImportant: true,
            });
          }
        }
      });
    }

    // 3. Supervisor-specific notifications
    if (currentUser.role === 'supervisor') {
      const myProfile = supervisors.find(
        s => s.id === currentUser.id || s.userId === currentUser.id || s.phone === currentUser.phone
      );
      const supervisorId = myProfile?.id || '';
      const myStudentIds = new Set(students.filter(s => s.supervisorId === supervisorId).map(s => s.id));

      const pendingProjs = projects.filter(
        p => p.status === 'Kutilmoqda' && (p.supervisorId === supervisorId || myStudentIds.has(p.studentId))
      );
      if (pendingProjs.length > 0) {
        items.push({
          id: `sup_pending_proj_${pendingProjs.length}_${pendingProjs[0].id}`,
          type: 'pending_review',
          title: `Kutilayotgan ilmiy loyihalar: ${pendingProjs.length} ta`,
          message: 'Talabalaringiz tomonidan ko‘rib chiqish uchun yangi ilmiy loyihalar taqdim etildi.',
          timestamp: pendingProjs[0].createdAt,
          isImportant: true,
        });
      }

      const pendingAchs = achievements.filter(
        a => a.status === 'Kutilmoqda' && myStudentIds.has(a.studentId)
      );
      if (pendingAchs.length > 0) {
        items.push({
          id: `sup_pending_ach_${pendingAchs.length}_${pendingAchs[0].id}`,
          type: 'pending_review',
          title: `Kutilayotgan talabalar yutuqlari: ${pendingAchs.length} ta`,
          message: 'Talabalaringiz yangi yutuq va sertifikatlarni tasdiqlash uchun yuborgan.',
          timestamp: pendingAchs[0].createdAt,
        });
      }
    }

    // 4. Admin notifications
    if (currentUser.role === 'admin' || currentUser.role === 'superAdmin') {
      const pendingProjsCount = projects.filter(p => p.status === 'Kutilmoqda').length;
      if (pendingProjsCount > 0) {
        items.push({
          id: `admin_pending_proj_${pendingProjsCount}`,
          type: 'pending_review',
          title: `Ko‘rib chiqilishi kerak: ${pendingProjsCount} ta loyiha`,
          message: 'Tasdiqlash yoki rad etish kutilayotgan talaba loyihalari mavjud.',
          timestamp: new Date().toISOString(),
        });
      }

      const pendingAchsCount = achievements.filter(a => a.status === 'Kutilmoqda').length;
      if (pendingAchsCount > 0) {
        items.push({
          id: `admin_pending_ach_${pendingAchsCount}`,
          type: 'pending_review',
          title: `Ko‘rib chiqilishi kerak: ${pendingAchsCount} ta yutuq`,
          message: 'Talabalar erishgan yutuqlarni tekshirish kutilmoqda.',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Sort newest first
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [currentUser, announcements, projects, achievements, events, students, supervisors]);

  // Unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !readIds.has(n.id)).length;
  }, [notifications, readIds]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'announcements') {
      return notifications.filter(n => n.type === 'announcement');
    }
    if (activeFilter === 'status') {
      return notifications.filter(n => n.type !== 'announcement');
    }
    return notifications;
  }, [notifications, activeFilter]);

  if (!currentUser) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        id="navbar-notification-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative min-w-[44px] min-h-[44px] p-2.5 text-slate-600 hover:text-blue-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center transition-colors active:scale-95 cursor-pointer shadow-2xs"
        aria-label="Bildirishnomalar"
        title="Bildirishnomalar markazi"
      >
        <Bell className="w-4 h-4 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs animate-in zoom-in-50">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Bildirishnomalar</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 rounded-full">
                  {unreadCount} ta yangi
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-blue-900 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                title="Barchasini o‘qilgan deb belgilash"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>O‘qildi</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-slate-100 px-3 pt-2 gap-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`pb-2 px-2 border-b-2 transition-colors cursor-pointer ${
                activeFilter === 'all'
                  ? 'border-blue-900 text-blue-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Barchasi ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('announcements')}
              className={`pb-2 px-2 border-b-2 transition-colors cursor-pointer ${
                activeFilter === 'announcements'
                  ? 'border-blue-900 text-blue-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              E’lonlar
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('status')}
              className={`pb-2 px-2 border-b-2 transition-colors cursor-pointer ${
                activeFilter === 'status'
                  ? 'border-blue-900 text-blue-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Holatlar
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">Yangi bildirishnomalar yo‘q</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Barcha muhim xabarlar shu yerda aks etadi.</p>
              </div>
            ) : (
              filteredNotifications.map(item => {
                const isRead = readIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => markAsRead(item.id)}
                    className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 ${
                      !isRead ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div className="mt-0.5 shrink-0">
                      {item.type === 'announcement' ? (
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                          <Megaphone className="w-3.5 h-3.5" />
                        </div>
                      ) : item.type === 'project_approved' || item.type === 'achievement_approved' ? (
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      ) : item.type === 'project_rejected' || item.type === 'achievement_rejected' ? (
                        <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center">
                          <XCircle className="w-3.5 h-3.5" />
                        </div>
                      ) : item.type === 'deadline' ? (
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center">
                          <AlertCircle className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1 mb-0.5">
                        <h4 className={`text-xs font-bold leading-tight ${isRead ? 'text-slate-800' : 'text-slate-900'}`}>
                          {item.title}
                        </h4>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                        <span>
                          {item.timestamp
                            ? new Date(item.timestamp).toLocaleDateString('uz-UZ', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                        {item.isImportant && (
                          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 font-bold rounded-sm">
                            Muhim
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
