import { Suspense, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { ToastContainer } from '../components/ToastContainer';
import { CommandPalette } from '../components/CommandPalette';
import { StudentDetailModal } from '../components/StudentDetailModal';
import { AddStudentModal } from '../components/AddStudentModal';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { useApp } from '../context/useApp';

export const AdminLayout = () => {
  const location = useLocation();
  const { setActiveTab } = useApp();

  // Sync activeTab state from URL path
  useEffect(() => {
    const path = location.pathname.replace(/^\/admin\/?/, '');
    if (path) {
      const topSegment = path.split('/')[0];
      if (topSegment) {
        setActiveTab(topSegment);
      }
    } else {
      setActiveTab('dashboard');
    }
  }, [location.pathname, setActiveTab]);

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-[#F8FAFC] flex overflow-hidden transition-colors duration-200">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full">
        <Header />

        <main className="flex-1 min-h-0 p-3 xs:p-4 sm:p-6 lg:p-6 xl:p-8 safe-area-bottom pb-10 sm:pb-6 overflow-y-auto overflow-x-hidden">
          <Suspense fallback={<LoadingSkeleton count={4} />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* Global Interactive Modals and Floating Elements */}
      <ToastContainer />
      <CommandPalette />
      <StudentDetailModal />
      <AddStudentModal />
    </div>
  );
};

