import React from 'react';
import {
  CERTIFICATE_DESIGNS,
  BACKGROUND_PATTERNS,
  CertificateDesignId,
  BackgroundPatternId,
  getCertificateDesign,
} from '../lib/certificateStyles';
import { Palette, Sparkles, Check, Layers, Image as ImageIcon } from 'lucide-react';

interface CertificateDesignSelectorProps {
  selectedDesignId: CertificateDesignId;
  selectedPatternId: BackgroundPatternId;
  onSelectDesign: (designId: CertificateDesignId) => void;
  onSelectPattern: (patternId: BackgroundPatternId) => void;
}

export const CertificateDesignSelector: React.FC<CertificateDesignSelectorProps> = ({
  selectedDesignId,
  selectedPatternId,
  onSelectDesign,
  onSelectPattern,
}) => {
  const currentDesign = getCertificateDesign(selectedDesignId);

  return (
    <div className="space-y-4">
      {/* 1. Header with badge and active indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Sertifikat dizayni va foni</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                10 ta yangi uslub
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Tanlangan uslub: <strong className="text-slate-800">{currentDesign.name}</strong> ({currentDesign.category})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Professional A4 Landscape bosma sifati</span>
        </div>
      </div>

      {/* 2. Design Grid (10 distinct styles) */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-900" />
          <span>1. Sertifikat dizayni va uslubini tanlang (10 ta)</span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {CERTIFICATE_DESIGNS.map(design => {
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
                    ? 'bg-amber-50/70 border-amber-500 shadow-md ring-2 ring-amber-400/30'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                {/* Active check pill */}
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}

                {/* Color swatches preview bar */}
                <div className="w-full h-2.5 rounded-md flex overflow-hidden mb-2 shadow-2xs border border-black/10">
                  <div className="flex-1" style={{ backgroundColor: design.primaryColor }} />
                  <div className="w-1/3" style={{ backgroundColor: design.secondaryColor }} />
                  <div className="w-1/4" style={{ backgroundColor: design.accentColor }} />
                </div>

                {/* Badge and Name */}
                <div className="flex items-center gap-1.5 mb-1 w-full">
                  <span className="text-sm shrink-0">{design.badge}</span>
                  <span className="text-xs font-bold text-slate-900 truncate leading-snug">
                    {design.name}
                  </span>
                </div>

                {/* Category & Tags */}
                <span className="text-[10px] text-slate-500 line-clamp-1 mb-1">
                  {design.category}
                </span>

                {/* Subtle description on hover / active */}
                <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                  {design.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Background Pattern Selector (8 options) */}
      <div className="pt-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-blue-900" />
          <span>2. Sertifikat foni va naqshini sozlash (8 ta fon)</span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
