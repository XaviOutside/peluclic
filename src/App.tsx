import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import Button from '@/components/atoms/Button';

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <h1 className="text-4xl font-bold text-gray-400">404</h1>
      <p className="mt-2 text-lg text-gray-600">Page not found</p>
      <Button variant="secondary" size="sm" className="mt-6" onClick={() => window.history.pushState({}, '', '/clients')}>
        <a href="/clients">Go to Clients</a>
      </Button>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <a
              href="/"
              className="text-xl font-semibold text-gray-900 hover:text-gray-700"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/clients';
              }}
            >
              PF Master
            </a>
            <nav className="flex gap-4">
              <a
                href="/clients"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = '/clients';
                }}
              >
                Clients
              </a>
              <a
                href="/pets"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = '/pets';
                }}
              >
                Pets
              </a>
              <a
                href="/services"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = '/services';
                }}
              >
                Services
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Navigate to="/clients" replace />} />
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
