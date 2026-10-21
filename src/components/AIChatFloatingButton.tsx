import React, { useState } from 'react';
import { Sparkles, MessageSquare, Bot } from 'lucide-react';

interface AIChatFloatingButtonProps {
  onClick: () => void;
}

export const AIChatFloatingButton: React.FC<AIChatFloatingButtonProps> = ({ onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <aside
      aria-label="Iqtidor AI Yordamchi"
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 select-none"
    >
      <div className="relative group flex items-center gap-2">
        {/* Subtle Tooltip on Hover */}
        <div
          className={`hidden sm:block absolute right-full mr-3 px-3 py-1.5 bg-slate-900/90 text-white text-xs font-semibold rounded-xl shadow-lg whitespace-nowrap transition-all duration-200 pointer-events-none ${
            isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
          }`}
        >
          <span>Iqtidor AI bilan maslahatlashish</span>
          <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-slate-900/90 rotate-45" />
        </div>

        {/* Pulse Ring */}
        <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 opacity-60 blur-xs group-hover:opacity-100 animate-pulse transition duration-500" />

        {/* Main Floating Button */}
        <button
          type="button"
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative flex items-center gap-2 px-3.5 py-3 sm:px-4 sm:py-3.5 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 text-white rounded-full sm:rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20 cursor-pointer"
          aria-label="Iqtidor AI bilan suhbatlashish"
        >
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-400 to-amber-200 text-blue-950 flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 fill-amber-950/20" />
          </div>

          <div className="text-left hidden sm:block">
            <span className="text-xs font-bold tracking-tight block leading-tight">
              Iqtidor AI
            </span>
            <span className="text-[10px] text-amber-300 font-semibold block leading-tight">
              Ilmiy yordamchi
            </span>
          </div>

          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
        </button>
      </div>
    </aside>
  );
};
