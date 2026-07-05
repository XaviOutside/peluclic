import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import LandingPage from '@/pages/LandingPage';
import ClientListPage from '@/pages/ClientListPage';
import ClientCreatePage from '@/pages/ClientCreatePage';
import ClientDetailPage from '@/pages/ClientDetailPage';
import ClientEditPage from '@/pages/ClientEditPage';
import PetListPage from '@/pages/PetListPage';
import PetCreatePage from '@/pages/PetCreatePage';
import PetDetailPage from '@/pages/PetDetailPage';
import PetEditPage from '@/pages/PetEditPage';
import ServiceListPage from '@/pages/ServiceListPage';
import ServiceCreatePage from '@/pages/ServiceCreatePage';
import ServiceDetailPage from '@/pages/ServiceDetailPage';
import ServiceEditPage from '@/pages/ServiceEditPage';
function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <h1 className="font-headline text-display-lg text-outline">404</h1>
      <p className="mt-2 text-body-lg text-on-surface-variant">Page not found</p>
      <NavLink
        to="/"
        className="mt-6 inline-flex items-center justify-center rounded-md border border-outline-variant bg-surface-container-high px-4 py-2 text-label-md font-headline text-on-surface transition-all duration-150 hover:bg-surface-container-highest focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        Go Home
      </NavLink>
    </div>
  );
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-label-md font-headline font-medium transition-colors duration-150 ${
    isActive
      ? 'text-primary'
      : 'text-on-surface-variant hover:text-on-surface'
  }`;

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        {/* ── Header / Nav ── */}
        <header className="sticky top-0 z-40 border-b border-outline-variant bg-surface/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-[--container-max] items-center justify-between px-gutter py-4">
            {/* Logo / Brand */}
            <NavLink
              to="/"
              className="flex items-center gap-2 font-headline text-headline-md text-on-surface hover:text-primary transition-colors duration-150"
            >
              <svg className="h-8 w-8 text-primary" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
                <path d="M16 2c-2.5 0-4.5 1.2-5.8 3C8.8 3.2 6.8 2 4 2 2 2 0 4 0 6.5 0 13 6 22 16 30 26 22 32 13 32 6.5 32 4 30 2 28 2c-2.8 0-4.8 1.2-6.2 3C20.5 3.2 18.5 2 16 2z" />
              </svg>
              <span className="hidden sm:inline">PawManage</span>
            </NavLink>

            {/* Navigation */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <NavLink to="/clients" className={navLinkClass}>
                Clients
              </NavLink>
              <NavLink to="/pets" className={navLinkClass}>
                Pets
              </NavLink>
              <NavLink to="/services" className={navLinkClass}>
                Services
              </NavLink>
            </nav>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main className="mx-auto max-w-[--container-max] px-gutter py-8">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/clients" element={<ClientListPage />} />
            <Route path="/clients/new" element={<ClientCreatePage />} />
            <Route path="/clients/:id" element={<ClientDetailPage />} />
            <Route path="/clients/:id/edit" element={<ClientEditPage />} />
            <Route path="/pets" element={<PetListPage />} />
            <Route path="/pets/new" element={<PetCreatePage />} />
            <Route path="/pets/:id" element={<PetDetailPage />} />
            <Route path="/pets/:id/edit" element={<PetEditPage />} />
            <Route path="/services" element={<ServiceListPage />} />
            <Route path="/services/new" element={<ServiceCreatePage />} />
            <Route path="/services/:id" element={<ServiceDetailPage />} />
            <Route path="/services/:id/edit" element={<ServiceEditPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
