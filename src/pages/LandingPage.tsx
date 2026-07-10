import { NavLink } from 'react-router-dom';

/* ═══════════════════════════════════════════════════════════════════════════
   SVG Icons — equivalents to Material Symbols in the HTML
   ═══════════════════════════════════════════════════════════════════════════ */

const PetsIcon = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const c = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-9 w-9' : 'h-6 w-6';
  return <svg className={c} viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 2c-2.5 0-4.5 1.2-5.8 3C8.8 3.2 6.8 2 4 2 2 2 0 4 0 6.5 0 13 6 22 16 30 26 22 32 13 32 6.5 32 4 30 2 28 2c-2.8 0-4.8 1.2-6.2 3C20.5 3.2 18.5 2 16 2z" /></svg>;
};

const CalendarIcon = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const c = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-9 w-9' : 'h-6 w-6';
  return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
};

const GroupIcon = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const c = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-9 w-9' : 'h-6 w-6';
  return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
};

const CutIcon = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const c = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-9 w-9' : 'h-6 w-6';
  return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" /></svg>;
};

const HomeIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
);

const EventIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
);

const PersonIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);

const MenuIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
);

const HERO_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCP-2mYS7jEBiaj96KxUzIEoVrDgBH7ztDf1MC8dzTuE96cNVVrENH_iCSrjDJpKi1jGO4opzISofyKXyV7ugm0S7ubPvbRPBx_ZZK_NT1B03uV1UwH56LafVJD9CL4unewK9c0nuSe6B1dQYpsEBy9B5SArfRvP-65qp6hsrk0WSzbKCQ_NlU7msqVJsuKrVeqvPNm8e6jB4cqnSpWaE1dTtc1mnFL3STBfxW7uCCfAa6UtoBT36ame0NharO-z7K24ibIeOPxYu8';

/* ═══════════════════════════════════════════════════════════════════════════
   Landing Page — matches pantalla_inicial_desktop.html
   ═══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <>
      {/* ── Hero Section ── */}
      <section className="mx-auto max-w-[--container-max] px-[--spacing-margin-mobile] py-12 md:grid md:grid-cols-2 md:items-center md:gap-12 md:px-[--spacing-margin-desktop] md:py-24">
        <div className="space-y-6">
          <h1 className="text-headline-xl-mobile text-on-surface md:text-headline-xl">
            Manage your grooming salon with ease.
          </h1>
          <p className="max-w-lg text-body-lg text-on-surface-variant">
            Pawsitive Manager helps you streamline appointments, track customer preferences, and provide the best care for every pet.
          </p>
          <div className="flex flex-col gap-4 pt-4 sm:flex-row">
            <NavLink
              to="/clients/new"
              className="inline-flex w-full items-center justify-center rounded-full bg-primary-container px-8 py-3 text-label-md font-semibold text-on-primary-container transition-colors hover:bg-surface-tint sm:w-auto"
            >
              Prueba gratis
            </NavLink>
            <NavLink
              to="/services"
              className="inline-flex w-full items-center justify-center rounded-full bg-secondary-container px-8 py-3 text-label-md font-semibold text-on-secondary-container transition-colors hover:bg-secondary-fixed sm:w-auto"
            >
              Ver Demo
            </NavLink>
          </div>
        </div>
        <div className="relative mt-8 h-[400px] overflow-hidden rounded-2xl shadow-xl shadow-primary-container/20 md:mt-0 md:h-[500px]">
          <img
            className="absolute inset-0 h-full w-full rounded-2xl object-cover"
            alt="A modern, bright dog grooming salon interior with clean white walls and subtle teal accents. A happy, fluffy white poodle is standing on a grooming table, looking at the camera."
            src={HERO_IMAGE}
          />
        </div>
      </section>

      {/* ── Features Bento Grid ── */}
      <section className="mx-auto max-w-[--container-max] px-[--spacing-margin-mobile] py-16 md:px-[--spacing-margin-desktop]">
        <h2 className="mb-12 text-center text-headline-lg text-on-surface">Everything you need to run your salon</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

          {/* Feature 1: Smart Scheduling — wide */}
          <div className="group relative col-span-1 overflow-hidden rounded-2xl border border-surface-variant bg-surface-bright p-8 shadow-sm transition-shadow hover:shadow-md md:col-span-2">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-container/10 blur-2xl transition-colors group-hover:bg-primary-container/20" />
            <div className="relative">
              <div className="mb-4 text-primary-container"><CalendarIcon size="lg" /></div>
              <h3 className="mb-2 text-headline-md text-on-surface">Smart Scheduling</h3>
              <p className="max-w-md text-body-md text-on-surface-variant">Effortlessly manage your daily appointments with our intuitive drag-and-drop calendar. Never double-book again.</p>
            </div>
          </div>

          {/* Feature 2: Client Directory */}
          <div className="col-span-1 rounded-2xl border border-surface-variant bg-surface-bright p-8 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 text-primary-container"><GroupIcon size="lg" /></div>
            <h3 className="mb-2 text-headline-md text-on-surface">Client Directory</h3>
            <p className="text-body-md text-on-surface-variant">Keep all client details, contact info, and history in one secure place.</p>
          </div>

          {/* Feature 3: Pet Profiles */}
          <div className="col-span-1 rounded-2xl border border-surface-variant bg-surface-bright p-8 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 text-primary-container"><PetsIcon size="lg" /></div>
            <h3 className="mb-2 text-headline-md text-on-surface">Pet Profiles</h3>
            <p className="text-body-md text-on-surface-variant">Track breeds, allergies, grooming preferences, and behavioral notes.</p>
          </div>

          {/* Feature 4: Service Customization — wide */}
          <div className="col-span-1 rounded-2xl border border-surface-variant bg-surface-bright p-8 shadow-sm transition-shadow hover:shadow-md md:col-span-2">
            <div className="mb-4 text-primary-container"><CutIcon size="lg" /></div>
            <h3 className="mb-2 text-headline-md text-on-surface">Service Customization</h3>
            <p className="text-body-md text-on-surface-variant">Define your services, set durations, and assign specific groomers to specialized tasks to optimize your workflow.</p>
          </div>

        </div>
      </section>

      {/* ── Bottom Nav (Mobile Only) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around rounded-t-xl bg-surface-container-highest px-4 py-2 shadow-lg md:hidden">
        <a href="#" className="flex scale-110 flex-col items-center justify-center rounded-full bg-primary-container px-4 py-1 text-on-primary-container duration-150 active:bg-surface-variant">
          <HomeIcon />
          <span className="mt-1 text-label-sm text-primary-container font-semibold">Home</span>
        </a>
        <a href="#" className="flex flex-col items-center justify-center text-on-surface-variant duration-150 active:scale-95 active:bg-surface-variant">
          <EventIcon />
          <span className="mt-1 text-label-sm text-primary-container">Calendar</span>
        </a>
        <a href="#" className="flex flex-col items-center justify-center text-on-surface-variant duration-150 active:scale-95 active:bg-surface-variant">
          <PersonIcon />
          <span className="mt-1 text-label-sm text-primary-container">Clients</span>
        </a>
        <a href="#" className="flex flex-col items-center justify-center text-on-surface-variant duration-150 active:scale-95 active:bg-surface-variant">
          <MenuIcon />
          <span className="mt-1 text-label-sm text-primary-container">More</span>
        </a>
      </nav>

      {/* ── Footer ── */}
      <footer className="mx-auto mb-16 flex max-w-[--container-max] flex-col items-center justify-between px-[--spacing-margin-desktop] py-10 md:mb-0 md:flex-row">
        <div className="mb-6 text-center md:mb-0 md:text-left">
          <div className="mb-2 flex items-center justify-center gap-2 opacity-80 transition-opacity hover:opacity-100 md:justify-start">
            <span className="text-primary-container"><PetsIcon size="sm" /></span>
            <span className="text-headline-md text-primary-container">Pawsitive Manager</span>
          </div>
          <p className="text-body-md text-on-surface-variant">© 2024 Pawsitive Grooming Solutions. All paws reserved.</p>
        </div>
        <div className="flex flex-col gap-4 text-center md:flex-row md:text-left">
          <a className="text-body-md text-on-surface-variant opacity-80 transition-opacity hover:underline hover:opacity-100" href="#">Privacy Policy</a>
          <a className="text-body-md text-on-surface-variant opacity-80 transition-opacity hover:underline hover:opacity-100" href="#">Terms of Service</a>
          <a className="text-body-md text-on-surface-variant opacity-80 transition-opacity hover:underline hover:opacity-100" href="#">Contact Us</a>
        </div>
      </footer>
    </>
  );
}
