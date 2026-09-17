import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CheckSquare, Square, RotateCcw, Save } from 'lucide-react';
import { PERMISSION_RESOURCES, ACTION_NAMES_UZ, getFullAdminPermissions, getReadOnlyPermissions } from '../../lib/permissions';
import type { AdminPermissions, PermissionResource, PermissionAction } from '../../types';

interface Props {
  isOpen: boolean;
  adminName: string;
  initialPermissions?: AdminPermissions;
  onSave: (permissions: AdminPermissions) => void;
  onClose: () => void;
}

export const AdminPermissionsModal: React.FC<Props> = ({
  isOpen,
  adminName,
  initialPermissions = {},
  onSave,
  onClose,
}) => {
  const [perms, setPerms] = useState<AdminPermissions>(() => {
    // deep clone
    return JSON.parse(JSON.stringify(initialPermissions || {}));
  });

  // Always sync permissions state whenever the modal opens or the target admin changes
  useEffect(() => {
    if (isOpen) {
      setPerms(JSON.parse(JSON.stringify(initialPermissions || {})));
    }
  }, [isOpen, initialPermissions]);

  if (!isOpen) return null;

  const toggleAction = (resId: PermissionResource, action: PermissionAction) => {
    setPerms(prev => {
      const next = { ...prev };
      const currentRes = { ...(next[resId] || {}) };
      const willBeGranted = !currentRes[action];

      if (action === 'view') {
        if (!willBeGranted) {
          // If viewing is disabled, clear all permissions for this resource
          next[resId] = { view: false };
        } else {
          currentRes.view = true;
          next[resId] = currentRes;
        }
      } else {
        // Any modification action (create, edit, delete, approve, export) requires view permission
        currentRes[action] = willBeGranted;
        if (willBeGranted) {
          currentRes.view = true;
        }
        next[resId] = currentRes;
      }
      return next;
    });
  };

  const toggleResourceAll = (resId: PermissionResource, actions: PermissionAction[]) => {
    setPerms(prev => {
      const next = { ...prev };
      const current = next[resId] || {};
      const allChecked = actions.every(act => current[act]);
      next[resId] = {};
      actions.forEach(act => {
        next[resId]![act] = !allChecked;
      });
      return next;
    });
  };

  const applyFullPreset = () => {
    setPerms(getFullAdminPermissions());
  };

  const applyReadOnlyPreset = () => {
    setPerms(getReadOnlyPermissions());
  };

  const handleSave = () => {
    onSave(perms);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Admin Ruxsatlarini Sozlash (RBAC)</h3>
              <p className="text-xs text-slate-500">
                Admin: <span className="font-semibold text-slate-800">{adminName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets bar */}
        <div className="px-6 py-2.5 bg-emerald-50/50 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-emerald-900 font-medium">Tezkor shablonlar:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={applyFullPreset}
              className="px-2.5 py-1 bg-white hover:bg-emerald-100/70 border border-emerald-300 text-emerald-800 rounded-lg font-medium transition-colors"
            >
              To‘liq ruxsatlar (Barchasi)
            </button>
            <button
              type="button"
              onClick={applyReadOnlyPreset}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
            >
              Faqat ko‘rish (Read-only)
            </button>
            <button
              type="button"
              onClick={() => setPerms({})}
              className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-medium transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Tozalash
            </button>
          </div>
        </div>

        {/* Matrix Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {PERMISSION_RESOURCES.map(res => {
              const resPerms = perms[res.id] || {};
              const allChecked = res.availableActions.every(act => !!resPerms[act]);
              const someChecked = res.availableActions.some(act => !!resPerms[act]);

              return (
                <div key={res.id} className="p-3.5 bg-white hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleResourceAll(res.id, res.availableActions)}
                        className="text-emerald-600 hover:text-emerald-700"
                      >
                        {allChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : someChecked ? (
                          <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-400 flex items-center justify-center">
                            <div className="w-2 h-0.5 bg-emerald-700" />
                          </div>
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      <div>
                        <span className="text-sm font-bold text-slate-800">{res.nameUz}</span>
                        <p className="text-xs text-slate-500">{res.descriptionUz}</p>
                      </div>
                    </div>

                    {/* Action toggles */}
                    <div className="flex flex-wrap items-center gap-2 ml-6 sm:ml-0">
                      {res.availableActions.map(action => {
                        const isGranted = !!resPerms[action];
                        return (
                          <button
                            key={action}
                            type="button"
                            onClick={() => toggleAction(res.id, action)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                              isGranted
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
                            }`}
                          >
                            {ACTION_NAMES_UZ[action]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            * Super Admin doimo cheklovsiz to‘liq ruxsatga ega.
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Ruxsatlarni saqlash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
