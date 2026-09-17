import React, { useState, useMemo } from 'react';
import {
  X,
  Award,
  Calendar,
  Sparkles,
  Download,
  Eye,
  FileCode2,
  Building2,
  ShieldCheck,
  Tag,
  AlignLeft,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import type { StudentProfile, UserAccount } from '../types';
import {
  PRESET_TEMPLATES,
  PresetTemplate,
  CertificateData,
  downloadCertificatePdf,
} from '../lib/certificateGenerator';
import { CertificateLivePreview } from './CertificateLivePreview';
import { canonicalizeDirection } from '../constants/directions';

interface IssueCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentProfile[];
  currentUser: UserAccount;
  onSubmit: (certData: {
    studentId: string;
    studentName: string;
    eventTitle: string;
    title: string;
    organizationName: string;
    issueDate: string;
    certificateNumber: string;
    documentType: 'diplom' | 'sertifikat';
    subtitle: string;
    presentedToText: string;
    description: string;
    competitionName?: string;
    nomination?: string;
    confirmationText?: string;
    decisionNumber?: string;
    awardLevel?: string;
    signatoryDegree?: string;
    additionalNote?: string;
    additionalSignatureText?: string;
    signatoryName: string;
    signatoryRole: string;
    studentDirection?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export const IssueCertificateModal: React.FC<IssueCertificateModalProps> = ({
  isOpen,
  onClose,
  students,
  currentUser,
  onSubmit,
  isSubmitting,
}) => {
  // 1. Document basics
  const [docType, setDocType] = useState<'diplom' | 'sertifikat'>('diplom');
  const [certNumber, setCertNumber] = useState<string>(
    () => `CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [issueDate, setIssueDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );

  // 2. Student info
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentFullName, setStudentFullName] = useState<string>('');
  const [studentDirection, setStudentDirection] = useState<string>('');

  // 3. Titles & Presentation
  const [title, setTitle] = useState<string>('DIPLOM');
  const [subtitle, setSubtitle] = useState<string>('Tanlov g‘olibi');
  const [awardLevel, setAwardLevel] = useState<string>('Tanlov g‘olibi');
  const [presentedToText, setPresentedToText] = useState<string>('Ushbu diplom');

  // 4. Event & Competition
  const [eventTitle, setEventTitle] = useState<string>(
    '«Yil talabasi–2026» respublika ko‘rik-tanlovi'
  );
  const [competitionName, setCompetitionName] = useState<string>(
    '«O‘z mutaxassisligi bo‘yicha yilning eng bilimdon talabasi»'
  );
  const [nomination, setNomination] = useState<string>(
    '«Mutaxassislik bo‘yicha tanlov g‘olibi»'
  );

  // 5. Main text & Confirmation
  const [description, setDescription] = useState<string>(
    'tanlovida yuqori natija, chuqur bilim va iqtidor namoyish etib, faxrli g‘oliblikni qo‘lga kiritgani uchun taqdim etiladi.'
  );
  const [decisionNumber, setDecisionNumber] = useState<string>('');
  const [confirmationText, setConfirmationText] = useState<string>(
    'Toshkent kimyo-texnologiya instituti Yangiyer filiali Ilmiy kengashining qaroriga asosan.'
  );
  const [organizationName, setOrganizationName] = useState<string>(
    'Toshkent kimyo-texnologiya instituti Yangiyer filiali'
  );

  // 6. Signatory
  const [signatoryName, setSignatoryName] = useState<string>('Xakimov Zafar Tulyaganovich');
  const [signatoryRole, setSignatoryRole] = useState<string>('TKTI Yangiyer filiali direktori');
  const [signatoryDegree, setSignatoryDegree] = useState<string>('');
  const [additionalSignatureText, setAdditionalSignatureText] = useState<string>('');

  // Active view tab in modal: 'editor' or 'preview'
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('winner');

  // Auto-fill first student if not yet populated
  React.useEffect(() => {
    if (!studentFullName && students && students.length > 0) {
      const first = students[0];
      setSelectedStudentId(first.id);
      setStudentFullName(first.fullName);
      const canonicalFaculty = canonicalizeDirection(first.facultyOrField) || first.facultyOrField || 'Kimyo muhandisligi';
      const dirText = `${canonicalFaculty}, ${first.course || 3}-kurs, ${first.group || '21-01'}-guruh`;
      setStudentDirection(dirText);
    }
  }, [students, studentFullName]);

  // Generate random new certificate code
  const handleRegenerateNumber = () => {
    setCertNumber(`CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  // When a student is chosen from dropdown, auto-fill studentFullName and direction
  const handleStudentSelect = (stId: string) => {
    setSelectedStudentId(stId);
    const st = students.find(s => s.id === stId);
    if (st) {
      setStudentFullName(st.fullName);
      const canonicalFaculty = canonicalizeDirection(st.facultyOrField) || st.facultyOrField || 'Kimyo muhandisligi';
      const dirText = `${canonicalFaculty}, ${st.course}-kurs, ${st.group}-guruh`;
      setStudentDirection(dirText);
    }
  };

  // Toggle document type
  const handleDocTypeChange = (type: 'diplom' | 'sertifikat') => {
    setDocType(type);
    if (type === 'diplom') {
      setTitle('DIPLOM');
      setSubtitle('Tanlov g‘olibi');
      setAwardLevel('Tanlov g‘olibi');
      setPresentedToText('Ushbu diplom');
    } else {
      setTitle('SERTIFIKAT');
      setSubtitle('Faxriy sertifikat');
      setAwardLevel('Ishtirokchi');
      setPresentedToText('Ushbu sertifikat');
    }
  };

  // Apply a preset template
  const handleApplyTemplate = (tmpl: PresetTemplate) => {
    setSelectedTemplateId(tmpl.id);
    setDocType(tmpl.documentType);
    setTitle(tmpl.title);
    setSubtitle(tmpl.subtitle);
    if (tmpl.awardLevel) {
      setAwardLevel(tmpl.awardLevel);
    }
    setPresentedToText(tmpl.presentedToText);
    setNomination(tmpl.nomination);
    setDescription(tmpl.description);
    if (tmpl.confirmationText) {
      setConfirmationText(tmpl.confirmationText);
    }
  };

  // Live preview data object
  const currentPreviewData: CertificateData = useMemo(() => {
    const effectiveStudentName =
      studentFullName.trim() ||
      (students.length > 0 ? students[0].fullName : 'SARVAR MUZAFFAROV');

    const effectiveConfirmation = decisionNumber.trim()
      ? `Toshkent kimyo-texnologiya instituti Yangiyer filiali Ilmiy kengashining 2026-yil ${decisionNumber.trim()} qaroriga asosan.`
      : confirmationText.trim();

    return {
      certificateNumber: certNumber.trim() || 'CERT-2026-6395',
      studentName: effectiveStudentName,
      title: title.trim() || (docType === 'diplom' ? 'DIPLOM' : 'SERTIFIKAT'),
      subtitle: subtitle.trim(),
      awardLevel: awardLevel.trim(),
      presentedToText: presentedToText.trim() || (docType === 'diplom' ? 'Ushbu diplom' : 'Ushbu sertifikat'),
      description: description.trim(),
      eventTitle: eventTitle.trim(),
      competitionName: competitionName.trim(),
      nomination: nomination.trim(),
      decisionNumber: decisionNumber.trim(),
      confirmationText: effectiveConfirmation,
      organizationName: organizationName.trim(),
      issueDate: issueDate,
      documentType: docType,
      signatoryName: signatoryName.trim() || 'Xakimov Zafar Tulyaganovich',
      signatoryRole: signatoryRole.trim() || 'TKTI Yangiyer filiali direktori',
      signatoryDegree: signatoryDegree.trim(),
      additionalSignatureText: additionalSignatureText.trim(),
      studentDirection: studentDirection.trim(),
    };
  }, [
    certNumber,
    studentFullName,
    students,
    title,
    subtitle,
    awardLevel,
    presentedToText,
    description,
    eventTitle,
    competitionName,
    nomination,
    decisionNumber,
    confirmationText,
    organizationName,
    issueDate,
    docType,
    signatoryName,
    signatoryRole,
    signatoryDegree,
    additionalSignatureText,
    studentDirection,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentFullName.trim()) {
      alert("Iltimos, talabaning F.I.Sh.ni kiriting yoki ro'yxatdan tanlang.");
      return;
    }
    await onSubmit({
      studentId: selectedStudentId || 'manual',
      studentName: studentFullName.trim(),
      eventTitle: eventTitle.trim(),
      title: title.trim(),
      organizationName: organizationName.trim(),
      issueDate: issueDate,
      certificateNumber: certNumber.trim(),
      documentType: docType,
      subtitle: subtitle.trim(),
      awardLevel: awardLevel.trim(),
      presentedToText: presentedToText.trim(),
      description: description.trim(),
      competitionName: competitionName.trim(),
      nomination: nomination.trim(),
      decisionNumber: decisionNumber.trim(),
      confirmationText: currentPreviewData.confirmationText,
      additionalNote: currentPreviewData.confirmationText,
      additionalSignatureText: additionalSignatureText.trim(),
      signatoryName: signatoryName.trim(),
      signatoryRole: signatoryRole.trim(),
      signatoryDegree: signatoryDegree.trim(),
      studentDirection: studentDirection.trim(),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-6xl max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Yangi diplom yoki sertifikat rasmiylashtirish</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  A4 Landscape
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                TKTI Yangiyer filiali rasmiy yangi dizayn shabloni va QR-kodli verifikatsiya bilan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher: Forma vs Oldindan ko'rish */}
            <div className="flex items-center bg-slate-200/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'editor'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileCode2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Forma tahrirlash</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'preview'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>Oldindan ko‘rish</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors ml-2"
              title="Yopish"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {/* Quick Preset Templates Bar */}
          <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Tayyor shablonlar (bir marta bosishda to‘ldiradi):</span>
              </div>
              <span className="text-[11px] text-slate-400">8 ta rasmiy namuna</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {PRESET_TEMPLATES.map(tmpl => {
                const isSelected = selectedTemplateId === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <span>{tmpl.badge}</span>
                    <span>{tmpl.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === 'preview' ? (
            /* PREVIEW TAB */
            <div className="space-y-4">
              <CertificateLivePreview
                data={currentPreviewData}
                onDownload={() => downloadCertificatePdf(currentPreviewData)}
                showActions={true}
              />
            </div>
          ) : (
            /* EDITOR TAB */
            <form id="cert-issue-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1: Document Type, Number, Date */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <span>1. Hujjat turi, raqami va berilgan sana</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Hujjat turi *
                    </label>
                    <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleDocTypeChange('diplom')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          docType === 'diplom'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        🏆 DIPLOM
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDocTypeChange('sertifikat')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          docType === 'sertifikat'
                            ? 'bg-blue-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        🎓 SERTIFIKAT
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Diplom / Sertifikat raqami *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={certNumber}
                        onChange={e => setCertNumber(e.target.value)}
                        placeholder="CERT-2026-XXXX"
                        className="w-full pl-3.5 pr-10 py-2 text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-emerald-900"
                      />
                      <button
                        type="button"
                        onClick={handleRegenerateNumber}
                        title="Yangi unikal raqam generatsiya qilish"
                        className="absolute right-2 top-2 text-slate-400 hover:text-emerald-700 p-1 rounded-md transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Berilgan sana *
                    </label>
                    <input
                      type="date"
                      required
                      value={issueDate}
                      onChange={e => setIssueDate(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Student Selection & Info */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>2. Talaba ma’lumotlari (Markaziy F.I.Sh.)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Tizimdagi talabani tanlang (avtomatik to‘ldirish)
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={e => handleStudentSelect(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      <option value="">-- Talabalar ro‘yxatidan tanlash --</option>
                      {students.map(st => (
                        <option key={st.id} value={st.id}>
                          {st.fullName} ({st.group}, {st.course}-kurs)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Talabaning to‘liq F.I.Sh. (Diplomda markazda katta shriftda chiqadi) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masalan: Sarvar Muzaffarov"
                      value={studentFullName}
                      onChange={e => setStudentFullName(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Talabaning fakulteti / yo‘nalishi / guruhi
                    </label>
                    <input
                      type="text"
                      placeholder="Masalan: Kimyo muhandisligi yo‘nalishi, 3-kurs, 102-guruh talabasi"
                      value={studentDirection}
                      onChange={e => setStudentDirection(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Headers & Presentation wording */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>3. Sarlavhalar, daraja va taqdimot matni</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Asosiy sarlavha (Katta harflarda) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="DIPLOM yoki SERTIFIKAT"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-emerald-950"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Daraja / Status (Badge)
                    </label>
                    <select
                      value={awardLevel}
                      onChange={e => {
                        setAwardLevel(e.target.value);
                        setSubtitle(e.target.value);
                      }}
                      className="w-full px-3.5 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-emerald-900"
                    >
                      <option value="Tanlov g‘olibi">Tanlov g‘olibi</option>
                      <option value="1-o‘rin">1-o‘rin (I darajali diplom)</option>
                      <option value="2-o‘rin">2-o‘rin (II darajali diplom)</option>
                      <option value="3-o‘rin">3-o‘rin (III darajali diplom)</option>
                      <option value="Faxriy yorliq">Faxriy yorliq</option>
                      <option value="Ishtirokchi">Faol ishtirokchi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Sarlavha ostidagi matn (Subtitle) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Tanlov g‘olibi yoki 1-o‘rin"
                      value={subtitle}
                      onChange={e => setSubtitle(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm italic bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Taqdimot so‘zlari *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ushbu diplom"
                      value={presentedToText}
                      onChange={e => setPresentedToText(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm italic bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Event, Competition & Nomination */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>4. Tadbir, tanlov va nominatsiya</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Tadbir nomi *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="«Yil talabasi–2026» respublika ko‘rik-tanlovi"
                      value={eventTitle}
                      onChange={e => setEventTitle(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Tanlov yoki yo‘nalish nomi (Diplomda ajratib ko‘rsatiladi) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="«O‘z mutaxassisligi bo‘yicha yilning eng bilimdon talabasi»"
                      value={competitionName}
                      onChange={e => setCompetitionName(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm font-semibold text-emerald-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nominatsiya / Maxsus unvon
                    </label>
                    <input
                      type="text"
                      placeholder="«Mutaxassislik bo‘yicha tanlov g‘olibi»"
                      value={nomination}
                      onChange={e => setNomination(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Main Body Description & Confirmation */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <AlignLeft className="w-4 h-4 text-emerald-600" />
                  <span>5. Asosiy tavsif matni va tasdiqlovchi qaror</span>
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Asosiy taqdirlash matni (Admin to‘liq tahrirlashi mumkin) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="tanlovida yuqori natija, chuqur bilim va iqtidor namoyish etib, faxrli g‘oliblikni qo‘lga kiritgani uchun taqdim etiladi."
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Matn uzunligidan qat'i nazar shrift o‘lchami va qator balandligi diplom ramkasiga avtomatik moslashtiriladi.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Qaror raqami (Ixtiyoriy)
                    </label>
                    <input
                      type="text"
                      value={decisionNumber}
                      onChange={e => setDecisionNumber(e.target.value)}
                      placeholder="Masalan: 5-sonli"
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Tasdiqlovchi matn (Kichik yozuv: Ilmiy kengash qarori) *
                    </label>
                    <input
                      type="text"
                      required
                      value={confirmationText}
                      onChange={e => setConfirmationText(e.target.value)}
                      placeholder="Toshkent kimyo-texnologiya instituti Yangiyer filiali Ilmiy kengashining qaroriga asosan."
                      className="w-full px-3.5 py-2 text-sm italic bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Section 6: Official Signatory & Institution */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>6. Muassasa va mas’ul shaxs (Rasmiy imzo va tasdiq bloki)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Muassasa nomi *
                    </label>
                    <input
                      type="text"
                      required
                      value={organizationName}
                      onChange={e => setOrganizationName(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Mas’ul shaxs F.I.Sh. (Direktor) *
                    </label>
                    <input
                      type="text"
                      required
                      value={signatoryName}
                      onChange={e => setSignatoryName(e.target.value)}
                      placeholder="Xakimov Zafar Tulyaganovich"
                      className="w-full px-3.5 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Mas’ul shaxs lavozimi *
                    </label>
                    <input
                      type="text"
                      required
                      value={signatoryRole}
                      onChange={e => setSignatoryRole(e.target.value)}
                      placeholder="TKTI Yangiyer filiali direktori"
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-700"
                    />
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Mavjud verification tizimi va unikal ID to‘liq saqlanadi</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Bekor qilish
            </button>

            {activeTab === 'editor' ? (
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors shadow-2xs"
              >
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Oldindan ko‘rish</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors shadow-2xs"
              >
                <FileCode2 className="w-4 h-4 text-emerald-600" />
                <span>Formaga qaytish</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => downloadCertificatePdf(currentPreviewData)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition-colors shadow-2xs"
            >
              <Download className="w-4 h-4" />
              <span>Namuna PDF yuklab olish</span>
            </button>

            <button
              type="submit"
              form="cert-issue-form"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              <Award className="w-4 h-4" />
              <span>{isSubmitting ? 'Saqlanmoqda...' : 'Tasdiqlash va PDF chiqarish'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
