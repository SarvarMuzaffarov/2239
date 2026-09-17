import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  FolderGit2,
  Rocket,
  FileText,
  Upload,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Users,
  Building,
  Eye,
} from 'lucide-react';
import type { ProjectOrStartup, SupervisorProfile, UserRole } from '../types';
import { updateProjectOrStartup } from '../services/firestoreService';
import {
  uploadPdfDocument,
  validatePdfFile,
  UploadStep,
  UploadResult,
} from '../lib/storage';
import { DirectionSelect } from './DirectionSelect';

interface EditProjectModalProps {
  isOpen: boolean;
  project: ProjectOrStartup | null;
  actor: { id: string; fullName: string; role: UserRole };
  supervisors?: SupervisorProfile[];
  onClose: () => void;
  onSaveSuccess: () => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
  onOpenPdf?: (url: string, name?: string, size?: number, title?: string) => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  project,
  actor,
  supervisors = [],
  onClose,
  onSaveSuccess,
  onNotify,
  onOpenPdf,
}) => {
  const [type, setType] = useState<'loyiha' | 'startap'>('loyiha');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [field, setField] = useState('');
  const [authorNames, setAuthorNames] = useState('');
  const [supervisorId, setSupervisorId] = useState('');

  // Admin specific fields
  const [status, setStatus] = useState<'Kutilmoqda' | 'Tasdiqlangan' | 'Rad etilgan'>('Kutilmoqda');
  const [reviewNotes, setReviewNotes] = useState('');

  // File replacement
  const [replaceFile, setReplaceFile] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [uploadStep, setUploadStep] = useState<UploadStep>('idle');
  const [uploadPercent, setUploadPercent] = useState<number>(0);
  const [uploadMessage, setUploadMessage] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isAdmin = actor.role === 'admin' || actor.role === 'superAdmin';

  useEffect(() => {
    if (project) {
      setType(project.type || 'loyiha');
      setTitle(project.title || '');
      setDescription(project.description || '');
      setField(project.field || '');
      setAuthorNames(project.authorNames || '');
      setSupervisorId(project.supervisorId || '');
      setStatus(project.status || 'Kutilmoqda');
      setReviewNotes(project.reviewNotes || '');

      setReplaceFile(false);
      setNewFile(null);
      setUploadStep('idle');
      setUploadPercent(0);
      setUploadMessage('');
      setErrorMessage(null);
    }
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("Loyiha nomini kiritish majburiy.");
      return;
    }
    if (!field.trim()) {
      setErrorMessage("Yo‘nalish yoki sohani belgilash majburiy.");
      return;
    }
    if (!authorNames.trim()) {
      setErrorMessage("Mualliflar F.I.Sh. kiritilishi majburiy.");
      return;
    }
    if (!description.trim()) {
      setErrorMessage("Loyiha tavsifi (annotatsiyasi) kiritilishi majburiy.");
      return;
    }

    // If new file chosen, validate it
    if (replaceFile && newFile) {
      const val = validatePdfFile(newFile);
      if (!val.valid) {
        setErrorMessage(val.error || "Fayl talabga javob bermaydi.");
        return;
      }
    }

    try {
      setIsSubmitting(true);

      let fileData: Partial<ProjectOrStartup> = {};

      if (replaceFile && newFile) {
        setUploadStep('validating');
        setUploadPercent(10);
        setUploadMessage("Fayl tekshirilmoqda...");

        const uploadRes: UploadResult = await uploadPdfDocument(
          newFile,
          project.studentId || actor.id,
          type === 'loyiha' ? 'projects' : 'startups',
          progress => {
            setUploadStep(progress.step);
            setUploadPercent(progress.percent);
            setUploadMessage(progress.message);
          }
        );

        fileData = {
          fileUrl: uploadRes.fileUrl,
          fileName: uploadRes.fileName,
          fileSize: uploadRes.fileSize,
          fileType: uploadRes.fileType,
          storagePath: uploadRes.storagePath,
          fileDataUrl: uploadRes.fileDataUrl,
        };
      }

      // If student edits and project was previously 'Rad etilgan', reset to 'Kutilmoqda' so admin can review again
      let targetStatus = status;
      if (!isAdmin && project.status === 'Rad etilgan') {
        targetStatus = 'Kutilmoqda';
      }

      const updates: Partial<ProjectOrStartup> = {
        type,
        title: title.trim(),
        description: description.trim(),
        field: field.trim(),
        authorNames: authorNames.trim(),
        supervisorId: supervisorId || '',
        status: targetStatus,
        ...(isAdmin ? { reviewNotes: reviewNotes.trim() } : {}),
        ...fileData,
      };

      await updateProjectOrStartup(project.id, updates, actor);

      onNotify('success', "Loyiha ma'lumotlari muvaffaqiyatli saqlandi!");
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      console.error('Update project error:', err);
      const msg = err?.message || "Loyihani saqlashda xatolik yuz berdi.";
      setErrorMessage(msg);
      onNotify('error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={e => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl my-8 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-900">
              {type === 'startap' ? <Rocket className="w-5 h-5" /> : <FolderGit2 className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {type === 'startap' ? 'Startap loyihani tahrirlash' : 'Ilmiy loyihani tahrirlash'}
              </h2>
              <p className="text-xs text-slate-500">
                Loyiha rekvizitlarini yangilash, hujjatni almashtirish yoki xulosani kiritish.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isAdmin && project.status === 'Rad etilgan' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Eslatma:</strong> Loyiha avval rad etilgan. O‘zgartirish kiritib saqlasangiz, status
                avtomatik tarzda qayta tekshiruv uchun <span className="font-bold">«Kutilmoqda»</span> holatiga o‘tadi.
              </div>
            </div>
          )}

          {/* Project Type Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Turi</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('loyiha')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  type === 'loyiha'
                    ? 'border-blue-900 bg-blue-50 text-blue-900 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FolderGit2 className="w-4 h-4" />
                <span>Ilmiy loyiha</span>
              </button>
              <button
                type="button"
                onClick={() => setType('startap')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  type === 'startap'
                    ? 'border-indigo-900 bg-indigo-50 text-indigo-900 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Rocket className="w-4 h-4" />
                <span>Startap tashabbusi</span>
              </button>
            </div>
          </div>

          {/* Project Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Loyiha nomi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Masalan: Qishloq xo‘jaligida sun’iy intellekt qo‘llanilishi"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-colors"
            />
          </div>

          {/* Field / Direction */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Soha / Ta'lim yo‘nalishi <span className="text-rose-500">*</span>
            </label>
            <DirectionSelect
              value={field}
              onChange={setField}
              placeholder="Yo‘nalishni tanlang yoki qidiring..."
              required
            />
          </div>

          {/* Authors */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mualliflar va hammualliflar <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={authorNames}
              onChange={e => setAuthorNames(e.target.value)}
              placeholder="Masalan: Karimov A., Mahmudov B."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-colors"
            />
          </div>

          {/* Supervisor Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ilmiy rahbar (Ixtiyoriy)
            </label>
            <select
              value={supervisorId}
              onChange={e => setSupervisorId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-colors cursor-pointer"
            >
              <option value="">Rahbar tanlanmagan</option>
              {supervisors.map(s => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.position || 'Rahbar'}, {s.department || ''})
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Loyiha tavsifi va dolzarbligi <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Loyiha maqsadi, kutilayotgan ilmiy/amaliy natijalar..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-colors resize-y"
            />
          </div>

          {/* PDF Document Management */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Hujjat (PDF fayl)
            </label>

            {project.fileUrl && !replaceFile ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-red-50 text-red-600 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-slate-900 truncate">
                      {project.fileName || 'Loyiha_hujjati.pdf'}
                    </div>
                    {project.fileSize && (
                      <div className="text-[11px] text-slate-500">
                        {(project.fileSize / (1024 * 1024)).toFixed(2)} MB
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {onOpenPdf && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenPdf(
                          project.fileDataUrl || project.fileUrl!,
                          project.fileName,
                          project.fileSize,
                          project.title
                        )
                      }
                      className="px-2.5 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ko‘rish</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setReplaceFile(true)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Almashtirish
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Yangi PDF fayl yuklash (Maksimal 10 MB)</span>
                  {project.fileUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setReplaceFile(false);
                        setNewFile(null);
                      }}
                      className="text-xs text-blue-900 hover:underline cursor-pointer"
                    >
                      Mavjud faylni qoldirish
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  accept="application/pdf"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const val = validatePdfFile(file);
                      if (!val.valid) {
                        setErrorMessage(val.error || 'Fayl formati yaroqsiz.');
                        setNewFile(null);
                      } else {
                        setErrorMessage(null);
                        setNewFile(file);
                      }
                    }
                  }}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-900 hover:file:bg-blue-100 file:cursor-pointer cursor-pointer border border-slate-200 rounded-xl p-1.5 bg-slate-50"
                />

                {newFile && (
                  <div className="text-xs text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Tanlangan fayl: {newFile.name} ({(newFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  </div>
                )}

                {uploadStep !== 'idle' && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span>{uploadMessage}</span>
                      <span>{uploadPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-900 transition-all duration-300 rounded-full"
                        style={{ width: `${uploadPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Admin Specific Controls: Status and Review Notes */}
          {isAdmin && (
            <div className="pt-3 border-t border-slate-100 space-y-3 bg-blue-50/40 p-3.5 rounded-xl border">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <span>Ekspertiza va Holat (Admin)</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Loyiha holati (Status)
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 cursor-pointer"
                >
                  <option value="Kutilmoqda">Kutilmoqda</option>
                  <option value="Tasdiqlangan">Tasdiqlangan</option>
                  <option value="Rad etilgan">Rad etilgan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ekspertiza xulosasi / Izoh
                </label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  placeholder="Loyiha bo‘yicha ekspert xulosasi yoki kamchiliklar..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saqlanmoqda...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>O‘zgarishlarni saqlash</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
