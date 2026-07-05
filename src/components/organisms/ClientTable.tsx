import { useState, useRef, useEffect, type ReactNode } from 'react';
import type { Client } from '@/types/client';
import StatusBadge from '@/components/molecules/StatusBadge';
import Button from '@/components/atoms/Button';

export interface ClientTableProps {
  clients: Client[];
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDeactivate: (client: Client) => void;
  onReactivate: (client: Client) => void;
}

interface DropdownState {
  clientId: number | null;
}

function ActionsDropdown({
  client,
  onView,
  onEdit,
  onDeactivate,
  onReactivate,
}: {
  client: Client;
  onView: (c: Client) => void;
  onEdit: (c: Client) => void;
  onDeactivate: (c: Client) => void;
  onReactivate: (c: Client) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
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

  function handleAction(fn: (c: Client) => void) {
    return () => {
      fn(client);
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
        <div className="absolute right-0 z-10 mt-1 w-44 rounded-lg border border-outline-variant bg-surface-container-lowest shadow-modal">
          <div className="py-1">
            <button
              type="button"
              onClick={handleAction(onView)}
              className="block w-full px-4 py-2 text-left text-body-md text-on-surface hover:bg-surface-container transition-colors"
            >
              View
            </button>
            <button
              type="button"
              onClick={handleAction(onEdit)}
              className="block w-full px-4 py-2 text-left text-body-md text-on-surface hover:bg-surface-container transition-colors"
            >
              Edit
            </button>
            {client.status === 'active' ? (
              <button
                type="button"
                onClick={handleAction(onDeactivate)}
                className="block w-full px-4 py-2 text-left text-body-md text-error hover:bg-error-container/30 transition-colors"
              >
                Deactivate
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAction(onReactivate)}
                className="block w-full px-4 py-2 text-left text-body-md text-primary hover:bg-primary-container/20 transition-colors"
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

/** Responsive table cell wrapper — visible on all screen sizes. */
function Td({ children, label }: { children: ReactNode; label: string }) {
  return (
    <td className="px-4 py-3 text-body-md text-on-surface md:table-cell">
      <span className="font-headline font-medium text-on-surface-variant md:hidden">{label}: </span>
      {children}
    </td>
  );
}

export default function ClientTable({
  clients,
  onView,
  onEdit,
  onDeactivate,
  onReactivate,
}: ClientTableProps) {
  if (clients.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-12 text-center">
        <svg className="mx-auto h-12 w-12 text-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <p className="mt-4 text-body-md text-on-surface-variant">No clients found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest shadow-card">
      <table className="min-w-full divide-y divide-outline-variant">
        <thead className="hidden md:table-header-group">
          <tr className="bg-surface-container">
            <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">
              Name
            </th>
            <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">
              Email
            </th>
            <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">
              Phone
            </th>
            <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">
              Status
            </th>
            <th className="px-4 py-3 text-right text-label-md text-on-surface-variant">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {clients.map((client) => (
            <tr key={client.id} className="flex flex-col border-b border-outline-variant last:border-b-0 md:table-row md:border-b-0 hover:bg-surface-container transition-colors">
              <Td label="Name">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-label-md font-headline font-semibold text-primary">
                    {client.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-headline font-medium text-on-surface">{client.name}</span>
                </div>
              </Td>
              <Td label="Email">
                <a
                  href={`mailto:${client.email}`}
                  className="text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {client.email}
                </a>
              </Td>
              <Td label="Phone">{client.phone}</Td>
              <Td label="Status">
                <StatusBadge status={client.status} />
              </Td>
              <td className="px-4 py-3 text-right md:table-cell">
                <div className="flex items-center justify-end gap-2">
                  <ActionsDropdown
                    client={client}
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
