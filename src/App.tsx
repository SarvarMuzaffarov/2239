import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthView } from './components/AuthView';
import { AuthModal } from './components/AuthModal';
import { PublicLandingPage } from './components/PublicLandingPage';
import { DirectionDetailView } from './components/DirectionDetailView';
import { PublicEventModal } from './components/PublicEventModal';
import { PublicProjectModal } from './components/PublicProjectModal';
import { PublicAnnouncementModal } from './components/PublicAnnouncementModal';
import { InitialSetupBanner } from './components/InitialSetupBanner';
import { StudentDashboard } from './components/StudentDashboard';
import { SupervisorDashboard } from './components/SupervisorDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { NotificationToast } from './components/NotificationToast';
import { ConfirmModal } from './components/ConfirmModal';
import { PdfViewerModal } from './components/PdfViewerModal';
import { VerifyCertificateModal } from './components/VerifyCertificateModal';
import { EventParticipantsModal } from './components/EventParticipantsModal';
import { StudentProfileModal } from './components/StudentProfileModal';
import { TopStudentsManageModal } from './components/TopStudentsManageModal';
import {
  getCurrentUserSession,
  saveUserSession,
  logoutUserSession,
  checkSuperAdminExists,
  refreshUserSessionActivity,
} from './services/authService';
import {
  subscribeStudents,
  subscribeSupervisors,
  subscribeProjectsAndStartups,
  subscribeAchievements,
  subscribeCertificates,
  subscribeLanguageCertificates,
  subscribeEvents,
  subscribeAnnouncements,
  subscribeUsers,
  subscribeAuditLogs,
} from './services/firestoreService';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';
import { normalizePhone } from './lib/crypto';
import { offlineStore } from './lib/offlineStore';
import { Lock } from 'lucide-react';
import type {
  UserAccount,
  StudentProfile,
  SupervisorProfile,
  ProjectOrStartup,
  Achievement,
  CertificateItem,
  LanguageCertificate,
  EventItem,
  Announcement,
  AuditLog,
} from './types';

export default function App() {
  // Authentication & Session
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isSuperAdminExists, setIsSuperAdminExists] = useState<boolean>(true);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Real-time Collections with instant offline/cache population (never zero)
  const [allUsers, setAllUsers] = useState<UserAccount[]>(() => offlineStore.get('users'));
  const [students, setStudents] = useState<StudentProfile[]>(() => offlineStore.get('students').filter(s => !s.isDeleted));
  const [supervisors, setSupervisors] = useState<SupervisorProfile[]>(() => offlineStore.get('supervisors').filter(s => !s.isDeleted));
  const [projects, setProjects] = useState<ProjectOrStartup[]>(() => offlineStore.get('projects').filter(p => !p.isDeleted));
  const [achievements, setAchievements] = useState<Achievement[]>(() => offlineStore.get('achievements').filter(a => !a.isDeleted));
  const [certificates, setCertificates] = useState<CertificateItem[]>(() => offlineStore.get('certificates').filter(c => !c.isDeleted));
  const [languageCertificates, setLanguageCertificates] = useState<LanguageCertificate[]>(() => offlineStore.get('languageCertificates').filter(l => !l.isDeleted));
  const [events, setEvents] = useState<EventItem[]>(() => offlineStore.get('events').filter(e => !e.isDeleted));
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => offlineStore.get('announcements').filter(a => !a.isDeleted));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => offlineStore.get('auditLogs'));

  // Notifications & Modals
  const [toast, setToast] = useState<{
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Public Landing Page & Navigation State
  const [currentView, setCurrentView] = useState<'public' | 'dashboard'>('public');
  const [selectedDirection, setSelectedDirection] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register'>('login');
  const [selectedPublicEvent, setSelectedPublicEvent] = useState<EventItem | null>(null);
  const [selectedPublicProject, setSelectedPublicProject] = useState<ProjectOrStartup | null>(null);
  const [selectedPublicAnnouncement, setSelectedPublicAnnouncement] = useState<Announcement | null>(null);

  const [confirmModalOptions, setConfirmModalOptions] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {},
  });

  const [pdfModalOptions, setPdfModalOptions] = useState<{
    isOpen: boolean;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    title?: string;
  }>({
    isOpen: false,
  });

  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyInitialCertId, setVerifyInitialCertId] = useState('');

  // Event participants & Student profile modals
  const [selectedEventForParticipants, setSelectedEventForParticipants] = useState<EventItem | null>(null);
  const [selectedStudentIdForProfile, setSelectedStudentIdForProfile] = useState<string | null>(null);
  const [topStudentsModalOpen, setTopStudentsModalOpen] = useState(false);

  const notify = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({
      id: Date.now().toString(),
      type,
      message,
    });
  };

  const handleOpenStudentProfile = (studentId: string) => {
    setSelectedStudentIdForProfile(studentId);
    window.location.hash = `#student/${studentId}`;
  };

  const handleCloseStudentProfile = () => {
    setSelectedStudentIdForProfile(null);
    if (window.location.hash.startsWith('#student/') || window.location.hash.startsWith('#students/')) {
      window.location.hash = '';
    }
  };

  // Check URL path, query params, and hash for verify links (e.g. /verify/CERT-2026-0001, ?verify=CERT-2026-0001, or #verify/CERT-2026-0001)
  useEffect(() => {
    const handleRouteCheck = () => {
      const hash = window.location.hash;
      const pathname = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const verifyQueryParam = searchParams.get('verify') || searchParams.get('cert') || searchParams.get('id');

      if (verifyQueryParam) {
        const certCode = decodeURIComponent(verifyQueryParam.trim());
        if (certCode) {
          setVerifyInitialCertId(certCode);
          setVerifyModalOpen(true);
          return;
        }
      }

      if (hash.startsWith('#verify/')) {
        const certCode = decodeURIComponent(hash.replace('#verify/', '').trim());
        if (certCode) {
          setVerifyInitialCertId(certCode);
          setVerifyModalOpen(true);
          return;
        }
      } else if (pathname.startsWith('/verify/')) {
        const certCode = decodeURIComponent(pathname.replace('/verify/', '').trim());
        if (certCode) {
          setVerifyInitialCertId(certCode);
          setVerifyModalOpen(true);
          return;
        }
      } else if (hash.startsWith('#direction/')) {
        const dir = decodeURIComponent(hash.replace('#direction/', ''));
        setSelectedDirection(dir);
        setCurrentView('public');
      } else if (hash === '#login') {
        setAuthInitialTab('login');
        setAuthModalOpen(true);
      } else if (hash === '#register') {
        setAuthInitialTab('register');
        setAuthModalOpen(true);
      } else if (hash === '#dashboard') {
        setCurrentView('dashboard');
      } else if (hash.startsWith('#student/')) {
        const stId = hash.replace('#student/', '');
        if (stId) setSelectedStudentIdForProfile(stId);
      } else if (hash.startsWith('#students/')) {
        const stId = hash.replace('#students/', '');
        if (stId) setSelectedStudentIdForProfile(stId);
      }
    };
    handleRouteCheck();
    window.addEventListener('hashchange', handleRouteCheck);
    window.addEventListener('popstate', handleRouteCheck);
    return () => {
      window.removeEventListener('hashchange', handleRouteCheck);
      window.removeEventListener('popstate', handleRouteCheck);
    };
  }, []);

  // Initial session & superAdmin check
  useEffect(() => {
    const initApp = async () => {
      try {
        const session = getCurrentUserSession();
        if (session) {
          setCurrentUser(session);
          // Restore latest user profile data (e.g. photoURL, avatarUrl) directly from Firestore
          try {
            const userDoc = await getDoc(doc(db, 'users', session.id));
            if (userDoc.exists()) {
              const freshUser = { id: userDoc.id, ...userDoc.data() } as UserAccount;
              if (freshUser.isActive) {
                setCurrentUser(freshUser);
                saveUserSession(freshUser);
              }
            }
          } catch (freshErr) {
            console.warn('Session Firestore refresh note:', freshErr);
          }
        }
        const hasSuperAdmin = await checkSuperAdminExists();
        setIsSuperAdminExists(hasSuperAdmin);
      } catch (err) {
        console.warn('App initialization note (offline/connecting):', err);
      } finally {
        setIsAuthLoading(false);
      }
    };

    initApp();
  }, []);

  // Real-time listener for current user's own document (ensures permissions, photo, role, and status update instantly)
  useEffect(() => {
    if (!currentUser?.id) return;
    const currentUserId = currentUser.id;
    const unsubUser = onSnapshot(
      doc(db, 'users', currentUserId),
      snap => {
        if (snap.exists()) {
          const fresh = { id: snap.id, ...snap.data() } as UserAccount;
          setCurrentUser(prev => {
            if (!prev) return fresh;
            const permsChanged = JSON.stringify(fresh.permissions || {}) !== JSON.stringify(prev.permissions || {});
            const roleChanged = fresh.role !== prev.role;
            const statusChanged = fresh.isActive !== prev.isActive || fresh.isDeleted !== prev.isDeleted;
            const infoChanged = (
              fresh.avatarUrl !== prev.avatarUrl ||
              fresh.photoURL !== prev.photoURL ||
              fresh.fullName !== prev.fullName ||
              fresh.position !== prev.position ||
              fresh.phone !== prev.phone
            );

            if (permsChanged || roleChanged || statusChanged || infoChanged) {
              saveUserSession(fresh);
              return { ...prev, ...fresh };
            }
            return prev;
          });

          if (fresh.isActive === false || fresh.isDeleted) {
            notify('error', 'Hisobingiz ma‘muriyat tomonidan to‘xtatildi yoki o‘chirildi.');
            handleLogout();
          }
        }
      },
      err => {
        console.warn('User live sync note:', err);
      }
    );
    return () => unsubUser();
  }, [currentUser?.id]);

  // Refresh session activity timestamp on user interaction (idle timeout protection)
  useEffect(() => {
    if (!currentUser) return;
    let throttleTimeout: any = null;
    const handleActivity = () => {
      if (throttleTimeout) return;
      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;
        refreshUserSessionActivity();
      }, 30000); // Throttled to once per 30 seconds
    };

    window.addEventListener('click', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    return () => {
      if (throttleTimeout) clearTimeout(throttleTimeout);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [currentUser]);

  // Safe state updaters that NEVER overwrite populated collections with empty arrays
  const setSafeStudents = (items: StudentProfile[]) => {
    if (items && items.length > 0) setStudents(items);
  };
  const setSafeSupervisors = (items: SupervisorProfile[]) => {
    if (items && items.length > 0) setSupervisors(items);
  };
  const setSafeProjects = (items: ProjectOrStartup[]) => {
    if (items && items.length > 0) setProjects(items);
  };
  const setSafeAchievements = (items: Achievement[]) => {
    if (items && items.length > 0) setAchievements(items);
  };
  const setSafeCertificates = (items: CertificateItem[]) => {
    if (items && items.length > 0) setCertificates(items);
  };
  const setSafeLanguageCertificates = (items: LanguageCertificate[]) => {
    if (items && items.length > 0) setLanguageCertificates(items);
  };

  // Subscriptions to live real-time collections
  useEffect(() => {
    // 1. Announcements & Events are lightweight and relevant for all visitors
    const unsubEvents = subscribeEvents(setEvents);
    const unsubAnnouncements = subscribeAnnouncements(setAnnouncements);

    // 2. Subscriptions management:
    // When not logged in (public landing page):
    // Use local offlineStore directly (which contains all 223 students, 157 certificates, 82 projects).
    // This saves 550 Firestore reads per visitor, preventing quota exhaustion so counts NEVER drop to 0!
    let unsubStudents = () => {};
    let unsubSupervisors = () => {};
    let unsubProjects = () => {};
    let unsubAchievements = () => {};
    let unsubCertificates = () => {};
    let unsubLanguageCertificates = () => {};
    let unsubUsers = () => {};
    let unsubLogs = () => {};

    if (currentUser) {
      // Connect to live Firestore for logged-in sessions
      unsubStudents = subscribeStudents(setSafeStudents);
      unsubSupervisors = subscribeSupervisors(setSafeSupervisors);
      unsubProjects = subscribeProjectsAndStartups(setSafeProjects);
      unsubAchievements = subscribeAchievements(setSafeAchievements);
      unsubCertificates = subscribeCertificates(setSafeCertificates);
      unsubLanguageCertificates = subscribeLanguageCertificates(setSafeLanguageCertificates);

      if (currentUser.role === 'admin' || currentUser.role === 'superAdmin') {
        unsubUsers = subscribeUsers(setAllUsers);
        unsubLogs = subscribeAuditLogs(setAuditLogs);
      }
    } else {
      // For public landing page: keep local store subscribers active (0 Firestore reads!)
      unsubStudents = offlineStore.subscribe('students', list => {
        const active = list.filter(s => !s.isDeleted);
        if (active.length > 0) setSafeStudents(active);
      });
      unsubSupervisors = offlineStore.subscribe('supervisors', list => {
        const active = list.filter(s => !s.isDeleted);
        if (active.length > 0) setSafeSupervisors(active);
      });
      unsubProjects = offlineStore.subscribe('projects', list => {
        const active = list.filter(p => !p.isDeleted);
        if (active.length > 0) setSafeProjects(active);
      });
      unsubAchievements = offlineStore.subscribe('achievements', list => {
        const active = list.filter(a => !a.isDeleted);
        if (active.length > 0) setSafeAchievements(active);
      });
      unsubCertificates = offlineStore.subscribe('certificates', list => {
        const active = list.filter(c => !c.isDeleted);
        if (active.length > 0) setSafeCertificates(active);
      });
      unsubLanguageCertificates = offlineStore.subscribe('languageCertificates', list => {
        const active = list.filter(l => !l.isDeleted);
        if (active.length > 0) setSafeLanguageCertificates(active);
      });
    }

    return () => {
      unsubEvents();
      unsubAnnouncements();
      unsubStudents();
      unsubSupervisors();
      unsubProjects();
      unsubAchievements();
      unsubCertificates();
      unsubLanguageCertificates();
      unsubUsers();
      unsubLogs();
    };
  }, [currentUser?.id, currentUser?.role]);

  const handleUpdateCurrentUser = (updatedUser: UserAccount) => {
    setCurrentUser(updatedUser);
    saveUserSession(updatedUser);
  };

  const handleAuthSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setAuthModalOpen(false);
    setCurrentView('dashboard');
    notify('success', `Xush kelibsiz, ${user.fullName}!`);
  };

  const handleLogout = async () => {
    if (currentUser) {
      await logoutUserSession(currentUser.id, currentUser.fullName);
    }
    setCurrentUser(null);
    setCurrentView('public');
    notify('info', 'Tizimdan muvaffaqiyatli chiqildi.');
  };

  const currentStudentProfile = currentUser
    ? students.find(
        s =>
          s.id === currentUser.id ||
          s.userId === currentUser.id ||
          (s.phone && normalizePhone(s.phone) === normalizePhone(currentUser.phone))
      ) || null
    : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 selection:bg-blue-900 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <NotificationToast
          id={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalOptions.isOpen}
        title={confirmModalOptions.title}
        message={confirmModalOptions.message}
        confirmText={confirmModalOptions.confirmText}
        isDestructive={confirmModalOptions.isDestructive}
        onConfirm={confirmModalOptions.onConfirm}
        onClose={() => setConfirmModalOptions(prev => ({ ...prev, isOpen: false }))}
      />

      {/* PDF Preview Modal */}
      <PdfViewerModal
        isOpen={pdfModalOptions.isOpen}
        fileUrl={pdfModalOptions.fileUrl}
        fileName={pdfModalOptions.fileName}
        fileSize={pdfModalOptions.fileSize}
        title={pdfModalOptions.title}
        onClose={() => setPdfModalOptions({ isOpen: false })}
      />

      {/* Certificate Verification Modal */}
      <VerifyCertificateModal
        isOpen={verifyModalOpen}
        initialCertId={verifyInitialCertId}
        onClose={() => {
          setVerifyModalOpen(false);
          setVerifyInitialCertId('');
          if (window.location.hash.startsWith('#verify/')) {
            window.location.hash = '';
          }
          if (window.location.pathname.startsWith('/verify/')) {
            window.history.replaceState(null, '', '/');
          }
          if (window.location.search.includes('verify=') || window.location.search.includes('cert=') || window.location.search.includes('id=')) {
            const url = new URL(window.location.href);
            url.searchParams.delete('verify');
            url.searchParams.delete('cert');
            url.searchParams.delete('id');
            window.history.replaceState(null, '', url.pathname + (url.search ? url.search : '') + url.hash);
          }
        }}
      />

      {/* Event Participants Modal */}
      <EventParticipantsModal
        isOpen={!!selectedEventForParticipants}
        event={selectedEventForParticipants}
        students={students}
        supervisors={supervisors}
        currentUser={currentUser}
        onClose={() => setSelectedEventForParticipants(null)}
        onOpenStudentProfile={handleOpenStudentProfile}
        onNotify={notify}
      />

      {/* Student Full Profile Modal */}
      <StudentProfileModal
        isOpen={!!selectedStudentIdForProfile}
        studentId={selectedStudentIdForProfile}
        currentUser={currentUser}
        students={students}
        supervisors={supervisors}
        projects={projects}
        achievements={achievements}
        certificates={certificates}
        languageCertificates={languageCertificates}
        events={events}
        onClose={handleCloseStudentProfile}
        onOpenPdf={(url, name, size, title) =>
          setPdfModalOptions({
            isOpen: true,
            fileUrl: url,
            fileName: name,
            fileSize: size,
            title,
          })
        }
        onVerifyCertificate={certNumber => {
          handleCloseStudentProfile();
          setVerifyInitialCertId(certNumber);
          setVerifyModalOpen(true);
        }}
        onNotify={notify}
      />

      {/* Top 3 Active Students Modal (Admin only) */}
      <TopStudentsManageModal
        isOpen={topStudentsModalOpen}
        onClose={() => setTopStudentsModalOpen(false)}
        currentUser={currentUser}
        students={students}
        supervisors={supervisors}
        projects={projects}
        achievements={achievements}
        onNotify={notify}
      />

      {/* Public Visitor & Auth Modals */}
      <AuthModal
        isOpen={authModalOpen}
        initialTab={authInitialTab}
        supervisors={supervisors}
        onClose={() => {
          setAuthModalOpen(false);
          if (window.location.hash === '#login' || window.location.hash === '#register') {
            window.location.hash = '';
          }
        }}
        onAuthSuccess={handleAuthSuccess}
        onNotify={notify}
      />

      <PublicEventModal
        isOpen={!!selectedPublicEvent}
        event={selectedPublicEvent}
        currentUser={currentUser}
        studentProfile={currentStudentProfile}
        onClose={() => setSelectedPublicEvent(null)}
        onOpenLogin={() => {
          setSelectedPublicEvent(null);
          setAuthInitialTab('login');
          setAuthModalOpen(true);
        }}
        onNotify={notify}
      />

      <PublicProjectModal
        isOpen={!!selectedPublicProject}
        project={selectedPublicProject}
        onClose={() => setSelectedPublicProject(null)}
        onOpenPdf={(url, name, size, title) =>
          setPdfModalOptions({
            isOpen: true,
            fileUrl: url,
            fileName: name,
            fileSize: size,
            title,
          })
        }
      />

      <PublicAnnouncementModal
        isOpen={!!selectedPublicAnnouncement}
        announcement={selectedPublicAnnouncement}
        onClose={() => setSelectedPublicAnnouncement(null)}
      />

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenVerifyModal={(certId?: string) => {
          if (certId) setVerifyInitialCertId(certId);
          setVerifyModalOpen(true);
        }}
        onOpenLogin={() => {
          setAuthInitialTab('login');
          setAuthModalOpen(true);
        }}
        currentView={currentView}
        onToggleView={view => {
          setCurrentView(view);
          setSelectedDirection(null);
        }}
        onNavigateSection={sectionId => {
          if (currentView !== 'public') {
            setCurrentView('public');
          }
          setSelectedDirection(null);
          if (sectionId === 'top') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            setTimeout(() => {
              const el = document.getElementById(sectionId);
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 50);
          }
        }}
        announcements={announcements}
        projects={projects}
        achievements={achievements}
        events={events}
        students={students}
        supervisors={supervisors}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 safe-area-pb">
        {/* Loading Spinner */}
        {isAuthLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold text-slate-600">Platforma yuklanmoqda...</p>
          </div>
        ) : currentView === 'public' || !currentUser ? (
          /* PUBLIC PORTAL: HOMEPAGE OR DIRECTION DETAIL */
          <div className="py-2">
            {!isSuperAdminExists && (
              <div className="mb-6">
                <InitialSetupBanner
                  onSuccess={admin => {
                    setIsSuperAdminExists(true);
                    handleAuthSuccess(admin);
                  }}
                  onNotify={notify}
                />
              </div>
            )}

            {selectedDirection ? (
              <DirectionDetailView
                directionName={selectedDirection}
                students={students}
                supervisors={supervisors}
                projects={projects}
                achievements={achievements}
                certificates={certificates}
                events={events}
                onBack={() => {
                  setSelectedDirection(null);
                  if (window.location.hash.startsWith('#direction/')) {
                    window.location.hash = '';
                  }
                }}
                onOpenProjectDetail={proj => setSelectedPublicProject(proj)}
                onOpenVerifyModal={certId => {
                  if (certId) setVerifyInitialCertId(certId);
                  setVerifyModalOpen(true);
                }}
              />
            ) : (
              <PublicLandingPage
                students={students}
                supervisors={supervisors}
                projects={projects}
                achievements={achievements}
                certificates={certificates}
                events={events}
                announcements={announcements}
                isLoading={isAuthLoading}
                currentUser={currentUser}
                onOpenLogin={() => {
                  setAuthInitialTab('login');
                  setAuthModalOpen(true);
                }}
                onOpenRegister={() => {
                  setAuthInitialTab('register');
                  setAuthModalOpen(true);
                }}
                onOpenVerifyModal={certId => {
                  if (certId) setVerifyInitialCertId(certId);
                  setVerifyModalOpen(true);
                }}
                onSelectDirection={dir => {
                  setSelectedDirection(dir);
                  window.location.hash = `#direction/${encodeURIComponent(dir)}`;
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOpenEventDetail={ev => setSelectedPublicEvent(ev)}
                onOpenProjectDetail={proj => setSelectedPublicProject(proj)}
                onOpenAnnouncementDetail={ann => setSelectedPublicAnnouncement(ann)}
                onOpenStudentProfile={handleOpenStudentProfile}
                onOpenManageTopStudents={() => setTopStudentsModalOpen(true)}
              />
            )}
          </div>
        ) : !currentUser.isActive ? (
          /* BLOCKED ACCOUNT BANNER */
          <div className="max-w-lg mx-auto bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-rose-950 mb-2">Hisobingiz vaqtincha bloklangan</h2>
            <p className="text-xs text-rose-700 mb-6 leading-relaxed">
              Xavfsizlik qoidalari yoki ma'muriyat qarori bilan profilingiz faoliyati to'xtatilgan. Iltimos, universitet ma'muriyatiga murojaat qiling.
            </p>
            <button
              onClick={handleLogout}
              className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              Tizimdan chiqish
            </button>
          </div>
        ) : currentUser.role === 'student' ? (
          /* STUDENT DASHBOARD */
          <StudentDashboard
            currentUser={currentUser}
            studentProfile={currentStudentProfile}
            supervisors={supervisors}
            projects={projects}
            achievements={achievements}
            certificates={certificates}
            languageCertificates={languageCertificates}
            events={events}
            announcements={announcements}
            onNotify={notify}
            onUpdateCurrentUser={handleUpdateCurrentUser}
            onOpenPdf={(url, name, size, title) =>
              setPdfModalOptions({
                isOpen: true,
                fileUrl: url,
                fileName: name,
                fileSize: size,
                title,
              })
            }
            onConfirmModal={opts =>
              setConfirmModalOptions({
                isOpen: true,
                title: opts.title,
                message: opts.message,
                confirmText: opts.confirmText,
                isDestructive: opts.isDestructive,
                onConfirm: async () => {
                  await opts.onConfirm();
                  setConfirmModalOptions(prev => ({ ...prev, isOpen: false }));
                },
              })
            }
          />
        ) : currentUser.role === 'supervisor' ? (
          /* SUPERVISOR DASHBOARD */
          <SupervisorDashboard
            currentUser={currentUser}
            supervisors={supervisors}
            students={students}
            projects={projects}
            achievements={achievements}
            certificates={certificates}
            languageCertificates={languageCertificates}
            events={events}
            onNotify={notify}
            onUpdateCurrentUser={handleUpdateCurrentUser}
            onOpenStudentProfile={handleOpenStudentProfile}
            onOpenPdf={(url, name, size, title) =>
              setPdfModalOptions({
                isOpen: true,
                fileUrl: url,
                fileName: name,
                fileSize: size,
                title,
              })
            }
          />
        ) : (
          /* ADMIN & SUPER ADMIN DASHBOARD */
          <AdminDashboard
            currentUser={currentUser}
            allUsers={allUsers}
            students={students}
            supervisors={supervisors}
            projects={projects}
            achievements={achievements}
            certificates={certificates}
            languageCertificates={languageCertificates}
            events={events}
            announcements={announcements}
            auditLogs={auditLogs}
            onNotify={notify}
            onOpenEventParticipants={ev => setSelectedEventForParticipants(ev)}
            onOpenStudentProfile={handleOpenStudentProfile}
            onOpenPdf={(url, name, size, title) =>
              setPdfModalOptions({
                isOpen: true,
                fileUrl: url,
                fileName: name,
                fileSize: size,
                title,
              })
            }
            onConfirmModal={opts =>
              setConfirmModalOptions({
                isOpen: true,
                title: opts.title,
                message: opts.message,
                confirmText: opts.confirmText,
                isDestructive: opts.isDestructive,
                onConfirm: async () => {
                  await opts.onConfirm();
                  setConfirmModalOptions(prev => ({ ...prev, isOpen: false }));
                },
              })
            }
          />
        )}
      </main>
    </div>
  );
}
