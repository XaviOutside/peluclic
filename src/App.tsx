import { Routes, Route, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicLayout from '@/components/templates/PublicLayout';
import DashboardLayout from '@/components/templates/DashboardLayout';
import LandingPage from '@/pages/LandingPage';
import ClientsPage from '@/pages/ClientsPage';
import ClientCreatePage from '@/pages/ClientCreatePage';
import ClientDetailPage from '@/pages/ClientDetailPage';
import ClientEditPage from '@/pages/ClientEditPage';
import PetsPage from '@/pages/PetsPage';
import PetCreatePage from '@/pages/PetCreatePage';
import PetDetailPage from '@/pages/PetDetailPage';
import PetEditPage from '@/pages/PetEditPage';
import RegisterPage from '@/pages/RegisterPage';
import ServicesPage from '@/pages/ServicesPage';
import ServiceCreatePage from '@/pages/ServiceCreatePage';
import ServiceDetailPage from '@/pages/ServiceDetailPage';
import ServiceEditPage from '@/pages/ServiceEditPage';
import SettingsPage from '@/pages/SettingsPage';
import AppointmentsPage from '@/pages/AppointmentsPage';

function NotFoundPage() {
  const { t } = useTranslation('common');

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <h1 className="font-headline text-headline-xl text-outline">{t('notFound.title')}</h1>
      <p className="mt-2 text-body-lg text-on-surface-variant">
        {t('notFound.message')}
      </p>
      <NavLink
        to="/"
        className="mt-6 inline-flex items-center justify-center rounded-lg border border-outline-variant bg-surface-container-high px-4 py-2 font-label text-label-md text-on-surface transition-all duration-150 hover:bg-surface-container-highest focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {t('notFound.backHome')}
      </NavLink>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public routes — full-width, no sidebar/mobile nav */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Dashboard routes — sidebar + mobile nav chrome */}
      <Route element={<DashboardLayout />}>
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
        <Route path="/calendar" element={<AppointmentsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
