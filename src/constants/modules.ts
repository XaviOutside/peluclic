/**
 * Module tab definitions shared across the app.
 * Used by ClientsPage, PetsPage, ServicesPage, and LandingPage.
 *
 * Labels are resolved from locale files via useModuleTabs() hook.
 * Only id and icon (Material Symbols name) are static.
 */
export interface ModuleTabDef {
  id: string;
  icon: string;
}

export const MODULE_TABS: ModuleTabDef[] = [
  { id: 'clients', icon: 'group' },
  { id: 'pets', icon: 'pets' },
  { id: 'services', icon: 'content_cut' },
];
