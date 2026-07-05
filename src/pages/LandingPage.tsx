import { NavLink } from 'react-router-dom';

/* ------------------------------------------------------------------ */
/*  Service preview card                                              */
/* ------------------------------------------------------------------ */
interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function ServiceCard({ icon, title, description }: ServiceCardProps) {
  return (
    <div className="group rounded-xl border border-outline-variant bg-surface-container-lowest p-card-padding shadow-card transition-all duration-200 hover:shadow-modal hover:-translate-y-0.5">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-headline text-body-lg font-semibold text-on-surface">{title}</h3>
      <p className="mt-2 text-body-md text-on-surface-variant leading-relaxed">{description}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat card for dashboard                                           */
/* ------------------------------------------------------------------ */
interface StatCardProps {
  label: string;
  href: string;
  icon: React.ReactNode;
  accent: string;
  textAccent: string;
}

function StatCard({ label, href, icon, accent, textAccent }: StatCardProps) {
  return (
    <NavLink
      to={href}
      className="group relative overflow-hidden rounded-xl bg-surface-container-lowest p-card-padding shadow-card transition-all duration-200 hover:shadow-modal hover:-translate-y-0.5"
    >
      <div className={`absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full opacity-10 ${accent}`} />
      <div className="relative flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${accent}`}>
          <div className={textAccent}>{icon}</div>
        </div>
        <div>
          <p className="font-headline text-headline-md text-on-surface">{label}</p>
          <p className="mt-1 text-label-md text-on-surface-variant">View all &rarr;</p>
        </div>
      </div>
    </NavLink>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick link card                                                   */
/* ------------------------------------------------------------------ */
interface QuickLinkProps {
  to: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

function QuickLink({ to, label, description, icon }: QuickLinkProps) {
  return (
    <NavLink
      to={to}
      className="group flex items-start gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 transition-all duration-150 hover:border-primary/30 hover:shadow-card"
    >
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
        {icon}
      </div>
      <div>
        <p className="font-headline text-body-md font-semibold text-on-surface group-hover:text-primary transition-colors">
          {label}
        </p>
        <p className="mt-1 text-caption text-on-surface-variant">{description}</p>
      </div>
    </NavLink>
  );
}

/* ================================================================== */
/*  Landing Page                                                       */
/* ================================================================== */
export default function LandingPage() {
  return (
    <div className="space-y-16">
      {/* ── Hero ── */}
      <section className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <svg className="h-10 w-10 text-primary" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
            <path d="M16 2c-2.5 0-4.5 1.2-5.8 3C8.8 3.2 6.8 2 4 2 2 2 0 4 0 6.5 0 13 6 22 16 30 26 22 32 13 32 6.5 32 4 30 2 28 2c-2.8 0-4.8 1.2-6.2 3C20.5 3.2 18.5 2 16 2z" />
          </svg>
        </div>
        <p className="text-label-md tracking-wide text-primary uppercase">Peluquería Canina en Girona</p>
        <h1 className="mt-3 font-headline text-display-lg text-on-surface">
          Bienvenido a{' '}
          <span className="text-primary">PawManage</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-body-lg text-on-surface-variant">
          Cuidamos de tu mascota con amor y profesionalidad. Gestioná clientes, mascotas y servicios de grooming — todo en un solo lugar.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <NavLink
            to="/clients/new"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-label-md font-headline font-medium text-on-primary shadow-card transition-all duration-150 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Cliente
          </NavLink>
          <NavLink
            to="/services"
            className="inline-flex items-center gap-2 rounded-md border border-outline-variant bg-surface-container-high px-6 py-3 text-label-md font-headline font-medium text-on-surface transition-all duration-150 hover:bg-surface-container-highest focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Reservar Cita
          </NavLink>
        </div>
      </section>

      {/* ── About ── */}
      <section className="mx-auto max-w-3xl text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary/20">
            <svg className="h-7 w-7 text-secondary-container" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
              <path d="M16 2c-2.5 0-4.5 1.2-5.8 3C8.8 3.2 6.8 2 4 2 2 2 0 4 0 6.5 0 13 6 22 16 30 26 22 32 13 32 6.5 32 4 30 2 28 2c-2.8 0-4.8 1.2-6.2 3C20.5 3.2 18.5 2 16 2z" />
            </svg>
          </div>
        </div>
        <h2 className="font-headline text-headline-lg text-on-surface">Amamos a los animales</h2>
        <p className="mt-4 text-body-lg text-on-surface-variant leading-relaxed">
          Nuestro equipo de profesionales cuenta con años de experiencia en peluquería canina, ofreciendo el mejor trato y cuidado para que tu mascota se sienta como en casa.
        </p>
      </section>

      {/* ── Services Preview ── */}
      <section>
        <h2 className="text-center font-headline text-headline-lg text-on-surface">Nuestros Servicios</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <ServiceCard
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8a4 4 0 014-4h10a4 4 0 014 4v1a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v4M17 4v4M3 12h18" />
              </svg>
            }
            title="Baño y Cepillado"
            description="Limpieza profunda con champús específicos para el tipo de piel y manto, seguido de un cepillado experto para eliminar nudos y pelo muerto."
          />
          <ServiceCard
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
              </svg>
            }
            title="Corte de Pelo"
            description="Cortes a tijera o máquina respetando el estándar de la raza o a gusto del cliente, buscando siempre la comodidad y bienestar del animal."
          />
          <ServiceCard
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            }
            title="Stripping"
            description="Técnica manual especializada para razas de pelo duro, favoreciendo la renovación del pelaje y manteniendo su textura y color naturales."
          />
        </div>
      </section>

      {/* ── Sections ── */}
      <section>
        <h2 className="text-center font-headline text-headline-lg text-on-surface">Acceso Rápido</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Clientes"
            href="/clients"
            accent="bg-primary"
            textAccent="text-on-primary"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
          <StatCard
            label="Mascotas"
            href="/pets"
            accent="bg-secondary"
            textAccent="text-on-secondary-container"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            }
          />
          <StatCard
            label="Servicios"
            href="/services"
            accent="bg-tertiary"
            textAccent="text-on-tertiary"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
              </svg>
            }
          />
        </div>
      </section>

      {/* ── Quick Actions ── */}
      <section>
        <h2 className="text-center font-headline text-headline-lg text-on-surface">Acciones rápidas</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <QuickLink
            to="/clients/new"
            label="Añadir Cliente"
            description="Registrá un nuevo dueño con sus datos de contacto."
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            }
          />
          <QuickLink
            to="/pets/new"
            label="Registrar Mascota"
            description="Añadí una mascota con su raza, edad y notas médicas."
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            }
          />
          <QuickLink
            to="/services/new"
            label="Crear Servicio"
            description="Definí un tratamiento con nombre, duración y precio."
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            }
          />
          <QuickLink
            to="/clients"
            label="Buscar Cliente"
            description="Consultá el historial y datos de tus clientes."
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
      </section>

      {/* ── Contact CTA ── */}
      <section className="rounded-2xl bg-primary p-card-padding text-center text-on-primary shadow-card sm:p-10">
        <p className="text-label-md tracking-wide text-primary-container/80 uppercase">¿Tenés dudas?</p>
        <p className="mt-2 font-headline text-headline-lg">Llámanos para más info</p>
        <p className="mt-2 font-headline text-display-lg tracking-tight">+34 123 456 789</p>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-outline-variant pt-6 text-center">
        <p className="text-caption text-outline">
          PawManage &mdash; Peluquería Canina en Girona
        </p>
      </footer>
    </div>
  );
}
