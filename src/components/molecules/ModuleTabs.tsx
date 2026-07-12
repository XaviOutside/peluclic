import { useTranslation } from 'react-i18next';

export interface ModuleTab {
  /** Unique identifier for the tab */
  id: string;
  /** Display label */
  label: string;
  /** Material Symbols icon name */
  icon: string;
  /** Optional badge count */
  count?: number;
}

export interface ModuleTabsProps {
  /** List of tabs to display */
  tabs: ModuleTab[];
  /** Currently active tab id */
  activeTab: string;
  /** Called when a tab is clicked */
  onTabChange: (tabId: string) => void;
  /** Additional class names */
  className?: string;
}

export default function ModuleTabs({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}: ModuleTabsProps) {
  const { t } = useTranslation('common');

  return (
    <nav
      className={`flex border-b border-outline-variant overflow-x-auto ${className}`}
      role="tablist"
      aria-label={t('moduleTabs.ariaLabel')}
      data-testid="module-tabs"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 font-label-md text-label-md whitespace-nowrap transition-colors duration-150 border-b-2 ${
              isActive
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-on-surface-variant hover:text-primary'
            }`}
            data-testid={`tab-${tab.id}`}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              {tab.icon}
            </span>
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1 inline-flex items-center justify-center rounded-full bg-secondary-container px-2 py-0.5 text-xs font-semibold text-on-secondary-container">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
