import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  GraduationCap,
  Users,
  FileText,
  Rocket,
  Award,
  ShieldCheck,
  Calendar,
  Search,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Eye,
  Building,
  UserCheck
} from 'lucide-react';
import { canonicalizeDirection } from '../constants/directions';
import type {
  StudentProfile,
  SupervisorProfile,
  ProjectOrStartup,
  Achievement,
  CertificateItem,
  EventItem,
} from '../types';

interface Props {
  directionName: string;
  students: StudentProfile[];
  supervisors: SupervisorProfile[];
  projects: ProjectOrStartup[];
  achievements: Achievement[];
  certificates: CertificateItem[];
  events: EventItem[];
  onBack: () => void;
  onOpenProjectDetail: (project: ProjectOrStartup) => void;
  onOpenVerifyModal: (certId?: string) => void;
}

export const DirectionDetailView: React.FC<Props> = ({
  directionName,
  students,
  supervisors,
  projects,
  achievements,
  certificates,
  events,
  onBack,
  onOpenProjectDetail,
  onOpenVerifyModal,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'students' | 'achievements'>('overview');
  const [searchStudent, setSearchStudent] = useState('');

  // Direction students (Public-safe: NO phone, NO password, NO private notes)
  const directionStudents = useMemo(() => {
    return students.filter(s => canonicalizeDirection(s.facultyOrField) === directionName);
  }, [students, directionName]);

  // Filtered public students search
  const filteredStudents = useMemo(() => {
    if (!searchStudent.trim()) return directionStudents;
    const q = searchStudent.toLowerCase().trim();
    return directionStudents.filter(
      s => s.fullName.toLowerCase().includes(q) || s.group.toLowerCase().includes(q)
    );
  }, [directionStudents, searchStudent]);

  // Direction approved projects
  const directionProjects = useMemo(() => {
    return projects.filter(
      p => canonicalizeDirection(p.field) === directionName && p.status === 'Tasdiqlangan'
    );
  }, [projects, directionName]);

  const directionStartups = useMemo(() => {
    return directionProjects.filter(p => p.type === 'startap');
  }, [directionProjects]);

  const directionAcademicProjects = useMemo(() => {
    return directionProjects.filter(p => p.type === 'loyiha');
  }, [directionProjects]);

  // Direction achievements (matching students in this direction)
  const directionStudentIds = useMemo(() => {
    return new Set(directionStudents.map(s => s.id));
  }, [directionStudents]);

  const directionAchievements = useMemo(() => {
    return achievements.filter(
      a => directionStudentIds.has(a.studentId) && a.status === 'Tasdiqlangan'
    );
  }, [achievements, directionStudentIds]);

  // Direction certificates
  const directionCertificates = useMemo(() => {
    return certificates.filter(
      c => directionStudentIds.has(c.studentId) || (c.studentDirection && canonicalizeDirection(c.studentDirection) === directionName)
    );
  }, [certificates, directionStudentIds, directionName]);

  return (
    <div className="w-full space-y-6 pb-16">
      {/* Back Navigation Button */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Barcha yo‘nalishlarga qaytish</span>
        </button>
      </div>

      {/* Direction Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-900 text-xs font-semibold">
              <Building className="w-3.5 h-3.5" />
              <span>Bakalavriat ta'lim yo‘nalishi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {directionName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Toshkent kimyo-texnologiya instituti Yangiyer filialining rasmiy ta'lim yo‘nalishi bo‘yicha iqtidorli talabalar reyestri, ilmiy loyihalar va erishilgan natijalar.
            </p>
          </div>
        </div>

        {/* Direction Key Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
            <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold mb-1">
              <GraduationCap className="w-4 h-4" />
              <span>Talabalar soni</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{directionStudents.length}</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
            <div className="flex items-center gap-2 text-blue-800 text-xs font-semibold mb-1">
              <FileText className="w-4 h-4" />
              <span>Ilmiy loyihalar</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{directionAcademicProjects.length}</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
            <div className="flex items-center gap-2 text-amber-800 text-xs font-semibold mb-1">
              <Rocket className="w-4 h-4" />
              <span>Startaplar</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{directionStartups.length}</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
            <div className="flex items-center gap-2 text-rose-800 text-xs font-semibold mb-1">
              <Award className="w-4 h-4" />
              <span>Yutuqlar</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{directionAchievements.length}</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 text-teal-800 text-xs font-semibold mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Sertifikatlar</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{directionCertificates.length}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Umumiy ma'lumot</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'projects'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Loyihalar va startaplar ({directionProjects.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'students'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Iqtidorli talabalar ({directionStudents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('achievements')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'achievements'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Yutuqlar ({directionAchievements.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Recent projects in this direction */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  Ushbu yo‘nalishdagi so‘nggi tasdiqlangan loyihalar
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('projects')}
                  className="text-xs font-semibold text-blue-900 hover:underline"
                >
                  Barchasi ({directionProjects.length})
                </button>
              </div>

              {directionProjects.length > 0 ? (
                <div className="space-y-3">
                  {directionProjects.slice(0, 3).map(proj => (
                    <div
                      key={proj.id}
                      className="p-4 rounded-xl border border-slate-100 hover:border-blue-200 bg-slate-50/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              proj.type === 'startap'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-900'
                            }`}
                          >
                            {proj.type === 'startap' ? 'Startap' : 'Loyiha'}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {proj.createdAt ? proj.createdAt.slice(0, 10) : ''}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{proj.title}</h4>
                        <p className="text-xs text-slate-600 line-clamp-1">{proj.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenProjectDetail(proj)}
                        className="px-3 py-1.5 text-xs font-semibold text-blue-900 bg-white border border-slate-200 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                      >
                        Batafsil
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Hozircha ushbu yo‘nalishda tasdiqlangan loyihalar mavjud emas.
                </p>
              )}
            </div>

            {/* Achievements in this direction */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  Erishilgan yutuqlar
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('achievements')}
                  className="text-xs font-semibold text-blue-900 hover:underline"
                >
                  Barchasi ({directionAchievements.length})
                </button>
              </div>

              {directionAchievements.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {directionAchievements.slice(0, 4).map(ach => (
                    <div
                      key={ach.id}
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                          {ach.category}
                        </span>
                        <span className="text-slate-400 font-mono">{ach.date}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{ach.title}</h4>
                      <p className="text-[11px] text-slate-500">Talaba: {ach.studentName}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Hozircha yutuqlar qayd etilmagan.
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Direction info & quick facts */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Yo‘nalish ko‘rsatkichlari
              </h3>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span>Jami ro‘yxatga olingan talabalar:</span>
                  <strong className="text-slate-900">{directionStudents.length} nafar</strong>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span>Tasdiqlangan ilmiy loyihalar:</span>
                  <strong className="text-slate-900">{directionAcademicProjects.length} ta</strong>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span>Innovatsion startaplar:</span>
                  <strong className="text-slate-900">{directionStartups.length} ta</strong>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span>Rasmiy sertifikatlar:</span>
                  <strong className="text-slate-900">{directionCertificates.length} ta</strong>
                </div>
              </div>
            </div>

            {/* University verification notice */}
            <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Davlat va institut standarti</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ushbu yo‘nalish talabalari filial ilmiy kengashi hamda kafedralar tomonidan tasdiqlangan dasturlar asosida tadqiqot olib boradilar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Projects */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          {directionProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {directionProjects.map(project => (
                <div
                  key={project.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                          project.type === 'startap'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        {project.type === 'startap' ? 'Startap' : 'Ilmiy loyiha'}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Tasdiqlangan
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                      {project.title}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {project.description}
                    </p>

                    <div className="text-xs text-slate-500 pt-1">
                      Mualliflar: <span className="text-slate-700">{project.authorNames || project.studentName}</span>
                    </div>
                  </div>

                  <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {project.createdAt ? project.createdAt.slice(0, 10) : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenProjectDetail(project)}
                      className="px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Tafsilotlar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">Ushbu yo‘nalishda loyihalar mavjud emas</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Students (Public-safe: F.I.Sh, Kurs, Guruh, Ilmiy rahbar - NO phone, NO password) */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Ushbu yo‘nalishdagi iqtidorli talabalar
              </h3>
              <p className="text-xs text-slate-500">
                Jami {directionStudents.length} nafar iqtidorli talaba ro‘yxatga olingan
              </p>
            </div>

            <div className="w-full sm:w-64 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchStudent}
                onChange={e => setSearchStudent(e.target.value)}
                placeholder="F.I.Sh yoki guruh bo‘yicha..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          {filteredStudents.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredStudents.map((student, idx) => {
                const supervisor = supervisors.find(sup => sup.id === student.supervisorId);
                const supName = supervisor ? supervisor.fullName : student.customSupervisorName || 'Biriktirilmagan';

                return (
                  <div
                    key={student.id || idx}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/80 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {student.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{student.fullName}</p>
                        <p className="text-xs text-slate-500">
                          {student.course}-kurs • {student.group}-guruh
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 sm:text-right">
                      <span className="text-slate-400 block text-[11px]">Ilmiy rahbar:</span>
                      <strong className="text-slate-800 font-semibold">{supName}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-6">
              Talabalar topilmadi.
            </p>
          )}
        </div>
      )}

      {/* Tab: Achievements */}
      {activeTab === 'achievements' && (
        <div className="space-y-4">
          {directionAchievements.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {directionAchievements.map(ach => (
                <div
                  key={ach.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                      {ach.category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{ach.date}</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                    {ach.title}
                  </h4>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {ach.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                    <span>Talaba: <strong className="text-slate-800">{ach.studentName}</strong></span>
                    <span className="text-emerald-700 font-bold">Tasdiqlangan</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
              <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">Ushbu yo‘nalishda tasdiqlangan yutuqlar hozircha mavjud emas</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
