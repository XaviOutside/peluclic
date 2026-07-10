import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Sidebar from '@/components/organisms/Sidebar';
import MobileNav from '@/components/organisms/MobileNav';
import LandingPage from '@/pages/LandingPage';
import ClientsPage from '@/pages/ClientsPage';
import ClientCreatePage from '@/pages/ClientCreatePage';
import ClientDetailPage from '@/pages/ClientDetailPage';
import ClientEditPage from '@/pages/ClientEditPage';
import PetsPage from '@/pages/PetsPage';
import PetCreatePage from '@/pages/PetCreatePage';
import PetDetailPage from '@/pages/PetDetailPage';
import PetEditPage from '@/pages/PetEditPage';
import ServicesPage from '@/pages/ServicesPage';
import ServiceCreatePage from '@/pages/ServiceCreatePage';
import ServiceDetailPage from '@/pages/ServiceDetailPage';
import ServiceEditPage from '@/pages/ServiceEditPage';

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <h1 className="font-headline text-headline-xl text-outline">404</h1>
      <p className="mt-2 text-body-lg text-on-surface-variant">
        Página no encontrada
      </p>
      <NavLink
        to="/"
        className="mt-6 inline-flex items-center justify-center rounded-lg border border-outline-variant bg-surface-container-high px-4 py-2 font-label text-label-md text-on-surface transition-all duration-150 hover:bg-surface-container-highest focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        Volver al inicio
      </NavLink>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-background text-on-surface antialiased md:flex-row">
        <Sidebar />

        {/* Main content — offset by sidebar width on desktop */}
        <main className="flex-1 pb-24 md:ml-64 md:pb-8">
          <div className="mx-auto w-full max-w-[--container-max] px-4 py-4 md:px-gutter md:py-8">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/clients/new" element={<ClientCreatePage />} />
              <Route path="/clients/:id" element={<ClientDetailPage />} />
              <Route path="/clients/:id/edit" element={<ClientEditPage />} />
              <Route path="/pets" element={<PetsPage />} />
              <Route path="/pets/new" element={<PetCreatePage />} />
              <Route path="/pets/:id" element={<PetDetailPage />} />
              <Route path="/pets/:id/edit" element={<PetEditPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/services/new" element={<ServiceCreatePage />} />
              <Route path="/services/:id" element={<ServiceDetailPage />} />
              <Route path="/services/:id/edit" element={<ServiceEditPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </main>

        <MobileNav />
      </div>
    </BrowserRouter>
  );
}
