import React, { useState } from 'react';
import {
  GraduationCap,
  LogOut,
  User,
  Menu,
  X,
  LogIn,
  LayoutDashboard,
  Globe,
  Calendar,
  Bell,
  Send
} from 'lucide-react';
import type {
  UserAccount,
  UserRole,
  Announcement,
  ProjectOrStartup,
  Achievement,
  EventItem,
  StudentProfile,
  SupervisorProfile,
} from '../types';
import { NotificationCenter } from './NotificationCenter';

interface Props {
  currentUser: UserAccount | null;
  onLogout: () => void;
  onOpenVerifyModal: (certId?: string) => void;
  onOpenLogin?: () => void;
  currentView?: 'public' | 'dashboard';
  onToggleView?: (view: 'public' | 'dashboard') => void;
  onNavigateSection?: (sectionId: string) => void;
  announcements?: Announcement[];
  projects?: ProjectOrStartup[];
  achievements?: Achievement[];
  events?: EventItem[];
  students?: StudentProfile[];
  supervisors?: SupervisorProfile[];
}

export const Navbar: React.FC<Props> = ({
  currentUser,
  onLogout,
  onOpenVerifyModal,
  onOpenLogin,
  currentView = 'public',
  onToggleView,
  onNavigateSection,
  announcements = [],
  projects = [],
  achievements = [],
  events = [],
  students = [],
  supervisors = [],
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'superAdmin':
        return { label: 'Super Admin', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'admin':
        return { label: 'Admin', className: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'supervisor':
        return { label: 'Ilmiy Rahbar', className: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'student':
      default:
        return { label: 'Talaba', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
  };

  const roleInfo = currentUser ? getRoleBadge(currentUser.role) : null;

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (onNavigateSection) {
      onNavigateSection(sectionId);
    } else {
      if (currentView !== 'public' && onToggleView) {
        onToggleView('public');
      }
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.hash = `#${sectionId}`;
      }
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-40 safe-area-pt transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Name */}
          <div
            onClick={() => handleNavClick('top')}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-900 group-hover:bg-blue-800 text-white flex items-center justify-center shadow-xs transition-colors">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-sm sm:text-base font-black text-slate-900 tracking-tight block leading-tight truncate">
                IQTIDORLI TALABALAR
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-semibold tracking-wide block truncate">
                Ilmiy-innovatsion platforma
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links (Public Sections) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => handleNavClick('top')}
              className="px-3 py-2 rounded-xl hover:text-blue-900 hover:bg-slate-50 transition-colors"
            >
              Bosh sahifa
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('tadbirlar')}
              className="px-3 py-2 rounded-xl hover:text-blue-900 hover:bg-slate-50 transition-colors"
            >
              Tadbirlar
            </button>
            <a
              href="https://t.me/yosh_olimlar_tktiyf"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl text-sky-600 hover:text-sky-700 hover:bg-sky-50 transition-colors flex items-center gap-1.5 font-medium"
              title="Yosh olimlar Telegram kanali"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram kanal</span>
            </a>
          </nav>

          {/* Desktop Right Controls */}
          <div className="hidden sm:flex items-center gap-3">
            {/* If logged in: Portal/Dashboard switch */}
            {currentUser && onToggleView && (
              <button
                type="button"
                onClick={() => onToggleView(currentView === 'dashboard' ? 'public' : 'dashboard')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors min-h-[38px]"
              >
                {currentView === 'dashboard' ? (
                  <>
                    <Globe className="w-3.5 h-3.5 text-blue-900" />
                    <span>Bosh sahifa</span>
                  </>
                ) : (
                  <>
                    <LayoutDashboard className="w-3.5 h-3.5 text-blue-900" />
                    <span>Mening kabinetim</span>
                  </>
                )}
              </button>
            )}

            {/* Notification Center */}
            {currentUser && (
              <NotificationCenter
                currentUser={currentUser}
                announcements={announcements}
                projects={projects}
                achievements={achievements}
                events={events}
                students={students}
                supervisors={supervisors}
              />
            )}

            {/* User Profile or Prominent Login Button */}
            {currentUser && roleInfo ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
                    {currentUser.photoURL || (currentUser as any).avatarUrl ? (
                      <img
                        src={currentUser.photoURL || (currentUser as any).avatarUrl}
                        alt={currentUser.fullName}
                        className="w-full h-full object-cover"
                        onError={e => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      currentUser.fullName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="text-left hidden md:block">
                    <span className="text-xs font-bold text-slate-900 block leading-tight truncate max-w-[130px]">
                      {currentUser.fullName}
                    </span>
                    <span
                      className={`inline-block px-1.5 py-0.2 text-[9px] font-semibold rounded-sm border ${roleInfo.className}`}
                    >
                      {roleInfo.label}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center"
                  title="Tizimdan chiqish"
                  aria-label="Tizimdan chiqish"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* ALOHIDA KO‘ZGA TASHLANADIGAN [ 🔐 KIRISH ] TUGMASI */
              <button
                type="button"
                onClick={onOpenLogin}
                className="min-h-[42px] px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all flex items-center gap-2 active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>Kirish</span>
              </button>
            )}
          </div>

          {/* Mobile Right Quick Buttons */}
          <div className="flex sm:hidden items-center gap-1.5 shrink-0">
            {!currentUser && (
              <button
                type="button"
                onClick={onOpenLogin}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Kirish</span>
              </button>
            )}

            {currentUser && (
              <NotificationCenter
                currentUser={currentUser}
                announcements={announcements}
                projects={projects}
                achievements={achievements}
                events={events}
                students={students}
                supervisors={supervisors}
              />
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-w-[40px] min-h-[40px] p-2 text-slate-700 rounded-xl hover:bg-slate-100 border border-slate-200 flex items-center justify-center transition-colors active:scale-95"
              aria-label="Menyuni ochish"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Full Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-200 space-y-3 animate-in fade-in duration-200">
            {/* User Profile if Logged In */}
            {currentUser && roleInfo && (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-900 text-white font-bold flex items-center justify-center text-xs shadow-2xs overflow-hidden">
                    {currentUser.photoURL || (currentUser as any).avatarUrl ? (
                      <img
                        src={currentUser.photoURL || (currentUser as any).avatarUrl}
                        alt={currentUser.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      currentUser.fullName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{currentUser.fullName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{currentUser.phone}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${roleInfo.className}`}>
                  {roleInfo.label}
                </span>
              </div>
            )}

            {/* If logged in: Switch view button */}
            {currentUser && onToggleView && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onToggleView(currentView === 'dashboard' ? 'public' : 'dashboard');
                }}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-blue-50 text-blue-900 border border-blue-200"
              >
                {currentView === 'dashboard' ? (
                  <>
                    <Globe className="w-4 h-4" />
                    <span>Bosh sahifani ko‘rish</span>
                  </>
                ) : (
                  <>
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Mening kabinetimga o‘tish</span>
                  </>
                )}
              </button>
            )}

            {/* Navigation links */}
            <div className="grid grid-cols-1 gap-1 pt-1 text-xs font-semibold text-slate-700">
              <button
                type="button"
                onClick={() => handleNavClick('top')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-slate-100 flex items-center gap-2.5"
              >
                <Globe className="w-4 h-4 text-blue-900" />
                <span>Bosh sahifa</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('tadbirlar')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-slate-100 flex items-center gap-2.5"
              >
                <Calendar className="w-4 h-4 text-blue-900" />
                <span>Tadbirlar va tanlovlar</span>
              </button>

              <a
                href="https://t.me/yosh_olimlar_tktiyf"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-sky-50 text-sky-700 flex items-center gap-2.5 font-medium"
              >
                <Send className="w-4 h-4 text-sky-600" />
                <span>Telegram kanalimiz</span>
              </a>
            </div>

            {/* Logout or Login button */}
            <div className="pt-2 border-t border-slate-100">
              {currentUser ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Tizimdan chiqish</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onOpenLogin) onOpenLogin();
                  }}
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl transition-colors shadow-xs"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Platformaga kirish</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
