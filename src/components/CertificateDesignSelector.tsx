import React, { useState } from 'react';
import {
  CERTIFICATE_DESIGNS,
  BACKGROUND_PATTERNS,
  CertificateDesignId,
  BackgroundPatternId,
  CertificateDesign,
  getCertificateDesign,
} from '../lib/certificateStyles';
import { Palette, Sparkles, Check, Layers, Image as ImageIcon, Info, Award, Shield, Compass } from 'lucide-react';

interface CertificateDesignSelectorProps {
  selectedDesignId: CertificateDesignId;
  selectedPatternId: BackgroundPatternId;
  onSelectDesign: (designId: CertificateDesignId) => void;
  onSelectPattern: (patternId: BackgroundPatternId) => void;
}

/**
 * Miniature architectural layout mockup for each certificate design
 * Shows the exact visual structure (sidebar, arch, bands, ribbon, decree, cyber, minimalist, baroque, wax seal, smart card)
 */
const TemplateMockup: React.FC<{ design: CertificateDesign; isSelected: boolean }> = ({
  design,
  isSelected,
}) => {
  const { layoutType, primaryColor, secondaryColor, accentColor, bgCenter } = design;

  return (
    <div
      className={`w-full h-22 sm:h-24 rounded-lg relative overflow-hidden border transition-all ${
        isSelected
          ? 'border-amber-500 shadow-sm ring-1 ring-amber-400/40'
          : 'border-slate-300/80 group-hover:border-slate-400 bg-white'
      }`}
      style={{ backgroundColor: bgCenter || '#ffffff' }}
    >
      {/* 1. SIDEBAR LAYOUT */}
      {layoutType === 'sidebar' && (
        <div className="w-full h-full flex">
          {/* Left Dark Sidebar */}
          <div
            className="w-[30%] h-full flex flex-col items-center justify-between py-1.5 px-1 relative border-r"
            style={{ backgroundColor: primaryColor, borderColor: secondaryColor }}
          >
            <div
              className="w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0"
              style={{ borderColor: secondaryColor, backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              <div className="w-1 h-1 rounded-full" style={{ backgroundColor: secondaryColor }} />
            </div>
            <div className="w-0.5 h-6 rounded-full bg-white/20" />
            {/* Mini QR card */}
            <div className="w-3.5 h-3.5 rounded-xs bg-white/90 p-0.5 flex flex-col justify-between">
              <div className="w-full h-0.5 bg-slate-900" />
              <div className="w-full h-0.5 bg-slate-700" />
            </div>
          </div>
          {/* Right Content Area */}
          <div className="w-[70%] h-full p-1.5 flex flex-col justify-between">
            <div className="w-3/4 h-1 rounded-full mx-auto" style={{ backgroundColor: primaryColor }} />
            <div className="space-y-1 my-auto">
              <div className="w-4/5 h-1.5 rounded-xs mx-auto" style={{ backgroundColor: secondaryColor }} />
              <div className="w-full h-1 rounded-xs bg-slate-200" />
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <div className="w-6 h-1 rounded-xs bg-slate-300" />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: secondaryColor }} />
            </div>
          </div>
        </div>
      )}

      {/* 2. ORIENTAL UZBEK ARCH & PORTAL */}
      {layoutType === 'arch' && (
        <div className="w-full h-full p-1 relative flex flex-col justify-between">
          {/* Outer Border */}
          <div
            className="absolute inset-1 rounded-xs border-2 pointer-events-none"
            style={{ borderColor: primaryColor }}
          />
          <div
            className="absolute inset-1.5 rounded-xs border pointer-events-none"
            style={{ borderColor: secondaryColor }}
          />

          {/* Pointed Arch SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 65" preserveAspectRatio="none">
            <path
              d="M 12 58 L 12 28 Q 12 12, 50 6 Q 88 12, 88 28 L 88 58"
              fill="none"
              stroke={secondaryColor}
              strokeWidth="2.5"
            />
            {/* 8-point star at apex */}
            <circle cx="50" cy="7" r="2.2" fill={secondaryColor} />
          </svg>

          {/* Text lines inside arch */}
          <div className="relative z-10 pt-2.5 flex flex-col items-center">
            <div className="w-12 h-1 rounded-full" style={{ backgroundColor: primaryColor }} />
            <div className="w-16 h-1.5 rounded-xs mt-1.5" style={{ backgroundColor: secondaryColor }} />
          </div>

          <div className="relative z-10 pb-1 flex justify-between items-center px-3">
            <div className="w-4 h-1 bg-slate-300 rounded-xs" />
            <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ backgroundColor: secondaryColor }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
            </div>
            <div className="w-4 h-1 bg-slate-300 rounded-xs" />
          </div>
        </div>
      )}

      {/* 3. SOLID HEADER & FOOTER BANDS */}
      {layoutType === 'bands' && (
        <div className="w-full h-full flex flex-col justify-between">
          {/* Top Solid Banner */}
          <div
            className="w-full h-5 px-2 flex items-center justify-between border-b"
            style={{ backgroundColor: primaryColor, borderColor: secondaryColor }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-white/20 border" style={{ borderColor: secondaryColor }} />
            <div className="w-16 h-1 rounded-full bg-white/90" />
            <div className="w-2 h-2 rounded-xs" style={{ backgroundColor: secondaryColor }} />
          </div>

          {/* Central Body Zone */}
          <div className="px-2 py-1 flex flex-col items-center justify-center my-auto">
            <div className="w-14 h-1.5 rounded-xs mb-1" style={{ backgroundColor: secondaryColor }} />
            <div className="w-20 h-1 rounded-xs bg-slate-200" />
          </div>

          {/* Bottom Solid Banner */}
          <div
            className="w-full h-5 px-2 flex items-center justify-between border-t"
            style={{ backgroundColor: primaryColor, borderColor: secondaryColor }}
          >
            <div className="w-8 h-1 rounded-xs bg-white/60" />
            <div className="w-3.5 h-3.5 rounded-full border flex items-center justify-center" style={{ backgroundColor: secondaryColor, borderColor: '#ffffff' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
            </div>
          </div>
        </div>
      )}

      {/* 4. DIAGONAL RIBBON & HANGING MEDAL */}
      {layoutType === 'ribbon' && (
        <div className="w-full h-full p-1 relative flex flex-col justify-between">
          {/* Frame */}
          <div className="absolute inset-1 border-2" style={{ borderColor: primaryColor }} />
          <div className="absolute inset-1.5 border" style={{ borderColor: secondaryColor }} />

          {/* Corner Diagonal Ribbon */}
          <div
            className="absolute top-0 left-0 w-8 h-8 pointer-events-none"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 50%, transparent 50%)`,
            }}
          >
            <div
              className="absolute top-0 left-0 w-9 h-1 origin-top-left rotate-45"
              style={{ backgroundColor: secondaryColor }}
            />
          </div>

          {/* Text Body */}
          <div className="relative z-10 pt-2 pl-6 pr-2 flex flex-col items-center">
            <div className="w-12 h-1 rounded-full" style={{ backgroundColor: primaryColor }} />
            <div className="w-16 h-1.5 rounded-xs mt-1.5" style={{ backgroundColor: secondaryColor }} />
          </div>

          {/* Bottom Hanging Medal */}
          <div className="relative z-10 pb-1.5 flex justify-between items-end px-2">
            <div className="w-6 h-1 bg-slate-300 rounded-xs" />
            <div className="relative flex flex-col items-center">
              {/* Hanging ribbons */}
              <div className="w-2 h-2 flex justify-between">
                <div className="w-0.5 h-2" style={{ backgroundColor: primaryColor }} />
                <div className="w-0.5 h-2" style={{ backgroundColor: primaryColor }} />
              </div>
              <div className="w-4 h-4 rounded-full shadow-xs flex items-center justify-center -mt-0.5" style={{ backgroundColor: secondaryColor }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. BILATERAL DECREE / STATE DIPLOMA */}
      {layoutType === 'decree' && (
        <div className="w-full h-full p-1 relative flex flex-col justify-between">
          {/* Multi-tier State Border */}
          <div className="absolute inset-1 border-2" style={{ borderColor: primaryColor }} />
          <div className="absolute inset-1.5 border" style={{ borderColor: secondaryColor }} />
          <div className="absolute inset-2 border border-dashed border-emerald-600/30" />

          {/* Top Dual Emblems */}
          <div className="relative z-10 pt-1 flex items-center justify-between px-2.5">
            <div className="w-3 h-3 rounded-full border flex items-center justify-center" style={{ borderColor: secondaryColor, backgroundColor: primaryColor }}>
              <div className="w-1 h-1 rounded-full bg-white" />
            </div>
            <div className="w-12 h-1 rounded-full" style={{ backgroundColor: primaryColor }} />
            <div className="w-3 h-3 rounded-full border flex items-center justify-center" style={{ borderColor: secondaryColor, backgroundColor: primaryColor }}>
              <div className="w-1 h-1 rounded-full bg-white" />
            </div>
          </div>

          {/* Central Awardee */}
          <div className="relative z-10 flex flex-col items-center my-auto">
            <div className="w-16 h-1.5 rounded-xs" style={{ backgroundColor: primaryColor }} />
            <div className="w-20 h-1 rounded-xs bg-slate-200 mt-1" />
          </div>

          {/* Bilateral Signatures & Center Presidential Crest */}
          <div className="relative z-10 pb-1 flex items-center justify-between px-2.5">
            <div className="w-5 h-1 bg-slate-300 rounded-xs" />
            <div className="w-4 h-4 rounded-full border flex items-center justify-center shadow-xs" style={{ backgroundColor: secondaryColor, borderColor: '#ffffff' }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
            </div>
            <div className="w-5 h-1 bg-slate-300 rounded-xs" />
          </div>
        </div>
      )}

      {/* 6. CYBER ANGLED TECH */}
      {layoutType === 'cyber' && (
        <div
          className="w-full h-full p-1.5 relative flex flex-col justify-between"
          style={{
            clipPath: 'polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)',
          }}
        >
          {/* Tech Angular Frame */}
          <div
            className="absolute inset-1 border"
            style={{
              borderColor: accentColor,
              clipPath: 'polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px)',
            }}
          />

          {/* Digital Telemetry Tags */}
          <div className="relative z-10 flex items-center justify-between px-2 text-[6px] font-mono" style={{ color: accentColor }}>
            <span>[TKTI // SEC]</span>
            <span>[2026]</span>
          </div>

          {/* Tech Center Line */}
          <div className="relative z-10 flex flex-col items-center my-auto">
            <div className="w-14 h-1.5 rounded-none" style={{ backgroundColor: primaryColor }} />
            <div className="w-20 h-0.5 mt-1" style={{ backgroundColor: accentColor }} />
          </div>

          {/* Bottom Chip Badge */}
          <div className="relative z-10 flex items-center justify-between px-2">
            <div className="w-4 h-1 rounded-none bg-slate-300" />
            <div className="w-3.5 h-3.5 border flex items-center justify-center" style={{ borderColor: accentColor, backgroundColor: primaryColor }}>
              <div className="w-1.5 h-1.5" style={{ backgroundColor: accentColor }} />
            </div>
            <div className="w-5 h-1 rounded-none bg-slate-300" />
          </div>
        </div>
      )}

      {/* 7. SWISS MINIMALIST ASYMMETRICAL */}
      {layoutType === 'minimalist' && (
        <div className="w-full h-full p-1.5 flex relative">
          {/* Thick Left Accent Rule */}
          <div className="w-2.5 h-full rounded-xs shrink-0 mr-2" style={{ backgroundColor: primaryColor }} />

          {/* Asymmetric Swiss Content */}
          <div className="flex-1 flex flex-col justify-between py-0.5">
            <div>
              <div className="w-16 h-1.5 rounded-xs" style={{ backgroundColor: primaryColor }} />
              <div className="w-10 h-1 rounded-xs bg-slate-300 mt-1" />
            </div>
            <div className="my-auto">
              <div className="w-22 h-1.5 rounded-xs" style={{ backgroundColor: accentColor }} />
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-1">
              <div className="w-8 h-1 rounded-xs bg-slate-400" />
              <div className="w-3 h-3 rounded-full border" style={{ borderColor: accentColor }} />
            </div>
          </div>
        </div>
      )}

      {/* 8. BAROQUE LAUREL WREATH */}
      {layoutType === 'baroque' && (
        <div className="w-full h-full p-1 relative flex flex-col justify-between">
          {/* Ornate Frame */}
          <div className="absolute inset-1 border-2" style={{ borderColor: primaryColor }} />
          <div className="absolute inset-1.5 border" style={{ borderColor: secondaryColor }} />

          {/* 4 Corner Leaf Garlands */}
          <div className="absolute top-1.5 left-1.5 text-[8px]" style={{ color: secondaryColor }}>🌿</div>
          <div className="absolute top-1.5 right-1.5 text-[8px]" style={{ color: secondaryColor }}>🌿</div>
          <div className="absolute bottom-1.5 left-1.5 text-[8px]" style={{ color: secondaryColor }}>🌿</div>
          <div className="absolute bottom-1.5 right-1.5 text-[8px]" style={{ color: secondaryColor }}>🌿</div>

          {/* Academic Script Heading */}
          <div className="relative z-10 pt-2 flex flex-col items-center">
            <div className="w-12 h-1 rounded-full" style={{ backgroundColor: primaryColor }} />
            <div className="w-16 h-1.5 rounded-xs mt-1.5" style={{ backgroundColor: secondaryColor }} />
          </div>

          <div className="relative z-10 pb-1 flex items-center justify-between px-3">
            <div className="w-5 h-1 bg-slate-300 rounded-xs" />
            <div className="w-4 h-4 rounded-full border flex items-center justify-center shadow-xs" style={{ backgroundColor: secondaryColor, borderColor: '#ffffff' }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
            </div>
            <div className="w-5 h-1 bg-slate-300 rounded-xs" />
          </div>
        </div>
      )}

      {/* 9. DIPLOMATIC RED WAX SEAL */}
      {layoutType === 'wax_seal' && (
        <div className="w-full h-full p-1 relative flex flex-col justify-between" style={{ backgroundColor: '#fffbeb' }}>
          {/* Greek Key Border Simulation */}
          <div className="absolute inset-1 border-2" style={{ borderColor: primaryColor }} />
          <div className="absolute inset-1.5 border border-dashed" style={{ borderColor: secondaryColor }} />

          {/* Heading */}
          <div className="relative z-10 pt-2 flex flex-col items-center">
            <div className="w-14 h-1 rounded-full" style={{ backgroundColor: primaryColor }} />
            <div className="w-18 h-1.5 rounded-xs mt-1" style={{ backgroundColor: secondaryColor }} />
          </div>

          {/* Centerpiece 3D Red Wax Seal with hanging tails */}
          <div className="relative z-10 pb-1 flex items-end justify-between px-2.5">
            <div className="w-6 h-1 bg-slate-300 rounded-xs" />
            <div className="relative flex flex-col items-center">
              {/* Twin ribbons */}
              <div className="w-2.5 h-2 flex justify-between">
                <div className="w-1 h-2 bg-red-700" />
                <div className="w-1 h-2 bg-red-700" />
              </div>
              <div className="w-4 h-4 rounded-full bg-red-700 border border-red-500 shadow-sm flex items-center justify-center -mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-200" />
              </div>
            </div>
            <div className="w-6 h-1 bg-slate-300 rounded-xs" />
          </div>
        </div>
      )}

      {/* 10. SMART CARD / INTERNATIONAL REGISTRY */}
      {layoutType === 'smart_card' && (
        <div className="w-full h-full p-1 relative flex flex-col justify-between">
          <div className="absolute inset-1 border-2" style={{ borderColor: primaryColor }} />
          <div className="absolute inset-1.5 border" style={{ borderColor: accentColor }} />

          {/* International Dual Title */}
          <div className="relative z-10 pt-1.5 px-2 flex justify-between items-center">
            <div className="w-10 h-1 rounded-full" style={{ backgroundColor: primaryColor }} />
            <div className="w-8 h-1 rounded-full bg-slate-300" />
          </div>

          <div className="relative z-10 px-2 my-auto">
            <div className="w-14 h-1.5 rounded-xs" style={{ backgroundColor: primaryColor }} />
          </div>

          {/* Bottom Right Embedded Smart ID Card */}
          <div className="relative z-10 pb-1 flex items-center justify-between px-2">
            <div className="w-6 h-1 bg-slate-300 rounded-xs" />
            {/* Embedded chip card */}
            <div className="w-8 h-5 rounded-xs bg-slate-900 border border-sky-400 p-0.5 flex flex-col justify-between shadow-xs">
              <div className="w-2.5 h-1.5 bg-amber-400 rounded-2xs" />
              <div className="w-full h-0.5 bg-sky-300 rounded-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const CertificateDesignSelector: React.FC<CertificateDesignSelectorProps> = ({
  selectedDesignId,
  selectedPatternId,
  onSelectDesign,
  onSelectPattern,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const currentDesign = getCertificateDesign(selectedDesignId);

  const categories = [
    { id: 'all', label: 'Barchasi (10 ta)' },
    { id: 'state', label: 'Davlat & Rasmiy' },
    { id: 'oriental', label: 'Sharqona & Milliy' },
    { id: 'academic', label: 'Klassik & Akademiya' },
    { id: 'tech', label: 'Zamonaviy & IT' },
  ];

  const filteredDesigns = CERTIFICATE_DESIGNS.filter(d => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'state') return d.id === 'government_decree' || d.id === 'header_footer_bands';
    if (categoryFilter === 'oriental') return d.id === 'uzbek_portal';
    if (categoryFilter === 'academic') return d.id === 'baroque_laurel' || d.id === 'diplomatic_wax' || d.id === 'diagonal_ribbon';
    if (categoryFilter === 'tech') return d.id === 'cyber_tech' || d.id === 'modern_sidebar' || d.id === 'swiss_minimal' || d.id === 'corporate_id_card';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* 1. Header with badge and active indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Sertifikat va diplom shablonlari</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                10 xil arxitektura
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Tanlangan uslub: <strong className="text-slate-800">{currentDesign.name}</strong> • {currentDesign.layoutTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Haqiqiy alohida kompozitsiyalar va A4 format</span>
        </div>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {categories.map(cat => {
          const isActive = categoryFilter === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 3. Design Grid with Rich Visual Layout Previews (10 Distinct Styles) */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-900" />
          <span>1. Sertifikat kompozitsion shablonini tanlang (10 ta o‘ziga xos arxitektura)</span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {filteredDesigns.map(design => {
            const isSelected = selectedDesignId === design.id;
            return (
              <button
                key={design.id}
                type="button"
                onClick={() => {
                  onSelectDesign(design.id);
                  onSelectPattern(design.defaultPattern);
                }}
                className={`relative group flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50/70 border-amber-500 shadow-md ring-2 ring-amber-400/40'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs'
                }`}
              >
                {/* Active check pill */}
                {isSelected && (
                  <div className="absolute top-2 right-2 z-20 w-4.5 h-4.5 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}

                {/* ARCHITECTURAL MINI MOCKUP PREVIEW */}
                <div className="w-full mb-2">
                  <TemplateMockup design={design} isSelected={isSelected} />
                </div>

                {/* Badge and Name */}
                <div className="flex items-center gap-1.5 mb-0.5 w-full">
                  <span className="text-sm shrink-0">{design.badge}</span>
                  <span className="text-xs font-bold text-slate-900 truncate leading-snug">
                    {design.name}
                  </span>
                </div>

                {/* Category & Layout Type */}
                <span className="text-[10px] font-semibold text-blue-900 line-clamp-1 mb-1">
                  {design.category}
                </span>

                {/* Subtle description */}
                <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                  {design.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Active Design Architectural Breakdown Info */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold shrink-0">
            <Info className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-slate-900">{currentDesign.name} shabloni tuzilishi:</span>{' '}
            <span className="text-slate-600">{currentDesign.description}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-semibold text-blue-900 bg-white px-2.5 py-1 rounded-md border border-slate-200">
          <Compass className="w-3.5 h-3.5" />
          <span>Shakl: {currentDesign.layoutTitle}</span>
        </div>
      </div>

      {/* 5. Background Pattern Selector (10 Options) */}
      <div className="pt-2 border-t border-slate-100">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-blue-900" />
          <span>2. Sertifikat foni va naqsh to‘qimasini sozlash (10 ta fon)</span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {BACKGROUND_PATTERNS.map(pat => {
            const isSelected = selectedPatternId === pat.id;
            return (
              <button
                key={pat.id}
                type="button"
                onClick={() => onSelectPattern(pat.id)}
                className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-600 shadow-2xs ring-2 ring-blue-500/20 text-blue-950 font-semibold'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                    isSelected ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : pat.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs truncate">{pat.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{pat.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
