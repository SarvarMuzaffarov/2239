import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  Sparkles,
  Award,
  Briefcase,
  Rocket,
  Languages,
  Calendar,
  CheckCircle2,
  QrCode,
  PenTool,
  Image as ImageIcon,
  Check,
  Building2,
  Cpu,
  Globe2,
} from 'lucide-react';
import type {
  StudentProfile,
  SupervisorProfile,
  ProjectOrStartup,
  Achievement,
  CertificateItem,
  LanguageCertificate,
  EventItem,
} from '../types';
import { generateStudentPortfolioPdf, PortfolioTemplateId } from '../lib/portfolioGenerator';

interface PortfolioExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile;
  supervisor?: SupervisorProfile;
  projects: ProjectOrStartup[];
  startups: ProjectOrStartup[];
  achievements: Achievement[];
  certificates: CertificateItem[];
  languageCertificates?: LanguageCertificate[];
  events: EventItem[];
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const PortfolioExportModal: React.FC<PortfolioExportModalProps> = ({
  isOpen,
  onClose,
  student,
  supervisor,
  projects,
  startups,
  achievements,
  certificates,
  languageCertificates,
  events,
  onNotify,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<PortfolioTemplateId>('master');
  const [includeQrCode, setIncludeQrCode] = useState(true);
  const [includeSupervisorSignature, setIncludeSupervisorSignature] = useState(true);
  const [includeStudentPhoto, setIncludeStudentPhoto] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const validLangCerts = (languageCertificates || []).filter(
    (c) => !c.isDeleted && (c.status === 'Tasdiqlangan' || !c.status)
  );

  const templates: {
    id: PortfolioTemplateId;
    title: string;
    subtitle: string;
    badge: string;
    icon: any;
    color: string;
    recommended?: boolean;
    features: string[];
  }[] = [
    {
      id: 'master',
      title: "Uyg'unlashtirilgan Master Portfolio (3-in-1)",
      subtitle: "3 ta yo'nalish (Davlat standarti, Silicon Valley KPI va Europass CV) eng mukammal sintezi.",
      badge: 'Tavsiya etiladi (3-in-1)',
      icon: Sparkles,
      color: 'from-blue-600 to-indigo-700',
      recommended: true,
      features: [
        'Vazirlik geraldikasi & oltin aksentli rasmiy shlyapka',
        'Silicon Valley uslubidagi 6 ta KPI metrika kartalari',
        'Europass formatidagi mukammal xronologik maʼlumotlar',
        'Dinamik QR-kod & Elektron tekshirish registratsiyasi',
        'Ilmiy rahbar va dekanat rasmiy muhr/imzo bloklari',
      ],
    },
    {
      id: 'academic',
      title: 'Rasmiy Akademik (Davlat standarti)',
      subtitle: 'Universitet va Oliy taʼlim vazirligi anʼanaviy rasmiy blanki.',
      badge: 'Rasmiy blank',
      icon: Building2,
      color: 'from-slate-700 to-slate-900',
      features: [
        'Davlat taʼlim standarti rasmiy blanki va ramzi',
        'Akademik guruh va yo‘nalish reestr jadvali',
        'Rasmiy muhr (M.O‘.) va ilmiy rahbar tasdig‘i',
      ],
    },
    {
      id: 'modern',
      title: 'Zamonaviy Texnologik (Silicon Valley)',
      subtitle: 'Innovatsion, metrikalar va zamonaviy badge kartalarga boy dizayn.',
      badge: 'High-Tech',
      icon: Cpu,
      color: 'from-indigo-600 to-purple-700',
      features: [
        'To‘q fonli zamonaviy identifikatsiya bloki',
        'Startap va ilmiy loyihalar chuqur ko‘rinishi',
        'QR-kodli smart tekshirish markazi',
      ],
    },
    {
      id: 'europass',
      title: 'Yevropa CV (Europass formati)',
      subtitle: 'Xalqaro talablarga mos 2 ustunli tuzilma.',
      badge: 'Xalqaro format',
      icon: Globe2,
      color: 'from-emerald-600 to-teal-800',
      features: [
        'Ikki ustunli xalqaro CV tuzilmasi',
        'Chet tillari (CEFR darajalari: A1–C2) chap panelda',
        'Akademik tajriba va tanlovlar xronologiyasi',
      ],
    },
  ];

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await generateStudentPortfolioPdf({
        student,
        supervisor,
        projects,
        startups,
        achievements,
        certificates,
        languageCertificates: validLangCerts,
        events,
        options: {
          template: selectedTemplate,
          includeQrCode,
          includeSupervisorSignature,
          includeStudentPhoto,
        },
      });
      onNotify('success', `Talaba portfoliosi (${selectedTemplate.toUpperCase()}) muvaffaqiyatli yuklab olindi!`);
      onClose();
    } catch (err: any) {
      onNotify('error', err.message || 'Portfolio PDF shakllantirishda xatolik yuz berdi.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Talaba portfoliosini shakllantirish va yuklab olish"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span>Talaba Portfoliosi (PDF)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900">
                  Dizayn tanlovi
                </span>
              </h2>
              <p className="text-xs text-blue-200 mt-0.5">
                {student.fullName} • {student.course}-kurs talabasi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            title="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Quick Summary Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-around flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Award className="w-4 h-4 text-amber-600" />
              <span>
                Yutuqlar: <strong className="text-slate-900">{achievements.length}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span>
                Loyihalar: <strong className="text-slate-900">{projects.length}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Rocket className="w-4 h-4 text-purple-600" />
              <span>
                Startaplar: <strong className="text-slate-900">{startups.length}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>
                Sertifikatlar: <strong className="text-slate-900">{certificates.length}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Languages className="w-4 h-4 text-indigo-600" />
              <span>
                Til sertifikatlari: <strong className="text-slate-900">{validLangCerts.length}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Calendar className="w-4 h-4 text-rose-600" />
              <span>
                Tadbirlar: <strong className="text-slate-900">{events.length}</strong>
              </span>
            </div>
          </div>

          {/* Design Selection Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              1. Portfolio dizayn shablonini tanlang
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {templates.map((tpl) => {
                const Icon = tpl.icon;
                const isSelected = selectedTemplate === tpl.id;

                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={`relative rounded-2xl p-4 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-xl bg-gradient-to-br ${tpl.color} text-white flex items-center justify-center shrink-0 shadow-xs`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <h3 className="font-bold text-sm text-slate-900 leading-snug">
                            {tpl.title}
                          </h3>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            tpl.recommended
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {tpl.badge}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed mb-3">
                        {tpl.subtitle}
                      </p>

                      <div className="space-y-1 text-[11px] text-slate-600">
                        {tpl.features.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold">
                      <span className={isSelected ? 'text-blue-700' : 'text-slate-400'}>
                        {isSelected ? 'Tanlangan dizayn' : 'Tanlash uchun bosing'}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Options Toggles */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              2. Qo‘shimcha elementlar va tasdiqlash
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* QR Code */}
              <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={includeQrCode}
                  onChange={(e) => setIncludeQrCode(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-slate-800">QR-kodli tekshirish</span>
                </div>
              </label>

              {/* Signature and Seal */}
              <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={includeSupervisorSignature}
                  onChange={(e) => setIncludeSupervisorSignature(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-semibold text-slate-800">Imzo & Muhr bloki</span>
                </div>
              </label>

              {/* Student Photo */}
              <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={includeStudentPhoto}
                  onChange={(e) => setIncludeStudentPhoto(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-slate-800">Talaba fotosurati</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            Hujjat A4 formatida, barcha rasmiy reestr raqamlari bilan PDF faylga eksport qilinadi.
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>

            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>PDF shakllantirilmoqda...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-blue-200" />
                  <span>Portfolioni yuklab olish (PDF)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
