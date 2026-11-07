import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Clock, 
  Users, 
  Star, 
  ArrowRight, 
  CheckCircle2, 
  Filter,
  Sparkles
} from 'lucide-react';
import { courseService } from '../../services/courseService';

export const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await courseService.getCourses();
        setCourses(data);
      } catch (err) {
        console.error('Failed to load courses', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const categories = ['All', 'Young Learners (Ages 4-6)', 'Primary Starters (Ages 6-9)', 'General (Kids & Teens)', 'Upper Secondary & Academic', 'Exam Prep'];

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = 
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.nameKhmer && course.nameKhmer.includes(searchQuery)) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-12 py-10 sm:py-16">
      {/* 1. Header & Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
          <Sparkles size={14} /> Comprehensive English Curriculum
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          Explore Our English Courses
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          From early childhood phonics to rigorous IELTS band preparation, find the ideal structured program with certified instructors and interactive learning.
        </p>
      </section>

      {/* 2. Search & Category Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-[#111C32] p-4 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-[#29364D] shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Search course name, Khmer name, or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#0B1120] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Total Results Count */}
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing <span className="font-bold text-slate-900 dark:text-white">{filteredCourses.length}</span> course programs
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1 shrink-0 mr-1">
              <Filter size={13} /> Filter:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl font-medium shrink-0 transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                    : 'bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Course Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#111C32] rounded-3xl border border-slate-200 dark:border-[#29364D] p-8">
            <BookOpen size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No courses found</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Try adjusting your search terms or clearing selected categories.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <div 
                key={course.id}
                className="group flex flex-col rounded-3xl bg-white dark:bg-[#111C32] border border-slate-200/90 dark:border-[#29364D] overflow-hidden hover:shadow-xl hover:border-indigo-500/40 transition-all duration-300"
              >
                {/* Course Image */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img 
                    src={course.image} 
                    alt={course.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 backdrop-blur-sm shadow-sm">
                      {course.category}
                    </span>
                    {course.badge && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-sm">
                        {course.badge}
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[11px] font-bold bg-black/60 text-white backdrop-blur-sm flex items-center gap-1">
                    <Star size={12} className="text-amber-400 fill-amber-400" /> {course.rating}
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 font-khmer">
                      {course.nameKhmer}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {course.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  {/* Highlights */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {course.objectives?.slice(0, 2).map((obj, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{obj}</span>
                      </div>
                    ))}
                  </div>

                  {/* Meta details */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1">
                      <Clock size={13} /> {course.duration}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <Users size={13} /> {course.suitableAge}
                    </span>
                  </div>

                  {/* Pricing and Action */}
                  <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Monthly Tuition</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white">
                        ${course.monthlyPrice}
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400"> /mo</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link 
                        to={`/courses/${course.slug || course.id}`}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
                        title="View Course Details"
                      >
                        Details
                      </Link>
                      <Link 
                        to={`/enrollment?course=${encodeURIComponent(course.name)}`}
                        className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1 shadow-sm transition-colors"
                      >
                        Enroll <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Bottom Consultation Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-8 sm:p-12 relative overflow-hidden shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Not sure which course fits your child?
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
              Book a free 20-minute English placement test at our campus or consult with our academic advisor online.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link 
              to="/enrollment"
              className="px-6 py-3 rounded-2xl bg-white text-indigo-950 font-bold text-xs sm:text-sm hover:bg-indigo-50 shadow-md transition-all"
            >
              Book Placement Assessment
            </Link>
            <Link 
              to="/contact"
              className="px-5 py-3 rounded-2xl bg-indigo-700/60 hover:bg-indigo-700 border border-indigo-400/30 text-white font-semibold text-xs sm:text-sm transition-all"
            >
              Talk to Advisor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

