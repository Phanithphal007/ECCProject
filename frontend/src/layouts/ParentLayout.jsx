import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ParentSidebar } from '../components/portal/ParentSidebar';
import { Header } from '../components/Header';
import { ToastContainer } from '../components/ToastContainer';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { useApp } from '../context/useApp';

export const ParentLayout = () => {
  const location = useLocation();
  const { setActiveTab } = useApp();

  // Sync activeTab state from URL path
  useEffect(() => {
    const path = location.pathname.replace(/^\/parent\/?/, '');
    if (path) {
      const topSegment = path.split('/')[0];
      if (topSegment === 'dashboard' || topSegment === 'overview') {
        setActiveTab('parent-overview');
      } else {
        setActiveTab(`parent-${topSegment}`);
      }
    } else {
      setActiveTab('parent-overview');
    }
  }, [location.pathname, setActiveTab]);

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-[#F8FAFC] flex overflow-hidden transition-colors duration-200">
      <ParentSidebar />

      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full">
        <Header />

        <main className="flex-1 min-h-0 p-3 xs:p-4 sm:p-6 lg:p-6 xl:p-8 safe-area-bottom pb-10 sm:pb-6 overflow-y-auto overflow-x-hidden">
          <Suspense fallback={<LoadingSkeleton count={4} />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <ToastContainer />
    </div>
  );
};

