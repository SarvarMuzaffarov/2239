import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  Search,
  Check,
  X,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import {
  OFFICIAL_DIRECTIONS,
  canonicalizeDirection,
} from '../constants/directions';

interface DirectionSelectProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  id?: string;
  label?: string;
  className?: string;
  showAllOption?: boolean;
  allOptionLabel?: string;
  autoFocusSearch?: boolean;
}

// Category clusters for 18 official directions
const DIRECTION_CLUSTERS = [
  {
    id: 'all',
    label: 'Barchasi',
    icon: '🌐',
    count: 18,
    directions: OFFICIAL_DIRECTIONS,
  },
  {
    id: 'it_econ',
    label: 'IT va Iqtisodiyot',
    icon: '💻',
    directions: [
      'Iqtisodiyot',
      'Menejment',
      'Kompyuter injiniringi',
      'Sun’iy intellekt',
    ],
  },
  {
    id: 'chem_bio',
    label: 'Kimyo va Neft-gaz',
    icon: '🧪',
    directions: [
      'Kimyo muhandisligi',
      'Biotexnologiya',
      'Neft va neft-gazni qayta ishlash texnologiyasi',
      'Materialshunoslik',
    ],
  },
  {
    id: 'engineering',
    label: 'Muhandislik va Avtomatika',
    icon: '⚙️',
    directions: [
      'Energetika muhandisligi',
      'Texnologik jarayonlar va ishlab chiqarishni avtomatlashtirish',
      'Atrof-muhit muhandisligi',
      'Texnologik mashinalar va jihozlar',
    ],
  },
  {
    id: 'agro_food',
    label: 'Agro va Oziq-ovqat',
    icon: '🌾',
    directions: [
      'Oziq-ovqat texnologiyasi',
      'Qishloq xo‘jaligini mexanizatsiyalashtirish',
      'Agrokimyo va tuproqshunoslik',
      'Agronomiya',
      'O‘simliklar himoyasi va karantini',
      'Qishloq xo‘jalik mahsulotlarini saqlash va qayta ishlash texnologiyasi',
    ],
  },
];

export const DirectionSelect: React.FC<DirectionSelectProps> = ({
  value,
  onChange,
  placeholder = "Ta'lim yo'nalishini tanlang...",
  required = false,
  disabled = false,
  error,
  id = 'direction-select',
  label,
  className = '',
  showAllOption = false,
  allOptionLabel = 'Barcha yo‘nalishlar',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<string>('all');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Canonical representation
  const canonicalValue = canonicalizeDirection(value);
  const isAllSelected = showAllOption && (value === 'all' || value === '');
  const displayText = isAllSelected
    ? allOptionLabel
    : canonicalValue || value || placeholder;

  const isSelected = Boolean(value && value !== 'all');

  // Filter directions based on cluster and search query
  const filteredDirections = useMemo(() => {
    let list = [...OFFICIAL_DIRECTIONS];

    if (selectedCluster !== 'all') {
      const cluster = DIRECTION_CLUSTERS.find(c => c.id === selectedCluster);
      if (cluster) {
        list = list.filter(dir => cluster.directions.includes(dir));
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(dir => dir.toLowerCase().includes(q));
    }

    return list;
  }, [searchQuery, selectedCluster]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Autofocus search on open
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

  const handleSelect = (dir: string) => {
    onChange(dir);
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

    const itemsCount = filteredDirections.length + (showAllOption ? 1 : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % itemsCount);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + itemsCount) % itemsCount);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showAllOption && highlightedIndex === 0) {
        handleSelect('all');
      } else {
        const adjustedIdx = showAllOption ? highlightedIndex - 1 : highlightedIndex;
        if (adjustedIdx >= 0 && adjustedIdx < filteredDirections.length) {
          handleSelect(filteredDirections[adjustedIdx]);
        }
      }
    }
  };

  // Find index of selected item in OFFICIAL_DIRECTIONS
  const selectedNumber = canonicalValue
    ? OFFICIAL_DIRECTIONS.indexOf(canonicalValue as any) + 1
    : null;

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
            <GraduationCap className="w-4 h-4" />
          </div>

          <div className="min-w-0 flex-1">
            <span
              className={`block truncate ${
                isSelected || isAllSelected
                  ? 'font-semibold text-slate-900 text-sm'
                  : 'text-slate-400 text-sm font-normal'
              }`}
            >
              {displayText}
            </span>
            {selectedNumber && (
              <span className="text-[11px] text-blue-900 font-medium block">
                Rasmiy yo‘nalish #{selectedNumber}
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
                onChange(showAllOption ? 'all' : '');
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
      {error && (
        <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>
      )}

      {/* DEDICATED FULL-SCREEN MODAL PICKER (PORTAL TO DOCUMENT.BODY) */}
      {isModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[120] bg-slate-900/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="direction-modal-title"
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
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3
                      id="direction-modal-title"
                      className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2"
                    >
                      <span>Ta’lim yo‘nalishini tanlang</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Universitetning 18 ta rasmiy yo‘nalishidan birini belgilang
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

              {/* Search & Fast Filter Bar */}
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-white space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Yo‘nalish nomi yoki so‘zni yozing (masalan: kimyo, dastur, iqtisod)..."
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

                {/* Category Clusters Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {DIRECTION_CLUSTERS.map(cluster => {
                    const isActive = selectedCluster === cluster.id;
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
                      </button>
                    );
                  })}
                </div>

                {/* Filter Results Counter */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                  <span>
                    Topilgan yo‘nalishlar:{' '}
                    <strong className="text-slate-900 font-bold">
                      {filteredDirections.length} ta
                    </strong>
                  </span>
                  {selectedCluster !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedCluster('all')}
                      className="text-blue-900 hover:underline font-medium"
                    >
                      Barchasini ko‘rish (18 ta)
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Directions Cards List */}
              <div
                ref={listRef}
                className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2 bg-slate-50/50"
              >
                {showAllOption && (
                  <button
                    type="button"
                    onClick={() => handleSelect('all')}
                    className={`w-full p-3.5 text-left rounded-2xl flex items-center justify-between gap-3 border transition-all cursor-pointer ${
                      isAllSelected
                        ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isAllSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        ∞
                      </div>
                      <span className="font-semibold text-sm">{allOptionLabel}</span>
                    </div>
                    {isAllSelected && <Check className="w-5 h-5 text-white" />}
                  </button>
                )}

                {filteredDirections.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                      <Search className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      «{searchQuery}» bo‘yicha yo‘nalish topilmadi
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Iltimos, boshqa kalit so‘z bilan qidiring yoki barcha 18 ta yo‘nalish ro‘yxatini ko‘ring.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCluster('all');
                      }}
                      className="mt-4 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Barcha yo‘nalishlarni ko‘rsatish
                    </button>
                  </div>
                ) : (
                  filteredDirections.map(dir => {
                    const isItemActive = canonicalValue === dir;
                    const officialIdx = OFFICIAL_DIRECTIONS.indexOf(dir as any) + 1;

                    return (
                      <button
                        key={dir}
                        type="button"
                        onClick={() => handleSelect(dir)}
                        className={`w-full p-3.5 text-left rounded-2xl flex items-center justify-between gap-3.5 border transition-all cursor-pointer group ${
                          isItemActive
                            ? 'bg-blue-50/90 border-blue-900 ring-2 ring-blue-900/10 shadow-xs text-blue-950 font-bold'
                            : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-blue-300 text-slate-800 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Number badge */}
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                              isItemActive
                                ? 'bg-blue-900 text-white'
                                : 'bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-900 text-slate-600'
                            }`}
                          >
                            {officialIdx < 10 ? `0${officialIdx}` : officialIdx}
                          </div>

                          <div className="min-w-0 flex-1">
                            <span
                              className={`block leading-snug text-sm sm:text-base ${
                                isItemActive ? 'font-bold text-blue-950' : 'font-medium text-slate-800 group-hover:text-blue-950'
                              }`}
                            >
                              {dir}
                            </span>
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
                <div className="text-xs text-slate-500">
                  {canonicalValue ? (
                    <span className="flex items-center gap-1.5 text-blue-950 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate max-w-[200px] sm:max-w-xs">
                        {canonicalValue}
                      </span>
                    </span>
                  ) : (
                    <span>Ro‘yxatdan kerakli yo‘nalishni tanlang</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
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
