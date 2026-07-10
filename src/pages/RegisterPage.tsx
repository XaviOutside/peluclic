import { NavLink } from 'react-router-dom';

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <h1 className="font-headline text-headline-xl text-outline">Coming Soon</h1>
      <p className="mt-2 text-body-lg text-on-surface-variant">
        Registration is not yet available. Please check back later.
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
