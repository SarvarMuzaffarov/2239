import React from 'react';
import { CheckSquare, Square, Download, Trash2, CheckCircle2, XCircle, X } from 'lucide-react';

interface Props {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkExport?: () => void;
  onBulkApprove?: () => void;
  onBulkReject?: () => void;
  onBulkDelete?: () => void;
  isAllSelected: boolean;
}

export const BulkActionToolbar: React.FC<Props> = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBulkExport,
  onBulkApprove,
  onBulkReject,
  onBulkDelete,
  isAllSelected,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150 border border-slate-800">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={isAllSelected ? onClearSelection : onSelectAll}
          className="flex items-center gap-2 text-xs font-semibold hover:text-emerald-400 transition-colors"
        >
          {isAllSelected ? (
            <CheckSquare className="w-4 h-4 text-emerald-400" />
          ) : (
            <Square className="w-4 h-4 text-slate-400" />
          )}
          <span>
            {selectedCount} / {totalCount} ta tanlandi
          </span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        {onBulkApprove && (
          <button
            type="button"
            onClick={onBulkApprove}
            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tasdiqlash</span>
          </button>
        )}

        {onBulkReject && (
          <button
            type="button"
            onClick={onBulkReject}
            className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rad etish</span>
          </button>
        )}

        {onBulkExport && (
          <button
            type="button"
            onClick={onBulkExport}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tanlanganlarni Excel yuklash</span>
          </button>
        )}

        {onBulkDelete && (
          <button
            type="button"
            onClick={onBulkDelete}
            className="px-2.5 py-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Chiqindiga (Trash)</span>
          </button>
        )}

        <button
          type="button"
          onClick={onClearSelection}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 ml-2"
          title="Tanlovni bekor qilish"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
