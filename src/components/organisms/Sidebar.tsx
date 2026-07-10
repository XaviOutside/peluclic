import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  icon: string;
  label: string;
  filled?: boolean;
}

const mainItems: NavItem[] = [
  { to: '/', icon: 'dashboard', label: 'Dashboard' },
  { to: '/calendar', icon: 'calendar_month', label: 'Calendario' },
  { to: '/clients', icon: 'group', label: 'Clientes', filled: true },
  { to: '/pets', icon: 'pets', label: 'Mascotas' },
  { to: '/services', icon: 'content_cut', label: 'Servicios' },
];

const bottomItems: NavItem[] = [
  { to: '/settings', icon: 'settings', label: 'Configuración' },
  { to: '/support', icon: 'help', label: 'Soporte' },
];

const linkBaseClasses =
  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-label text-label-md';

export default function Sidebar() {
  return (
    <nav className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col border-r border-outline-variant bg-surface-container p-4 md:flex">
      {/* Brand */}
      <div className="mb-8 flex flex-col items-center px-4">
        <div className="mb-3 h-16 w-16 overflow-hidden rounded-full border-2 border-primary">
          <img
            className="h-full w-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfv-uR_56YCYol0OaJcsEIWvcDfY9NNKTyTA9IxsCv1QUKIFIsUuPBC8f4M9aZkOh5ReqNIEakQ3ER2kuZaCcU6111VlxsT3_2YEO-RFaPjWEx_P5RrJxej4VgbHIXZy9zwZ1nIrIXWLsnZK-JkBxTnXcSZ-l9ePZ_SxVu_RJccD1Jnr2iMNNTr4WgD-kPga8FQbr9j6r2H4DP6WB8c4lp5WpQZ214wUFt2Ho7Fe7snr3Jl2q8VTx-CDmiPzzt_nUgu0z2Un-By2U"
            alt="Bark & Bubbles logo"
          />
        </div>
        <h1 className="text-center font-headline text-headline-md text-primary">
          Bark &amp; Bubbles
        </h1>
        <p className="mt-1 text-center font-label text-label-sm text-on-surface-variant">
          Professional Grooming
        </p>
      </div>

      {/* New Appointment CTA */}
      <button className="mb-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-label text-label-md text-on-primary shadow-sm transition-colors hover:bg-surface-tint">
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          add
        </span>
        Nueva Cita
      </button>

      {/* Main navigation */}
      <ul className="flex flex-1 flex-col gap-1">
        {mainItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `${linkBaseClasses} ${
                  isActive
                    ? 'bg-primary-container font-bold text-on-primary-container'
                    : 'text-on-surface-variant hover:bg-secondary-container'
                }`
              }
            >
              <span
                className="material-symbols-outlined"
                style={
                  item.filled
                    ? { fontVariationSettings: "'FILL' 1" }
                    : undefined
                }
              >
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Bottom section */}
      <div className="mt-auto border-t border-outline-variant pt-4">
        <ul className="flex flex-col gap-1">
          {bottomItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors font-label text-label-sm ${
                    isActive
                      ? 'bg-primary-container font-bold text-on-primary-container'
                      : 'text-on-surface-variant hover:bg-secondary-container'
                  }`
                }
              >
                <span className="material-symbols-outlined text-sm">
                  {item.icon}
                </span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
