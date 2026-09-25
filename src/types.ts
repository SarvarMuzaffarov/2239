export type UserRole = 'superAdmin' | 'admin' | 'student' | 'supervisor';

export type PermissionResource =
  | 'dashboard'
  | 'students'
  | 'supervisors'
  | 'events'
  | 'announcements'
  | 'projects'
  | 'startups'
  | 'achievements'
  | 'certificates'
  | 'language_certificates'
  | 'competitions'
  | 'statistics'
  | 'excel'
  | 'portfolio'
  | 'notifications'
  | 'admins'
  | 'audit_logs'
  | 'trash'
  | 'settings';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export';

export type AdminPermissions = {
  [key in PermissionResource]?: {
    [action in PermissionAction]?: boolean;
  };
};

export interface UserAccount {
  id: string;
  phone: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  fullName: string;
  isActive: boolean;
  avatarUrl?: string;
  photoURL?: string;
  email?: string;
  login?: string;
  position?: string;
  permissions?: AdminPermissions;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  lastLoginAt?: string;
  sessionStartedAt?: number;
  sessionLastActiveAt?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  course: number;
  group: string;
  facultyOrField: string;
  supervisorId: string;
  customSupervisorName?: string;
  avatarUrl?: string;
  photoURL?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt?: string;
  // Admin-designated Top 3 Active Student fields
  isTopStudent?: boolean;
  topStudentRank?: number; // 1, 2, or 3
  topStudentReason?: string; // Citation or achievements summary
  topStudentAssignedAt?: string;
  topStudentAssignedBy?: string;
}

export interface TopStudentAssignment {
  studentId: string;
  rank: number; // 1, 2, or 3
  reason?: string;
}

export interface SupervisorProfile {
  id: string;
  userId?: string;
  fullName: string;
  phone: string;
  email: string;
  position: string;
  academicDegree: string;
  department: string;
  avatarUrl?: string;
  photoURL?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminProfile {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email?: string;
  position?: string;
  permissions?: AdminPermissions;
  createdAt: string;
  createdBy: string;
  isActive: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface ProjectOrStartup {
  id: string;
  type: 'loyiha' | 'startap';
  title: string;
  description: string;
  field: string;
  supervisorId?: string;
  studentId: string;
  studentName: string;
  studentPhone?: string;
  authorNames: string;
  status: 'Kutilmoqda' | 'Tasdiqlangan' | 'Rad etilgan';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  storagePath?: string;
  fileDataUrl?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewNotes?: string;
}

export interface Achievement {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  category: 'Olimpiada' | 'Tanlov' | 'Konferensiya' | 'Stipendiya' | 'Musobaqa' | 'Boshqa yutuqlar';
  date: string;
  description: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  storagePath?: string;
  fileDataUrl?: string;
  status: 'Kutilmoqda' | 'Tasdiqlangan' | 'Rad etilgan';
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewNotes?: string;
}

export interface CertificateItem {
  id: string;
  certificateNumber: string;
  title: string;
  eventTitle: string;
  eventId?: string;
  studentId: string;
  studentName: string;
  organizationName: string;
  issueDate: string;
  status: 'Kutilmoqda' | 'Tasdiqlangan' | 'Rad etilgan' | 'Bekor qilingan';
  isOfficialGenerated?: boolean;
  isRevoked?: boolean;
  revokedAt?: string;
  revokedBy?: string;
  revokeReason?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  storagePath?: string;
  fileDataUrl?: string;
  qrCodeData?: string;
  createdAt: string;
  updatedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  // New dynamic fields for rich diploma/certificate design:
  documentType?: 'diplom' | 'sertifikat';
  subtitle?: string;
  presentedToText?: string;
  description?: string;
  competitionName?: string;
  nomination?: string;
  additionalNote?: string;
  signatoryName?: string;
  signatoryRole?: string;
  studentDirection?: string;
  confirmationText?: string;
  decisionNumber?: string;
  awardLevel?: string;
  signatoryDegree?: string;
  verificationUrl?: string;
  footerText?: string;
  additionalSignatureText?: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  deadline: string;
  status: 'Rejalashtirilgan' | 'Davom etmoqda' | 'Yakunlangan';
  participantIds: string[];
  createdAt: string;
  createdBy: string;
  eventType?: string;
  participantsLimit?: number;
  bannerUrl?: string;
  documentUrl?: string;
  eligibleDirections?: string[];
  eligibleCourses?: number[];
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  updatedAt?: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  studentId: string;
  registeredAt: string;
  status: 'Tasdiqlangan' | 'Kutilmoqda' | 'Bekor qilingan';
  studentName?: string;
  studentPhone?: string;
  studentCourse?: number;
  studentGroup?: string;
  studentFaculty?: string;
  supervisorId?: string;
  supervisorName?: string;
  projectId?: string;
  projectTitle?: string;
  projectDescription?: string;
  applicationStatus?: 'Kutilmoqda' | 'Tasdiqlangan' | 'Rad etilgan';
  rejectionReason?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  audience: 'Barcha talabalar' | 'Tanlangan talabalar' | 'Tadbir ishtirokchilari';
  targetStudentIds?: string[];
  targetEventId?: string;
  targetDirections?: string[];
  imageUrl?: string;
  isPublished?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  previousValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface DashboardStats {
  studentsCount: number;
  supervisorsCount: number;
  projectsCount: number;
  startupsCount: number;
  achievementsCount: number;
  certificatesCount: number;
  eventsCount: number;
  pendingApprovalsCount: number;
  courseDistribution: Record<number, number>;
}

export interface LanguageCertificate {
  id: string;
  studentId: string;
  studentName: string;
  studentPhone?: string;
  language: string; // Masalan: "Ingliz tili", "Nemis tili", "Fransuz tili", "Rus tili", "Koreys tili", "Xitoy tili", "Yapon tili", "Arab tili", "Turk tili", "Boshqa"
  certificateType: string; // Masalan: "IELTS", "TOEFL iBT", "CEFR / Milliy sertifikat", "Cambridge", "PTE", "Goethe-Zertifikat", "TestDaF", "DELF / DALF", "TCF", "TOPIK", "HSK", "JLPT", "TRKI / Milliy", "Boshqa"
  level: string; // Masalan: "A1", "A2", "B1", "B2", "C1", "C2"
  score?: string; // Masalan: "7.5", "95", "Level 4", "70 ball"
  certificateNumber: string; // Seriya va raqami
  issueDate: string; // Berilgan sana
  expiryDate?: string; // Amal qilish muddati (yoki "Muddatsiz")
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  storagePath?: string;
  fileDataUrl?: string;
  status: 'Kutilmoqda' | 'Tasdiqlangan' | 'Rad etilgan';
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewNotes?: string;
}

