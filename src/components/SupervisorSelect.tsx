import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  Search,
  Check,
  X,
  ChevronDown,
  ArrowRight,
  UserPlus,
  CheckCircle2,
  Briefcase,
  GraduationCap,
  UserX,
  Sparkles,
} from 'lucide-react';
import type { SupervisorProfile } from '../types';

export interface SupervisorSelectProps {
  value: string; // supervisor.id or 'other' or 'all' or 'unassigned' or ''
  onChange: (val: string) => void;
  supervisors: SupervisorProfile[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  id?: string;
  label?: string;
  className?: string;
  allowOther?: boolean;
  otherOptionLabel?: string;
  customSupervisorName?: string;
  showAllOption?: boolean;
  allOptionLabel?: string;
  showUnassignedOption?: boolean;
  unassignedOptionLabel?: string;
  allowUnassigned?: boolean; // Inside modal allows selecting "Biriktirilmagan"
}

// Predefined clusters for faculty/department specialization
const SUPERVISOR_CLUSTERS = [
  {
    id: 'all',
    label: 'Barchasi',
    icon: '🌐',
    keywords: [],
  },
  {
    id: 'it_soft',
    label: 'IT va Dasturlash',
    icon: '💻',
    keywords: ['axborot', 'dastur', 'sun’iy', 'intellekt', 'kompyuter', 'it'],
  },
  {
    id: 'eng_auto',
    label: 'Muhandislik & Avtomatika',
    icon: '⚙️',
    keywords: ['avtomat', 'mexanika', 'mashina', 'jihoz', 'uskuna', 'energetika'],
  },
  {
    id: 'econ_mgmt',
    label: 'Iqtisodiyot & Menejment',
    icon: '📊',
    keywords: ['iqtisod', 'menejment', 'boshqaruv', 'marketing'],
  },
  {
    id: 'food_bio',
    label: 'Oziq-ovqat & Biotexnologiya',
    icon: '🌾',
    keywords: ['oziq', 'ovqat', 'bio', 'kimyo', 'agro'],
  },
];

export const SupervisorSelect: React.FC<SupervisorSelectProps> = ({
  value,
  onChange,
  supervisors = [],
  placeholder = '-- Ilmiy rahbarni tanlang --',
  required = false,
  disabled = false,
  error,
  id = 'supervisor-select',
  label,
  className = '',
  allowOther = true,
  otherOptionLabel = 'Boshqa (Ro‘yxatda bo‘lmasa, qo‘lda kiritish)',
  customSupervisorName = '',
  showAllOption = false,
  allOptionLabel = 'Barcha rahbarlar',
  showUnassignedOption = false,
  unassignedOptionLabel = 'Rahbar biriktirilmagan',
  allowUnassigned = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<string>('all');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Active non-deleted supervisors
  const activeSupervisors = useMemo(() => {
    return (supervisors || []).filter(s => !(s as any).isDeleted);
  }, [supervisors]);

  // Selected supervisor object
  const selectedSupervisor = useMemo(() => {
    if (!value || value === 'other' || value === 'all' || value === 'unassigned') {
      return null;
    }
    return activeSupervisors.find(s => s.id === value) || null;
  }, [value, activeSupervisors]);

  const isAllSelected = showAllOption && (value === 'all' || (!value && showAllOption));
  const isOtherSelected = value === 'other';
  const isSelected = Boolean(value && value !== 'all');

  // Display text in button trigger
  const displayText = useMemo(() => {
    if (isAllSelected) return allOptionLabel;
    if (value === 'unassigned') return unassignedOptionLabel;
    if (isOtherSelected) {
      return customSupervisorName
        ? `Boshqa: ${customSupervisorName}`
        : 'Boshqa rahbar (Qo‘lda kiritilgan)';
    }
    if (selectedSupervisor) {
      return selectedSupervisor.fullName;
    }
    if (allowUnassigned && !value) {
      return 'Biriktirilmagan (Tanlash uchun bosing)';
    }
    return placeholder;
  }, [
    isAllSelected,
    value,
    isOtherSelected,
    customSupervisorName,
    selectedSupervisor,
    allowUnassigned,
    allOptionLabel,
    unassignedOptionLabel,
    placeholder,
  ]);

  // Compute supervisor matches per cluster for badge counts
  const clusterCounts = useMemo(() => {
    const counts: Record<string, number> = { all: activeSupervisors.length };

    SUPERVISOR_CLUSTERS.forEach(cluster => {
      if (cluster.id === 'all') return;
      const count = activeSupervisors.filter(sup => {
        const text = `${sup.department || ''} ${sup.position || ''} ${sup.academicDegree || ''}`.toLowerCase();
        return cluster.keywords.some(kw => text.includes(kw));
      }).length;
      counts[cluster.id] = count;
    });

    return counts;
  }, [activeSupervisors]);

  // Visible clusters (only those with at least 1 supervisor, plus 'all')
  const visibleClusters = useMemo(() => {
    return SUPERVISOR_CLUSTERS.filter(
      c => c.id === 'all' || (clusterCounts[c.id] || 0) > 0
    );
  }, [clusterCounts]);

  // Filtered supervisors based on cluster and search query
  const filteredSupervisors = useMemo(() => {
    let list = [...activeSupervisors];

    // Filter by cluster
    if (selectedCluster !== 'all') {
      const cluster = SUPERVISOR_CLUSTERS.find(c => c.id === selectedCluster);
      if (cluster && cluster.keywords.length > 0) {
        list = list.filter(sup => {
          const text = `${sup.department || ''} ${sup.position || ''} ${sup.academicDegree || ''}`.toLowerCase();
          return cluster.keywords.some(kw => text.includes(kw));
        });
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(s => {
        const nameMatch = (s.fullName || '').toLowerCase().includes(q);
        const deptMatch = (s.department || '').toLowerCase().includes(q);
        const posMatch = (s.position || '').toLowerCase().includes(q);
        const degMatch = (s.academicDegree || '').toLowerCase().includes(q);
        return nameMatch || deptMatch || posMatch || degMatch;
      });
    }

    return list;
  }, [activeSupervisors, selectedCluster, searchQuery]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      setSearchQuery('');
      setSelectedCluster('all');
      setHighlightedIndex(-1);

      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsModalOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
        clearTimeout(timer);
      };
    }
  }, [isModalOpen]);

  const handleSelect = (selectedId: string) => {
    onChange(selectedId);
    setIsModalOpen(false);
    setSearchQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isModalOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsModalOpen(true);
      }
      return;
    }

    const itemsCount = filteredSupervisors.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % itemsCount);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + itemsCount) % itemsCount);
    } else if (e.key === 'Enter' && highlightedIndex >= 0 && highlightedIndex < itemsCount) {
      e.preventDefault();
      handleSelect(filteredSupervisors[highlightedIndex].id);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Main Trigger Button */}
      <button
        type="button"
        id={id}
        aria-haspopup="dialog"
        aria-expanded={isModalOpen}
        disabled={disabled}
        onClick={() => setIsModalOpen(true)}
        onKeyDown={handleKeyDown}
        className={`w-full min-h-[48px] px-3.5 py-2.5 flex items-center justify-between gap-2.5 text-left text-sm rounded-xl border transition-all cursor-pointer select-none group ${
          disabled
            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            : error
            ? 'bg-rose-50/70 text-slate-900 border-rose-300 focus:ring-2 focus:ring-rose-500 shadow-xs'
            : isSelected
            ? 'bg-blue-50/50 hover:bg-blue-50/80 text-blue-950 border-blue-300 ring-1 ring-blue-900/10 shadow-xs'
            : 'bg-slate-50 hover:bg-white text-slate-800 border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className={`p-1.5 rounded-lg shrink-0 transition-colors ${
              isSelected
                ? 'bg-blue-900 text-white'
                : 'bg-slate-200/70 text-slate-600 group-hover:bg-slate-300/70'
            }`}
          >
            <Users className="w-4 h-4" />
          </div>

          <div className="min-w-0 flex-1">
            <span
              className={`block truncate ${
                isSelected || isAllSelected || (allowUnassigned && !value)
                  ? 'font-semibold text-slate-900 text-sm'
                  : 'text-slate-400 text-sm font-normal'
              }`}
            >
              {displayText}
            </span>
            {selectedSupervisor && (
              <span className="text-[11px] text-blue-900 font-medium block truncate">
                {[selectedSupervisor.position, selectedSupervisor.department]
                  .filter(Boolean)
                  .join(' • ') || 'Ilmiy rahbar'}
              </span>
            )}
            {isOtherSelected && (
              <span className="text-[11px] text-amber-700 font-medium block">
                Ro‘yxatdan tashqari kiritilgan rahbar
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isSelected && !disabled && (
            <span
              role="button"
              tabIndex={0}
              title="Tozalash"
              onClick={e => {
                e.stopPropagation();
                onChange(showAllOption ? 'all' : allowUnassigned ? '' : '');
              }}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/80 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <span className="px-2 py-1 text-xs font-semibold bg-white border border-slate-200 group-hover:border-blue-900 text-slate-600 group-hover:text-blue-900 rounded-lg transition-colors flex items-center gap-1">
            <span>Tanlash</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-900" />
          </span>
        </div>
      </button>

      {/* Error message */}
      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}

      {/* DEDICATED FULL-SCREEN MODAL PICKER (PORTAL TO DOCUMENT.BODY) */}
      {isModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[120] bg-slate-900/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="supervisor-modal-title"
          >
            {/* Backdrop click to dismiss */}
            <div
              className="fixed inset-0"
              onClick={() => setIsModalOpen(false)}
              aria-hidden="true"
            />

            {/* Modal Dialog Card */}
            <div className="relative z-10 w-full max-w-xl bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-6 sm:slide-in-from-bottom-0 duration-200">
              {/* Mobile handle indicator */}
              <div className="sm:hidden pt-3 pb-1 flex justify-center">
                <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-5 sm:px-6 pt-3 sm:pt-5 pb-4 border-b border-slate-100 flex items-start justify-between gap-3 bg-gradient-to-b from-slate-50/80 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3
                      id="supervisor-modal-title"
                      className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2"
                    >
                      <span>Ilmiy rahbarni tanlang</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Sizga biriktirilgan ilmiy rahbarni rasmiy ro‘yxatdan belgilang
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Yopish (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search & Cluster Filter Bar */}
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-white space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Rahbar F.I.Sh, kafedrasi yoki lavozimi bo‘yicha qidiring..."
                    className="w-full pl-10 pr-9 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-900 transition-all shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Category Cluster Chips */}
                {visibleClusters.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {visibleClusters.map(cluster => {
                      const isActive = selectedCluster === cluster.id;
                      const count = clusterCounts[cluster.id] ?? 0;
                      return (
                        <button
                          key={cluster.id}
                          type="button"
                          onClick={() => setSelectedCluster(cluster.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                            isActive
                              ? 'bg-blue-900 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <span>{cluster.icon}</span>
                          <span>{cluster.label}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                              isActive ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Results count & quick reset */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                  <span>
                    Topilgan rahbarlar:{' '}
                    <strong className="text-slate-900 font-bold">
                      {filteredSupervisors.length} ta
                    </strong>
                  </span>
                  {selectedCluster !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedCluster('all')}
                      className="text-blue-900 hover:underline font-medium"
                    >
                      Barchasini ko‘rish ({activeSupervisors.length} ta)
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Supervisors Cards List */}
              <div
                ref={listRef}
                className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2 bg-slate-50/50"
              >
                {/* Option: "Barcha rahbarlar" (for filters) */}
                {showAllOption && (
                  <button
                    type="button"
                    onClick={() => handleSelect('all')}
                    className={`w-full p-3.5 text-left rounded-2xl flex items-center justify-between gap-3 border transition-all cursor-pointer ${
                      isAllSelected
                        ? 'bg-blue-900 text-white border-blue-900 shadow-xs font-bold'
                        : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isAllSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        ∞
                      </div>
                      <span className="font-semibold text-sm">{allOptionLabel}</span>
                    </div>
                    {isAllSelected && <Check className="w-5 h-5 text-white" />}
                  </button>
                )}

                {/* Option: "Rahbar biriktirilmagan / Unassigned" */}
                {(showUnassignedOption || allowUnassigned) && (
                  <button
                    type="button"
                    onClick={() => handleSelect(showUnassignedOption ? 'unassigned' : '')}
                    className={`w-full p-3.5 text-left rounded-2xl flex items-center justify-between gap-3 border transition-all cursor-pointer ${
                      value === 'unassigned' || (allowUnassigned && !value)
                        ? 'bg-slate-800 text-white border-slate-800 shadow-xs font-bold'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          value === 'unassigned' || (allowUnassigned && !value)
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <UserX className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-sm block">
                          {unassignedOptionLabel}
                        </span>
                        <span
                          className={`text-xs block ${
                            value === 'unassigned' || (allowUnassigned && !value)
                              ? 'text-slate-300'
                              : 'text-slate-400'
                          }`}
                        >
                          Ilmiy rahbar hali biriktirilmagan
                        </span>
                      </div>
                    </div>
                    {(value === 'unassigned' || (allowUnassigned && !value)) && (
                      <Check className="w-5 h-5 text-white" />
                    )}
                  </button>
                )}

                {/* Option: "Boshqa rahbar (Ro'yxatda bo'lmasa)" */}
                {allowOther && (
                  <button
                    type="button"
                    onClick={() => handleSelect('other')}
                    className={`w-full p-3.5 text-left rounded-2xl flex items-center justify-between gap-3 border transition-all cursor-pointer ${
                      isOtherSelected
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 shadow-xs text-amber-950 font-bold'
                        : 'bg-white hover:bg-amber-50/50 border-dashed border-amber-300 text-amber-900 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                          isOtherSelected
                            ? 'bg-amber-600 text-white'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-sm block">
                          {otherOptionLabel}
                        </span>
                        <span className="text-xs text-amber-700 font-medium block">
                          Agar rahbarni ro‘yxatdan topolmasangiz, uning ismini o‘zingiz yozasiz
                        </span>
                      </div>
                    </div>
                    {isOtherSelected && (
                      <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    )}
                  </button>
                )}

                {/* Empty State */}
                {filteredSupervisors.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                      <Search className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      «{searchQuery}» bo‘yicha ilmiy rahbar topilmadi
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      Qidiruv so‘zini o‘zgartirib ko‘ring yoki yuqoridagi «Boshqa rahbar» bandini tanlab, ismini qo‘lda kiriting.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCluster('all');
                      }}
                      className="mt-4 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Barcha rahbarlarni ko‘rsatish
                    </button>
                  </div>
                ) : (
                  filteredSupervisors.map((sup, idx) => {
                    const isItemActive = value === sup.id;
                    const displayNum = idx + 1;

                    return (
                      <button
                        key={sup.id}
                        type="button"
                        onClick={() => handleSelect(sup.id)}
                        className={`w-full p-3.5 text-left rounded-2xl flex items-center justify-between gap-3.5 border transition-all cursor-pointer group ${
                          isItemActive
                            ? 'bg-blue-50/90 border-blue-900 ring-2 ring-blue-900/10 shadow-xs text-blue-950 font-bold'
                            : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-blue-300 text-slate-800 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Number Badge or Avatar */}
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors shadow-xs ${
                              isItemActive
                                ? 'bg-blue-900 text-white'
                                : 'bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-900 text-slate-700'
                            }`}
                          >
                            {sup.photoURL ? (
                              <img
                                src={sup.photoURL}
                                alt={sup.fullName}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              <span>{displayNum < 10 ? `0${displayNum}` : displayNum}</span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`block leading-snug text-sm sm:text-base truncate ${
                                  isItemActive
                                    ? 'font-bold text-blue-950'
                                    : 'font-semibold text-slate-900 group-hover:text-blue-950'
                                }`}
                              >
                                {sup.fullName}
                              </span>
                              {sup.academicDegree && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-900 rounded-md shrink-0">
                                  {sup.academicDegree}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 flex-wrap">
                              {sup.position && (
                                <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                                  <Briefcase className="w-3 h-3 text-slate-400" />
                                  <span>{sup.position}</span>
                                </span>
                              )}
                              {sup.department && (
                                <span className="inline-flex items-center gap-1 text-slate-500">
                                  <span>•</span>
                                  <span>{sup.department}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Icon */}
                        <div className="shrink-0 flex items-center">
                          {isItemActive ? (
                            <div className="w-7 h-7 rounded-full bg-blue-900 text-white flex items-center justify-center shadow-xs">
                              <Check className="w-4 h-4 stroke-[2.5]" />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-900 flex items-center justify-center transition-colors">
                              <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3.5 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-500 min-w-0 flex-1">
                  {selectedSupervisor ? (
                    <span className="flex items-center gap-1.5 text-blue-950 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{selectedSupervisor.fullName}</span>
                    </span>
                  ) : isOtherSelected ? (
                    <span className="flex items-center gap-1.5 text-amber-800 font-medium">
                      <UserPlus className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Boshqa rahbar tanlandi</span>
                    </span>
                  ) : value === 'unassigned' || (allowUnassigned && !value) ? (
                    <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <UserX className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>Biriktirilmagan</span>
                    </span>
                  ) : (
                    <span>Ro‘yxatdan o‘z ilmiy rahbaringizni belgilang</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
