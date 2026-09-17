import React, { useState, useMemo } from 'react';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Search,
  Users,
  GraduationCap,
  Award,
  Calendar,
  Bell,
  CheckCircle2,
  AlertCircle,
  CheckSquare,
  Square,
  Loader2,
  FolderGit2,
  Trophy,
  Shield,
  Layers,
} from 'lucide-react';
import {
  restoreDocument,
  permanentDeleteDocument,
  emptyTrashPermanently,
  restoreDocumentsBatch,
} from '../../services/firestoreService';
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

  // Single item permanent delete state
  const [itemToDeletePermanently, setItemToDeletePermanently] = useState<TrashItem | null>(null);

  // Multi-item selection state
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Empty Trash Modal state
  const [isEmptyModalOpen, setIsEmptyModalOpen] = useState(false);
  const [emptyScope, setEmptyScope] = useState<'all' | 'filtered' | 'selected'>('all');
  const [confirmInputText, setConfirmInputText] = useState('');
  const [isConfirmChecked, setIsConfirmChecked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Counts by category for tabs & modal breakdown
  const categoryCounts = useMemo(() => {
    return {
      all: trashItems.length,
      students: trashItems.filter(i => i.category === 'students').length,
      supervisors: trashItems.filter(i => i.category === 'supervisors').length,
      projects: trashItems.filter(i => i.category === 'projects').length,
      certificates: trashItems.filter(i => i.category === 'certificates').length,
      achievements: trashItems.filter(i => i.category === 'achievements').length,
      events: trashItems.filter(i => i.category === 'events').length,
      announcements: trashItems.filter(i => i.category === 'announcements').length,
      admins: trashItems.filter(i => i.category === 'admins').length,
    };
  }, [trashItems]);

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

  // Select all / toggle individual item
  const allFilteredSelected = useMemo(() => {
    if (filteredItems.length === 0) return false;
    return filteredItems.every(i => selectedKeys.has(`${i.collectionName}_${i.id}`));
  }, [filteredItems, selectedKeys]);

  const toggleSelectAllFiltered = () => {
    const next = new Set(selectedKeys);
    if (allFilteredSelected) {
      filteredItems.forEach(i => next.delete(`${i.collectionName}_${i.id}`));
    } else {
      filteredItems.forEach(i => next.add(`${i.collectionName}_${i.id}`));
    }
    setSelectedKeys(next);
  };

  const toggleSelectItem = (key: string) => {
    const next = new Set(selectedKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelectedKeys(next);
  };

  // Single Item Restore
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
      // Remove from selection if was selected
      setSelectedKeys(prev => {
        const next = new Set(prev);
        next.delete(`${item.collectionName}_${item.id}`);
        return next;
      });
      setMsg({ text: `"${item.title}" muvaffaqiyatli qayta tiklandi!`, type: 'success' });
      onRefresh();
    } catch (err: any) {
      setMsg({ text: err.message || 'Tiklashda xatolik yuz berdi.', type: 'error' });
    } finally {
      setLoadingId(null);
    }
  };

  // Single Item Permanent Delete
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
      setSelectedKeys(prev => {
        const next = new Set(prev);
        next.delete(`${item.collectionName}_${item.id}`);
        return next;
      });
      setMsg({ text: `"${item.title}" bazadan butunlay o'chirildi!`, type: 'success' });
      onRefresh();
    } catch (err: any) {
      setMsg({ text: err.message || 'Butunlay o‘chirishda xatolik yuz berdi.', type: 'error' });
    } finally {
      setLoadingId(null);
    }
  };

  // Bulk Restore Selected Items
  const handleBulkRestore = async () => {
    const targetItems = trashItems.filter(i => selectedKeys.has(`${i.collectionName}_${i.id}`));
    if (targetItems.length === 0) return;

    setIsProcessing(true);
    setMsg(null);
    try {
      const { restoredCount } = await restoreDocumentsBatch(
        targetItems.map(i => ({
          collectionName: i.collectionName,
          id: i.id,
          categoryLabel: i.categoryLabel,
          title: i.title,
        })),
        { id: actor.id, fullName: actor.fullName, role: actor.role }
      );
      setSelectedKeys(new Set());
      setMsg({
        text: `Tanlangan ${restoredCount} ta yozuv muvaffaqiyatli qayta tiklandi!`,
        type: 'success',
      });
      onRefresh();
    } catch (err: any) {
      setMsg({ text: err.message || 'Ommaviy qayta tiklashda xatolik yuz berdi.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Completely Empty Trash (All, Filtered, or Selected)
  const handleEmptyTrashConfirm = async () => {
    let targetItems: TrashItem[] = [];
    let scopeLabel = '';

    if (emptyScope === 'selected') {
      targetItems = trashItems.filter(i => selectedKeys.has(`${i.collectionName}_${i.id}`));
      scopeLabel = `Tanlangan ${targetItems.length} ta yozuv`;
    } else if (emptyScope === 'filtered' && selectedCategory !== 'all') {
      targetItems = filteredItems;
      scopeLabel = `"${selectedCategory}" toifasidagi ${targetItems.length} ta yozuv`;
    } else {
      targetItems = trashItems;
      scopeLabel = `Chiqindilar qutisidagi barcha ${targetItems.length} ta yozuv`;
    }

    if (targetItems.length === 0) {
      setIsEmptyModalOpen(false);
      return;
    }

    setIsProcessing(true);
    setMsg(null);

    try {
      const { deletedCount } = await emptyTrashPermanently(
        targetItems.map(i => ({
          collectionName: i.collectionName,
          id: i.id,
          categoryLabel: i.categoryLabel,
          title: i.title,
        })),
        { id: actor.id, fullName: actor.fullName, role: actor.role },
        `Chiqindilar qutisi butunlay bo‘shatildi (${scopeLabel})`
      );

      // Reset selection and modal
      setSelectedKeys(new Set());
      setIsEmptyModalOpen(false);
      setConfirmInputText('');
      setIsConfirmChecked(false);

      setMsg({
        text: `Chiqindilar qutisi muvaffaqiyatli butunlay bo‘shatildi! Jami ${deletedCount} ta yozuv Firestore bazasidan qaytarib bo'lmas darajada o'chirildi.`,
        type: 'success',
      });
      onRefresh();
    } catch (err: any) {
      setMsg({ text: err.message || 'Chiqindilarni tozalashda xatolik yuz berdi.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Open the Empty Trash Modal
  const openEmptyTrashModal = (scope: 'all' | 'filtered' | 'selected' = 'all') => {
    setEmptyScope(scope);
    setConfirmInputText('');
    setIsConfirmChecked(false);
    setIsEmptyModalOpen(true);
  };

  const isSuperAdmin = actor.role === 'superAdmin';
  const canDeleteTrash = isSuperAdmin || hasPermission(actor, 'trash', 'delete');
  const canEditTrash = isSuperAdmin || hasPermission(actor, 'trash', 'edit');

  // Compute how many items will be purged based on emptyScope
  const itemsToPurgeCount = useMemo(() => {
    if (emptyScope === 'selected') {
      return trashItems.filter(i => selectedKeys.has(`${i.collectionName}_${i.id}`)).length;
    }
    if (emptyScope === 'filtered' && selectedCategory !== 'all') {
      return filteredItems.length;
    }
    return trashItems.length;
  }, [emptyScope, selectedCategory, filteredItems.length, trashItems, selectedKeys]);

  const isConfirmValid = isConfirmChecked || confirmInputText.trim().toUpperCase() === 'TOZALASH';

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
              Soft-delete qilingan yozuvlar shu yerda saqlanadi. Istalgan paytda qayta tiklash yoki butunlay tozalash mumkin.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200">
            Chiqindida jami: <strong>{trashItems.length} ta yozuv</strong>
          </span>

          {canDeleteTrash && (
            <button
              type="button"
              disabled={trashItems.length === 0 || isProcessing}
              onClick={() => openEmptyTrashModal(selectedCategory !== 'all' ? 'filtered' : 'all')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              title="Chiqindi qutisidagi ma'lumotlarni Firestore bazasidan butunlay tozalash"
            >
              <Trash2 className="w-4 h-4" />
              <span>Chiqindi qutisini butunlay bo‘shatish</span>
            </button>
          )}
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
          <span className="font-medium">{msg.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Chiqindidan qidirish (nomi, muallif, sana)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
            >
              Barchasi ({categoryCounts.all})
            </button>
            <button
              onClick={() => setSelectedCategory('students')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                selectedCategory === 'students'
                  ? 'bg-emerald-700 border-emerald-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
            >
              Talabalar ({categoryCounts.students})
            </button>
            <button
              onClick={() => setSelectedCategory('supervisors')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                selectedCategory === 'supervisors'
                  ? 'bg-emerald-700 border-emerald-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
            >
              Rahbarlar ({categoryCounts.supervisors})
            </button>
            <button
              onClick={() => setSelectedCategory('projects')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                selectedCategory === 'projects'
                  ? 'bg-emerald-700 border-emerald-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
            >
              Loyihalar ({categoryCounts.projects})
            </button>
            <button
              onClick={() => setSelectedCategory('certificates')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                selectedCategory === 'certificates'
                  ? 'bg-emerald-700 border-emerald-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
            >
              Sertifikatlar ({categoryCounts.certificates})
            </button>
            <button
              onClick={() => setSelectedCategory('achievements')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                selectedCategory === 'achievements'
                  ? 'bg-emerald-700 border-emerald-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
            >
              Yutuqlar ({categoryCounts.achievements})
            </button>
            {categoryCounts.events > 0 && (
              <button
                onClick={() => setSelectedCategory('events')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  selectedCategory === 'events'
                    ? 'bg-emerald-700 border-emerald-700 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                }`}
              >
                Tadbirlar ({categoryCounts.events})
              </button>
            )}
            {categoryCounts.announcements > 0 && (
              <button
                onClick={() => setSelectedCategory('announcements')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  selectedCategory === 'announcements'
                    ? 'bg-emerald-700 border-emerald-700 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                }`}
              >
                E'lonlar ({categoryCounts.announcements})
              </button>
            )}
            {categoryCounts.admins > 0 && (
              <button
                onClick={() => setSelectedCategory('admins')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  selectedCategory === 'admins'
                    ? 'bg-emerald-700 border-emerald-700 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                }`}
              >
                Adminlar ({categoryCounts.admins})
              </button>
            )}
          </div>
        </div>

        {/* Selection & Batch actions bar */}
        {filteredItems.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSelectAllFiltered}
                className="flex items-center gap-1.5 font-medium text-slate-700 hover:text-slate-900 cursor-pointer"
              >
                {allFilteredSelected ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>
                  {allFilteredSelected
                    ? 'Barcha ko‘rsatilganlarni bekor qilish'
                    : `Ko‘rsatilgan barchasini belgilash (${filteredItems.length})`}
                </span>
              </button>

              {selectedKeys.size > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  {selectedKeys.size} ta tanlandi
                </span>
              )}
            </div>

            {selectedKeys.size > 0 && (
              <div className="flex items-center gap-2">
                {canEditTrash && (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleBulkRestore}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Tanlanganlarni qayta tiklash ({selectedKeys.size})</span>
                  </button>
                )}

                {canDeleteTrash && (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => openEmptyTrashModal('selected')}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Tanlanganlarni butunlay o‘chirish ({selectedKeys.size})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedKeys(new Set())}
                  className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Bekor qilish
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* List of trash items */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Chiqindilar qutisi bo‘sh</h3>
            <p className="text-xs text-slate-500 mt-1">Ushbu bo‘lim bo‘yicha o‘chirilgan ma’lumotlar mavjud emas.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredItems.map(item => {
              const itemKey = `${item.collectionName}_${item.id}`;
              const isSelected = selectedKeys.has(itemKey);

              return (
                <div
                  key={itemKey}
                  className={`p-4 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isSelected ? 'bg-emerald-50/50' : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleSelectItem(itemKey)}
                      className="mt-0.5 text-slate-400 hover:text-slate-600 cursor-pointer shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                    </button>

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
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 pl-7 md:pl-0">
                    {canEditTrash && (
                      <button
                        type="button"
                        disabled={loadingId === item.id || isProcessing}
                        onClick={() => handleRestore(item)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Qayta tiklash</span>
                      </button>
                    )}

                    {canDeleteTrash && (
                      <button
                        type="button"
                        disabled={loadingId === item.id || isProcessing}
                        onClick={() => setItemToDeletePermanently(item)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Butunlay o'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Butunlay o‘chirish</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SINGLE ITEM PERMANENT DELETE CONFIRMATION MODAL */}
      {itemToDeletePermanently && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-rose-200 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
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
              Haqiqatan ham <strong className="text-slate-900 font-bold">"{itemToDeletePermanently.title}"</strong> ({itemToDeletePermanently.categoryLabel}) yozuvini Firestore bazasidan butunlay tozalamoqchimisiz?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setItemToDeletePermanently(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handlePermanentDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
              >
                Ha, butunlay o‘chirilsin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE EMPTY TRASH CONFIRMATION MODAL */}
      {isEmptyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-rose-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center gap-3 text-rose-600 border-b border-slate-100 pb-3">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Chiqindi qutisini butunlay bo‘shatish
                </h3>
                <p className="text-xs text-rose-600 font-medium">
                  Barcha o‘chirilgan ma’lumotlar bazadan qaytarib bo‘lmas darajada o‘chiriladi
                </p>
              </div>
            </div>

            {/* Scope Selection (if category or items are selected) */}
            {(selectedCategory !== 'all' || selectedKeys.size > 0) && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-slate-700">Tozalash ko‘lamini tanlang:</span>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="emptyScope"
                      checked={emptyScope === 'all'}
                      onChange={() => setEmptyScope('all')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-slate-800">
                      Barcha chiqindilar qutisini tozalash (<strong>{trashItems.length} ta yozuv</strong>)
                    </span>
                  </label>

                  {selectedCategory !== 'all' && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="emptyScope"
                        checked={emptyScope === 'filtered'}
                        onChange={() => setEmptyScope('filtered')}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span className="text-slate-800">
                        Faqat hozirgi toifa bo‘yicha tozalash (<strong>{filteredItems.length} ta yozuv</strong>)
                      </span>
                    </label>
                  )}

                  {selectedKeys.size > 0 && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="emptyScope"
                        checked={emptyScope === 'selected'}
                        onChange={() => setEmptyScope('selected')}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span className="text-slate-800">
                        Faqat belgilangan yozuvlarni tozalash (<strong>{selectedKeys.size} ta yozuv</strong>)
                      </span>
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Breakdown summary */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>O‘chiriladigan ma’lumotlar tarkibi:</span>
                <span className="text-rose-600 font-bold">Jami: {itemsToPurgeCount} ta yozuv</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                {categoryCounts.students > 0 && (
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-600">Talabalar:</span>
                    <strong className="text-slate-900">{categoryCounts.students} ta</strong>
                  </div>
                )}
                {categoryCounts.supervisors > 0 && (
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-600">Rahbarlar:</span>
                    <strong className="text-slate-900">{categoryCounts.supervisors} ta</strong>
                  </div>
                )}
                {categoryCounts.projects > 0 && (
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-600">Loyihalar/startaplar:</span>
                    <strong className="text-slate-900">{categoryCounts.projects} ta</strong>
                  </div>
                )}
                {categoryCounts.certificates > 0 && (
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-600">Sertifikatlar:</span>
                    <strong className="text-slate-900">{categoryCounts.certificates} ta</strong>
                  </div>
                )}
                {categoryCounts.achievements > 0 && (
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-600">Yutuqlar:</span>
                    <strong className="text-slate-900">{categoryCounts.achievements} ta</strong>
                  </div>
                )}
                {categoryCounts.events > 0 && (
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-600">Tadbirlar:</span>
                    <strong className="text-slate-900">{categoryCounts.events} ta</strong>
                  </div>
                )}
                {categoryCounts.announcements > 0 && (
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-600">E'lonlar:</span>
                    <strong className="text-slate-900">{categoryCounts.announcements} ta</strong>
                  </div>
                )}
                {categoryCounts.admins > 0 && (
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-600">Adminlar:</span>
                    <strong className="text-slate-900">{categoryCounts.admins} ta</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Warning callout */}
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-900">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Qaytarib bo‘lmas amal!</span>
              </div>
              <p className="leading-relaxed">
                Ushbu amal tanlangan barcha ma’lumotlarni Firestore ma’lumotlar bazasidan butunlay tozalaydi. Ushbu yozuvlarni keyinchalik qayta tiklashning umuman iloji bo‘lmaydi.
              </p>
            </div>

            {/* Confirmation verification */}
            <div className="space-y-2 pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={isConfirmChecked}
                  onChange={e => setIsConfirmChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                />
                <span>
                  Barcha ma’lumotlar butunlay yo‘q qilinishini tushundim va roziman.
                </span>
              </label>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-500">
                  Yoki tasdiqlash uchun maydonga <strong className="text-slate-800">TOZALASH</strong> deb yozing:
                </label>
                <input
                  type="text"
                  placeholder="TOZALASH"
                  value={confirmInputText}
                  onChange={e => setConfirmInputText(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono uppercase"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setIsEmptyModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl cursor-pointer"
              >
                Bekor qilish
              </button>

              <button
                type="button"
                disabled={!isConfirmValid || isProcessing || itemsToPurgeCount === 0}
                onClick={handleEmptyTrashConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Tozalanmoqda...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ha, butunlay bo‘shatilsin ({itemsToPurgeCount})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
