import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/organisms/Sidebar';
import MobileNav from '@/components/organisms/MobileNav';

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface antialiased md:flex-row">
      <Sidebar />

      {/* Main content — offset by sidebar width on desktop */}
      <main className="flex-1 pb-24 md:ml-64 md:pb-8">
        <div className="mx-auto w-full max-w-[--container-max] px-4 py-4 md:px-gutter md:py-8">
          <Outlet />
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
