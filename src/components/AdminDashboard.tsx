import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Users,
  GraduationCap,
  FolderGit2,
  Rocket,
  Trophy,
  Award,
  Calendar,
  Bell,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Search,
  Download,
  Filter,
  Eye,
  Lock,
  Unlock,
  QrCode,
  Send,
  AlertTriangle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  ExternalLink,
  Pencil,
  FileSpreadsheet,
  Building,
  TrendingUp,
  Archive,
  KeyRound,
  Ban,
  ArrowUpDown,
  SlidersHorizontal,
} from 'lucide-react';
import { EmptyState } from './EmptyState';
import { EditStudentModal } from './EditStudentModal';
import { EditSupervisorModal } from './EditSupervisorModal';
import { EditProjectModal } from './EditProjectModal';
import { IssueCertificateModal } from './IssueCertificateModal';
import { CertificatePreviewModal } from './CertificatePreviewModal';
import { AdminManagementView } from './admin/AdminManagementView';
import { TrashRecoveryView } from './admin/TrashRecoveryView';
import { CertificateEditModal } from './admin/CertificateEditModal';
import { RevokeCertificateModal } from './admin/RevokeCertificateModal';
import { ResetPasswordModal } from './admin/ResetPasswordModal';
import { TopStudentsManageModal } from './TopStudentsManageModal';
import { hasPermission } from '../lib/permissions';
import {
  updateProjectOrStartupStatus,
  deleteProjectOrStartup,
  updateAchievementStatus,
  updateCertificateDocStatus,
  createEventDoc,
  updateEventDoc,
  deleteEventDoc,
  createAnnouncementDoc,
  updateAnnouncementDoc,
  deleteAnnouncementDoc,
  createSupervisorProfile,
  updateSupervisorProfile,
  deleteSupervisorProfile,
  assignSupervisorToStudent,
  deleteStudentProfile,
  createOfficialCertificate,
  deleteCertificateDoc,
  fetchStudentsPaginated,
  softDeleteDocument,
} from '../services/firestoreService';
import {
  exportStudentsToExcel,
  exportSupervisorsToExcel,
  exportProjectsToExcel,
  exportAchievementsToExcel,
  exportCertificatesToExcel,
  exportAuditLogsToExcel,
  exportEventParticipantsToExcel,
  exportCompetitionApplicationsToExcel,
  exportDirectionStatisticsToExcel,
  DirectionExportRow,
} from '../lib/excelExport';
import { DirectionSelect } from './DirectionSelect';
import {
  OFFICIAL_DIRECTIONS,
  canonicalizeDirection,
  getDirectionFilterVariants,
} from '../constants/directions';
import { getDeadlineInfo } from '../lib/deadlineHelper';
import {
  registerAdminUser,
  toggleUserBlockStatus,
  changeUserRole,
} from '../services/authService';
import { downloadCertificatePdf } from '../lib/certificateGenerator';
import { formatUzbekPhone } from '../lib/crypto';
import type {
  UserAccount,
  StudentProfile,
  SupervisorProfile,
  ProjectOrStartup,
  Achievement,
  CertificateItem,
  EventItem,
  Announcement,
  AuditLog,
} from '../types';

interface Props {
  currentUser: UserAccount;
  allUsers: UserAccount[];
  students: StudentProfile[];
  supervisors: SupervisorProfile[];
  projects: ProjectOrStartup[];
  achievements: Achievement[];
  certificates: CertificateItem[];
  events: EventItem[];
  announcements: Announcement[];
  auditLogs: AuditLog[];
  onNotify: (type: 'success' | 'error' | 'info', msg: string) => void;
  onOpenPdf: (url: string, name?: string, size?: number, title?: string) => void;
  onConfirmModal: (options: {
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
    onConfirm: () => Promise<void>;
  }) => void;
  onOpenEventParticipants?: (event: EventItem) => void;
  onOpenStudentProfile?: (studentId: string) => void;
}

type TabType =
  | 'stats'
  | 'students'
  | 'supervisors'
  | 'projects'
  | 'achievements'
  | 'certificates'
  | 'events'
  | 'announcements'
  | 'admins'
  | 'trash'
  | 'audit';

export const AdminDashboard: React.FC<Props> = ({
  currentUser,
  allUsers = [],
  students = [],
  supervisors = [],
  projects = [],
  achievements = [],
  certificates = [],
  events = [],
  announcements = [],
  auditLogs = [],
  onNotify,
  onOpenPdf,
  onConfirmModal,
  onOpenEventParticipants,
  onOpenStudentProfile,
}) => {
  const isSuperAdmin = currentUser.role === 'superAdmin';

  // Define admin navigation tabs with RBAC checks
  const canViewStats = hasPermission(currentUser, 'statistics', 'view') || hasPermission(currentUser, 'dashboard', 'view');
  const canViewStudents = hasPermission(currentUser, 'students', 'view');
  const canViewSupervisors = hasPermission(currentUser, 'supervisors', 'view');
  const canViewProjects = hasPermission(currentUser, 'projects', 'view');
  const canViewStartups = hasPermission(currentUser, 'startups', 'view');
  const canViewAchievements = hasPermission(currentUser, 'achievements', 'view');
  const canViewCertificates = hasPermission(currentUser, 'certificates', 'view');
  const canViewEvents = hasPermission(currentUser, 'events', 'view');
  const canViewAnnouncements = hasPermission(currentUser, 'announcements', 'view');
  const canViewAdmins = isSuperAdmin || hasPermission(currentUser, 'admins', 'view');
  const canViewTrash = isSuperAdmin || hasPermission(currentUser, 'trash', 'view');
  const canViewAudit = isSuperAdmin || hasPermission(currentUser, 'audit_logs', 'view');

  const trashCount = (
    students.filter(s => s.isDeleted).length +
    supervisors.filter(s => s.isDeleted).length +
    projects.filter(p => p.isDeleted).length +
    achievements.filter(a => a.isDeleted).length +
    certificates.filter(c => c.isDeleted).length +
    events.filter(e => e.isDeleted).length +
    announcements.filter(a => a.isDeleted).length +
    allUsers.filter(u => (u.role === 'admin' || u.role === 'superAdmin') && u.isDeleted).length
  );

  const adminNavItems = useMemo(() => [
    { id: 'stats' as TabType, label: 'Statistika', icon: BarChart3, count: null, visible: canViewStats },
    { id: 'students' as TabType, label: 'Talabalar', icon: GraduationCap, count: students.filter(s => !s.isDeleted).length, visible: canViewStudents },
    { id: 'supervisors' as TabType, label: 'Ilmiy rahbarlar', icon: Users, count: supervisors.filter(s => !s.isDeleted).length, visible: canViewSupervisors },
    { id: 'projects' as TabType, label: 'Loyihalar va Startaplar', icon: FolderGit2, count: projects.filter(p => !p.isDeleted && (((p.type === 'startap' || p.type === 'startup') && canViewStartups) || (p.type !== 'startap' && p.type !== 'startup' && canViewProjects))).length, visible: canViewProjects || canViewStartups },
    { id: 'achievements' as TabType, label: 'Yutuqlar', icon: Trophy, count: achievements.filter(a => !a.isDeleted).length, visible: canViewAchievements },
    { id: 'certificates' as TabType, label: 'Sertifikatlar', icon: Award, count: certificates.filter(c => !c.isDeleted).length, visible: canViewCertificates },
    { id: 'events' as TabType, label: 'Tadbirlar', icon: Calendar, count: events.filter(e => !e.isDeleted).length, visible: canViewEvents },
    { id: 'announcements' as TabType, label: "E'lonlar", icon: Bell, count: announcements.filter(a => !a.isDeleted).length, visible: canViewAnnouncements },
    { id: 'admins' as TabType, label: 'Adminlar va Huquqlar', icon: Shield, count: allUsers.filter(u => (u.role === 'admin' || u.role === 'superAdmin') && !u.isDeleted).length, visible: canViewAdmins },
    { id: 'trash' as TabType, label: 'Chiqindilar qutisi', icon: Archive, count: trashCount > 0 ? trashCount : null, visible: canViewTrash },
    { id: 'audit' as TabType, label: 'Audit Log', icon: FileText, count: auditLogs.length, visible: canViewAudit },
  ].filter(item => item.visible), [
    canViewStats,
    canViewStudents,
    canViewSupervisors,
    canViewProjects,
    canViewStartups,
    canViewAchievements,
    canViewCertificates,
    canViewEvents,
    canViewAnnouncements,
    canViewAdmins,
    canViewTrash,
    canViewAudit,
    students,
    supervisors,
    projects,
    achievements,
    certificates,
    events,
    announcements,
    allUsers,
    auditLogs
  ]);

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    return adminNavItems[0]?.id || 'stats';
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Synchronize activeTab if permissions change and active tab is no longer permitted
  useEffect(() => {
    if (adminNavItems.length > 0 && !adminNavItems.some(item => item.id === activeTab)) {
      setActiveTab(adminNavItems[0].id);
    }
  }, [adminNavItems, activeTab]);

  const currentTabInfo = adminNavItems.find(item => item.id === activeTab) || adminNavItems[0] || {
    id: 'stats' as TabType,
    label: 'Statistika',
    icon: BarChart3,
    count: null,
    visible: true,
  };
  const CurrentIcon = currentTabInfo.icon;

  // Search & Filters for Students
  const [studentSearch, setStudentSearch] = useState('');
  const [studentCourseFilter, setStudentCourseFilter] = useState<string>('all');

  // Projects Search, Filters, Sorting & Pagination
  const [projectSearch, setProjectSearch] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>('all');
  const [projectTypeFilter, setProjectTypeFilter] = useState<'all' | 'loyiha' | 'startap'>('all');
  const [projectSort, setProjectSort] = useState<'newest' | 'oldest' | 'title_asc' | 'title_desc' | 'author_asc'>('newest');
  const [projectCurrentPage, setProjectCurrentPage] = useState<number>(1);

  // Achievements Search, Filters, Sorting & Pagination
  const [achievementSearch, setAchievementSearch] = useState('');
  const [achievementStatusFilter, setAchievementStatusFilter] = useState<string>('all');
  const [achievementCategoryFilter, setAchievementCategoryFilter] = useState<string>('all');
  const [achievementSort, setAchievementSort] = useState<'newest' | 'oldest' | 'title_asc' | 'student_asc'>('newest');
  const [achievementCurrentPage, setAchievementCurrentPage] = useState<number>(1);

  // Certificates Search, Filters, Sorting & Pagination
  const [certificateSearch, setCertificateSearch] = useState('');
  const [certificateTypeFilter, setCertificateTypeFilter] = useState<string>('all');
  const [certificateStatusFilter, setCertificateStatusFilter] = useState<string>('all');
  const [certificateSort, setCertificateSort] = useState<'newest' | 'oldest' | 'number_asc' | 'student_asc' | 'title_asc'>('newest');
  const [certificateCurrentPage, setCertificateCurrentPage] = useState<number>(1);

  // Events Search, Filters, Sorting & Pagination
  const [eventSearch, setEventSearch] = useState('');
  const [eventStatusFilter, setEventStatusFilter] = useState<string>('all');
  const [eventSort, setEventSort] = useState<'date_asc' | 'date_desc' | 'title_asc' | 'participants_desc'>('date_asc');
  const [eventCurrentPage, setEventCurrentPage] = useState<number>(1);

  // Announcements Search, Filters, Sorting & Pagination
  const [announcementSearch, setAnnouncementSearch] = useState('');
  const [announcementAudienceFilter, setAnnouncementAudienceFilter] = useState<string>('all');
  const [announcementSort, setAnnouncementSort] = useState<'newest' | 'oldest' | 'title_asc'>('newest');
  const [announcementCurrentPage, setAnnouncementCurrentPage] = useState<number>(1);

  // Supervisor Search, Filters & Pagination
  const [supervisorSearch, setSupervisorSearch] = useState('');
  const [supervisorDepartmentFilter, setSupervisorDepartmentFilter] = useState<string>('all');
  const [supervisorDegreeFilter, setSupervisorDegreeFilter] = useState<string>('all');
  const [supervisorStudentsFilter, setSupervisorStudentsFilter] = useState<'all' | 'has_students' | 'no_students'>('all');
  const [supervisorCurrentPage, setSupervisorCurrentPage] = useState<number>(1);
  const [selectedSupervisorForStudents, setSelectedSupervisorForStudents] = useState<SupervisorProfile | null>(null);
  const [isSupervisorStudentsModalOpen, setIsSupervisorStudentsModalOpen] = useState(false);

  // New Supervisor modal
  const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState(false);
  const [supFullName, setSupFullName] = useState('');
  const [supPhone, setSupPhone] = useState('+998 ');
  const [supPosition, setSupPosition] = useState('Dotsent');
  const [supDegree, setSupDegree] = useState('PhD');
  const [supDept, setSupDept] = useState('Axborot texnologiyalari');
  const [supEmail, setSupEmail] = useState('');
  const [supPassword, setSupPassword] = useState('123456');
  const [isSupSubmitting, setIsSupSubmitting] = useState(false);

  // New Event modal
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventTime, setEventTime] = useState('10:00');
  const [eventLocation, setEventLocation] = useState('Bosh bino, Anjumanlar zali');
  const [eventDeadline, setEventDeadline] = useState('');
  const [isEventSubmitting, setIsEventSubmitting] = useState(false);

  // New Announcement modal
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annAudience, setAnnAudience] = useState<'Barchaga' | 'Talabalar' | 'Ilmiy rahbarlar'>('Barchaga');

  // Edit Student Modal state
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [isTopStudentsModalOpen, setIsTopStudentsModalOpen] = useState(false);

  // Edit Supervisor Modal state
  const [editingSupervisor, setEditingSupervisor] = useState<SupervisorProfile | null>(null);
  const [isEditSupervisorModalOpen, setIsEditSupervisorModalOpen] = useState(false);
  const [isAnnSubmitting, setIsAnnSubmitting] = useState(false);

  // Issue Official Certificate modal
  const [isCertIssueModalOpen, setIsCertIssueModalOpen] = useState(false);
  const [isCertIssuing, setIsCertIssuing] = useState(false);
  const [previewCert, setPreviewCert] = useState<CertificateItem | null>(null);

  // Certificate Edit & Revoke state
  const [editingCertificate, setEditingCertificate] = useState<CertificateItem | null>(null);
  const [isEditCertModalOpen, setIsEditCertModalOpen] = useState(false);
  const [revokingCertificate, setRevokingCertificate] = useState<CertificateItem | null>(null);
  const [isRevokeCertModalOpen, setIsRevokeCertModalOpen] = useState(false);

  // Universal Password Reset state
  const [resetPassUser, setResetPassUser] = useState<{ id: string; fullName: string; phone: string; role: any } | null>(null);
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);

  // Super Admin: New Admin modal
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminFullName, setAdminFullName] = useState('');
  const [adminPhone, setAdminPhone] = useState('+998 ');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminRole, setAdminRole] = useState<'admin' | 'superAdmin'>('admin');
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);

  // Review Project / Achievement modal (with notes)
  const [reviewModalData, setReviewModalData] = useState<{
    type: 'project' | 'achievement' | 'cert';
    id: string;
    title: string;
    status: 'Tasdiqlangan' | 'Rad etilgan';
  } | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  // Edit Project modal
  const [editingProject, setEditingProject] = useState<ProjectOrStartup | null>(null);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);

  // Pagination & Debounced Search for Students
  const [paginatedStudents, setPaginatedStudents] = useState<StudentProfile[]>([]);
  const [studentsTotalCount, setStudentsTotalCount] = useState<number>(0);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [studentFacultyFilter, setStudentFacultyFilter] = useState('all');
  const [studentSupervisorFilter, setStudentSupervisorFilter] = useState('all');
  const [pageCursors, setPageCursors] = useState<(any | null)[]>([null]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isExportingStudents, setIsExportingStudents] = useState(false);
  const [isExportingCompetitions, setIsExportingCompetitions] = useState(false);
  const [showAllDirectionsStats, setShowAllDirectionsStats] = useState(false);

  // Edit Event state
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [editEventTitle, setEditEventTitle] = useState('');
  const [editEventDesc, setEditEventDesc] = useState('');
  const [editEventDate, setEditEventDate] = useState('');
  const [editEventTime, setEditEventTime] = useState('');
  const [editEventLocation, setEditEventLocation] = useState('');
  const [editEventDeadline, setEditEventDeadline] = useState('');
  const [editEventStatus, setEditEventStatus] = useState<'Rejalashtirilgan' | 'Davom etmoqda' | 'Yakunlangan'>('Rejalashtirilgan');
  const [isEditEventSubmitting, setIsEditEventSubmitting] = useState(false);

  // Edit Announcement state
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isEditAnnModalOpen, setIsEditAnnModalOpen] = useState(false);
  const [editAnnTitle, setEditAnnTitle] = useState('');
  const [editAnnContent, setEditAnnContent] = useState('');
  const [editAnnAudience, setEditAnnAudience] = useState<'Barcha talabalar' | 'Tanlangan talabalar' | 'Tadbir ishtirokchilari'>('Barcha talabalar');
  const [isEditAnnSubmitting, setIsEditAnnSubmitting] = useState(false);

  // Available unique faculties for filter
  const availableFaculties = Array.from(
    new Set(students.map(s => s.facultyOrField).filter((f): f is string => Boolean(f)))
  ).sort();

  // Platform Statistics Calculations
  const facultyDistribution = React.useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach(s => {
      const canonical = canonicalizeDirection(s.facultyOrField) || 'Belgilanmagan';
      counts[canonical] = (counts[canonical] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: students.length > 0 ? (count / students.length) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [students]);

  // Full 18 official directions breakdown statistics
  const fullDirectionStats: DirectionExportRow[] = React.useMemo(() => {
    return OFFICIAL_DIRECTIONS.map(dir => {
      const dirVariants = new Set(getDirectionFilterVariants(dir));
      const dirStudents = students.filter(s => {
        const canonical = canonicalizeDirection(s.facultyOrField);
        return canonical === dir || dirVariants.has(s.facultyOrField || '');
      });
      const studentIds = new Set(dirStudents.map(s => s.id));
      const dirProjects = projects.filter(
        p => p.type === 'loyiha' && (studentIds.has(p.studentId) || canonicalizeDirection(p.field) === dir)
      );
      const dirStartups = projects.filter(
        p => p.type === 'startap' && (studentIds.has(p.studentId) || canonicalizeDirection(p.field) === dir)
      );
      const dirAchievements = achievements.filter(a => studentIds.has(a.studentId));
      const dirCertificates = certificates.filter(c => studentIds.has(c.studentId));
      const activeCount = dirStudents.filter(s => {
        return (
          projects.some(p => p.studentId === s.id) ||
          achievements.some(a => a.studentId === s.id) ||
          certificates.some(c => c.studentId === s.id)
        );
      }).length;

      return {
        direction: dir,
        totalStudents: dirStudents.length,
        activeStudents: activeCount,
        projectsCount: dirProjects.length,
        startupsCount: dirStartups.length,
        achievementsCount: dirAchievements.length,
        certificatesCount: dirCertificates.length,
        eventParticipationsCount: 0,
        competitionApplicationsCount: 0,
      };
    });
  }, [students, projects, achievements, certificates]);

  const topActiveStudents = React.useMemo(() => {
    return students
      .map(s => {
        const approvedProj = projects.filter(p => p.studentId === s.id && p.status === 'Tasdiqlangan').length;
        const approvedAch = achievements.filter(a => a.studentId === s.id && a.status === 'Tasdiqlangan').length;
        const certsCount = certificates.filter(c => c.studentId === s.id).length;
        const totalScore = approvedProj * 5 + approvedAch * 3 + certsCount * 2;
        return {
          student: s,
          approvedProj,
          approvedAch,
          certsCount,
          totalScore,
        };
      })
      .filter(item => item.totalScore > 0)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 5);
  }, [students, projects, achievements, certificates]);

  const eventStats = React.useMemo(() => {
    const totalEvents = events.length;
    const activeEvents = events.filter(e => e.status !== 'Yakunlangan').length;
    const totalParticipants = events.reduce((sum, e) => sum + (e.participantIds?.length || 0), 0);
    return { totalEvents, activeEvents, totalParticipants };
  }, [events]);

  // Available unique departments and degrees for supervisor filters
  const supervisorDepartments = React.useMemo(() => {
    return Array.from(
      new Set(
        supervisors
          .filter(s => !s.isDeleted)
          .map(s => s.department)
          .filter((d): d is string => Boolean(d && d.trim()))
      )
    ).sort();
  }, [supervisors]);

  const supervisorDegrees = React.useMemo(() => {
    return Array.from(
      new Set(
        supervisors
          .filter(s => !s.isDeleted)
          .map(s => s.academicDegree)
          .filter((d): d is string => Boolean(d && d.trim()))
      )
    ).sort();
  }, [supervisors]);

  const filteredSupervisors = React.useMemo(() => {
    const q = (supervisorSearch || '').toLowerCase().trim();
    return supervisors
      .filter(s => !s.isDeleted)
      .filter(s => {
        const matchSearch =
          !q ||
          (s.fullName || '').toLowerCase().includes(q) ||
          (s.department || '').toLowerCase().includes(q) ||
          (s.position || '').toLowerCase().includes(q) ||
          (s.academicDegree || '').toLowerCase().includes(q) ||
          (s.phone || '').toLowerCase().includes(q) ||
          (s.email || '').toLowerCase().includes(q);

        const matchDept =
          supervisorDepartmentFilter === 'all' || s.department === supervisorDepartmentFilter;

        const matchDegree =
          supervisorDegreeFilter === 'all' || s.academicDegree === supervisorDegreeFilter;

        const assignedCount = students.filter(st => st.supervisorId === s.id && !st.isDeleted).length;
        const matchStudents =
          supervisorStudentsFilter === 'all' ||
          (supervisorStudentsFilter === 'has_students' && assignedCount > 0) ||
          (supervisorStudentsFilter === 'no_students' && assignedCount === 0);

        return matchSearch && matchDept && matchDegree && matchStudents;
      });
  }, [supervisors, students, supervisorSearch, supervisorDepartmentFilter, supervisorDegreeFilter, supervisorStudentsFilter]);

  const SUPERVISOR_PAGE_SIZE = 15;
  const totalSupervisorPages = Math.max(1, Math.ceil(filteredSupervisors.length / SUPERVISOR_PAGE_SIZE));
  const paginatedSupervisors = React.useMemo(() => {
    const start = (supervisorCurrentPage - 1) * SUPERVISOR_PAGE_SIZE;
    return filteredSupervisors.slice(start, start + SUPERVISOR_PAGE_SIZE);
  }, [filteredSupervisors, supervisorCurrentPage, SUPERVISOR_PAGE_SIZE]);

  // Debounced search for student query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(studentSearch.trim());
      setCurrentPage(1);
      setPageCursors([null]);
    }, 350);
    return () => clearTimeout(timer);
  }, [studentSearch]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
    setPageCursors([null]);
  }, [studentCourseFilter, studentFacultyFilter, studentSupervisorFilter]);

  // Fetch paginated students from Firestore
  const fetchStudentsForPage = async (page: number, cursor: any | null) => {
    setIsStudentsLoading(true);
    try {
      const res = await fetchStudentsPaginated({
        pageSize: 20,
        startAfterDoc: cursor,
        courseFilter: studentCourseFilter,
        facultyFilter: studentFacultyFilter,
        supervisorFilter: studentSupervisorFilter,
        searchQuery: debouncedSearch,
      });
      setPaginatedStudents(res.students);
      setStudentsTotalCount(res.totalCount);
      setHasNextPage(res.hasMore);

      if (res.lastDoc) {
        setPageCursors(prev => {
          const nextStack = [...prev];
          nextStack[page] = res.lastDoc;
          return nextStack;
        });
      }
    } catch (err) {
      console.warn('Students page fetch notice:', err);
    } finally {
      setIsStudentsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudentsForPage(currentPage, pageCursors[currentPage - 1] || null);
    }
  }, [activeTab, debouncedSearch, studentCourseFilter, studentFacultyFilter, studentSupervisorFilter, currentPage]);

  const handleOpenEditEvent = (ev: EventItem) => {
    setEditingEvent(ev);
    setEditEventTitle(ev.title || '');
    setEditEventDesc(ev.description || '');
    setEditEventDate(ev.date || '');
    setEditEventTime(ev.time || '');
    setEditEventLocation(ev.location || '');
    setEditEventDeadline(ev.deadline || '');
    setEditEventStatus((ev.status as any) || 'Rejalashtirilgan');
    setIsEditEventModalOpen(true);
  };

  const handleUpdateEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    setIsEditEventSubmitting(true);
    try {
      await updateEventDoc(
        editingEvent.id,
        {
          title: editEventTitle.trim(),
          description: editEventDesc.trim(),
          date: editEventDate,
          time: editEventTime,
          location: editEventLocation.trim(),
          deadline: editEventDeadline || undefined,
          status: editEventStatus,
        },
        {
          id: currentUser.id,
          fullName: currentUser.fullName,
          role: currentUser.role,
        }
      );
      onNotify('success', 'Tadbir ma’lumotlari muvaffaqiyatli yangilandi!');
      setIsEditEventModalOpen(false);
      setEditingEvent(null);
    } catch (err: any) {
      onNotify('error', err.message || 'Tadbirni yangilashda xatolik.');
    } finally {
      setIsEditEventSubmitting(false);
    }
  };

  const handleOpenEditAnn = (ann: Announcement) => {
    setEditingAnnouncement(ann);
    setEditAnnTitle(ann.title || '');
    setEditAnnContent(ann.content || '');
    setEditAnnAudience((ann.audience as any) || 'Barcha talabalar');
    setIsEditAnnModalOpen(true);
  };

  const handleUpdateAnnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnouncement) return;
    setIsEditAnnSubmitting(true);
    try {
      await updateAnnouncementDoc(
        editingAnnouncement.id,
        {
          title: editAnnTitle.trim(),
          content: editAnnContent.trim(),
          audience: editAnnAudience,
        },
        currentUser.id,
        currentUser.fullName
      );
      onNotify('success', 'E’lon muvaffaqiyatli yangilandi!');
      setIsEditAnnModalOpen(false);
      setEditingAnnouncement(null);
    } catch (err: any) {
      onNotify('error', err.message || 'E’lonni yangilashda xatolik.');
    } finally {
      setIsEditAnnSubmitting(false);
    }
  };

  const handleExportStudents = async () => {
    try {
      setIsExportingStudents(true);
      await exportStudentsToExcel(supervisors);
      onNotify('success', 'Barcha iqtidorli talabalar ma’lumotlari Excel formatda yuklab olindi.');
    } catch (err: any) {
      onNotify('error', err.message || 'Excel eksport qilishda xatolik.');
    } finally {
      setIsExportingStudents(false);
    }
  };

  const handleExportCompetitions = async () => {
    try {
      setIsExportingCompetitions(true);
      await exportCompetitionApplicationsToExcel(events, supervisors);
      onNotify('success', 'Tanlov arizalari Excel formatda muvaffaqiyatli yuklab olindi.');
    } catch (err: any) {
      onNotify('error', err.message || 'Excel eksport qilishda xatolik.');
    } finally {
      setIsExportingCompetitions(false);
    }
  };

  const handleExportDirectionStats = () => {
    try {
      exportDirectionStatisticsToExcel(fullDirectionStats);
      onNotify('success', '18 ta ta’lim yo‘nalishlari bo‘yicha to‘liq hisobot Excel formatda yuklab olindi.');
    } catch (err: any) {
      onNotify('error', err.message || 'Statistikani eksport qilishda xatolik.');
    }
  };

  // Filtered Students (fallback or for live count if needed)
  const filteredStudents = students.filter(st => {
    if (st.isDeleted) return false;
    const q = (studentSearch || '').toLowerCase().trim();
    const matchName =
      !q ||
      (st.fullName || '').toLowerCase().includes(q) ||
      (st.phone || '').includes(q) ||
      (st.group || '').toLowerCase().includes(q) ||
      (st.facultyOrField || '').toLowerCase().includes(q) ||
      canonicalizeDirection(st.facultyOrField).toLowerCase().includes(q);
    const matchCourse = studentCourseFilter === 'all' || (st.course != null && st.course.toString() === studentCourseFilter);
    return matchName && matchCourse;
  });

  // Filtered & Sorted Projects
  const filteredAndSortedProjects = useMemo(() => {
    const q = (projectSearch || '').toLowerCase().trim();
    const result = projects
      .filter(p => !p.isDeleted)
      .filter(p => {
        const isStartup = p.type === 'startap' || p.type === 'startup';
        if (!canViewProjects && !isStartup) return false;
        if (!canViewStartups && isStartup) return false;

        const matchType =
          projectTypeFilter === 'all' ||
          (projectTypeFilter === 'startap' ? isStartup : !isStartup);

        const matchStatus =
          projectStatusFilter === 'all' || p.status === projectStatusFilter;

        const matchSearch =
          !q ||
          (p.title || '').toLowerCase().includes(q) ||
          (p.studentName || '').toLowerCase().includes(q) ||
          (p.supervisorName || '').toLowerCase().includes(q) ||
          (p.field || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q);

        return matchType && matchStatus && matchSearch;
      });

    return result.sort((a, b) => {
      if (projectSort === 'newest') {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tB - tA;
      }
      if (projectSort === 'oldest') {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tA - tB;
      }
      if (projectSort === 'title_asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (projectSort === 'title_desc') {
        return (b.title || '').localeCompare(a.title || '');
      }
      if (projectSort === 'author_asc') {
        return (a.studentName || '').localeCompare(b.studentName || '');
      }
      return 0;
    });
  }, [projects, canViewProjects, canViewStartups, projectTypeFilter, projectStatusFilter, projectSearch, projectSort]);

  const filteredProjects = filteredAndSortedProjects;
  const PROJECTS_PAGE_SIZE = 12;
  const totalProjectPages = Math.max(1, Math.ceil(filteredAndSortedProjects.length / PROJECTS_PAGE_SIZE));
  const paginatedProjects = useMemo(() => {
    const start = (projectCurrentPage - 1) * PROJECTS_PAGE_SIZE;
    return filteredAndSortedProjects.slice(start, start + PROJECTS_PAGE_SIZE);
  }, [filteredAndSortedProjects, projectCurrentPage, PROJECTS_PAGE_SIZE]);

  // Unique categories for achievements
  const achievementCategories = useMemo(() => {
    return Array.from(
      new Set(
        achievements
          .filter(a => !a.isDeleted)
          .map(a => a.category)
          .filter((c): c is string => Boolean(c && c.trim()))
      )
    ).sort();
  }, [achievements]);

  // Filtered & Sorted Achievements
  const filteredAndSortedAchievements = useMemo(() => {
    const q = (achievementSearch || '').toLowerCase().trim();
    const result = achievements
      .filter(a => !a.isDeleted)
      .filter(a => {
        const matchStatus =
          achievementStatusFilter === 'all' || a.status === achievementStatusFilter;

        const matchCat =
          achievementCategoryFilter === 'all' || a.category === achievementCategoryFilter;

        const matchSearch =
          !q ||
          (a.title || '').toLowerCase().includes(q) ||
          (a.studentName || '').toLowerCase().includes(q) ||
          (a.category || '').toLowerCase().includes(q) ||
          (a.description || '').toLowerCase().includes(q);

        return matchStatus && matchCat && matchSearch;
      });

    return result.sort((a, b) => {
      if (achievementSort === 'newest') {
        const dA = a.date || a.createdAt || '';
        const dB = b.date || b.createdAt || '';
        return dB.localeCompare(dA);
      }
      if (achievementSort === 'oldest') {
        const dA = a.date || a.createdAt || '';
        const dB = b.date || b.createdAt || '';
        return dA.localeCompare(dB);
      }
      if (achievementSort === 'title_asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (achievementSort === 'student_asc') {
        return (a.studentName || '').localeCompare(b.studentName || '');
      }
      return 0;
    });
  }, [achievements, achievementStatusFilter, achievementCategoryFilter, achievementSearch, achievementSort]);

  const ACHIEVEMENTS_PAGE_SIZE = 12;
  const totalAchievementPages = Math.max(1, Math.ceil(filteredAndSortedAchievements.length / ACHIEVEMENTS_PAGE_SIZE));
  const paginatedAchievements = useMemo(() => {
    const start = (achievementCurrentPage - 1) * ACHIEVEMENTS_PAGE_SIZE;
    return filteredAndSortedAchievements.slice(start, start + ACHIEVEMENTS_PAGE_SIZE);
  }, [filteredAndSortedAchievements, achievementCurrentPage, ACHIEVEMENTS_PAGE_SIZE]);

  // Filtered & Sorted Certificates
  const filteredAndSortedCertificates = useMemo(() => {
    const q = (certificateSearch || '').toLowerCase().trim();
    const result = certificates
      .filter(c => !c.isDeleted)
      .filter(c => {
        const matchType =
          certificateTypeFilter === 'all' ||
          (certificateTypeFilter === 'diplom' && c.documentType === 'diplom') ||
          (certificateTypeFilter === 'sertifikat' && c.documentType !== 'diplom') ||
          (certificateTypeFilter === 'official' && c.isOfficialGenerated) ||
          (certificateTypeFilter === 'uploaded' && !c.isOfficialGenerated);

        const matchStatus =
          certificateStatusFilter === 'all' ||
          (certificateStatusFilter === 'valid' && !c.isRevoked) ||
          (certificateStatusFilter === 'revoked' && c.isRevoked);

        const matchSearch =
          !q ||
          (c.title || '').toLowerCase().includes(q) ||
          (c.studentName || '').toLowerCase().includes(q) ||
          (c.certificateNumber || '').toLowerCase().includes(q) ||
          (c.eventTitle || '').toLowerCase().includes(q) ||
          (c.nomination || '').toLowerCase().includes(q);

        return matchType && matchStatus && matchSearch;
      });

    return result.sort((a, b) => {
      if (certificateSort === 'newest') {
        const dA = a.issueDate || a.createdAt || '';
        const dB = b.issueDate || b.createdAt || '';
        return dB.localeCompare(dA);
      }
      if (certificateSort === 'oldest') {
        const dA = a.issueDate || a.createdAt || '';
        const dB = b.issueDate || b.createdAt || '';
        return dA.localeCompare(dB);
      }
      if (certificateSort === 'number_asc') {
        return (a.certificateNumber || '').localeCompare(b.certificateNumber || '');
      }
      if (certificateSort === 'student_asc') {
        return (a.studentName || '').localeCompare(b.studentName || '');
      }
      if (certificateSort === 'title_asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });
  }, [certificates, certificateTypeFilter, certificateStatusFilter, certificateSearch, certificateSort]);

  const CERTS_PAGE_SIZE = 12;
  const totalCertPages = Math.max(1, Math.ceil(filteredAndSortedCertificates.length / CERTS_PAGE_SIZE));
  const paginatedCertificates = useMemo(() => {
    const start = (certificateCurrentPage - 1) * CERTS_PAGE_SIZE;
    return filteredAndSortedCertificates.slice(start, start + CERTS_PAGE_SIZE);
  }, [filteredAndSortedCertificates, certificateCurrentPage, CERTS_PAGE_SIZE]);

  // Filtered & Sorted Events
  const filteredAndSortedEvents = useMemo(() => {
    const q = (eventSearch || '').toLowerCase().trim();
    const result = events
      .filter(e => !e.isDeleted)
      .filter(e => {
        const matchStatus =
          eventStatusFilter === 'all' || e.status === eventStatusFilter;

        const matchSearch =
          !q ||
          (e.title || '').toLowerCase().includes(q) ||
          (e.description || '').toLowerCase().includes(q) ||
          (e.location || '').toLowerCase().includes(q);

        return matchStatus && matchSearch;
      });

    return result.sort((a, b) => {
      if (eventSort === 'date_asc') {
        return (a.date || '').localeCompare(b.date || '');
      }
      if (eventSort === 'date_desc') {
        return (b.date || '').localeCompare(a.date || '');
      }
      if (eventSort === 'title_asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (eventSort === 'participants_desc') {
        return (b.participantIds?.length || 0) - (a.participantIds?.length || 0);
      }
      return 0;
    });
  }, [events, eventStatusFilter, eventSearch, eventSort]);

  const EVENTS_PAGE_SIZE = 10;
  const totalEventPages = Math.max(1, Math.ceil(filteredAndSortedEvents.length / EVENTS_PAGE_SIZE));
  const paginatedEvents = useMemo(() => {
    const start = (eventCurrentPage - 1) * EVENTS_PAGE_SIZE;
    return filteredAndSortedEvents.slice(start, start + EVENTS_PAGE_SIZE);
  }, [filteredAndSortedEvents, eventCurrentPage, EVENTS_PAGE_SIZE]);

  // Filtered & Sorted Announcements
  const filteredAndSortedAnnouncements = useMemo(() => {
    const q = (announcementSearch || '').toLowerCase().trim();
    const result = announcements
      .filter(a => !a.isDeleted)
      .filter(a => {
        const matchAudience =
          announcementAudienceFilter === 'all' || a.audience === announcementAudienceFilter;

        const matchSearch =
          !q ||
          (a.title || '').toLowerCase().includes(q) ||
          (a.content || '').toLowerCase().includes(q) ||
          (a.createdByName || '').toLowerCase().includes(q);

        return matchAudience && matchSearch;
      });

    return result.sort((a, b) => {
      if (announcementSort === 'newest') {
        const dA = a.date || a.createdAt || '';
        const dB = b.date || b.createdAt || '';
        return dB.localeCompare(dA);
      }
      if (announcementSort === 'oldest') {
        const dA = a.date || a.createdAt || '';
        const dB = b.date || b.createdAt || '';
        return dA.localeCompare(dB);
      }
      if (announcementSort === 'title_asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });
  }, [announcements, announcementAudienceFilter, announcementSearch, announcementSort]);

  const ANNOUNCEMENTS_PAGE_SIZE = 10;
  const totalAnnPages = Math.max(1, Math.ceil(filteredAndSortedAnnouncements.length / ANNOUNCEMENTS_PAGE_SIZE));
  const paginatedAnnouncements = useMemo(() => {
    const start = (announcementCurrentPage - 1) * ANNOUNCEMENTS_PAGE_SIZE;
    return filteredAndSortedAnnouncements.slice(start, start + ANNOUNCEMENTS_PAGE_SIZE);
  }, [filteredAndSortedAnnouncements, announcementCurrentPage, ANNOUNCEMENTS_PAGE_SIZE]);

  // Action: Create Supervisor Profile + Account
  const handleCreateSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSupSubmitting(true);
    try {
      await createSupervisorProfile(
        {
          fullName: supFullName.trim(),
          phone: supPhone.trim(),
          position: supPosition.trim(),
          academicDegree: supDegree.trim(),
          department: supDept.trim(),
          email: supEmail.trim(),
        },
        supPassword.trim(),
        currentUser.id,
        currentUser.fullName
      );
      onNotify('success', "Yangi ilmiy rahbar va uning tizim hisobi muvaffaqiyatli yaratildi!");
      setIsSupervisorModalOpen(false);
      setSupFullName('');
      setSupPhone('+998 ');
      setSupEmail('');
    } catch (err: any) {
      onNotify('error', err.message || "Ilmiy rahbar qo'shishda xatolik.");
    } finally {
      setIsSupSubmitting(false);
    }
  };

  // Action: Create Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEventSubmitting(true);
    try {
      await createEventDoc(
        {
          title: eventTitle.trim(),
          description: eventDesc.trim(),
          date: eventDate,
          time: eventTime.trim(),
          location: eventLocation.trim(),
          deadline: eventDeadline.trim(),
          status: 'Rejalashtirilgan',
          createdBy: currentUser.fullName,
        },
        currentUser.id,
        currentUser.fullName
      );
      onNotify('success', "Yangi tadbir muvaffaqiyatli e'lon qilindi!");
      setIsEventModalOpen(false);
      setEventTitle('');
      setEventDesc('');
    } catch (err: any) {
      onNotify('error', err.message || "Tadbir yaratishda xatolik.");
    } finally {
      setIsEventSubmitting(false);
    }
  };

  // Action: Create Announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnnSubmitting(true);
    try {
      await createAnnouncementDoc(
        {
          title: annTitle.trim(),
          content: annContent.trim(),
          audience: annAudience,
          date: new Date().toLocaleDateString(),
          createdBy: currentUser.fullName,
          createdByName: currentUser.fullName,
        },
        currentUser.id,
        currentUser.fullName
      );
      onNotify('success', "E'lon barcha foydalanuvchilarga muvaffaqiyatli yetkazildi!");
      setIsAnnModalOpen(false);
      setAnnTitle('');
      setAnnContent('');
    } catch (err: any) {
      onNotify('error', err.message || "E'lon chiqarishda xatolik.");
    } finally {
      setIsAnnSubmitting(false);
    }
  };

  // Action: Issue Official Certificate / Diploma with QR Code & PDF
  const handleIssueCertificate = async (certData: {
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
    additionalNote?: string;
    confirmationText?: string;
    decisionNumber?: string;
    awardLevel?: string;
    signatoryDegree?: string;
    verificationUrl?: string;
    footerText?: string;
    additionalSignatureText?: string;
    signatoryName: string;
    signatoryRole: string;
    studentDirection?: string;
  }) => {
    setIsCertIssuing(true);
    try {
      const newCert = await createOfficialCertificate(
        certData,
        currentUser.id,
        currentUser.fullName
      );

      const typeLabel = certData.documentType === 'diplom' ? 'Diplom' : 'Sertifikat';
      onNotify(
        'success',
        `${typeLabel} ${newCert.certificateNumber} raqami bilan muvaffaqiyatli ro'yxatga olindi va PDF tayyorlandi!`
      );
      setIsCertIssueModalOpen(false);

      // Trigger instant official PDF download with the complete new dynamic certificate design
      downloadCertificatePdf(newCert);
    } catch (err: any) {
      onNotify('error', err.message || "Sertifikat/diplom berishda xatolik.");
    } finally {
      setIsCertIssuing(false);
    }
  };

  // Action: Submit review (Approve / Reject)
  const handleSubmitReview = async () => {
    if (!reviewModalData) return;

    // Requirement: Validate Admin/Super Admin identity before attempting updateDoc()
    if (!currentUser || !currentUser.id) {
      onNotify(
        'error',
        'Admin yoki Super Admin identifikatori (UID) aniqlanmadi. Noto‘g‘ri ma’lumot yozilmasligi uchun tasdiqlash to‘xtatildi. Iltimos, qayta kiring.'
      );
      return;
    }

    setIsReviewSubmitting(true);
    try {
      const actor = {
        id: currentUser.id,
        fullName: currentUser.fullName || 'Admin',
        role: currentUser.role,
      };

      if (reviewModalData.type === 'project') {
        await updateProjectOrStartupStatus(
          reviewModalData.id,
          reviewModalData.status,
          reviewNotes.trim(),
          actor.id,
          actor.fullName
        );
      } else if (reviewModalData.type === 'achievement') {
        await updateAchievementStatus(
          reviewModalData.id,
          reviewModalData.status,
          reviewNotes.trim(),
          actor
        );
      } else if (reviewModalData.type === 'cert') {
        await updateCertificateDocStatus(
          reviewModalData.id,
          reviewModalData.status,
          actor.id,
          actor.fullName
        );
      }

      onNotify('success', `Status «${reviewModalData.status}» holatiga o‘zgartirildi.`);
      setReviewModalData(null);
      setReviewNotes('');
    } catch (err: any) {
      onNotify('error', err.message || "Statusni o'zgartirishda xatolik.");
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  // Super Admin: Create Admin
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdminSubmitting(true);
    try {
      await registerAdminUser(
        {
          fullName: adminFullName.trim(),
          phone: adminPhone.trim(),
          password: adminPassword.trim(),
          role: adminRole,
        },
        currentUser.id,
        currentUser.fullName
      );
      onNotify('success', `Yangi ${adminRole === 'superAdmin' ? 'Super Admin' : 'Admin'} muvaffaqiyatli ro'yxatga olindi!`);
      setIsAdminModalOpen(false);
      setAdminFullName('');
      setAdminPhone('+998 ');
      setAdminPassword('');
    } catch (err: any) {
      onNotify('error', err.message || "Admin qo'shishda xatolik.");
    } finally {
      setIsAdminSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-900 text-white flex items-center justify-center text-xl font-bold shadow-xs">
            {isSuperAdmin ? <ShieldCheck className="w-8 h-8" /> : <Shield className="w-8 h-8" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{currentUser.fullName}</h1>
              <span
                className={`px-2.5 py-0.5 text-xs font-semibold rounded-lg ${
                  isSuperAdmin
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {isSuperAdmin ? 'Boshqaruvchi Super Admin' : 'Universitet Administratori'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Universitet Iqtidorli Talabalar Platformasi Boshqaruv Markazi
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCertIssueModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
          >
            <Award className="w-4 h-4" />
            <span>Sertifikat berish</span>
          </button>
          <button
            onClick={() => setIsEventModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors border border-slate-200"
          >
            <Calendar className="w-4 h-4 text-blue-900" />
            <span>Yangi tadbir</span>
          </button>
          <button
            onClick={() => setIsAnnModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors border border-slate-200"
          >
            <Bell className="w-4 h-4 text-blue-900" />
            <span>E'lon berish</span>
          </button>
        </div>
      </div>

      {/* Mobile Quick Action & Drawer Trigger (lg:hidden) */}
      <div className="lg:hidden space-y-3">
        {/* Mobile current section bar */}
        <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CurrentIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Hozirgi bo‘lim:
              </span>
              <span className="text-sm font-bold text-slate-900 truncate block">
                {currentTabInfo.label} {currentTabInfo.count !== null && `(${currentTabInfo.count})`}
              </span>
            </div>
          </div>

          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="min-h-[44px] px-3.5 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all border border-slate-200 shrink-0"
            aria-label="Bo'limlar menyusi"
          >
            {mobileSidebarOpen ? <X className="w-4 h-4 text-slate-700" /> : <Menu className="w-4 h-4 text-slate-700" />}
            <span>{mobileSidebarOpen ? 'Yopish' : 'Bo‘limlar'}</span>
          </button>
        </div>

        {/* Mobile slide-in / dropdown drawer */}
        {mobileSidebarOpen && (
          <div className="bg-white rounded-2xl border border-slate-200 p-2.5 shadow-lg space-y-1 animate-in fade-in duration-200">
            <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
              Barcha bo‘limlar
            </div>
            {adminNavItems.map(item => {
              const TabIcon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-900 text-white shadow-xs font-bold'
                      : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <TabIcon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== null && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Mobile Horizontal scrollable pill bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
          {adminNavItems.map(item => {
            const TabIcon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`min-h-[44px] flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.count !== null && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* DESKTOP SIDEBAR + CONTENT LAYOUT */}
      <div className="lg:flex lg:gap-6 lg:items-start">
        {/* DESKTOP SIDEBAR (hidden lg:block) */}
        <aside className="hidden lg:block lg:w-64 shrink-0 bg-white rounded-3xl border border-slate-200 p-3.5 shadow-xs sticky top-20">
          <div className="px-3 py-2.5 mb-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Bo‘limlar</span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-900 rounded-md">
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </span>
          </div>

          <nav className="space-y-1">
            {adminNavItems.map(item => {
              const TabIcon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full min-h-[42px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-900 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <TabIcon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== null && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* RIGHT MAIN CONTENT AREA */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* NO PERMISSIONS FALLBACK */}
          {adminNavItems.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-lg mx-auto my-12 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Ruxsatlar cheklangan</h3>
              <p className="text-xs text-slate-500">
                Sizning hisobingizga boshqaruv paneli modullari uchun ruxsat berilmagan. Iltimos, Super Admin bilan bog‘laning.
              </p>
            </div>
          )}

      {/* TAB 1: REAL STATS */}
      {activeTab === 'stats' && canViewStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Talabalar</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{students.length}</p>
              <span className="text-[10px] text-emerald-600 font-semibold">Ro'yxatdan o'tgan</span>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Ilmiy rahbarlar</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{supervisors.length}</p>
              <span className="text-[10px] text-slate-500">Kafedralardan</span>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Loyihalar</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{projects.filter(p => p.type === 'loyiha').length}</p>
              <span className="text-[10px] text-blue-600 font-semibold">Ilmiy ishlar</span>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Startaplar</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{projects.filter(p => p.type === 'startap').length}</p>
              <span className="text-[10px] text-indigo-600 font-semibold">Tijoriy g‘oyalar</span>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Yutuqlar</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{achievements.length}</p>
              <span className="text-[10px] text-amber-600 font-semibold">Olimpiada va tanlov</span>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Sertifikatlar</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{certificates.length}</p>
              <span className="text-[10px] text-emerald-600 font-semibold">QR-kodli berilgan</span>
            </div>
          </div>

          {/* Breakdown panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status overview */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-4">Ariza va loyihalar holati</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                  <span className="text-xs font-semibold text-amber-900">Kutilayotgan loyihalar (Ko'rib chiqish kerak)</span>
                  <strong className="text-sm font-bold text-amber-900">
                    {projects.filter(p => p.status === 'Kutilmoqda').length} ta
                  </strong>
                </div>
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-xs font-semibold text-emerald-900">Tasdiqlangan ilmiy loyihalar</span>
                  <strong className="text-sm font-bold text-emerald-900">
                    {projects.filter(p => p.status === 'Tasdiqlangan').length} ta
                  </strong>
                </div>
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                  <span className="text-xs font-semibold text-amber-900">Kutilayotgan yutuqlar</span>
                  <strong className="text-sm font-bold text-amber-900">
                    {achievements.filter(a => a.status === 'Kutilmoqda').length} ta
                  </strong>
                </div>
              </div>
            </div>

            {/* Course distribution */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-4">Kurslar bo‘yicha taqsimot</h3>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(courseNum => {
                  const count = students.filter(s => s.course === courseNum).length;
                  const label = courseNum === 5 ? 'Magistratura' : `${courseNum}-kurs`;
                  const percentage = students.length > 0 ? (count / students.length) * 100 : 0;
                  return (
                    <div key={courseNum} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{label}</span>
                        <span>{count} nafar ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-900 h-full rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECOND ROW: FACULTIES & EVENTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Faculty / Yo‘nalishlar */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-900" />
                  <h3 className="text-base font-bold text-slate-900">18 ta ta’lim yo‘nalishi taqsimoti</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportDirectionStats}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                    title="18 ta yo‘nalish bo‘yicha to‘liq Excel hisobot yuklab olish"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAllDirectionsStats(prev => !prev)}
                    className="text-xs text-blue-900 hover:underline font-medium"
                  >
                    {showAllDirectionsStats ? 'Asosiy 6 ta' : 'Barcha 18 ta'}
                  </button>
                </div>
              </div>
              {facultyDistribution.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">Ma’lumot topilmadi</p>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {(showAllDirectionsStats ? fullDirectionStats.map(f => ({
                    name: f.direction,
                    count: f.totalStudents,
                    percentage: students.length > 0 ? (f.totalStudents / students.length) * 100 : 0
                  })) : facultyDistribution).map((fac, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-700">
                        <span className="truncate max-w-[240px] font-semibold" title={fac.name}>{fac.name}</span>
                        <span className="font-mono text-slate-500">{fac.count} talaba ({fac.percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(fac.count > 0 ? 5 : 0, fac.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Events & Competitions Overview */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-900" />
                  <h3 className="text-base font-bold text-slate-900">Tadbirlar va tanlovlar monitoringi</h3>
                </div>
                <span className="text-xs text-slate-500 font-semibold">{eventStats.totalEvents} ta tadbir</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100">
                  <span className="text-xs text-blue-700 font-medium block">Faol / Rejalashtirilgan</span>
                  <span className="text-xl font-bold text-blue-950 mt-1 block">{eventStats.activeEvents} ta</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <span className="text-xs text-emerald-700 font-medium block">Jami ishtirokchilar</span>
                  <span className="text-xl font-bold text-emerald-950 mt-1 block">{eventStats.totalParticipants} nafar</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-100">
                  <span className="text-xs text-purple-700 font-medium block">QR Sertifikatlar</span>
                  <span className="text-xl font-bold text-purple-950 mt-1 block">{certificates.length} ta</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-600 font-medium block">Faol e’lonlar</span>
                  <span className="text-xl font-bold text-slate-900 mt-1 block">{announcements.length} ta</span>
                </div>
              </div>
            </div>
          </div>

          {/* THIRD ROW: TOP ACTIVE STUDENTS */}
          {topActiveStudents.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">Eng faol iqtidorli talabalar</h3>
                </div>
                <span className="text-xs text-slate-400">Tasdiqlangan ishlar soni bo‘yicha</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Talaba F.I.SH</th>
                      <th className="py-2.5 px-3">Kurs & Guruh</th>
                      <th className="py-2.5 px-3">Yo‘nalish</th>
                      <th className="py-2.5 px-3 text-center">Loyihalar</th>
                      <th className="py-2.5 px-3 text-center">Yutuqlar</th>
                      <th className="py-2.5 px-3 text-center">Sertifikatlar</th>
                      <th className="py-2.5 px-3 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topActiveStudents.map((item, idx) => (
                      <tr key={item.student.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() => onOpenStudentProfile?.(item.student.id)}
                            className="font-bold text-slate-900 hover:text-blue-900 text-left transition-colors cursor-pointer"
                          >
                            {item.student.fullName}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {item.student.course ? `${item.student.course}-kurs` : '-'}, {item.student.group || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 truncate max-w-[180px]" title={canonicalizeDirection(item.student.facultyOrField) || item.student.facultyOrField}>
                          {canonicalizeDirection(item.student.facultyOrField) || item.student.facultyOrField || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-md font-bold bg-blue-50 text-blue-900">
                            {item.approvedProj}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-md font-bold bg-amber-50 text-amber-900">
                            {item.approvedAch}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-md font-bold bg-emerald-50 text-emerald-900">
                            {item.certsCount}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => onOpenStudentProfile?.(item.student.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <span>Profil</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STUDENTS */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Iqtidorli talabalar bazasi</h2>
                <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-900 rounded-md">
                  Jami: {studentsTotalCount || students.length} nafar
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Talabalar ma’lumotlarini ko‘rish, tahrirlash, ilmiy rahbar biriktirish va Excel hisobotlarini yuklab olish.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(hasPermission(currentUser, 'students', 'edit') || currentUser.role === 'superAdmin') && (
                <button
                  type="button"
                  onClick={() => setIsTopStudentsModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer active:scale-[0.99]"
                  title="Bosh sahifada ko‘rsatiladigan 3 ta eng faol talabani belgilash"
                >
                  <Trophy className="w-4 h-4 text-slate-950" />
                  <span>Eng faol 3 ta talaba</span>
                </button>
              )}
              {(hasPermission(currentUser, 'students', 'export') || hasPermission(currentUser, 'excel', 'export')) && (
                <button
                  onClick={handleExportStudents}
                  disabled={isExportingStudents}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                  title="Barcha talabalar ro‘yxatini Excel formatida yuklash"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{isExportingStudents ? 'Yuklanmoqda...' : 'Talabalar Excel'}</span>
                </button>
              )}
              {(hasPermission(currentUser, 'competitions', 'export') || hasPermission(currentUser, 'students', 'export') || hasPermission(currentUser, 'excel', 'export')) && (
                <button
                  onClick={handleExportCompetitions}
                  disabled={isExportingCompetitions}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                  title="Barcha tanlov arizalarini Excel formatida yuklash"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExportingCompetitions ? 'Yuklanmoqda...' : 'Tanlov arizalari Excel'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="F.I.Sh, guruh, telefon yoki yo‘nalish bo‘yicha qidirish..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={studentCourseFilter}
                onChange={e => setStudentCourseFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                <option value="all">Barcha kurslar</option>
                <option value="1">1-kurs</option>
                <option value="2">2-kurs</option>
                <option value="3">3-kurs</option>
                <option value="4">4-kurs</option>
                <option value="5">Magistratura</option>
              </select>

              <div className="w-48 sm:w-56">
                <DirectionSelect
                  id="admin-students-faculty-filter"
                  value={studentFacultyFilter}
                  onChange={setStudentFacultyFilter}
                  showAllOption
                  allOptionLabel="Barcha yo‘nalishlar"
                  placeholder="Yo‘nalish bo‘yicha..."
                />
              </div>

              <select
                value={studentSupervisorFilter}
                onChange={e => setStudentSupervisorFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 max-w-[180px] truncate"
              >
                <option value="all">Barcha rahbarlar</option>
                <option value="unassigned">Rahbar biriktirilmagan</option>
                {supervisors.map(sup => (
                  <option key={sup.id} value={sup.id}>{sup.fullName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Loading state or Empty state or Data view */}
          {isStudentsLoading && paginatedStudents.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
              <div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Talabalar ro‘yxati yuklanmoqda...</p>
            </div>
          ) : (paginatedStudents.length === 0 && !isStudentsLoading) ? (
            <EmptyState
              title="Talaba topilmadi"
              description="Tanlangan qidiruv yoki filtr mezonlari bo‘yicha hech qanday talaba ma’lumoti topilmadi."
            />
          ) : (
            <>
              {/* MOBILE CARD LIST (md:hidden) */}
              <div className="md:hidden space-y-3 relative">
                {isStudentsLoading && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center z-10 rounded-2xl">
                    <div className="w-6 h-6 border-2 border-blue-900 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {paginatedStudents.map(st => {
                  const sup = supervisors.find(s => s.id === st.supervisorId);
                  return (
                    <div key={st.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-blue-900 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0 overflow-hidden">
                            {st.avatarUrl || st.photoURL ? (
                              <img src={st.avatarUrl || st.photoURL} alt={st.fullName} className="w-full h-full object-cover" />
                            ) : (
                              (st.fullName || 'T').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="text-sm font-bold text-slate-900 break-words">{st.fullName}</h3>
                              {st.isTopStudent && (
                                <span
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold border ${
                                    st.topStudentRank === 1
                                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                                      : st.topStudentRank === 2
                                      ? 'bg-slate-200 text-slate-900 border-slate-300'
                                      : 'bg-amber-900/10 text-amber-950 border-amber-800/30'
                                  }`}
                                  title={`Bosh sahifada #${st.topStudentRank} o‘rinda: ${st.topStudentReason || ''}`}
                                >
                                  {st.topStudentRank === 1 ? '🥇 1-o‘rin' : st.topStudentRank === 2 ? '🥈 2-o‘rin' : '🥉 3-o‘rin'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-mono text-slate-500 mt-0.5">{st.phone}</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-900 rounded-lg shrink-0">
                          {st.course}-kurs
                        </span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 text-slate-600">
                        <div className="break-words">Yo‘nalish: <strong>{canonicalizeDirection(st.facultyOrField) || st.facultyOrField || "Ko'rsatilmagan"}</strong></div>
                        <div>Guruh: <strong className="font-mono">{st.group}</strong></div>
                        {st.customSupervisorName && !st.supervisorId && (
                          <div className="text-amber-800 font-medium">
                            Kiritilgan rahbar: {st.customSupervisorName}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                          Ilmiy rahbar biriktirish:
                        </label>
                        <select
                          disabled={!hasPermission(currentUser, 'students', 'edit')}
                          value={st.supervisorId || ''}
                          onChange={async e => {
                            const newSupId = e.target.value;
                            try {
                              await assignSupervisorToStudent(
                                st.id,
                                newSupId,
                                currentUser.id,
                                currentUser.fullName
                              );
                              onNotify('success', `${st.fullName} uchun ilmiy rahbar yangilandi.`);
                            } catch (err: any) {
                              onNotify('error', err.message || 'Xatolik yuz berdi.');
                            }
                          }}
                          className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:opacity-60"
                        >
                          <option value="">Biriktirilmagan</option>
                          {supervisors.map(s => (
                            <option key={s.id} value={s.id}>{s.fullName}</option>
                          ))}
                        </select>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            id={`view-student-profile-mobile-${st.id}`}
                            onClick={() => onOpenStudentProfile?.(st.id)}
                            className="min-h-[40px] px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <User className="w-4 h-4" />
                            <span>Profil</span>
                          </button>

                          {hasPermission(currentUser, 'students', 'edit') && (
                            <button
                              type="button"
                              id={`edit-student-mobile-${st.id}`}
                              onClick={() => {
                                setEditingStudent(st);
                                setIsEditStudentModalOpen(true);
                              }}
                              className="min-h-[40px] px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Tahrirlash</span>
                            </button>
                          )}

                          {hasPermission(currentUser, 'students', 'edit') && (
                            <button
                              type="button"
                              onClick={() => {
                                setResetPassUser({
                                  id: st.id,
                                  fullName: st.fullName,
                                  phone: st.phone,
                                  role: 'student',
                                });
                                setIsResetPassModalOpen(true);
                              }}
                              className="min-h-[40px] px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Parolni yangilash"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Parol</span>
                            </button>
                          )}
                        </div>

                        {hasPermission(currentUser, 'students', 'delete') && (
                          <button
                            onClick={() => {
                              onConfirmModal({
                                title: "Talaba anketasini o'chirish",
                                message: `${st.fullName} anketasini o'chirishni tasdiqlaysizmi?`,
                                confirmText: "Ha, o'chirish",
                                isDestructive: true,
                                onConfirm: async () => {
                                  await deleteStudentProfile(st.id, currentUser, currentUser.fullName, st.userId);
                                  onNotify('success', "Talaba anketasi o'chirildi.");
                                  // Refresh current page
                                  fetchStudentsForPage(currentPage, pageCursors[currentPage - 1] || null);
                                },
                              });
                            }}
                            className="min-h-[40px] px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="O‘chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP TABLE VIEW (hidden md:block) */}
              <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs relative">
                {isStudentsLoading && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center z-10">
                    <div className="w-6 h-6 border-2 border-blue-900 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Talaba F.I.Sh.</th>
                        <th className="px-4 py-3">Telefon</th>
                        <th className="px-4 py-3">Yo‘nalish & Guruh</th>
                        <th className="px-4 py-3">Kurs</th>
                        <th className="px-4 py-3">Ilmiy rahbar</th>
                        <th className="px-4 py-3">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedStudents.map(st => {
                        const sup = supervisors.find(s => s.id === st.supervisorId);
                        return (
                          <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-slate-900">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-blue-900 text-white font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden shadow-xs">
                                  {st.avatarUrl || st.photoURL ? (
                                    <img src={st.avatarUrl || st.photoURL} alt={st.fullName} className="w-full h-full object-cover" />
                                  ) : (
                                    (st.fullName || 'T').charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="truncate max-w-[180px]">{st.fullName}</span>
                                    {st.isTopStudent && (
                                      <span
                                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold border ${
                                          st.topStudentRank === 1
                                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                                            : st.topStudentRank === 2
                                            ? 'bg-slate-200 text-slate-900 border-slate-300'
                                            : 'bg-amber-900/10 text-amber-950 border-amber-800/30'
                                        }`}
                                        title={`Bosh sahifada #${st.topStudentRank} o‘rinda: ${st.topStudentReason || ''}`}
                                      >
                                        {st.topStudentRank === 1 ? '🥇 1-o‘rin' : st.topStudentRank === 2 ? '🥈 2-o‘rin' : '🥉 3-o‘rin'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 font-mono text-slate-600">{st.phone}</td>
                            <td className="px-4 py-3.5 text-slate-700">
                              <div className="break-words max-w-[220px]">{canonicalizeDirection(st.facultyOrField) || st.facultyOrField || "—"}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{st.group}</div>
                            </td>
                            <td className="px-4 py-3.5 font-semibold text-slate-800">{st.course}-kurs</td>
                            <td className="px-4 py-3.5">
                              <select
                                value={st.supervisorId || ''}
                                onChange={async e => {
                                  const newSupId = e.target.value;
                                  try {
                                    await assignSupervisorToStudent(
                                      st.id,
                                      newSupId,
                                      currentUser.id,
                                      currentUser.fullName
                                    );
                                    onNotify('success', `${st.fullName} uchun ilmiy rahbar yangilandi.`);
                                  } catch (err: any) {
                                    onNotify('error', err.message || 'Xatolik yuz berdi.');
                                  }
                                }}
                                className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900 max-w-[170px] truncate disabled:opacity-60"
                                disabled={!hasPermission(currentUser, 'students', 'edit')}
                              >
                                <option value="">Biriktirilmagan</option>
                                {supervisors.map(s => (
                                  <option key={s.id} value={s.id}>{s.fullName}</option>
                                ))}
                              </select>
                              {st.customSupervisorName && !st.supervisorId && (
                                <span className="block text-[10px] text-amber-700 mt-0.5">
                                  Kiritilgan: {st.customSupervisorName}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  id={`view-student-profile-desktop-${st.id}`}
                                  onClick={() => onOpenStudentProfile?.(st.id)}
                                  className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="Talaba to‘liq profilini ko‘rish"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                                {hasPermission(currentUser, 'students', 'edit') && (
                                  <button
                                    type="button"
                                    id={`edit-student-desktop-${st.id}`}
                                    onClick={() => {
                                      setEditingStudent(st);
                                      setIsEditStudentModalOpen(true);
                                    }}
                                    className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                    title="Talaba profilini tahrirlash"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                )}
                                {hasPermission(currentUser, 'students', 'edit') && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setResetPassUser({
                                        id: st.id,
                                        fullName: st.fullName,
                                        phone: st.phone,
                                        role: 'student',
                                      });
                                      setIsResetPassModalOpen(true);
                                    }}
                                    className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                    title="Parolni yangilash"
                                  >
                                    <KeyRound className="w-4 h-4" />
                                  </button>
                                )}
                                {hasPermission(currentUser, 'students', 'delete') && (
                                  <button
                                    onClick={() => {
                                      onConfirmModal({
                                        title: "Talaba anketasini o'chirish",
                                        message: `${st.fullName} anketasini o'chirishni tasdiqlaysizmi?`,
                                        confirmText: "Ha, o'chirish",
                                        isDestructive: true,
                                        onConfirm: async () => {
                                          await deleteStudentProfile(st.id, currentUser, currentUser.fullName, st.userId);
                                          onNotify('success', "Talaba anketasi o'chirildi.");
                                          // Refresh current page
                                          fetchStudentsForPage(currentPage, pageCursors[currentPage - 1] || null);
                                        },
                                      });
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="O‘chirish"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-white rounded-2xl border border-slate-200 text-xs shadow-xs">
                <div className="text-slate-600 font-medium">
                  Ko‘rsatilmoqda: <strong>{studentsTotalCount > 0 ? (currentPage - 1) * 20 + 1 : 0}–{Math.min(currentPage * 20, studentsTotalCount)}</strong> (Jami: <strong>{studentsTotalCount}</strong> ta talaba)
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage <= 1 || isStudentsLoading}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors"
                  >
                    <span>Birinchi</span>
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1 || isStudentsLoading}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Oldingi</span>
                  </button>

                  <span className="px-3 py-1.5 bg-blue-900 text-white font-bold rounded-xl shadow-2xs">
                    {currentPage}
                  </span>

                  <button
                    onClick={() => {
                      if (hasNextPage) {
                        setCurrentPage(p => p + 1);
                      }
                    }}
                    disabled={!hasNextPage || isStudentsLoading}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors"
                  >
                    <span>Keyingi</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: SUPERVISORS */}
      {activeTab === 'supervisors' && (
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Ilmiy rahbarlar bazasi</h2>
                <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-900 rounded-md">
                  Jami: {supervisors.filter(s => !s.isDeleted).length} nafar
                </span>
                {filteredSupervisors.length !== supervisors.filter(s => !s.isDeleted).length && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-md">
                    Filtr bo‘yicha: {filteredSupervisors.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kafedralar bo‘yicha ilmiy rahbarlar, ularning unvonlari, biriktirilgan talabalar va hisobotlar boshqaruvi.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(hasPermission(currentUser, 'supervisors', 'export') || hasPermission(currentUser, 'excel', 'export')) && (
                <button
                  type="button"
                  onClick={() => exportSupervisorsToExcel(supervisors)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                  title="Ilmiy rahbarlar ro‘yxatini Excel (.xlsx) formatida yuklab olish"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Ilmiy rahbarlar Excel</span>
                </button>
              )}
              {hasPermission(currentUser, 'supervisors', 'create') && (
                <button
                  type="button"
                  onClick={() => setIsSupervisorModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yangi ilmiy rahbar qo‘shish</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="F.I.Sh, kafedra, lavozim, unvon yoki telefon bo‘yicha qidirish..."
                value={supervisorSearch}
                onChange={e => {
                  setSupervisorSearch(e.target.value);
                  setSupervisorCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={supervisorDepartmentFilter}
                onChange={e => {
                  setSupervisorDepartmentFilter(e.target.value);
                  setSupervisorCurrentPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 max-w-[200px] truncate"
              >
                <option value="all">Barcha kafedralar</option>
                {supervisorDepartments.map(dep => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>

              <select
                value={supervisorDegreeFilter}
                onChange={e => {
                  setSupervisorDegreeFilter(e.target.value);
                  setSupervisorCurrentPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 max-w-[180px] truncate"
              >
                <option value="all">Barcha ilmiy darajalar</option>
                {supervisorDegrees.map(deg => (
                  <option key={deg} value={deg}>{deg}</option>
                ))}
              </select>

              <select
                value={supervisorStudentsFilter}
                onChange={e => {
                  setSupervisorStudentsFilter(e.target.value as any);
                  setSupervisorCurrentPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                <option value="all">Barcha rahbarlar</option>
                <option value="has_students">Talabasi biriktirilgan</option>
                <option value="no_students">Talaba biriktirilmagan</option>
              </select>
            </div>
          </div>

          {/* List or Empty State */}
          {filteredSupervisors.length === 0 ? (
            <EmptyState
              title="Ilmiy rahbar topilmadi"
              description="Tanlangan qidiruv yoki filtr mezonlari bo‘yicha hech qanday ilmiy rahbar topilmadi."
              action={
                supervisors.filter(s => !s.isDeleted).length === 0 && hasPermission(currentUser, 'supervisors', 'create')
                  ? {
                      label: "Ilmiy rahbar qo'shish",
                      onClick: () => setIsSupervisorModalOpen(true),
                    }
                  : undefined
              }
            />
          ) : (
            <>
              {/* MOBILE CARD LIST (md:hidden) */}
              <div className="md:hidden space-y-3">
                {paginatedSupervisors.map(sup => {
                  const assignedStudents = students.filter(s => s.supervisorId === sup.id && !s.isDeleted);
                  return (
                    <div key={sup.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-purple-900 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0 overflow-hidden">
                            {sup.avatarUrl || sup.photoURL ? (
                              <img src={sup.avatarUrl || sup.photoURL} alt={sup.fullName} className="w-full h-full object-cover" />
                            ) : (
                              (sup.fullName || 'R').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-slate-900 break-words">{sup.fullName}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">{sup.position} • {sup.academicDegree}</p>
                            <p className="text-xs font-mono text-slate-500 mt-0.5">{sup.phone}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSupervisorForStudents(sup);
                            setIsSupervisorStudentsModalOpen(true);
                          }}
                          className="px-2 py-0.5 text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-lg border border-purple-200 shrink-0 cursor-pointer transition-colors"
                          title="Biriktirilgan talabalar ro‘yxatini ko‘rish"
                        >
                          {assignedStudents.length} ta talaba
                        </button>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 text-slate-600">
                        <div>Kafedra: <strong>{sup.department}</strong></div>
                        <div>Lavozim: <strong>{sup.position}</strong></div>
                        <div>Ilmiy daraja / unvon: <strong>{sup.academicDegree}</strong></div>
                        {sup.email && <div className="truncate">Email: {sup.email}</div>}
                      </div>

                      {assignedStudents.length > 0 && (
                        <div className="pt-1">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                            <span>Biriktirilgan talabalar ({assignedStudents.length}):</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSupervisorForStudents(sup);
                                setIsSupervisorStudentsModalOpen(true);
                              }}
                              className="text-blue-900 hover:underline normal-case font-bold cursor-pointer"
                            >
                              Barchasini ko‘rish
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {assignedStudents.slice(0, 3).map(st => (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => onOpenStudentProfile?.(st.id)}
                                className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-900 text-[11px] font-medium rounded-md truncate max-w-[150px] transition-colors cursor-pointer"
                                title={`${st.fullName} (${st.course}-kurs)`}
                              >
                                {st.fullName}
                              </button>
                            ))}
                            {assignedStudents.length > 3 && (
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-md">
                                +{assignedStudents.length - 3} ta
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSupervisorForStudents(sup);
                              setIsSupervisorStudentsModalOpen(true);
                            }}
                            className="min-h-[40px] px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Biriktirilgan talabalarni ko‘rish"
                          >
                            <Users className="w-4 h-4" />
                            <span>Talabalar</span>
                          </button>

                          {hasPermission(currentUser, 'supervisors', 'edit') && (
                            <button
                              type="button"
                              id={`edit-supervisor-mobile-${sup.id}`}
                              onClick={() => {
                                setEditingSupervisor(sup);
                                setIsEditSupervisorModalOpen(true);
                              }}
                              className="min-h-[40px] px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Tahrirlash</span>
                            </button>
                          )}

                          {hasPermission(currentUser, 'supervisors', 'edit') && (
                            <button
                              type="button"
                              onClick={() => {
                                setResetPassUser({
                                  id: sup.id,
                                  fullName: sup.fullName,
                                  phone: sup.phone,
                                  role: 'supervisor',
                                });
                                setIsResetPassModalOpen(true);
                              }}
                              className="min-h-[40px] px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Parolni yangilash"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Parol</span>
                            </button>
                          )}
                        </div>

                        {hasPermission(currentUser, 'supervisors', 'delete') && (
                          <button
                            type="button"
                            onClick={() => {
                              onConfirmModal({
                                title: "Ilmiy rahbarni o'chirish",
                                message: `${sup.fullName} ni o'chirishni tasdiqlaysizmi? Hujjat Chiqindilar qutisiga o'tkaziladi.`,
                                confirmText: "O‘chirish (Chiqindiga)",
                                isDestructive: true,
                                onConfirm: async () => {
                                  await deleteSupervisorProfile(sup.id, currentUser, currentUser.fullName);
                                  onNotify('success', "Ilmiy rahbar chiqindilar qutisiga o'tkazildi.");
                                },
                              });
                            }}
                            className="min-h-[40px] px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="O‘chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP TABLE VIEW (hidden md:block) */}
              <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs relative">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Ilmiy rahbar F.I.Sh.</th>
                        <th className="px-4 py-3">Telefon & Email</th>
                        <th className="px-4 py-3">Kafedra</th>
                        <th className="px-4 py-3">Lavozim & Ilmiy daraja</th>
                        <th className="px-4 py-3">Biriktirilgan talabalar</th>
                        <th className="px-4 py-3">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedSupervisors.map(sup => {
                        const assignedStudents = students.filter(s => s.supervisorId === sup.id && !s.isDeleted);
                        return (
                          <tr key={sup.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-slate-900">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-purple-900 text-white font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden shadow-xs">
                                  {sup.avatarUrl || sup.photoURL ? (
                                    <img src={sup.avatarUrl || sup.photoURL} alt={sup.fullName} className="w-full h-full object-cover" />
                                  ) : (
                                    (sup.fullName || 'R').charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="truncate max-w-[190px] font-bold text-slate-900">{sup.fullName}</div>
                                  <div className="text-[11px] text-slate-400 font-normal truncate max-w-[190px]">
                                    {sup.position}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-slate-600">
                              <div className="font-mono text-xs font-semibold text-slate-800">{sup.phone}</div>
                              {sup.email ? (
                                <div className="text-[11px] text-slate-400 truncate max-w-[170px]">{sup.email}</div>
                              ) : (
                                <div className="text-[11px] text-slate-300">—</div>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-slate-700">
                              <div className="font-medium max-w-[200px] break-words">{sup.department}</div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 border border-purple-200 text-xs font-semibold">
                                <span>{sup.academicDegree}</span>
                                {sup.position && <span className="text-purple-400">•</span>}
                                {sup.position && <span className="text-[11px] font-normal text-purple-700">{sup.position}</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              {assignedStudents.length > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedSupervisorForStudents(sup);
                                    setIsSupervisorStudentsModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                                  title="Biriktirilgan talabalar ro‘yxatini ko‘rish"
                                >
                                  <Users className="w-3.5 h-3.5" />
                                  <span>{assignedStudents.length} ta talaba</span>
                                </button>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 text-xs text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
                                  Biriktirilmagan
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedSupervisorForStudents(sup);
                                    setIsSupervisorStudentsModalOpen(true);
                                  }}
                                  className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="Biriktirilgan talabalar ro‘yxatini ochish"
                                >
                                  <Users className="w-4 h-4" />
                                </button>
                                {hasPermission(currentUser, 'supervisors', 'edit') && (
                                  <button
                                    type="button"
                                    id={`edit-supervisor-desktop-${sup.id}`}
                                    onClick={() => {
                                      setEditingSupervisor(sup);
                                      setIsEditSupervisorModalOpen(true);
                                    }}
                                    className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                    title="Ilmiy rahbar profilini tahrirlash"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                )}
                                {hasPermission(currentUser, 'supervisors', 'edit') && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setResetPassUser({
                                        id: sup.id,
                                        fullName: sup.fullName,
                                        phone: sup.phone,
                                        role: 'supervisor',
                                      });
                                      setIsResetPassModalOpen(true);
                                    }}
                                    className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                    title="Parolni yangilash"
                                  >
                                    <KeyRound className="w-4 h-4" />
                                  </button>
                                )}
                                {hasPermission(currentUser, 'supervisors', 'delete') && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onConfirmModal({
                                        title: "Ilmiy rahbarni o'chirish",
                                        message: `${sup.fullName} ni o'chirishni tasdiqlaysizmi? Hujjat Chiqindilar qutisiga o'tkaziladi.`,
                                        confirmText: "O‘chirish (Chiqindiga)",
                                        isDestructive: true,
                                        onConfirm: async () => {
                                          await deleteSupervisorProfile(sup.id, currentUser, currentUser.fullName);
                                          onNotify('success', "Ilmiy rahbar chiqindilar qutisiga o'tkazildi.");
                                        },
                                      });
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="O‘chirish"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-white rounded-2xl border border-slate-200 text-xs shadow-xs">
                <div className="text-slate-600 font-medium">
                  Ko‘rsatilmoqda: <strong>{filteredSupervisors.length > 0 ? (supervisorCurrentPage - 1) * SUPERVISOR_PAGE_SIZE + 1 : 0}–{Math.min(supervisorCurrentPage * SUPERVISOR_PAGE_SIZE, filteredSupervisors.length)}</strong> (Jami: <strong>{filteredSupervisors.length}</strong> ta ilmiy rahbar)
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSupervisorCurrentPage(1)}
                    disabled={supervisorCurrentPage <= 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    <span>Birinchi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSupervisorCurrentPage(p => Math.max(1, p - 1))}
                    disabled={supervisorCurrentPage <= 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Oldingi</span>
                  </button>

                  <span className="px-3 py-1.5 bg-blue-900 text-white font-bold rounded-xl shadow-2xs">
                    {supervisorCurrentPage} / {totalSupervisorPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setSupervisorCurrentPage(p => Math.min(totalSupervisorPages, p + 1))}
                    disabled={supervisorCurrentPage >= totalSupervisorPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    <span>Keyingi</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 4: PROJECTS & STARTUPS */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Loyihalar va Startaplar moderatsiyasi</h2>
                <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-900 rounded-md">
                  Jami: {projects.filter(p => !p.isDeleted).length} ta
                </span>
                {filteredAndSortedProjects.length !== projects.filter(p => !p.isDeleted).length && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-md">
                    Filtr bo‘yicha: {filteredAndSortedProjects.length} ta
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Talabalar tomonidan topshirilgan ilmiy ishlar va biznes g'oyalarni ekspertiza qilish, ko‘rib chiqish va tasdiqlash.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(hasPermission(currentUser, 'projects', 'export') || hasPermission(currentUser, 'startups', 'export') || hasPermission(currentUser, 'excel', 'export')) && (
                <button
                  type="button"
                  onClick={() => exportProjectsToExcel(projects)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                  title="Loyihalar ro‘yxatini Excel (.xlsx) formatida yuklab olish"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Excelga yuklash</span>
                </button>
              )}
            </div>
          </div>

          {/* Search, Sort and Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Loyiha nomi, talaba F.I.Sh, rahbar yoki yo‘nalish bo‘yicha qidirish..."
                value={projectSearch}
                onChange={e => {
                  setProjectSearch(e.target.value);
                  setProjectCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Type Filter */}
              <select
                value={projectTypeFilter}
                onChange={e => {
                  setProjectTypeFilter(e.target.value as any);
                  setProjectCurrentPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
              >
                <option value="all">Barcha turlar (Loyiha & Startap)</option>
                <option value="loyiha">Faqat Ilmiy loyihalar</option>
                <option value="startap">Faqat Startap tashabbuslari</option>
              </select>

              {/* Status Filter */}
              <select
                value={projectStatusFilter}
                onChange={e => {
                  setProjectStatusFilter(e.target.value);
                  setProjectCurrentPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
              >
                <option value="all">Barcha statuslar</option>
                <option value="Kutilmoqda">Kutilmoqda</option>
                <option value="Tasdiqlangan">Tasdiqlangan</option>
                <option value="Rad etilgan">Rad etilgan</option>
              </select>

              {/* Sort Order */}
              <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 border border-slate-200 rounded-xl">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1" />
                <select
                  value={projectSort}
                  onChange={e => setProjectSort(e.target.value as any)}
                  className="bg-transparent text-xs text-slate-700 py-1 pr-2 focus:outline-none cursor-pointer"
                >
                  <option value="newest">Yangi qo‘shilganlar</option>
                  <option value="oldest">Eski qo‘shilganlar</option>
                  <option value="title_asc">Nomi (A–Z)</option>
                  <option value="title_desc">Nomi (Z–A)</option>
                  <option value="author_asc">Talaba F.I.Sh (A–Z)</option>
                </select>
              </div>

              {/* Reset filter button */}
              {(projectSearch || projectStatusFilter !== 'all' || projectTypeFilter !== 'all' || projectSort !== 'newest') && (
                <button
                  type="button"
                  onClick={() => {
                    setProjectSearch('');
                    setProjectStatusFilter('all');
                    setProjectTypeFilter('all');
                    setProjectSort('newest');
                    setProjectCurrentPage(1);
                  }}
                  className="px-2.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  title="Barcha filtrlarni tozalash"
                >
                  Tozalash
                </button>
              )}
            </div>
          </div>

          {/* List or Empty State */}
          {filteredAndSortedProjects.length === 0 ? (
            <EmptyState
              title="Loyihalar topilmadi"
              description={
                projectSearch || projectStatusFilter !== 'all' || projectTypeFilter !== 'all'
                  ? "Kiritilgan qidiruv yoki filtr mezonlariga mos loyihalar mavjud emas."
                  : "Hozircha birorta ham loyiha yoki startap yuklanmagan."
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedProjects.map(proj => {
                  const projResource = (proj.type === 'startap' || proj.type === 'startup') ? 'startups' : 'projects';
                  return (
                    <div
                      key={proj.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-blue-200 transition-all"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 rounded-md mb-1 inline-block">
                              {proj.type === 'loyiha' ? 'Ilmiy loyiha' : 'Startap tashabbusi'}
                            </span>
                            <h3 className="text-base font-bold text-slate-900">{proj.title}</h3>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 text-xs font-semibold rounded-lg shrink-0 ${
                              proj.status === 'Tasdiqlangan'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : proj.status === 'Rad etilgan'
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {proj.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 mb-3 line-clamp-3">{proj.description}</p>

                        <div className="space-y-1 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl mb-4">
                          <div>Talaba: <strong className="text-slate-900">{proj.studentName}</strong> ({proj.studentPhone})</div>
                          <div>Mualliflar: {proj.authorNames}</div>
                          <div>Yo‘nalish: {proj.field}</div>
                          {proj.reviewNotes && (
                            <div className="text-amber-800 font-medium mt-1">
                              Izoh: {proj.reviewNotes}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        {proj.fileUrl ? (
                          <button
                            onClick={() => onOpenPdf(proj.fileDataUrl || proj.fileUrl!, proj.fileName, proj.fileSize, proj.title)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-red-600" />
                            <span>PDF Hujjatni ko‘rish</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">PDF yo‘q</span>
                        )}

                        <div className="flex flex-wrap items-center gap-1.5">
                          {hasPermission(currentUser, projResource, 'edit') && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProject(proj);
                                setIsEditProjectModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors cursor-pointer"
                              title="Loyihani tahrirlash"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Tahrirlash</span>
                            </button>
                          )}

                          {hasPermission(currentUser, projResource, 'approve') && (
                            <>
                              <button
                                onClick={() => {
                                  setReviewModalData({
                                    type: 'project',
                                    id: proj.id,
                                    title: proj.title,
                                    status: 'Tasdiqlangan',
                                  });
                                  setReviewNotes(proj.reviewNotes || '');
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Tasdiqlash</span>
                              </button>
                              <button
                                onClick={() => {
                                  setReviewModalData({
                                    type: 'project',
                                    id: proj.id,
                                    title: proj.title,
                                    status: 'Rad etilgan',
                                  });
                                  setReviewNotes(proj.reviewNotes || '');
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Rad etish</span>
                              </button>
                            </>
                          )}

                          {hasPermission(currentUser, projResource, 'delete') && (
                            <button
                              type="button"
                              onClick={() => {
                                onConfirmModal({
                                  title: "Loyihani o'chirish",
                                  message: `"${proj.title}" loyihasini o'chirishni tasdiqlaysizmi? Hujjat Chiqindilar qutisiga o'tkaziladi.`,
                                  confirmText: "O‘chirish (Chiqindiga)",
                                  isDestructive: true,
                                  onConfirm: async () => {
                                    await deleteProjectOrStartup(proj.id, currentUser);
                                    onNotify('success', "Loyiha muvaffaqiyatli o'chirildi (Chiqindilar qutisiga o'tkazildi).");
                                  },
                                });
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                              title="Loyihani o'chirish"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>O‘chirish</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-white rounded-2xl border border-slate-200 text-xs shadow-xs">
                <div className="text-slate-500 font-medium">
                  Ko‘rsatilmoqda: <span className="font-bold text-slate-800">{(projectCurrentPage - 1) * PROJECTS_PAGE_SIZE + 1}–{Math.min(projectCurrentPage * PROJECTS_PAGE_SIZE, filteredAndSortedProjects.length)}</span> (Jami: <span className="font-bold text-slate-800">{filteredAndSortedProjects.length}</span> ta)
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setProjectCurrentPage(1)}
                    disabled={projectCurrentPage <= 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    <span>Birinchi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProjectCurrentPage(p => Math.max(1, p - 1))}
                    disabled={projectCurrentPage <= 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Oldingi</span>
                  </button>

                  <span className="px-3 py-1.5 bg-blue-900 text-white font-bold rounded-xl shadow-2xs">
                    {projectCurrentPage} / {totalProjectPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setProjectCurrentPage(p => Math.min(totalProjectPages, p + 1))}
                    disabled={projectCurrentPage >= totalProjectPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    <span>Keyingi</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 5: ACHIEVEMENTS */}
      {activeTab === 'achievements' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Yutuqlar va Diplomlarni tekshirish</h2>
                <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-900 rounded-md">
                  Jami: {achievements.filter(a => !a.isDeleted).length} ta
                </span>
                {filteredAndSortedAchievements.length !== achievements.filter(a => !a.isDeleted).length && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-md">
                    Filtr bo‘yicha: {filteredAndSortedAchievements.length} ta
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Talabalar qo'shgan olimpiada va tanlov natijalarini hujjat asosida tekshirish va tasdiqlash.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(hasPermission(currentUser, 'achievements', 'export') || hasPermission(currentUser, 'excel', 'export')) && (
                <button
                  type="button"
                  onClick={() => exportAchievementsToExcel(achievements)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                  title="Yutuqlar ro‘yxatini Excel (.xlsx) formatida yuklab olish"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Excelga yuklash</span>
                </button>
              )}
            </div>
          </div>

          {/* Search, Sort and Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Yutuq nomi, talaba F.I.Sh, toifasi bo‘yicha qidirish..."
                value={achievementSearch}
                onChange={e => {
                  setAchievementSearch(e.target.value);
                  setAchievementCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <select
                value={achievementCategoryFilter}
                onChange={e => {
                  setAchievementCategoryFilter(e.target.value);
                  setAchievementCurrentPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
              >
                <option value="all">Barcha toifalar</option>
                {achievementCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={achievementStatusFilter}
                onChange={e => {
                  setAchievementStatusFilter(e.target.value);
                  setAchievementCurrentPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
              >
                <option value="all">Barcha statuslar</option>
                <option value="Kutilmoqda">Kutilmoqda</option>
                <option value="Tasdiqlangan">Tasdiqlangan</option>
                <option value="Rad etilgan">Rad etilgan</option>
              </select>

              {/* Sort Order */}
              <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 border border-slate-200 rounded-xl">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1" />
                <select
                  value={achievementSort}
                  onChange={e => setAchievementSort(e.target.value as any)}
                  className="bg-transparent text-xs text-slate-700 py-1 pr-2 focus:outline-none cursor-pointer"
                >
                  <option value="newest">Eng so‘nggi sanadagilar</option>
                  <option value="oldest">Eski sanadagilar</option>
                  <option value="title_asc">Nomi (A–Z)</option>
                  <option value="student_asc">Talaba F.I.Sh (A–Z)</option>
                </select>
              </div>

              {/* Reset filter button */}
              {(achievementSearch || achievementStatusFilter !== 'all' || achievementCategoryFilter !== 'all' || achievementSort !== 'newest') && (
                <button
                  type="button"
                  onClick={() => {
                    setAchievementSearch('');
                    setAchievementStatusFilter('all');
                    setAchievementCategoryFilter('all');
                    setAchievementSort('newest');
                    setAchievementCurrentPage(1);
                  }}
                  className="px-2.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  title="Barcha filtrlarni tozalash"
                >
                  Tozalash
                </button>
              )}
            </div>
          </div>

          {/* List or Empty State */}
          {filteredAndSortedAchievements.length === 0 ? (
            <EmptyState
              title="Yutuqlar topilmadi"
              description={
                achievementSearch || achievementStatusFilter !== 'all' || achievementCategoryFilter !== 'all'
                  ? "Kiritilgan qidiruv yoki filtr mezonlariga mos yutuqlar mavjud emas."
                  : "Talabalar tomonidan hali yutuq yoki diplomlar topshirilmagan."
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedAchievements.map(ach => (
                  <div
                    key={ach.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-blue-200 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-50 text-amber-800 rounded-md border border-amber-200">
                          {ach.category}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-lg ${
                            ach.status === 'Tasdiqlangan'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : ach.status === 'Rad etilgan'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {ach.status}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mb-1">{ach.title}</h3>
                      <p className="text-xs text-slate-600 mb-3 line-clamp-2">{ach.description}</p>

                      <div className="text-xs text-slate-500 space-y-0.5 bg-slate-50 p-2.5 rounded-xl">
                        <div>Talaba: <strong className="text-slate-900">{ach.studentName}</strong></div>
                        <div>Sana: <span className="font-medium text-slate-700">{ach.date}</span></div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 mt-4 flex flex-wrap items-center justify-between gap-2">
                      {ach.fileUrl ? (
                        <button
                          onClick={() => onOpenPdf(ach.fileDataUrl || ach.fileUrl!, ach.fileName, ach.fileSize, ach.title)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-red-600" />
                          <span>PDF Hujjat</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">PDF yo‘q</span>
                      )}

                      {hasPermission(currentUser, 'achievements', 'approve') && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setReviewModalData({
                                type: 'achievement',
                                id: ach.id,
                                title: ach.title,
                                status: 'Tasdiqlangan',
                              });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
                            title="Tasdiqlash"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Tasdiqlash</span>
                          </button>
                          <button
                            onClick={() => {
                              setReviewModalData({
                                type: 'achievement',
                                id: ach.id,
                                title: ach.title,
                                status: 'Rad etilgan',
                              });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                            title="Rad etish"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Rad etish</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-white rounded-2xl border border-slate-200 text-xs shadow-xs">
                <div className="text-slate-500 font-medium">
                  Ko‘rsatilmoqda: <span className="font-bold text-slate-800">{(achievementCurrentPage - 1) * ACHIEVEMENTS_PAGE_SIZE + 1}–{Math.min(achievementCurrentPage * ACHIEVEMENTS_PAGE_SIZE, filteredAndSortedAchievements.length)}</span> (Jami: <span className="font-bold text-slate-800">{filteredAndSortedAchievements.length}</span> ta)
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAchievementCurrentPage(1)}
                    disabled={achievementCurrentPage <= 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    <span>Birinchi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAchievementCurrentPage(p => Math.max(1, p - 1))}
                    disabled={achievementCurrentPage <= 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Oldingi</span>
                  </button>

                  <span className="px-3 py-1.5 bg-blue-900 text-white font-bold rounded-xl shadow-2xs">
                    {achievementCurrentPage} / {totalAchievementPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setAchievementCurrentPage(p => Math.min(totalAchievementPages, p + 1))}
                    disabled={achievementCurrentPage >= totalAchievementPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    <span>Keyingi</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 6: CERTIFICATES */}
      {activeTab === 'certificates' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Sertifikatlar boshqaruvi</h2>
                <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-900 rounded-md">
                  Jami: {certificates.filter(c => !c.isDeleted).length} ta
                </span>
                {filteredAndSortedCertificates.length !== certificates.filter(c => !c.isDeleted).length && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-md">
                    Filtr bo‘yicha: {filteredAndSortedCertificates.length} ta
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Berilgan rasmiy sertifikatlar va diplomlar ro‘yxati, QR-kodli tekshiruv, yuklab olish va boshqarish.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(hasPermission(currentUser, 'certificates', 'export') || hasPermission(currentUser, 'excel', 'export')) && (
                <button
                  type="button"
                  onClick={() => exportCertificatesToExcel(certificates)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                  title="Sertifikatlar ro‘yxatini Excel (.xlsx) formatida yuklab olish"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Excelga yuklash</span>
                </button>
              )}
              {hasPermission(currentUser, 'certificates', 'create') && (
                <button
                  type="button"
                  onClick={() => setIsCertIssueModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yangi sertifikat berish</span>
                </button>
              )}
            </div>
          </div>

          {/* Search, Sort and Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Sertifikat nomi, talaba F.I.Sh, raqami (ID) yoki tadbir bo‘yicha qidirish..."
                value={certificateSearch}
                onChange={e => {
                  setCertificateSearch(e.target.value);
                  setCertificateCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Type Filter */}
              <select
                value={certificateTypeFilter}
                onChange={e => {
                  setCertificateTypeFilter(e.target.value);
                  setCertificateCurrentPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
              >
                <option value="all">Barcha hujjatlar</option>
                <option value="diplom">Faqat Diplomlar</option>
                <option value="sertifikat">Faqat Sertifikatlar</option>
                <option value="official">Rasmiy berilganlar</option>
                <option value="uploaded">Fayl yuklanganlar</option>
              </select>

              {/* Status Filter */}
              <select
                value={certificateStatusFilter}
                onChange={e => {
                  setCertificateStatusFilter(e.target.value);
                  setCertificateCurrentPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
              >
                <option value="all">Barcha holatlar</option>
                <option value="valid">Amaldagilar (Haqiqiy)</option>
                <option value="revoked">Bekor qilinganlar</option>
              </select>

              {/* Sort Order */}
              <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 border border-slate-200 rounded-xl">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1" />
                <select
                  value={certificateSort}
                  onChange={e => setCertificateSort(e.target.value as any)}
                  className="bg-transparent text-xs text-slate-700 py-1 pr-2 focus:outline-none cursor-pointer"
                >
                  <option value="newest">Yangi berilganlar</option>
                  <option value="oldest">Eski berilganlar</option>
                  <option value="number_asc">Sertifikat ID bo‘yicha</option>
                  <option value="student_asc">Talaba F.I.Sh (A–Z)</option>
                  <option value="title_asc">Nomi (A–Z)</option>
                </select>
              </div>

              {/* Reset filter button */}
              {(certificateSearch || certificateTypeFilter !== 'all' || certificateStatusFilter !== 'all' || certificateSort !== 'newest') && (
                <button
                  type="button"
                  onClick={() => {
                    setCertificateSearch('');
                    setCertificateTypeFilter('all');
                    setCertificateStatusFilter('all');
                    setCertificateSort('newest');
                    setCertificateCurrentPage(1);
                  }}
                  className="px-2.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  title="Barcha filtrlarni tozalash"
                >
                  Tozalash
                </button>
              )}
            </div>
          </div>

          {/* List or Empty State */}
          {filteredAndSortedCertificates.length === 0 ? (
            <EmptyState
              title="Sertifikatlar topilmadi"
              description={
                certificateSearch || certificateTypeFilter !== 'all' || certificateStatusFilter !== 'all'
                  ? "Kiritilgan qidiruv yoki filtr mezonlariga mos sertifikatlar mavjud emas."
                  : "Hozircha birorta ham rasmiy sertifikat berilmagan."
              }
              action={hasPermission(currentUser, 'certificates', 'create') ? {
                label: "Sertifikat berish",
                onClick: () => setIsCertIssueModalOpen(true),
              } : undefined}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedCertificates.map(cert => (
                  <div
                    key={cert.id}
                    className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${cert.isRevoked ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200 hover:border-emerald-200'}`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex flex-wrap gap-1.5">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                            cert.documentType === 'diplom'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}>
                            {cert.isOfficialGenerated
                              ? (cert.documentType === 'diplom' ? '🏆 Rasmiy diplom' : '🎓 Rasmiy sertifikat')
                              : 'Yuklangan'}
                          </span>
                          {cert.isRevoked && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                              Bekor qilingan
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-slate-600">{cert.status}</span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mb-1">{cert.title}</h3>
                      {cert.subtitle && (
                        <p className="text-xs text-emerald-700 italic mb-1">{cert.subtitle}</p>
                      )}
                      <p className="text-xs text-slate-600 mb-2">Talaba: <strong className="text-slate-900">{cert.studentName}</strong></p>

                      <div className="space-y-0.5 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl">
                        <div>Tadbir: {cert.eventTitle}</div>
                        {cert.nomination && (
                          <div className="text-emerald-800 font-medium">Nominatsiya: {cert.nomination}</div>
                        )}
                        <div>Sana: {cert.issueDate}</div>
                        <div>ID: <code className="font-mono font-bold text-emerald-800">{cert.certificateNumber}</code></div>
                        {cert.isRevoked && cert.revokedReason && (
                          <div className="text-rose-700 font-medium mt-1">Sabab: {cert.revokedReason}</div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 mt-4 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        {cert.isOfficialGenerated ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setPreviewCert(cert)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                              title="Diplomni ekranda ko‘rish"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              <span>Ko‘rish</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadCertificatePdf(cert)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl transition-colors shadow-2xs cursor-pointer"
                              title="PDF va QR-kod yuklash"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </button>
                          </>
                        ) : cert.fileUrl ? (
                          <button
                            onClick={() => onOpenPdf(cert.fileDataUrl || cert.fileUrl!, cert.fileName, undefined, cert.title)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-red-600" />
                            <span>PDF Ko‘rish</span>
                          </button>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-1">
                        {hasPermission(currentUser, 'certificates', 'edit') && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCertificate(cert);
                              setIsEditCertModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Tahrirlash"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}

                        {hasPermission(currentUser, 'certificates', 'edit') && !cert.isRevoked && (
                          <button
                            type="button"
                            onClick={() => {
                              setRevokingCertificate(cert);
                              setIsRevokeCertModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Sertifikatni bekor qilish (Revoke)"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}

                        {hasPermission(currentUser, 'certificates', 'delete') && (
                          <button
                            type="button"
                            onClick={() => {
                              onConfirmModal({
                                title: "Sertifikatni o‘chirish",
                                message: `«${cert.title}» (${cert.certificateNumber}) sertifikatini o‘chirishni xohlaysizmi? Bu hujjat Chiqindilar qutisiga o‘tkaziladi va tiklash imkoni saqlanadi.`,
                                confirmText: "O‘chirish (Chiqindiga)",
                                confirmType: "danger",
                                onConfirm: async () => {
                                  try {
                                    await deleteCertificateDoc(cert.id, currentUser);
                                    onNotify('success', "Sertifikat chiqindilar qutisiga o‘tkazildi.");
                                  } catch (e: any) {
                                    onNotify('error', e.message || "Xatolik yuz berdi.");
                                  }
                                },
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Chiqindiga tashlash"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-white rounded-2xl border border-slate-200 text-xs shadow-xs">
                <div className="text-slate-500 font-medium">
                  Ko‘rsatilmoqda: <span className="font-bold text-slate-800">{(certificateCurrentPage - 1) * CERTS_PAGE_SIZE + 1}–{Math.min(certificateCurrentPage * CERTS_PAGE_SIZE, filteredAndSortedCertificates.length)}</span> (Jami: <span className="font-bold text-slate-800">{filteredAndSortedCertificates.length}</span> ta)
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCertificateCurrentPage(1)}
                    disabled={certificateCurrentPage <= 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    <span>Birinchi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCertificateCurrentPage(p => Math.max(1, p - 1))}
                    disabled={certificateCurrentPage <= 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Oldingi</span>
                  </button>

                  <span className="px-3 py-1.5 bg-blue-900 text-white font-bold rounded-xl shadow-2xs">
                    {certificateCurrentPage} / {totalCertPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setCertificateCurrentPage(p => Math.min(totalCertPages, p + 1))}
                    disabled={certificateCurrentPage >= totalCertPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    <span>Keyingi</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 7: EVENTS */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Universitet tadbirlari boshqaruvi</h2>
                <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-900 rounded-md">
                  Jami: {events.length} ta
                </span>
                {filteredAndSortedEvents.length !== events.length && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-md">
                    Filtr bo‘yicha: {filteredAndSortedEvents.length} ta
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Olimpiada, forum va seminarlarni rejalashtirish, o'tkazish hamda ishtirokchilarni boshqarish.
              </p>
            </div>

            {hasPermission(currentUser, 'events', 'create') && (
              <button
                onClick={() => setIsEventModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Yangi tadbir e'lon qilish</span>
              </button>
            )}
          </div>

          {/* Search, Sort and Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tadbir nomi, joyi yoki tavsifi bo‘yicha qidirish..."
                value={eventSearch}
                onChange={e => {
                  setEventSearch(e.target.value);
                  setEventCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <select
                value={eventStatusFilter}
                onChange={e => {
                  setEventStatusFilter(e.target.value);
                  setEventCurrentPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
              >
                <option value="all">Barcha tadbirlar</option>
                <option value="active">Faol (Muddati tugamagan)</option>
                <option value="expired">Muddati o‘tgan</option>
              </select>

              {/* Sort Order */}
              <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 border border-slate-200 rounded-xl">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1" />
                <select
                  value={eventSort}
                  onChange={e => setEventSort(e.target.value as any)}
                  className="bg-transparent text-xs text-slate-700 py-1 pr-2 focus:outline-none cursor-pointer"
                >
                  <option value="date_asc">Sanasi bo‘yicha (Yaqinlari oldinda)</option>
                  <option value="date_desc">Sanasi bo‘yicha (Keyingilari oldinda)</option>
                  <option value="title_asc">Nomi (A–Z)</option>
                  <option value="participants_desc">Ishtirokchilar soni bo‘yicha</option>
                </select>
              </div>

              {/* Reset filter button */}
              {(eventSearch || eventStatusFilter !== 'all' || eventSort !== 'date_asc') && (
                <button
                  type="button"
                  onClick={() => {
                    setEventSearch('');
                    setEventStatusFilter('all');
                    setEventSort('date_asc');
                    setEventCurrentPage(1);
                  }}
                  className="px-2.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  title="Barcha filtrlarni tozalash"
                >
                  Tozalash
                </button>
              )}
            </div>
          </div>

          {/* List or Empty State */}
          {filteredAndSortedEvents.length === 0 ? (
            <EmptyState
              title="Tadbirlar topilmadi"
              description={
                eventSearch || eventStatusFilter !== 'all'
                  ? "Kiritilgan qidiruv yoki filtr mezonlariga mos tadbirlar mavjud emas."
                  : "Hozirda rejalashtirilgan tadbirlar yo'q."
              }
              action={hasPermission(currentUser, 'events', 'create') ? {
                label: "Tadbir yaratish",
                onClick: () => setIsEventModalOpen(true),
              } : undefined}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedEvents.map(ev => {
                  const deadlineInfo = ev.deadline ? getDeadlineInfo(ev.deadline) : null;
                  return (
                    <div
                      key={ev.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-blue-200 transition-all"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-base font-bold text-slate-900">{ev.title}</h3>
                          <button
                            type="button"
                            id={`event-participants-btn-${ev.id}`}
                            onClick={() => onOpenEventParticipants?.(ev)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 transition-all cursor-pointer shadow-2xs hover:shadow-xs group shrink-0"
                            title="Ushbu tadbir ishtirokchilari ro‘yxatini ko‘rish"
                          >
                            <Users className="w-3.5 h-3.5 text-blue-700 group-hover:scale-110 transition-transform" />
                            <span>{ev.participantIds?.length || 0} ishtirokchi</span>
                          </button>
                        </div>

                        <p className="text-xs text-slate-600 mb-3 line-clamp-3">{ev.description}</p>

                        <div className="space-y-1.5 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
                          <div>Sana va vaqt: <strong>{ev.date} ({ev.time})</strong></div>
                          <div>O‘tkazilish joyi: <strong>{ev.location}</strong></div>
                          {deadlineInfo && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60 mt-1">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  deadlineInfo.isExpired
                                    ? 'bg-rose-100 text-rose-800'
                                    : deadlineInfo.daysLeft <= 3
                                    ? 'bg-amber-100 text-amber-900 font-extrabold'
                                    : 'bg-blue-100 text-blue-900'
                                }`}
                              >
                                {deadlineInfo.isExpired ? (
                                  '🔴 Ariza topshirish yakunlangan'
                                ) : (
                                  `⏳ ${deadlineInfo.daysLeft === 0 ? 'Bugun oxirgi kun!' : `${deadlineInfo.daysLeft} kun qoldi`}`
                                )}
                              </span>
                              <span className="text-[11px] text-slate-400">({deadlineInfo.formatted})</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between">
                        <div>
                          {ev.status && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded-md">
                              {ev.status}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {hasPermission(currentUser, 'events', 'edit') && (
                            <button
                              onClick={() => handleOpenEditEvent(ev)}
                              className="p-1.5 text-slate-400 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Tadbirni tahrirlash"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission(currentUser, 'events', 'delete') && (
                            <button
                              onClick={() => {
                                onConfirmModal({
                                  title: "Tadbirni o'chirish",
                                  message: `«${ev.title}» tadbirini o'chirishni tasdiqlaysizmi?`,
                                  confirmText: "Ha, o'chirish",
                                  isDestructive: true,
                                  onConfirm: async () => {
                                    await deleteEventDoc(ev.id, currentUser.id, currentUser.fullName);
                                    onNotify('success', "Tadbir o'chirildi.");
                                  },
                                });
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="O‘chirish"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-white rounded-2xl border border-slate-200 text-xs shadow-xs">
                <div className="text-slate-500 font-medium">
                  Ko‘rsatilmoqda: <span className="font-bold text-slate-800">{(eventCurrentPage - 1) * EVENTS_PAGE_SIZE + 1}–{Math.min(eventCurrentPage * EVENTS_PAGE_SIZE, filteredAndSortedEvents.length)}</span> (Jami: <span className="font-bold text-slate-800">{filteredAndSortedEvents.length}</span> ta)
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEventCurrentPage(1)}
                    disabled={eventCurrentPage <= 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    <span>Birinchi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventCurrentPage(p => Math.max(1, p - 1))}
                    disabled={eventCurrentPage <= 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Oldingi</span>
                  </button>

                  <span className="px-3 py-1.5 bg-blue-900 text-white font-bold rounded-xl shadow-2xs">
                    {eventCurrentPage} / {totalEventPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setEventCurrentPage(p => Math.min(totalEventPages, p + 1))}
                    disabled={eventCurrentPage >= totalEventPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    <span>Keyingi</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 8: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">E'lonlar markazi</h2>
                <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-900 rounded-md">
                  Jami: {announcements.length} ta
                </span>
                {filteredAndSortedAnnouncements.length !== announcements.length && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-md">
                    Filtr bo‘yicha: {filteredAndSortedAnnouncements.length} ta
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Talabalar va ilmiy rahbarlar uchun tezkor xabarnomalar va muhim e'lonlarni boshqarish.
              </p>
            </div>

            {hasPermission(currentUser, 'announcements', 'create') && (
              <button
                onClick={() => setIsAnnModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Yangi e'lon berish</span>
              </button>
            )}
          </div>

          {/* Search, Sort and Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="E'lon sarlavhasi yoki matni bo‘yicha qidirish..."
                value={announcementSearch}
                onChange={e => {
                  setAnnouncementSearch(e.target.value);
                  setAnnouncementCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Audience Filter */}
              <select
                value={announcementAudienceFilter}
                onChange={e => {
                  setAnnouncementAudienceFilter(e.target.value);
                  setAnnouncementCurrentPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
              >
                <option value="all">Barcha auditoriyalar</option>
                <option value="Barchaga">Barchaga</option>
                <option value="Talabalarga">Talabalarga</option>
                <option value="Ilmiy rahbarlarga">Ilmiy rahbarlarga</option>
              </select>

              {/* Sort Order */}
              <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 border border-slate-200 rounded-xl">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1" />
                <select
                  value={announcementSort}
                  onChange={e => setAnnouncementSort(e.target.value as any)}
                  className="bg-transparent text-xs text-slate-700 py-1 pr-2 focus:outline-none cursor-pointer"
                >
                  <option value="newest">Yangi e‘lonlar</option>
                  <option value="oldest">Eski e‘lonlar</option>
                  <option value="title_asc">Sarlavha (A–Z)</option>
                </select>
              </div>

              {/* Reset filter button */}
              {(announcementSearch || announcementAudienceFilter !== 'all' || announcementSort !== 'newest') && (
                <button
                  type="button"
                  onClick={() => {
                    setAnnouncementSearch('');
                    setAnnouncementAudienceFilter('all');
                    setAnnouncementSort('newest');
                    setAnnouncementCurrentPage(1);
                  }}
                  className="px-2.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  title="Barcha filtrlarni tozalash"
                >
                  Tozalash
                </button>
              )}
            </div>
          </div>

          {/* List or Empty State */}
          {filteredAndSortedAnnouncements.length === 0 ? (
            <EmptyState
              title="E'lonlar topilmadi"
              description={
                announcementSearch || announcementAudienceFilter !== 'all'
                  ? "Kiritilgan qidiruv yoki filtr mezonlariga mos e'lonlar mavjud emas."
                  : "Hozircha birorta ham e'lon chiqarilmagan."
              }
              action={hasPermission(currentUser, 'announcements', 'create') ? {
                label: "E'lon berish",
                onClick: () => setIsAnnModalOpen(true),
              } : undefined}
            />
          ) : (
            <>
              <div className="space-y-3">
                {paginatedAnnouncements.map(ann => (
                  <div key={ann.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-200 transition-all">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-900 rounded-md">
                            {ann.audience}
                          </span>
                          <span className="text-xs text-slate-400">{ann.date}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-1">{ann.title}</h3>
                      </div>

                      <div className="flex items-center gap-1">
                        {hasPermission(currentUser, 'announcements', 'edit') && (
                          <button
                            onClick={() => handleOpenEditAnn(ann)}
                            className="p-1.5 text-slate-400 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="E'lonni tahrirlash"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {hasPermission(currentUser, 'announcements', 'delete') && (
                          <button
                            onClick={() => {
                              onConfirmModal({
                                title: "E'lonni o'chirish",
                                message: `«${ann.title}» e'lonini o'chirishni tasdiqlaysizmi?`,
                                confirmText: "Ha, o'chirish",
                                isDestructive: true,
                                onConfirm: async () => {
                                  await deleteAnnouncementDoc(ann.id, currentUser.id, currentUser.fullName);
                                  onNotify('success', "E'lon o'chirildi.");
                                },
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="O‘chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">{ann.content}</p>
                  </div>
                ))}
              </div>

              {/* Pagination Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-white rounded-2xl border border-slate-200 text-xs shadow-xs">
                <div className="text-slate-500 font-medium">
                  Ko‘rsatilmoqda: <span className="font-bold text-slate-800">{(announcementCurrentPage - 1) * ANNOUNCEMENTS_PAGE_SIZE + 1}–{Math.min(announcementCurrentPage * ANNOUNCEMENTS_PAGE_SIZE, filteredAndSortedAnnouncements.length)}</span> (Jami: <span className="font-bold text-slate-800">{filteredAndSortedAnnouncements.length}</span> ta)
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAnnouncementCurrentPage(1)}
                    disabled={announcementCurrentPage <= 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    <span>Birinchi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnnouncementCurrentPage(p => Math.max(1, p - 1))}
                    disabled={announcementCurrentPage <= 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Oldingi</span>
                  </button>

                  <span className="px-3 py-1.5 bg-blue-900 text-white font-bold rounded-xl shadow-2xs">
                    {announcementCurrentPage} / {totalAnnPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setAnnouncementCurrentPage(p => Math.min(totalAnnPages, p + 1))}
                    disabled={announcementCurrentPage >= totalAnnPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    <span>Keyingi</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 9: SUPER ADMIN - ADMIN MANAGEMENT */}
      {(isSuperAdmin || hasPermission(currentUser, 'admins', 'view')) && activeTab === 'admins' && (
        <AdminManagementView
          actor={currentUser}
          admins={allUsers.filter(u => (u.role === 'admin' || u.role === 'superAdmin') && !u.isDeleted)}
          onRefresh={() => {}}
        />
      )}

      {/* TAB 9B: TRASH & RECOVERY */}
      {(isSuperAdmin || hasPermission(currentUser, 'trash', 'view')) && activeTab === 'trash' && (
        <TrashRecoveryView
          actor={currentUser}
          students={students}
          supervisors={supervisors}
          projects={projects}
          achievements={achievements}
          certificates={certificates}
          events={events}
          announcements={announcements}
          admins={allUsers.filter(u => u.role === 'admin' || u.role === 'superAdmin')}
          onRefresh={() => {
            fetchStudentsForPage(currentPage, pageCursors[currentPage - 1] || null);
          }}
        />
      )}

      {/* TAB 10: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Tizim Audit Tarixi (Audit Log)</h2>
              <p className="text-xs text-slate-500">Kim qachon qanday amal bajarganini real vaqtda kuzatish va hisobotini olish.</p>
            </div>

            {(hasPermission(currentUser, 'audit_logs', 'export') || hasPermission(currentUser, 'excel', 'export')) && (
              <button
                type="button"
                onClick={() => exportAuditLogsToExcel(auditLogs)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                title="Audit loglarini Excel (.xlsx) formatida yuklab olish"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Audit Log Excel</span>
              </button>
            )}
          </div>

          {auditLogs.length === 0 ? (
            <EmptyState title="Audit jurnali bo'sh" description="Hozircha tizim amallari qayd etilmagan." />
          ) : (
            <>
              {/* MOBILE AUDIT LIST (md:hidden) */}
              <div className="md:hidden space-y-3">
                {auditLogs.slice(0, 50).map(log => (
                  <div key={log.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-slate-900">{log.userName}</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-slate-100 text-slate-700 rounded-md">
                        {log.action}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 break-words">{log.details}</p>
                    <div className="text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-100">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP AUDIT TABLE (hidden md:block) */}
              <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Vaqt</th>
                        <th className="px-4 py-3">Foydalanuvchi</th>
                        <th className="px-4 py-3">Amal turi</th>
                        <th className="px-4 py-3">Tafsilotlar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditLogs.slice(0, 50).map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                            {log.userName}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-slate-100 text-slate-700 rounded-md">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {log.details}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

        </div>
      </div>

      {/* ================= ADMIN MODALS ================= */}

      {/* MODAL 1: ADD SUPERVISOR */}
      {isSupervisorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Yangi ilmiy rahbar qo‘shish</h3>
            <p className="text-xs text-slate-500 mb-5">
              Ilmiy rahbar ma'lumotlari kiritiladi va unga tizimga kirish uchun hisob ochiladi.
            </p>

            <form onSubmit={handleCreateSupervisor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  F.I.Sh. (Familiya, Ism, Sharif) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Qodirov Jamshid Toxirovich"
                  value={supFullName}
                  onChange={e => setSupFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Telefon (Login) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+998 (90) 123-45-67"
                    value={supPhone}
                    onChange={e => setSupPhone(formatUzbekPhone(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Dastlabki parol *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="123456"
                    value={supPassword}
                    onChange={e => setSupPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Lavozimi *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Dotsent, Professor, Katta o‘qituvchi"
                    value={supPosition}
                    onChange={e => setSupPosition(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ilmiy darajasi *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="PhD, DSc, Magistr"
                    value={supDegree}
                    onChange={e => setSupDegree(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kafedra nomi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Dasturiy ta'minot kafedrasi"
                  value={supDept}
                  onChange={e => setSupDept(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Elektron pochta (Ixtiyoriy)
                </label>
                <input
                  type="email"
                  placeholder="supervisor@univ.edu.uz"
                  value={supEmail}
                  onChange={e => setSupEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSupervisorModalOpen(false)}
                  disabled={isSupSubmitting}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSupSubmitting}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                >
                  {isSupSubmitting ? 'Saqlanmoqda...' : 'Saqlash va hisob ochish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ISSUE OFFICIAL CERTIFICATE / DIPLOMA */}
      <IssueCertificateModal
        isOpen={isCertIssueModalOpen}
        onClose={() => setIsCertIssueModalOpen(false)}
        students={students}
        currentUser={currentUser}
        onSubmit={handleIssueCertificate}
        isSubmitting={isCertIssuing}
      />

      {/* PREVIEW MODAL FOR EXISTING CERTIFICATE */}
      <CertificatePreviewModal
        isOpen={!!previewCert}
        onClose={() => setPreviewCert(null)}
        certificate={previewCert}
      />

      {/* MODAL 3: CREATE EVENT */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Yangi tadbir e'lon qilish</h3>
            <p className="text-xs text-slate-500 mb-5">
              Iqtidorli talabalar uchun olimpiada, tanlov yoki seminar rejalashtirish.
            </p>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tadbir nomi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Universitet Yosh Dasturchilar Hakatoni"
                  value={eventTitle}
                  onChange={e => setEventTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tadbir tavsifi va qoidalari *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ishtirok etish shartlari va talablar"
                  value={eventDesc}
                  onChange={e => setEventDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    O'tkazilish sanasi *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Boshlanish vaqti
                  </label>
                  <input
                    type="text"
                    placeholder="10:00"
                    value={eventTime}
                    onChange={e => setEventTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    O'tkazilish joyi *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Bosh bino, 204-auditoriya"
                    value={eventLocation}
                    onChange={e => setEventLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ro'yxatdan o'tish muddati (Deadline)
                  </label>
                  <input
                    type="date"
                    value={eventDeadline}
                    onChange={e => setEventDeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  disabled={isEventSubmitting}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isEventSubmitting}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                >
                  {isEventSubmitting ? 'E’lon qilinmoqda...' : 'Tadbirni e’lon qilish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CREATE ANNOUNCEMENT */}
      {isAnnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Yangi rasmiy e'lon berish</h3>
            <p className="text-xs text-slate-500 mb-5">
              Auditoriyani tanlang va xabarnoma matnini kiriting.
            </p>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Auditoriya
                </label>
                <select
                  value={annAudience}
                  onChange={e => setAnnAudience(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                >
                  <option value="Barchaga">Barchaga (Talabalar va Rahbarlar)</option>
                  <option value="Talabalar">Faqat Talabalarga</option>
                  <option value="Ilmiy rahbarlar">Faqat Ilmiy rahbarlarga</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Sarlavha *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Respublika startap tanloviga arizalar qabuli boshlandi"
                  value={annTitle}
                  onChange={e => setAnnTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  E'lon matni *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Xabarnoma batafsil mazmuni..."
                  value={annContent}
                  onChange={e => setAnnContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAnnModalOpen(false)}
                  disabled={isAnnSubmitting}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isAnnSubmitting}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isAnnSubmitting ? 'Chiqarilmoqda...' : 'E’lonni chiqarish'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT EVENT */}
      {isEditEventModalOpen && editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Tadbirni tahrirlash</h3>
            <p className="text-xs text-slate-500 mb-5">
              Tadbir nomi, sanasi, o‘tkazilish joyi va holatini yangilash.
            </p>

            <form onSubmit={handleUpdateEventSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tadbir nomi *
                </label>
                <input
                  type="text"
                  required
                  value={editEventTitle}
                  onChange={e => setEditEventTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tadbir tavsifi va qoidalari *
                </label>
                <textarea
                  required
                  rows={3}
                  value={editEventDesc}
                  onChange={e => setEditEventDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    O'tkazilish sanasi *
                  </label>
                  <input
                    type="date"
                    required
                    value={editEventDate}
                    onChange={e => setEditEventDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Boshlanish vaqti
                  </label>
                  <input
                    type="text"
                    value={editEventTime}
                    onChange={e => setEditEventTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    O'tkazilish joyi *
                  </label>
                  <input
                    type="text"
                    required
                    value={editEventLocation}
                    onChange={e => setEditEventLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ro'yxatdan o'tish muddati (Deadline)
                  </label>
                  <input
                    type="date"
                    value={editEventDeadline}
                    onChange={e => setEditEventDeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tadbir holati
                </label>
                <select
                  value={editEventStatus}
                  onChange={e => setEditEventStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                >
                  <option value="Rejalashtirilgan">Rejalashtirilgan</option>
                  <option value="Davom etmoqda">Davom etmoqda</option>
                  <option value="Yakunlangan">Yakunlangan</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditEventModalOpen(false);
                    setEditingEvent(null);
                  }}
                  disabled={isEditEventSubmitting}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isEditEventSubmitting}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                >
                  {isEditEventSubmitting ? 'Saqlanmoqda...' : 'O‘zgarishlarni saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ANNOUNCEMENT */}
      {isEditAnnModalOpen && editingAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-1">E'lonni tahrirlash</h3>
            <p className="text-xs text-slate-500 mb-5">
              E'lon sarlavhasi, mazmuni va auditoriyasini yangilash.
            </p>

            <form onSubmit={handleUpdateAnnSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Auditoriya
                </label>
                <select
                  value={editAnnAudience}
                  onChange={e => setEditAnnAudience(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                >
                  <option value="Barchaga">Barchaga (Talabalar va Rahbarlar)</option>
                  <option value="Talabalar">Faqat Talabalarga</option>
                  <option value="Ilmiy rahbarlar">Faqat Ilmiy rahbarlarga</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Sarlavha *
                </label>
                <input
                  type="text"
                  required
                  value={editAnnTitle}
                  onChange={e => setEditAnnTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  E'lon matni *
                </label>
                <textarea
                  required
                  rows={4}
                  value={editAnnContent}
                  onChange={e => setEditAnnContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditAnnModalOpen(false);
                    setEditingAnnouncement(null);
                  }}
                  disabled={isEditAnnSubmitting}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isEditAnnSubmitting}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                >
                  {isEditAnnSubmitting ? 'Saqlanmoqda...' : 'O‘zgarishlarni saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Yangi Admin qo‘shish</h3>
            <p className="text-xs text-slate-500 mb-5">
              Super Admin orqali tizim ma'muri hisobini ro'yxatdan o'tkazish.
            </p>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  F.I.Sh. *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Rahimov Otabek"
                  value={adminFullName}
                  onChange={e => setAdminFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Telefon raqami (Login) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+998 (90) 123-45-67"
                  value={adminPhone}
                  onChange={e => setAdminPhone(formatUzbekPhone(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Admin roli
                </label>
                <select
                  value={adminRole}
                  onChange={e => setAdminRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                >
                  <option value="admin">Admin (Standart boshqaruv)</option>
                  <option value="superAdmin">Super Admin (To'liq huquqli)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Parol (Kamida 6 belgi) *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  disabled={isAdminSubmitting}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isAdminSubmitting}
                  className="px-5 py-2 bg-indigo-900 hover:bg-indigo-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                >
                  {isAdminSubmitting ? 'Qo‘shilmoqda...' : 'Adminni faollashtirish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: REVIEW STATUS & NOTES */}
      {reviewModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {reviewModalData.status === 'Tasdiqlangan' ? 'Tasdiqlash xulosasi' : 'Rad etish xulosasi'}
            </h3>
            <p className="text-xs text-slate-500 mb-4 truncate">
              {reviewModalData.title}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ekspert / Admin izohi (Talabaga ko‘rinadi)
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    reviewModalData.status === 'Tasdiqlangan'
                      ? 'Loyiha talablarga to‘liq mos deb topildi.'
                      : 'Hujjatda kamchiliklar mavjud, qayta ko‘rib chiqilsin.'
                  }
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReviewModalData(null)}
                  disabled={isReviewSubmitting}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={isReviewSubmitting}
                  className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-colors ${
                    reviewModalData.status === 'Tasdiqlangan'
                      ? 'bg-emerald-700 hover:bg-emerald-600'
                      : 'bg-rose-700 hover:bg-rose-600'
                  }`}
                >
                  {isReviewSubmitting ? 'Saqlanmoqda...' : 'Xulosani tasdiqlash'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Edit Student Modal */}
      {isEditStudentModalOpen && (
        <EditStudentModal
          isOpen={isEditStudentModalOpen}
          student={editingStudent}
          supervisors={supervisors}
          actor={currentUser}
          onClose={() => {
            setIsEditStudentModalOpen(false);
            setEditingStudent(null);
          }}
          onSaveSuccess={() => {
            // Live Firestore subscription will update state automatically
          }}
          onNotify={onNotify}
        />
      )}

      {/* Edit Supervisor Modal */}
      {isEditSupervisorModalOpen && (
        <EditSupervisorModal
          isOpen={isEditSupervisorModalOpen}
          supervisor={editingSupervisor}
          actor={currentUser}
          onClose={() => {
            setIsEditSupervisorModalOpen(false);
            setEditingSupervisor(null);
          }}
          onSaveSuccess={() => {
            // Live Firestore subscription will update state automatically
          }}
          onNotify={onNotify}
        />
      )}

      {/* Supervisor Assigned Students Modal */}
      {isSupervisorStudentsModalOpen && selectedSupervisorForStudents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-purple-900 text-white font-bold flex items-center justify-center text-base shadow-xs shrink-0 overflow-hidden">
                  {selectedSupervisorForStudents.avatarUrl || selectedSupervisorForStudents.photoURL ? (
                    <img
                      src={selectedSupervisorForStudents.avatarUrl || selectedSupervisorForStudents.photoURL}
                      alt={selectedSupervisorForStudents.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (selectedSupervisorForStudents.fullName || 'R').charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {selectedSupervisorForStudents.fullName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedSupervisorForStudents.position} • {selectedSupervisorForStudents.academicDegree}
                  </p>
                  <p className="text-xs text-slate-500">
                    Kafedra: <strong className="text-slate-700">{selectedSupervisorForStudents.department}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsSupervisorStudentsModalOpen(false);
                  setSelectedSupervisorForStudents(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Yopish"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: List of Assigned Students */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {(() => {
                const assigned = students.filter(
                  st => st.supervisorId === selectedSupervisorForStudents.id && !st.isDeleted
                );

                if (assigned.length === 0) {
                  return (
                    <div className="text-center py-10">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                        <Users className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">Biriktirilgan talabalar yo‘q</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                        Ushbu ilmiy rahbar uchun hozircha birorta ham iqtidorli talaba biriktirilmagan. Talabalar profilini tahrirlash orqali ushbu rahbarga biriktirishingiz mumkin.
                      </p>
                    </div>
                  );
                }

                return (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Biriktirilgan talabalar: <span className="text-blue-900 font-bold">({assigned.length} nafar)</span>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                      {assigned.map(st => (
                        <div
                          key={st.id}
                          className="p-3.5 bg-white hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-blue-900 text-white font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden shadow-2xs">
                              {st.avatarUrl || st.photoURL ? (
                                <img src={st.avatarUrl || st.photoURL} alt={st.fullName} className="w-full h-full object-cover" />
                              ) : (
                                (st.fullName || 'T').charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 truncate">{st.fullName}</h4>
                              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                {st.faculty} • {st.course}-kurs • {st.group}-guruh
                              </p>
                              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                                {st.phone}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {onOpenStudentProfile && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsSupervisorStudentsModalOpen(false);
                                  setSelectedSupervisorForStudents(null);
                                  onOpenStudentProfile(st.id);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                              >
                                <span>Profilni ko‘rish</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsSupervisorStudentsModalOpen(false);
                  setSelectedSupervisorForStudents(null);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {isEditProjectModalOpen && editingProject && (
        <EditProjectModal
          isOpen={isEditProjectModalOpen}
          project={editingProject}
          actor={currentUser}
          supervisors={supervisors}
          onClose={() => {
            setIsEditProjectModalOpen(false);
            setEditingProject(null);
          }}
          onSaveSuccess={() => {}}
          onNotify={onNotify}
          onOpenPdf={onOpenPdf}
        />
      )}

      {/* Edit Certificate Modal */}
      {isEditCertModalOpen && editingCertificate && (
        <CertificateEditModal
          isOpen={isEditCertModalOpen}
          certificate={editingCertificate}
          actor={currentUser}
          onClose={() => {
            setIsEditCertModalOpen(false);
            setEditingCertificate(null);
          }}
          onSaveSuccess={() => {}}
          onNotify={onNotify}
        />
      )}

      {/* Revoke Certificate Modal */}
      {isRevokeCertModalOpen && revokingCertificate && (
        <RevokeCertificateModal
          isOpen={isRevokeCertModalOpen}
          certificate={revokingCertificate}
          actor={currentUser}
          onClose={() => {
            setIsRevokeCertModalOpen(false);
            setRevokingCertificate(null);
          }}
          onRevokeSuccess={() => {}}
          onNotify={onNotify}
        />
      )}

      {/* Universal Password Reset Modal */}
      {isResetPassModalOpen && resetPassUser && (
        <ResetPasswordModal
          isOpen={isResetPassModalOpen}
          targetUser={resetPassUser}
          actor={currentUser}
          onClose={() => {
            setIsResetPassModalOpen(false);
            setResetPassUser(null);
          }}
          onSuccess={() => {}}
          onNotify={onNotify}
        />
      )}

      {/* Top 3 Active Students Modal */}
      <TopStudentsManageModal
        isOpen={isTopStudentsModalOpen}
        onClose={() => setIsTopStudentsModalOpen(false)}
        currentUser={currentUser}
        students={students}
        supervisors={supervisors}
        projects={projects}
        achievements={achievements}
        onNotify={onNotify}
      />
    </div>
  );
};
