import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface MobileNavItem {
  to: string;
  icon: string;
  labelKey: string;
  filled?: boolean;
}

const items: MobileNavItem[] = [
  { to: '/', icon: 'home', labelKey: 'mobileNav.home' },
  { to: '/calendar', icon: 'event', labelKey: 'mobileNav.calendar' },
  { to: '/clients', icon: 'person', labelKey: 'mobileNav.clients', filled: true },
  { to: '/pets', icon: 'pets', labelKey: 'mobileNav.pets' },
  { to: '/services', icon: 'content_cut', labelKey: 'mobileNav.services' },
];

export default function MobileNav() {
  const { t } = useTranslation('common');

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
            {t(item.labelKey)}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
