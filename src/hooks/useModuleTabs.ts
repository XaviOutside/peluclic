import { useTranslation } from 'react-i18next';
import { MODULE_TABS } from '@/constants/modules';
import type { ModuleTabDef } from '@/constants/modules';

export interface ModuleTab {
  id: string;
  label: string;
  icon: string;
  count?: number;
}

/**
 * Returns translated module tabs by resolving labels from the
 * `common.moduleTabs` namespace for each MODULE_TABS entry.
 */
export function useModuleTabs(): ModuleTab[] {
  const { t } = useTranslation('common');

  return MODULE_TABS.map((def: ModuleTabDef) => ({
    id: def.id,
    label: t(`moduleTabs.${def.id}`),
    icon: def.icon,
  }));
}
