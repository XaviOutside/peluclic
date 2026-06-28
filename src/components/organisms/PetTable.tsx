import { useState, useRef, useEffect, type ReactNode } from 'react';
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
        aria-label="Actions"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </Button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-44 rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="py-1">
            <button
              type="button"
              onClick={handleAction(onView)}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            >
              View
            </button>
            <button
              type="button"
              onClick={handleAction(onEdit)}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            >
              Edit
            </button>
            {pet.status === 'active' ? (
              <button
                type="button"
                onClick={handleAction(onDeactivate)}
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Deactivate
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAction(onReactivate)}
                className="block w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50"
              >
                Reactivate
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
    <td className="px-4 py-3 text-sm text-gray-700 md:table-cell">
      <span className="font-medium text-gray-500 md:hidden">{label}: </span>
      {children}
    </td>
  );
}

function getClientDisplay(clientId: number, clientNames?: Record<number, string>): string {
  return clientNames?.[clientId] ?? `Client #${clientId}`;
}

export default function PetTable({
  pets,
  clientNames,
  onView,
  onEdit,
  onDeactivate,
  onReactivate,
}: PetTableProps) {
  if (pets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
        <p className="text-sm text-gray-500">No pets found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="hidden bg-gray-50 md:table-header-group">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Species
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Breed
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Client
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {pets.map((pet) => (
            <tr key={pet.id} className="flex flex-col border-b border-gray-100 last:border-b-0 md:table-row md:border-b-0">
              <Td label="Name">
                <span className="font-medium text-gray-900">{pet.name}</span>
              </Td>
              <Td label="Species">{pet.species}</Td>
              <Td label="Breed">{pet.breed}</Td>
              <Td label="Client">{getClientDisplay(pet.client_id, clientNames)}</Td>
              <Td label="Status">
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
