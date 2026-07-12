import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Pet } from '@/types/pet';
import StatusBadge from '@/components/molecules/StatusBadge';
import Button from '@/components/atoms/Button';

export interface PetTableProps {
  pets: Pet[];
  clientNames?: Record<number, string>;
  onView: (pet: Pet) => void;
  onEdit: (pet: Pet) => void;
  onDeactivate: (pet: Pet) => void;
  onReactivate: (pet: Pet) => void;
}

function ActionsDropdown({
  pet,
  onView,
  onEdit,
  onDeactivate,
  onReactivate,
}: {
  pet: Pet;
  onView: (p: Pet) => void;
  onEdit: (p: Pet) => void;
  onDeactivate: (p: Pet) => void;
  onReactivate: (p: Pet) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useTranslation('common');

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleAction(fn: (p: Pet) => void) {
    return () => {
      fn(pet);
      setOpen(false);
    };
  }

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={t('actions.actions')}
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </Button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-44 rounded-lg border border-outline-variant bg-surface-container-lowest shadow-modal">
          <div className="py-1">
            <button
              type="button"
              onClick={handleAction(onView)}
              className="block w-full px-4 py-2 text-left text-body-md text-on-surface hover:bg-surface-container transition-colors"
            >
              {t('actions.view')}
            </button>
            <button
              type="button"
              onClick={handleAction(onEdit)}
              className="block w-full px-4 py-2 text-left text-body-md text-on-surface hover:bg-surface-container transition-colors"
            >
              {t('actions.edit')}
            </button>
            {pet.status === 'active' ? (
              <button
                type="button"
                onClick={handleAction(onDeactivate)}
                className="block w-full px-4 py-2 text-left text-body-md text-error hover:bg-error-container/30 transition-colors"
              >
                {t('actions.deactivate')}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAction(onReactivate)}
                className="block w-full px-4 py-2 text-left text-body-md text-primary-container hover:bg-primary-container/20 transition-colors"
              >
                {t('actions.reactivate')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Td({ children, label }: { children: ReactNode; label: string }) {
  return (
    <td className="px-4 py-3 text-body-md text-on-surface md:table-cell">
      <span className="font-headline font-medium text-on-surface-variant md:hidden">{label}: </span>
      {children}
    </td>
  );
}

function getClientDisplay(clientId: number, clientNames: Record<number, string> | undefined, t: (key: string, params?: Record<string, unknown>) => string): string {
  return clientNames?.[clientId] ?? t('detail.clientNumber', { id: clientId });
}

export default function PetTable({
  pets,
  clientNames,
  onView,
  onEdit,
  onDeactivate,
  onReactivate,
}: PetTableProps) {
  const { t } = useTranslation(['common', 'pets']);

  if (pets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-12 text-center">
        <svg className="mx-auto h-12 w-12 text-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <p className="mt-4 text-body-md text-on-surface-variant">{t('empty.noPets', { ns: 'common' })}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest shadow-card">
      <table className="min-w-full divide-y divide-outline-variant">
        <thead className="hidden md:table-header-group">
          <tr className="bg-surface-container">
            <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">
              {t('form.label.name', { ns: 'pets' })}
            </th>
            <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">
              {t('column.species', { ns: 'pets' })}
            </th>
            <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">
              {t('column.breed', { ns: 'pets' })}
            </th>
            <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">
              {t('form.label.client', { ns: 'pets' })}
            </th>
            <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">
              {t('column.status', { ns: 'pets' })}
            </th>
            <th className="px-4 py-3 text-right text-label-md text-on-surface-variant">
              {t('actions.actions', { ns: 'common' })}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {pets.map((pet) => (
            <tr key={pet.id} className="flex flex-col border-b border-outline-variant last:border-b-0 md:table-row md:border-b-0 hover:bg-surface-container transition-colors">
              <Td label={t('form.label.name', { ns: 'pets' })}>
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-label-md text-secondary-container">
                    <svg className="h-4 w-4" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
                      <path d="M16 2c-2.5 0-4.5 1.2-5.8 3C8.8 3.2 6.8 2 4 2 2 2 0 4 0 6.5 0 13 6 22 16 30 26 22 32 13 32 6.5 32 4 30 2 28 2c-2.8 0-4.8 1.2-6.2 3C20.5 3.2 18.5 2 16 2z" />
                    </svg>
                  </span>
                  <span className="font-headline font-medium text-on-surface">{pet.name}</span>
                </div>
              </Td>
              <Td label={t('column.species', { ns: 'pets' })}>{pet.species}</Td>
              <Td label={t('column.breed', { ns: 'pets' })}>{pet.breed}</Td>
              <Td label={t('form.label.client', { ns: 'pets' })}>{getClientDisplay(pet.clientId, clientNames, t)}</Td>
              <Td label={t('column.status', { ns: 'pets' })}>
                <StatusBadge status={pet.status} />
              </Td>
              <td className="px-4 py-3 text-right md:table-cell">
                <div className="flex items-center justify-end gap-2">
                  <ActionsDropdown
                    pet={pet}
                    onView={onView}
                    onEdit={onEdit}
                    onDeactivate={onDeactivate}
                    onReactivate={onReactivate}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
