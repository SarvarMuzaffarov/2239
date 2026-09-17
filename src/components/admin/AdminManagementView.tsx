import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  ShieldCheck,
  UserPlus,
  KeyRound,
  Edit,
  Ban,
  CheckCircle,
  Trash2,
  Search,
  Sliders,
  ShieldAlert,
  Clock,
  Phone,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { toggleUserBlockStatus, softDeleteUser, permanentDeleteUser } from '../../services/authService';
import { AdminEditModal } from './AdminEditModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import { AdminPermissionsModal } from './AdminPermissionsModal';
import { updateAdminProfile } from '../../services/authService';
import type { UserAccount, AdminPermissions } from '../../types';

interface Props {
  actor: UserAccount;
  admins: UserAccount[];
  onRefresh: () => void;
}

export const AdminManagementView: React.FC<Props> = ({ actor, admins, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'superAdmin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [adminToEdit, setAdminToEdit] = useState<UserAccount | null>(null);

  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
  const [adminToResetPass, setAdminToResetPass] = useState<UserAccount | null>(null);

  const [isPermsModalOpen, setIsPermsModalOpen] = useState(false);
  const [adminForPerms, setAdminForPerms] = useState<UserAccount | null>(null);

  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [adminToDelete, setAdminToDelete] = useState<UserAccount | null>(null);
  const [deleteMode, setDeleteMode] = useState<'soft' | 'permanent'>('soft');

  // Filtered list of non-deleted admins
  const activeAdmins = useMemo(() => {
    return admins.filter(a => !a.isDeleted && Boolean(a.isDeleted) !== true && !deletedIds.includes(a.id));
  }, [admins, deletedIds]);

  const filteredAdmins = useMemo(() => {
    return activeAdmins.filter(admin => {
      const matchRole = roleFilter === 'all' || admin.role === roleFilter;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && admin.isActive !== false) ||
        (statusFilter === 'blocked' && admin.isActive === false);

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        admin.fullName.toLowerCase().includes(q) ||
        admin.phone.toLowerCase().includes(q) ||
        (admin.email && admin.email.toLowerCase().includes(q)) ||
        (admin.login && admin.login.toLowerCase().includes(q)) ||
        (admin.position && admin.position.toLowerCase().includes(q));

      return matchRole && matchStatus && matchSearch;
    });
  }, [activeAdmins, roleFilter, statusFilter, searchQuery]);

  const handleToggleStatus = async (admin: UserAccount) => {
    if (admin.id === actor.id) {
      setFeedback({ text: "O‘z hisobingizni bloklay olmaysiz!", type: 'error' });
      return;
    }
    setLoadingId(admin.id);
    setFeedback(null);
    try {
      const nextActive = admin.isActive === false;
      await toggleUserBlockStatus(admin.id, nextActive, actor.id, actor.fullName);
      setFeedback({
        text: `Admin ${admin.fullName} ${nextActive ? 'faollashtirildi' : 'bloklandi'}.`,
        type: 'success',
      });
      onRefresh();
    } catch (err: any) {
      setFeedback({ text: err.message || "Holatni o'zgartirishda xatolik yuz berdi.", type: 'error' });
    } finally {
      setLoadingId(null);
    }
  };

  const handleOpenDeleteModal = (admin: UserAccount) => {
    if (admin.id === actor.id) {
      setFeedback({ text: "O‘z hisobingizni o‘chira olmaysiz!", type: 'error' });
      return;
    }
    setAdminToDelete(admin);
    setDeleteMode('soft');
  };

  const handleConfirmDelete = async () => {
    if (!adminToDelete) return;
    const target = adminToDelete;
    setLoadingId(target.id);
    setFeedback(null);
    try {
      if (deleteMode === 'permanent') {
        await permanentDeleteUser(target.id, {
          id: actor.id,
          fullName: actor.fullName,
          role: actor.role,
        });
        setFeedback({
          text: `${target.fullName} tizimdan butunlay o‘chirildi!`,
          type: 'success',
        });
      } else {
        await softDeleteUser(target.id, {
          id: actor.id,
          fullName: actor.fullName,
          role: actor.role,
        });
        setFeedback({
          text: `${target.fullName} chiqindilar qutisiga o‘tkazildi (Trash). Istalgan vaqt tiklash mumkin.`,
          type: 'success',
        });
      }
      setDeletedIds(prev => [...prev, target.id]);
      setAdminToDelete(null);
      onRefresh();
    } catch (err: any) {
      setFeedback({ text: err.message || "O‘chirishda xatolik yuz berdi.", type: 'error' });
    } finally {
      setLoadingId(null);
    }
  };

  const handleSavePermissions = async (updatedPerms: AdminPermissions) => {
    if (!adminForPerms) return;
    try {
      await updateAdminProfile(
        adminForPerms.id,
        { permissions: updatedPerms },
        { id: actor.id, fullName: actor.fullName, role: actor.role }
      );
      setFeedback({ text: `Ruxsatlar yangilandi: ${adminForPerms.fullName}`, type: 'success' });
      setAdminForPerms(prev => prev ? { ...prev, permissions: updatedPerms } : null);
      onRefresh();
    } catch (err: any) {
      setFeedback({ text: err.message || "Ruxsatlarni saqlashda xatolik yuz berdi.", type: 'error' });
    }
  };

  const isSuperAdmin = actor.role === 'superAdmin';

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Adminlarni Boshqarish Markazi</h2>
            <p className="text-xs text-slate-500">
              Super Admin va Adminlar ro‘yxati, huquqlar (RBAC) va xavfsizlik nazorati
            </p>
          </div>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => {
              setAdminToEdit(null);
              setIsEditModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Yangi Admin qo‘shish</span>
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="F.I.Sh, telefon yoki lavozim bo‘yicha qidirish..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="all">Barcha rollar</option>
            <option value="superAdmin">Super Adminlar</option>
            <option value="admin">Oddiy Adminlar</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="all">Barcha holatlar</option>
            <option value="active">🟢 Faol adminlar</option>
            <option value="blocked">🔴 Bloklanganlar</option>
          </select>

          <span className="text-xs text-slate-500 font-medium px-2">
            Jami: <strong>{filteredAdmins.length} nafar</strong>
          </span>
        </div>
      </div>

      {/* Admin Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAdmins.map(admin => {
          const isMe = admin.id === actor.id;
          const isTargetSuper = admin.role === 'superAdmin';

          return (
            <div
              key={admin.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between ${
                admin.isActive === false
                  ? 'border-rose-200 bg-rose-50/20'
                  : isTargetSuper
                  ? 'border-amber-200 bg-amber-50/10'
                  : 'border-slate-200'
              }`}
            >
              <div>
                {/* Top status line */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      isTargetSuper
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}
                  >
                    {isTargetSuper ? '👑 SUPER ADMIN' : '🛡️ ADMIN'}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                      admin.isActive === false
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        admin.isActive === false ? 'bg-rose-600' : 'bg-emerald-600'
                      }`}
                    />
                    {admin.isActive === false ? 'Bloklangan' : 'Faol'}
                  </span>
                </div>

                {/* Profile info */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-600 font-bold text-base uppercase overflow-hidden">
                    {admin.photoURL ? (
                      <img src={admin.photoURL} alt={admin.fullName} className="w-full h-full object-cover" />
                    ) : (
                      admin.fullName.slice(0, 2)
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {admin.fullName} {isMe && <span className="text-emerald-700 text-xs">(Siz)</span>}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {admin.position || 'Boshqaruvchi ma’sul'}
                    </p>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">{admin.phone}</span>
                  </div>
                  {admin.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{admin.email}</span>
                    </div>
                  )}
                  {admin.login && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Login: <strong className="font-mono text-slate-800">{admin.login}</strong></span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>Yaratilgan: {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString('uz-UZ') : '—'}</span>
                  </div>
                </div>
              </div>

              {/* Actions toolbar */}
              {isSuperAdmin && (
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAdminToEdit(admin);
                        setIsEditModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title="Tahrirlash"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAdminToResetPass(admin);
                        setIsResetPassModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 transition-colors"
                      title="Parolni yangilash"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>

                    {!isTargetSuper && (
                      <button
                        type="button"
                        onClick={() => {
                          setAdminForPerms(admin);
                          setIsPermsModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                        title="Ruxsatlarni boshqarish (RBAC)"
                      >
                        <Sliders className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {!isMe && (
                      <>
                        <button
                          type="button"
                          disabled={loadingId === admin.id}
                          onClick={() => handleToggleStatus(admin)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                            admin.isActive === false
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                          {admin.isActive === false ? 'Faollashtirish' : 'Bloklash'}
                        </button>

                        <button
                          type="button"
                          disabled={loadingId === admin.id}
                          onClick={() => handleOpenDeleteModal(admin)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Adminni o‘chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Admin Modal */}
      <AdminEditModal
        isOpen={isEditModalOpen}
        adminToEdit={adminToEdit}
        actor={actor}
        onSuccess={() => {
          onRefresh();
          setFeedback({ text: "Admin ma'lumotlari muvaffaqiyatli saqlandi!", type: 'success' });
        }}
        onClose={() => setIsEditModalOpen(false)}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={isResetPassModalOpen}
        targetUser={adminToResetPass}
        actor={actor}
        onSuccess={() => {
          onRefresh();
          setFeedback({ text: "Parol muvaffaqiyatli yangilandi!", type: 'success' });
        }}
        onClose={() => setIsResetPassModalOpen(false)}
      />

      {/* Permissions Modal */}
      {adminForPerms && (
        <AdminPermissionsModal
          isOpen={isPermsModalOpen}
          adminName={adminForPerms.fullName}
          initialPermissions={adminForPerms.permissions}
          onSave={handleSavePermissions}
          onClose={() => setIsPermsModalOpen(false)}
        />
      )}

      {/* Delete Admin Confirmation Modal */}
      {adminToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="p-2 bg-rose-50 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Admin hisobini o‘chirish</h3>
              </div>
              <button
                type="button"
                onClick={() => setAdminToDelete(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-600">
                Quyidagi admin hisobini tizimdan o‘chirmoqchimisiz?
              </p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="font-bold text-slate-900">{adminToDelete.fullName}</div>
                <div className="text-slate-500 mt-0.5 font-mono">{adminToDelete.phone} | {adminToDelete.role}</div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-slate-700 block">O‘chirish usulini tanlang:</label>
                
                <div
                  onClick={() => setDeleteMode('soft')}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    deleteMode === 'soft'
                      ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="deleteMode"
                    checked={deleteMode === 'soft'}
                    onChange={() => setDeleteMode('soft')}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Chiqindilar qutisiga o‘tkazish (Tavsiya etiladi)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Admin faolsizlantiriladi va Chiqindilar qutisiga (Trash) o‘tkaziladi. Istalgan paytda qayta tiklash mumkin.
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setDeleteMode('permanent')}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    deleteMode === 'permanent'
                      ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-400'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="deleteMode"
                    checked={deleteMode === 'permanent'}
                    onChange={() => setDeleteMode('permanent')}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-rose-700">Tizimdan butunlay o‘chirish (Permanent Delete)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Foydalanuvchi ma’lumotlar bazasidan butunlay o‘chiriladi. Qayta tiklab bo‘lmaydi.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAdminToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={loadingId === adminToDelete.id}
                onClick={handleConfirmDelete}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-colors flex items-center gap-2 ${
                  deleteMode === 'permanent'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {loadingId === adminToDelete.id ? (
                  <span>O‘chirilmoqda...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deleteMode === 'permanent' ? 'Butunlay o‘chirish' : 'Chiqindiga o‘tkazish'}</span>
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
