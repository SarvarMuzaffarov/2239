import React, { useState, useMemo } from 'react';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Search,
  Filter,
  Users,
  GraduationCap,
  Award,
  Calendar,
  Bell,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { restoreDocument, permanentDeleteDocument } from '../../services/firestoreService';
import { restoreUser, permanentDeleteUser } from '../../services/authService';
import { hasPermission } from '../../lib/permissions';
import type {
  UserAccount,
  StudentProfile,
  SupervisorProfile,
  ProjectOrStartup,
  Achievement,
  CertificateItem,
  EventItem,
  Announcement,
} from '../../types';

interface Props {
  actor: UserAccount;
  students: StudentProfile[];
  supervisors: SupervisorProfile[];
  projects: ProjectOrStartup[];
  achievements: Achievement[];
  certificates: CertificateItem[];
  events: EventItem[];
  announcements: Announcement[];
  admins: UserAccount[];
  onRefresh: () => void;
}

interface TrashItem {
  id: string;
  collectionName: string;
  category: string;
  categoryLabel: string;
  title: string;
  subtitle: string;
  deletedAt?: string;
  deletedBy?: string;
  raw: any;
}

export const TrashRecoveryView: React.FC<Props> = ({
  actor,
  students,
  supervisors,
  projects,
  achievements,
  certificates,
  events,
  announcements,
  admins,
  onRefresh,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Permanent delete confirmation modal state
  const [itemToDeletePermanently, setItemToDeletePermanently] = useState<TrashItem | null>(null);

  // Collect all soft-deleted items across all collections
  const trashItems: TrashItem[] = useMemo(() => {
    const items: TrashItem[] = [];

    // Students
    students
      .filter(s => s.isDeleted)
      .forEach(s => {
        items.push({
          id: s.id,
          collectionName: 'students',
          category: 'students',
          categoryLabel: 'Talaba',
          title: s.fullName,
          subtitle: `${s.course}-kurs | ${s.facultyOrField || 'Yo‘nalish ko‘rsatilmagan'}`,
          deletedAt: s.deletedAt,
          deletedBy: s.deletedBy,
          raw: s,
        });
      });

    // Supervisors
    supervisors
      .filter(s => s.isDeleted)
      .forEach(s => {
        items.push({
          id: s.id,
          collectionName: 'supervisors',
          category: 'supervisors',
          categoryLabel: 'Ilmiy rahbar',
          title: s.fullName,
          subtitle: `${s.position || 'Rahbar'} | ${s.department || ''}`,
          deletedAt: s.deletedAt,
          deletedBy: s.deletedBy,
          raw: s,
        });
      });

    // Projects & Startups
    projects
      .filter(p => p.isDeleted)
      .forEach(p => {
        items.push({
          id: p.id,
          collectionName: 'projects',
          category: 'projects',
          categoryLabel: p.type === 'startap' ? 'Startap' : 'Loyiha',
          title: p.title,
          subtitle: `Muallif: ${p.studentName} | ${p.field}`,
          deletedAt: p.deletedAt,
          deletedBy: p.deletedBy,
          raw: p,
        });
      });

    // Achievements
    achievements
      .filter(a => a.isDeleted)
      .forEach(a => {
        items.push({
          id: a.id,
          collectionName: 'achievements',
          category: 'achievements',
          categoryLabel: 'Yutuq',
          title: a.title,
          subtitle: `Talaba: ${a.studentName} | ${a.category}`,
          deletedAt: a.deletedAt,
          deletedBy: a.deletedBy,
          raw: a,
        });
      });

    // Certificates
    certificates
      .filter(c => c.isDeleted)
      .forEach(c => {
        items.push({
          id: c.id,
          collectionName: 'certificates',
          category: 'certificates',
          categoryLabel: 'Sertifikat / Diplom',
          title: `${c.certificateNumber} — ${c.studentName}`,
          subtitle: `${c.title} | Tadbir: ${c.eventTitle}`,
          deletedAt: c.deletedAt,
          deletedBy: c.deletedBy,
          raw: c,
        });
      });

    // Events
    events
      .filter(e => e.isDeleted)
      .forEach(e => {
        items.push({
          id: e.id,
          collectionName: 'events',
          category: 'events',
          categoryLabel: 'Tadbir',
          title: e.title,
          subtitle: `Sana: ${e.date} ${e.time} | Joy: ${e.location}`,
          deletedAt: e.deletedAt,
          deletedBy: e.deletedBy,
          raw: e,
        });
      });

    // Announcements
    announcements
      .filter(a => a.isDeleted)
      .forEach(a => {
        items.push({
          id: a.id,
          collectionName: 'announcements',
          category: 'announcements',
          categoryLabel: 'E’lon',
          title: a.title,
          subtitle: `Chiqaruvchi: ${a.createdByName} | Sana: ${a.date}`,
          deletedAt: a.deletedAt,
          deletedBy: a.deletedBy,
          raw: a,
        });
      });

    // Admins (Users)
    admins
      .filter(u => u.isDeleted)
      .forEach(u => {
        items.push({
          id: u.id,
          collectionName: 'users',
          category: 'admins',
          categoryLabel: 'Admin hisobi',
          title: u.fullName,
          subtitle: `Tel: ${u.phone} | Roli: ${u.role}`,
          deletedAt: u.deletedAt,
          deletedBy: u.deletedBy,
          raw: u,
        });
      });

    return items;
  }, [students, supervisors, projects, achievements, certificates, events, announcements, admins]);

  // Filtered by category and search query
  const filteredItems = useMemo(() => {
    return trashItems.filter(item => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [trashItems, selectedCategory, searchQuery]);

  const handleRestore = async (item: TrashItem) => {
    setLoadingId(item.id);
    setMsg(null);
    try {
      if (item.collectionName === 'users') {
        await restoreUser(item.id, { id: actor.id, fullName: actor.fullName, role: actor.role });
      } else {
        await restoreDocument(item.collectionName, item.id, item.categoryLabel, {
          id: actor.id,
          fullName: actor.fullName,
          role: actor.role,
        });
      }
      setMsg({ text: `"${item.title}" muvaffaqiyatli qayta tiklandi!`, type: 'success' });
      onRefresh();
    } catch (err: any) {
      setMsg({ text: err.message || 'Tiklashda xatolik yuz berdi.', type: 'error' });
    } finally {
      setLoadingId(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!itemToDeletePermanently) return;
    const item = itemToDeletePermanently;
    setLoadingId(item.id);
    setItemToDeletePermanently(null);
    setMsg(null);
    try {
      if (item.collectionName === 'users') {
        await permanentDeleteUser(item.id, { id: actor.id, fullName: actor.fullName, role: actor.role });
      } else {
        await permanentDeleteDocument(item.collectionName, item.id, item.categoryLabel, {
          id: actor.id,
          fullName: actor.fullName,
          role: actor.role,
        });
      }
      setMsg({ text: `"${item.title}" butunlay o'chirildi!`, type: 'success' });
      onRefresh();
    } catch (err: any) {
      setMsg({ text: err.message || 'Butunlay o‘chirishda xatolik yuz berdi.', type: 'error' });
    } finally {
      setLoadingId(null);
    }
  };

  const isSuperAdmin = actor.role === 'superAdmin';

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Chiqindilar qutisi (Xavfsiz tiklash markazi)</h2>
            <p className="text-xs text-slate-500">
              Soft-delete qilingan barcha yozuvlar shu yerda saqlanadi va ularni bir bosishda qayta tiklash mumkin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200">
            Chiqindida jami: <strong>{trashItems.length} ta yozuv</strong>
          </span>
        </div>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs ${
            msg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Chiqindidan qidirish..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
            >
              Barchasi ({trashItems.length})
            </button>
            <button
              onClick={() => setSelectedCategory('students')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                selectedCategory === 'students'
                  ? 'bg-emerald-700 border-emerald-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
            >
              Talabalar
            </button>
            <button
              onClick={() => setSelectedCategory('supervisors')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                selectedCategory === 'supervisors'
                  ? 'bg-emerald-700 border-emerald-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
            >
              Rahbarlar
            </button>
            <button
              onClick={() => setSelectedCategory('projects')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                selectedCategory === 'projects'
                  ? 'bg-emerald-700 border-emerald-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
            >
              Loyihalar
            </button>
            <button
              onClick={() => setSelectedCategory('certificates')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                selectedCategory === 'certificates'
                  ? 'bg-emerald-700 border-emerald-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
            >
              Sertifikatlar
            </button>
            <button
              onClick={() => setSelectedCategory('achievements')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                selectedCategory === 'achievements'
                  ? 'bg-emerald-700 border-emerald-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
            >
              Yutuqlar
            </button>
          </div>
        </div>
      </div>

      {/* List of trash items */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Chiqindilar qutisi bo‘sh</h3>
            <p className="text-xs text-slate-500 mt-1">Ushbu bo‘lim bo‘yicha o‘chirilgan ma’lumotlar topilmadi.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredItems.map(item => (
              <div
                key={`${item.collectionName}_${item.id}`}
                className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {item.categoryLabel}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  </div>
                  <p className="text-xs text-slate-500">{item.subtitle}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                    {item.deletedBy && (
                      <span>
                        O‘chiruvchi: <strong className="text-slate-600">{item.deletedBy}</strong>
                      </span>
                    )}
                    {item.deletedAt && (
                      <span>Vaqt: {new Date(item.deletedAt).toLocaleString('uz-UZ')}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {(isSuperAdmin || hasPermission(actor, 'trash', 'edit')) && (
                    <button
                      type="button"
                      disabled={loadingId === item.id}
                      onClick={() => handleRestore(item)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Qayta tiklash</span>
                    </button>
                  )}

                  {(isSuperAdmin || hasPermission(actor, 'trash', 'delete')) && (
                    <button
                      type="button"
                      disabled={loadingId === item.id}
                      onClick={() => setItemToDeletePermanently(item)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Butunlay o'chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Butunlay o‘chirish</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Permanent delete confirmation modal */}
      {itemToDeletePermanently && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-rose-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Butunlay o‘chirishni tasdiqlang</h3>
                <p className="text-xs text-rose-600 font-semibold">Bu amalni ortga qaytarib bo‘lmaydi!</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Haqiqatan ham <strong className="text-slate-900 font-bold">"{itemToDeletePermanently.title}"</strong> ({itemToDeletePermanently.categoryLabel}) yozuvini ma’lumotlar bazasidan butunlay tozalamoqchimisiz?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setItemToDeletePermanently(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handlePermanentDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Ha, butunlay o‘chirilsin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
