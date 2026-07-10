import { NavLink } from 'react-router-dom';

interface MobileNavItem {
  to: string;
  icon: string;
  label: string;
  filled?: boolean;
}

const items: MobileNavItem[] = [
  { to: '/', icon: 'home', label: 'Inicio' },
  { to: '/calendar', icon: 'event', label: 'Calendario' },
  { to: '/clients', icon: 'person', label: 'Clientes', filled: true },
  { to: '/pets', icon: 'pets', label: 'Mascotas' },
  { to: '/services', icon: 'content_cut', label: 'Servicios' },
];

export default function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-xl bg-surface-container-highest px-4 py-2 shadow-lg md:hidden">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center rounded-lg p-2 transition-all duration-150 active:scale-110 ${
              isActive
                ? 'bg-primary-container text-on-primary-container'
                : 'text-on-surface-variant active:bg-surface-variant'
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
          <span
            className={`mt-1 font-label text-[10px] ${
              item.filled ? 'font-bold' : ''
            }`}
          >
            {item.label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
