import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Mail, 
  Phone, 
  Award, 
  BookOpen, 
  Users, 
  CheckCircle2, 
  Search,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { teacherService } from '../../services/teacherService';

export const PublicTeachersPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const data = await teacherService.getTeachers();
        setTeachers(data);
      } catch (err) {
        console.error('Failed to load teachers', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  const filteredTeachers = teachers.filter((t) => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.role.toLowerCase().includes(search.toLowerCase()) ||
    (t.grades && t.grades.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-16 py-10 sm:py-16">
      {/* 1. Header Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50">
          <GraduationCap size={15} /> Experienced & Passionate Faculty
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          Meet Our English Educators
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Our teachers combine international certifications (CELTA, TESOL) with caring pedagogical methods, creating an inspiring, safe, and motivating classroom for every learner.
        </p>
      </section>

      {/* 2. Search & Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input 
              type="text"
              placeholder="Search teacher by name or level..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#0B1120] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 font-medium">
            <span>Faculty Members: <strong className="text-slate-900 dark:text-white">{filteredTeachers.length}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={13} /> 100% Certified TESOL / CELTA
            </span>
          </div>
        </div>
      </section>

      {/* 3. Teachers Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-72 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#111C32] rounded-3xl border border-slate-200 dark:border-[#29364D] p-8">
            <p className="text-slate-500 text-sm">No teachers match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTeachers.map((teacher) => (
              <div 
                key={teacher.id}
                className="group rounded-3xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] p-6 hover:shadow-xl hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src={teacher.avatar} 
                      alt={teacher.name}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/30 group-hover:ring-indigo-500 transition-all"
                    />
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                        {teacher.name}
                      </h3>
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                        {teacher.role}
                      </p>
                      <span className="inline-block mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Assigned: {teacher.grades || 'All Levels'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Active Classes:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{teacher.assignedClasses || 4} classes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Enrolled Students:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{teacher.activeStudents || 80}+ students</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Language Expertise:</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">English, Khmer</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                    <Award size={12} /> Certified Faculty
                  </span>

                  <Link 
                    to={`/enrollment`}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 inline-flex items-center gap-1"
                  >
                    Join Class <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Faculty Quality Pledge */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-100/80 dark:bg-[#0E1626] border border-slate-200 dark:border-[#1E293B] space-y-6">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Our Standards</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Our Teaching Guarantee</h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Every educator at ECC undergoes background checks, rigorous child protection training, and continuous professional development seminars every academic quarter.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Child-Safe Classrooms</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Strict safeguarding protocols ensuring a respectful, positive learning environment.</p>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Interactive Phonics</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Hands-on visual cards, storytelling, and songs that banish rote memorization.</p>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Parent Collaboration</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Direct teacher remarks and monthly evaluations shared via our secure parent portal.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

