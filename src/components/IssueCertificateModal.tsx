import React, { useState, useMemo, useEffect } from 'react';
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
  User,
  Users,
  CheckSquare,
  Square,
  CheckCheck,
  Globe,
  Search,
  Filter,
  Layers,
  ChevronLeft,
  ChevronRight,
  Info,
  ListCheck,
} from 'lucide-react';
import type { StudentProfile, UserAccount } from '../types';
import {
  PRESET_TEMPLATES,
  PresetTemplate,
  CertificateData,
  downloadCertificatePdf,
  downloadBulkCertificatesPdf,
} from '../lib/certificateGenerator';
import { CertificateLivePreview } from './CertificateLivePreview';
import { canonicalizeDirection } from '../constants/directions';

export type IssuanceMode = 'single' | 'group' | 'selection' | 'all';

export interface SingleCertificatePayload {
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
}

interface IssueCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentProfile[];
  currentUser: UserAccount;
  onSubmit: (certData: SingleCertificatePayload) => Promise<void>;
  onSubmitBulk?: (certsData: SingleCertificatePayload[]) => Promise<void>;
  isSubmitting: boolean;
}

export const IssueCertificateModal: React.FC<IssueCertificateModalProps> = ({
  isOpen,
  onClose,
  students,
  currentUser,
  onSubmit,
  onSubmitBulk,
  isSubmitting,
}) => {
  // Active non-deleted students
  const activeStudents = useMemo(() => {
    return students.filter(s => !s.isDeleted);
  }, [students]);

  // Unique sorted student groups
  const availableGroups = useMemo(() => {
    const set = new Set<string>();
    activeStudents.forEach(s => {
      if (s.group?.trim()) set.add(s.group.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [activeStudents]);

  // 1. Issuance Mode: single, group, selection, all
  const [issuanceMode, setIssuanceMode] = useState<IssuanceMode>('single');

  // Mode 1: Single student
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentFullName, setStudentFullName] = useState<string>('');
  const [studentDirection, setStudentDirection] = useState<string>('');

  // Mode 2: By Group
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [groupStudentIds, setGroupStudentIds] = useState<Set<string>>(new Set());

  // Mode 3: Custom selection
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [filterGroup, setFilterGroup] = useState<string>('all');

  // Mode 4: All students
  const [allSelectedStudentIds, setAllSelectedStudentIds] = useState<Set<string>>(new Set());
  const [allStudentsSearchQuery, setAllStudentsSearchQuery] = useState<string>('');

  // 2. Document basics
  const [docType, setDocType] = useState<'diplom' | 'sertifikat'>('diplom');
  const [certNumber, setCertNumber] = useState<string>(
    () => `CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [bulkPrefix, setBulkPrefix] = useState<string>('CERT-2026-');
  const [bulkStartNum, setBulkStartNum] = useState<number>(1001);
  const [issueDate, setIssueDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );

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
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [isBulkDownloading, setIsBulkDownloading] = useState<boolean>(false);

  // Initialize first student if single mode is empty
  useEffect(() => {
    if (!studentFullName && activeStudents && activeStudents.length > 0) {
      const first = activeStudents[0];
      setSelectedStudentId(first.id);
      setStudentFullName(first.fullName);
      const canonicalFaculty = canonicalizeDirection(first.facultyOrField) || first.facultyOrField || 'Kimyo muhandisligi';
      const dirText = `${canonicalFaculty}, ${first.course || 3}-kurs, ${first.group || '21-01'}-guruh`;
      setStudentDirection(dirText);
    }
  }, [activeStudents, studentFullName]);

  // Initialize group when available
  useEffect(() => {
    if (!selectedGroup && availableGroups.length > 0) {
      const defaultGrp = availableGroups[0];
      setSelectedGroup(defaultGrp);
      const inGrp = activeStudents.filter(s => s.group?.trim() === defaultGrp.trim());
      setGroupStudentIds(new Set(inGrp.map(s => s.id)));
    }
  }, [availableGroups, selectedGroup, activeStudents]);

  // When selectedGroup changes, populate groupStudentIds
  const handleGroupChange = (grp: string) => {
    setSelectedGroup(grp);
    const inGrp = activeStudents.filter(s => s.group?.trim() === grp.trim());
    setGroupStudentIds(new Set(inGrp.map(s => s.id)));
  };

  // When switching to 'all' mode, select all active students by default
  const handleSwitchMode = (mode: IssuanceMode) => {
    setIssuanceMode(mode);
    setPreviewIndex(0);

    if (mode === 'all') {
      setAllSelectedStudentIds(new Set(activeStudents.map(s => s.id)));
    } else if (mode === 'group' && selectedGroup) {
      const inGrp = activeStudents.filter(s => s.group?.trim() === selectedGroup.trim());
      setGroupStudentIds(new Set(inGrp.map(s => s.id)));
    }
  };

  // Generate random new certificate code
  const handleRegenerateNumber = () => {
    setCertNumber(`CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  // Single student dropdown select
  const handleStudentSelect = (stId: string) => {
    setSelectedStudentId(stId);
    const st = activeStudents.find(s => s.id === stId);
    if (st) {
      setStudentFullName(st.fullName);
      const canonicalFaculty = canonicalizeDirection(st.facultyOrField) || st.facultyOrField || 'Kimyo muhandisligi';
      const dirText = `${canonicalFaculty}, ${st.course}-kurs, ${st.group}-guruh talabasi`;
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
      if (bulkPrefix === 'CERT-2026-') setBulkPrefix('DIP-2026-');
    } else {
      setTitle('SERTIFIKAT');
      setSubtitle('Faxriy sertifikat');
      setAwardLevel('Ishtirokchi');
      setPresentedToText('Ushbu sertifikat');
      if (bulkPrefix === 'DIP-2026-') setBulkPrefix('CERT-2026-');
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
    if (tmpl.documentType === 'diplom' && bulkPrefix.startsWith('CERT-')) {
      setBulkPrefix('DIP-2026-');
    } else if (tmpl.documentType === 'sertifikat' && bulkPrefix.startsWith('DIP-')) {
      setBulkPrefix('CERT-2026-');
    }
  };

  // Compute effective target students list based on active mode
  const effectiveStudentsList: Array<{
    id: string;
    fullName: string;
    group: string;
    course: number;
    facultyOrField: string;
    directionText: string;
  }> = useMemo(() => {
    if (issuanceMode === 'single') {
      const canonical = studentDirection.trim() || 'Kimyo muhandisligi, 3-kurs, 21-01-guruh talabasi';
      return [
        {
          id: selectedStudentId || 'manual',
          fullName: studentFullName.trim() || 'SARVAR MUZAFFAROV',
          group: activeStudents.find(s => s.id === selectedStudentId)?.group || '21-01',
          course: activeStudents.find(s => s.id === selectedStudentId)?.course || 3,
          facultyOrField: activeStudents.find(s => s.id === selectedStudentId)?.facultyOrField || '',
          directionText: canonical,
        },
      ];
    }

    let chosenIds: string[] = [];
    if (issuanceMode === 'group') {
      chosenIds = Array.from(groupStudentIds);
    } else if (issuanceMode === 'selection') {
      chosenIds = Array.from(selectedStudentIds);
    } else if (issuanceMode === 'all') {
      chosenIds = Array.from(allSelectedStudentIds);
    }

    return chosenIds
      .map(id => activeStudents.find(s => s.id === id))
      .filter((s): s is StudentProfile => !!s)
      .map(s => {
        const canonicalFaculty = canonicalizeDirection(s.facultyOrField) || s.facultyOrField || 'Kimyo muhandisligi';
        const dirText = `${canonicalFaculty}, ${s.course}-kurs, ${s.group}-guruh talabasi`;
        return {
          id: s.id,
          fullName: s.fullName,
          group: s.group,
          course: s.course,
          facultyOrField: s.facultyOrField,
          directionText: dirText,
        };
      });
  }, [
    issuanceMode,
    selectedStudentId,
    studentFullName,
    studentDirection,
    activeStudents,
    groupStudentIds,
    selectedStudentIds,
    allSelectedStudentIds,
  ]);

  // Clamp preview index
  const safePreviewIndex = Math.min(
    previewIndex,
    Math.max(0, effectiveStudentsList.length - 1)
  );
  const currentPreviewStudent = effectiveStudentsList[safePreviewIndex];

  // Helper to generate unique certificate number
  const getCertNumberForIndex = (index: number) => {
    if (issuanceMode === 'single') {
      return certNumber.trim() || 'CERT-2026-6395';
    }
    const cleanPrefix = bulkPrefix.trim() || (docType === 'diplom' ? 'DIP-2026-' : 'CERT-2026-');
    return `${cleanPrefix}${bulkStartNum + index}`;
  };

  // Live preview data for current student
  const currentPreviewData: CertificateData = useMemo(() => {
    const effectiveStudentName =
      currentPreviewStudent?.fullName ||
      studentFullName.trim() ||
      (activeStudents.length > 0 ? activeStudents[0].fullName : 'SARVAR MUZAFFAROV');

    const effectiveDirection =
      currentPreviewStudent?.directionText ||
      studentDirection.trim() ||
      'Kimyo muhandisligi, 3-kurs, 21-01-guruh talabasi';

    const effectiveCertNum = getCertNumberForIndex(safePreviewIndex);

    const effectiveConfirmation = decisionNumber.trim()
      ? `Toshkent kimyo-texnologiya instituti Yangiyer filiali Ilmiy kengashining 2026-yil ${decisionNumber.trim()} qaroriga asosan.`
      : confirmationText.trim();

    return {
      certificateNumber: effectiveCertNum,
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
      studentDirection: effectiveDirection,
    };
  }, [
    currentPreviewStudent,
    studentFullName,
    activeStudents,
    studentDirection,
    safePreviewIndex,
    certNumber,
    bulkPrefix,
    bulkStartNum,
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
  ]);

  // Filtered students for 'selection' mode
  const filteredStudentsForSelection = useMemo(() => {
    return activeStudents.filter(s => {
      const q = studentSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.fullName.toLowerCase().includes(q) ||
        s.group?.toLowerCase().includes(q) ||
        s.facultyOrField?.toLowerCase().includes(q) ||
        String(s.course).includes(q);
      const matchesGroup = filterGroup === 'all' || s.group?.trim() === filterGroup.trim();
      return matchesSearch && matchesGroup;
    });
  }, [activeStudents, studentSearchQuery, filterGroup]);

  // Filtered students for 'all' mode review list
  const filteredStudentsForAllMode = useMemo(() => {
    const q = allStudentsSearchQuery.toLowerCase().trim();
    if (!q) return activeStudents;
    return activeStudents.filter(
      s =>
        s.fullName.toLowerCase().includes(q) ||
        s.group?.toLowerCase().includes(q) ||
        s.facultyOrField?.toLowerCase().includes(q)
    );
  }, [activeStudents, allStudentsSearchQuery]);

  // Bulk PDF download directly from modal
  const handleDownloadBulk = async () => {
    if (effectiveStudentsList.length === 0) return;
    setIsBulkDownloading(true);
    try {
      const bulkCertificatesData: CertificateData[] = effectiveStudentsList.map((st, idx) => ({
        ...currentPreviewData,
        certificateNumber: getCertNumberForIndex(idx),
        studentName: st.fullName,
        studentDirection: st.directionText,
      }));
      await downloadBulkCertificatesPdf(bulkCertificatesData);
    } catch (err) {
      console.error('Error generating bulk PDF:', err);
      alert('PDFlarni shakllantirishda xatolik yuz berdi.');
    } finally {
      setIsBulkDownloading(false);
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (issuanceMode === 'single') {
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
    } else {
      if (effectiveStudentsList.length === 0) {
        alert("Iltimos, sertifikat berish uchun kamida 1 ta talabani tanlang.");
        return;
      }

      const bulkPayload: SingleCertificatePayload[] = effectiveStudentsList.map((st, idx) => {
        const itemCertNum = getCertNumberForIndex(idx);
        return {
          studentId: st.id,
          studentName: st.fullName.trim(),
          eventTitle: eventTitle.trim(),
          title: title.trim(),
          organizationName: organizationName.trim(),
          issueDate: issueDate,
          certificateNumber: itemCertNum,
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
          studentDirection: st.directionText,
        };
      });

      if (onSubmitBulk) {
        await onSubmitBulk(bulkPayload);
      } else {
        for (const item of bulkPayload) {
          await onSubmit(item);
        }
      }
    }
  };

  if (!isOpen) return null;

  const totalCount = effectiveStudentsList.length;

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
                {totalCount > 1 && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-900 border border-blue-200">
                    {totalCount} ta talaba
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Yakka tartibda, guruh bo‘yicha, tanlov bo‘yicha yoki barcha talabalarga birdaniga sertifikat berish
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
              {/* Multi-student preview toolbar */}
              {effectiveStudentsList.length > 1 && (
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700">
                      Ko‘rib chiqilayotgan namuna:
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewIndex(prev => Math.max(0, prev - 1))}
                        disabled={safePreviewIndex <= 0}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 text-slate-600"
                        title="Oldingi talaba"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="px-2.5 py-1 text-xs font-bold bg-slate-100 rounded-lg text-slate-800">
                        {safePreviewIndex + 1} / {effectiveStudentsList.length}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewIndex(prev =>
                            Math.min(effectiveStudentsList.length - 1, prev + 1)
                          )
                        }
                        disabled={safePreviewIndex >= effectiveStudentsList.length - 1}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 text-slate-600"
                        title="Keyingi talaba"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <select
                      value={safePreviewIndex}
                      onChange={e => setPreviewIndex(Number(e.target.value))}
                      className="text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    >
                      {effectiveStudentsList.map((st, i) => (
                        <option key={st.id + i} value={i}>
                          {i + 1}. {st.fullName} ({st.group}-guruh)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadBulk}
                      disabled={isBulkDownloading}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>
                        {isBulkDownloading
                          ? 'PDFlar jamlanmoqda...'
                          : `Barcha ${effectiveStudentsList.length} ta PDFni yuklab olish`}
                      </span>
                    </button>
                  </div>
                </div>
              )}

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
                  <span>1. Hujjat turi, unikal raqami va berilgan sana</span>
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

                  {issuanceMode === 'single' ? (
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
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Unikal raqamlash formati (Prefiks & Start) *
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          required
                          value={bulkPrefix}
                          onChange={e => setBulkPrefix(e.target.value)}
                          placeholder="CERT-2026-"
                          className="w-28 px-2.5 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-emerald-900"
                        />
                        <input
                          type="number"
                          required
                          min={1}
                          value={bulkStartNum}
                          onChange={e => setBulkStartNum(Math.max(1, Number(e.target.value) || 1))}
                          className="w-24 px-2.5 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-emerald-900"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {totalCount > 0 ? (
                          <>
                            Diapazon: <strong className="font-mono text-emerald-800">{getCertNumberForIndex(0)}</strong>{' '}
                            dan <strong className="font-mono text-emerald-800">{getCertNumberForIndex(totalCount - 1)}</strong> gacha
                          </>
                        ) : (
                          'Talabalar tanlanishi bilan avtomatik unikal ketma-ketlik beriladi'
                        )}
                      </p>
                    </div>
                  )}

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

              {/* Section 2: Student Selection & Multi-mode Options */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>2. Talaba(lar) ma’lumotlari va tanlov usuli</span>
                  </h4>

                  {/* Mode Badges / Indicator */}
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    Jami tanlandi: <strong>{totalCount} ta talaba</strong>
                  </span>
                </div>

                {/* 4 Mode Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('single')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      issuanceMode === 'single'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Yakka tartibda</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchMode('group')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      issuanceMode === 'group'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Guruh bo‘yicha</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchMode('selection')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      issuanceMode === 'selection'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Tanlov bo‘yicha</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchMode('all')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      issuanceMode === 'all'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Barchasiga birdan</span>
                  </button>
                </div>

                {/* MODE 1: SINGLE STUDENT */}
                {issuanceMode === 'single' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
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
                        {activeStudents.map(st => (
                          <option key={st.id} value={st.id}>
                            {st.fullName} ({st.group}, {st.course}-kurs)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Talabaning to‘liq F.I.Sh. (Markazda katta harflarda chiqadi) *
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
                )}

                {/* MODE 2: BY GROUP */}
                {issuanceMode === 'group' && (
                  <div className="space-y-4 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                          Guruhni tanlang:
                        </label>
                        <select
                          value={selectedGroup}
                          onChange={e => handleGroupChange(e.target.value)}
                          className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        >
                          {availableGroups.map(grp => {
                            const count = activeStudents.filter(s => s.group?.trim() === grp.trim()).length;
                            return (
                              <option key={grp} value={grp}>
                                {grp} ({count} ta talaba)
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const inGrp = activeStudents.filter(s => s.group?.trim() === selectedGroup.trim());
                            setGroupStudentIds(new Set(inGrp.map(s => s.id)));
                          }}
                          className="text-xs font-semibold px-2.5 py-1 text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
                        >
                          Guruhdagi hammasini belgilash
                        </button>
                        <button
                          type="button"
                          onClick={() => setGroupStudentIds(new Set())}
                          className="text-xs font-semibold px-2.5 py-1 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          Tozalash
                        </button>
                      </div>
                    </div>

                    {/* Students list in selected group */}
                    <div className="border border-slate-200 rounded-xl p-3 bg-white max-h-56 overflow-y-auto space-y-1.5">
                      {activeStudents
                        .filter(s => s.group?.trim() === selectedGroup.trim())
                        .map(st => {
                          const isChecked = groupStudentIds.has(st.id);
                          return (
                            <label
                              key={st.id}
                              className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                                isChecked
                                  ? 'bg-emerald-50/60 border-emerald-300 text-slate-900'
                                  : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={e => {
                                    setGroupStudentIds(prev => {
                                      const next = new Set(prev);
                                      if (e.target.checked) next.add(st.id);
                                      else next.delete(st.id);
                                      return next;
                                    });
                                  }}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="font-bold">{st.fullName}</span>
                              </div>
                              <span className="text-[11px] text-slate-500">
                                {st.course}-kurs • {st.facultyOrField || 'Kimyo muhandisligi'}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* MODE 3: CUSTOM SELECTION */}
                {issuanceMode === 'selection' && (
                  <div className="space-y-4 pt-2">
                    {/* Search and Filter */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 justify-between">
                      <div className="relative flex-1 w-full">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          value={studentSearchQuery}
                          onChange={e => setStudentSearchQuery(e.target.value)}
                          placeholder="Talaba ismi, guruhi yoki yo‘nalishi bo‘yicha qidirish..."
                          className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select
                          value={filterGroup}
                          onChange={e => setFilterGroup(e.target.value)}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                        >
                          <option value="all">Barcha guruhlar</option>
                          {availableGroups.map(grp => (
                            <option key={grp} value={grp}>
                              {grp}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentIds(prev => {
                              const next = new Set(prev);
                              filteredStudentsForSelection.forEach(s => next.add(s.id));
                              return next;
                            });
                          }}
                          className="text-xs font-semibold px-2.5 py-1.5 text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg whitespace-nowrap transition-colors"
                        >
                          Qidiruvdagilarni tanlash ({filteredStudentsForSelection.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedStudentIds(new Set())}
                          className="text-xs font-semibold px-2.5 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg whitespace-nowrap transition-colors"
                        >
                          Tozalash
                        </button>
                      </div>
                    </div>

                    {/* Checkbox list */}
                    <div className="border border-slate-200 rounded-xl p-3 bg-white max-h-60 overflow-y-auto space-y-1.5">
                      {filteredStudentsForSelection.length === 0 ? (
                        <div className="text-center py-6 text-xs text-slate-400">
                          Qidiruv bo‘yicha talabalar topilmadi.
                        </div>
                      ) : (
                        filteredStudentsForSelection.map(st => {
                          const isChecked = selectedStudentIds.has(st.id);
                          return (
                            <label
                              key={st.id}
                              className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                                isChecked
                                  ? 'bg-emerald-50/70 border-emerald-300 text-slate-900 font-semibold'
                                  : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={e => {
                                    setSelectedStudentIds(prev => {
                                      const next = new Set(prev);
                                      if (e.target.checked) next.add(st.id);
                                      else next.delete(st.id);
                                      return next;
                                    });
                                  }}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                                />
                                <div>
                                  <span className="font-bold text-slate-900">{st.fullName}</span>
                                  <span className="text-[11px] text-slate-400 ml-2 font-normal">
                                    {st.group}-guruh • {st.course}-kurs
                                  </span>
                                </div>
                              </div>
                              <span className="text-[11px] text-slate-500">
                                {st.facultyOrField || 'Kimyo muhandisligi'}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* MODE 4: ALL STUDENTS AT ONCE */}
                {issuanceMode === 'all' && (
                  <div className="space-y-4 pt-2">
                    <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-start gap-3">
                      <CheckCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                      <div className="text-xs text-emerald-900">
                        <strong className="block text-sm font-bold mb-0.5">
                          Tizimdagi barcha faol talabalarga birdaniga sertifikat berish
                        </strong>
                        Hozirda jami <strong>{activeStudents.length} ta</strong> faol talaba mavjud bo‘lib,
                        ulardan <strong>{allSelectedStudentIds.size} tasi</strong> sertifikat olish uchun belgilandi.
                        Agar ayrim talabalarni chiqarib tashlamoqchi bo‘lsangiz, quyidagi ro‘yxatdan ularning belgisini olib tashlang.
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          value={allStudentsSearchQuery}
                          onChange={e => setAllStudentsSearchQuery(e.target.value)}
                          placeholder="Ro‘yxatdan talaba qidirish..."
                          className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAllSelectedStudentIds(new Set(activeStudents.map(s => s.id)))}
                          className="text-xs font-semibold px-2.5 py-1.5 text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg whitespace-nowrap transition-colors"
                        >
                          Barchasini belgilash ({activeStudents.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setAllSelectedStudentIds(new Set())}
                          className="text-xs font-semibold px-2.5 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg whitespace-nowrap transition-colors"
                        >
                          Hammasini tozalash
                        </button>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-3 bg-white max-h-56 overflow-y-auto space-y-1.5">
                      {filteredStudentsForAllMode.map(st => {
                        const isChecked = allSelectedStudentIds.has(st.id);
                        return (
                          <label
                            key={st.id}
                            className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-emerald-50/60 border-emerald-300 text-slate-900'
                                : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => {
                                  setAllSelectedStudentIds(prev => {
                                    const next = new Set(prev);
                                    if (e.target.checked) next.add(st.id);
                                    else next.delete(st.id);
                                    return next;
                                  });
                                }}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="font-bold">{st.fullName}</span>
                              <span className="text-[11px] text-slate-500 ml-1">
                                ({st.group}-guruh)
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500">
                              {st.course}-kurs • {st.facultyOrField || 'Kimyo muhandisligi'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
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
                      <option value="Faxriy sertifikat">Faxriy sertifikat</option>
                      <option value="Tashakkurnoma">Tashakkurnoma</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Ost-sarlavha (Subtitle)
                    </label>
                    <input
                      type="text"
                      placeholder="Masalan: Tanlov g‘olibi"
                      value={subtitle}
                      onChange={e => setSubtitle(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Taqdimot prefiksi *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ushbu diplom / Ushbu sertifikat"
                      value={presentedToText}
                      onChange={e => setPresentedToText(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Event, Competition & Nomination */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>4. Tadbir, ko‘rik-tanlov va nominatsiya</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Tadbir / Tanlov nomi *
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
                      Yo‘nalish / Musobaqa nomi
                    </label>
                    <input
                      type="text"
                      placeholder="«O‘z mutaxassisligi bo‘yicha eng bilimdon talabasi»"
                      value={competitionName}
                      onChange={e => setCompetitionName(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nominatsiya / Shior
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

              {/* Section 5: Description & Institutional Decision */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <AlignLeft className="w-4 h-4 text-emerald-600" />
                  <span>5. Taqdim etilish asosi va Ilmiy kengash qarori</span>
                </h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Taqdim etilish sababi / Asosiy matn *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="tanlovida yuqori natija, chuqur bilim va iqtidor namoyish etib..."
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Ilmiy kengash qaror raqami (masalan: 7-sonli)
                      </label>
                      <input
                        type="text"
                        placeholder="7-sonli"
                        value={decisionNumber}
                        onChange={e => setDecisionNumber(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

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
                  </div>
                </div>
              </div>

              {/* Section 6: Signatory */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>6. Imzo chekuvchi rasmiy shaxs (Filial rahbari)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Rahbar F.I.Sh. *
                    </label>
                    <input
                      type="text"
                      required
                      value={signatoryName}
                      onChange={e => setSignatoryName(e.target.value)}
                      placeholder="Xakimov Zafar Tulyaganovich"
                      className="w-full px-3.5 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Lavozimi *
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
            <span>Mavjud verification tizimi va har bir talaba uchun unikal QR/ID avtomatik shakllanadi</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isBulkDownloading}
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
              <span>Namuna PDF (1 ta)</span>
            </button>

            {totalCount > 1 && (
              <button
                type="button"
                onClick={handleDownloadBulk}
                disabled={isBulkDownloading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-800 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded-xl transition-colors shadow-2xs"
              >
                <Download className="w-4 h-4" />
                <span>{isBulkDownloading ? 'Jamlanmoqda...' : `Barcha ${totalCount} ta PDF`}</span>
              </button>
            )}

            <button
              type="submit"
              form="cert-issue-form"
              disabled={isSubmitting || isBulkDownloading || totalCount === 0}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              <Award className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Saqlanmoqda...'
                  : totalCount > 1
                  ? `Tasdiqlash va ${totalCount} ta sertifikat berish`
                  : 'Tasdiqlash va PDF chiqarish'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
