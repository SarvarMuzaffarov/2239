import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X, Building } from 'lucide-react';
import { OFFICIAL_DIRECTIONS, canonicalizeDirection, isValidDirection } from '../constants/directions';

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
  allOptionLabel = "Barcha yo‘nalishlar",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter directions based on search query
  const filteredDirections = OFFICIAL_DIRECTIONS.filter(dir =>
    dir.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  // Selected canonical display
  const canonicalValue = canonicalizeDirection(value);
  const isAllSelected = showAllOption && (value === 'all' || value === '');
  const displayText = isAllSelected
    ? allOptionLabel
    : canonicalValue || value || placeholder;

  const isSelected = Boolean(value && value !== 'all');

  // Handle outside click to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setHighlightedIndex(-1);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Scroll highlighted element into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const el = listRef.current.children[highlightedIndex] as HTMLElement;
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleSelect = (selectedDirection: string) => {
    onChange(selectedDirection);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
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
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
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
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full min-h-[44px] px-3.5 py-2.5 flex items-center justify-between gap-2.5 text-left text-sm rounded-xl border transition-all cursor-pointer select-none ${
          disabled
            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            : error
            ? 'bg-rose-50/60 text-slate-900 border-rose-300 focus:ring-2 focus:ring-rose-500'
            : isOpen
            ? 'bg-white text-slate-900 border-blue-900 ring-2 ring-blue-900/10 shadow-xs'
            : 'bg-slate-50 hover:bg-white text-slate-800 border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Building className="w-4 h-4 text-slate-400 shrink-0" />
          <span
            className={`block truncate ${
              isSelected || isAllSelected
                ? 'font-medium text-slate-900'
                : 'text-slate-400'
            }`}
          >
            {displayText}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isSelected && !disabled && (
            <span
              role="button"
              tabIndex={0}
              title="Tozalash"
              onClick={e => {
                e.stopPropagation();
                onChange(showAllOption ? 'all' : '');
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-900' : ''
            }`}
          />
        </div>
      </button>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>
      )}

      {/* Floating Dropdown */}
      {isOpen && (
        <div
          className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          style={{ minWidth: '280px' }}
        >
          {/* Search Input Bar */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/60">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Yo‘nalish nomini qidiring (18 ta)..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between px-1 pt-1.5 text-[11px] text-slate-500">
              <span>Rasmiy ta’lim yo‘nalishlari:</span>
              <span className="font-semibold text-blue-950">
                {filteredDirections.length} / 18
              </span>
            </div>
          </div>

          {/* List Options */}
          <div
            ref={listRef}
            role="listbox"
            className="max-h-64 overflow-y-auto p-1.5 space-y-1 divide-y divide-slate-50"
          >
            {showAllOption && (
              <button
                type="button"
                role="option"
                aria-selected={isAllSelected}
                onClick={() => handleSelect('all')}
                className={`w-full px-3 py-2.5 text-left text-xs sm:text-sm rounded-xl flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                  isAllSelected
                    ? 'bg-blue-50 text-blue-900 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{allOptionLabel}</span>
                {isAllSelected && <Check className="w-4 h-4 text-blue-900 shrink-0" />}
              </button>
            )}

            {filteredDirections.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                Mos keluvchi rasmiy yo‘nalish topilmadi.
              </div>
            ) : (
              filteredDirections.map((dir, idx) => {
                const isItemActive = canonicalValue === dir;
                const itemIndex = showAllOption ? idx + 1 : idx;
                const isHighlighted = highlightedIndex === itemIndex;

                return (
                  <button
                    key={dir}
                    type="button"
                    role="option"
                    aria-selected={isItemActive}
                    onClick={() => handleSelect(dir)}
                    onMouseEnter={() => setHighlightedIndex(itemIndex)}
                    className={`w-full min-h-[44px] px-3 py-2.5 text-left text-xs sm:text-sm rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                      isItemActive
                        ? 'bg-blue-50 text-blue-950 font-semibold ring-1 ring-blue-900/10'
                        : isHighlighted
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="leading-snug break-words">
                      {idx + 1}. {dir}
                    </span>
                    {isItemActive && (
                      <Check className="w-4 h-4 text-blue-900 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
