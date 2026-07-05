import { useState, useRef, useEffect, type ReactNode } from 'react';
import type { Service } from '@/types/service';
import StatusBadge from '@/components/molecules/StatusBadge';
import Button from '@/components/atoms/Button';

export interface ServiceTableProps {
  services: Service[];
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  /** When provided, renders an "Unlink" action instead of/in addition to Delete for linked services */
  onUnlink?: (service: Service) => void;
}

function Td({ children, label }: { children: ReactNode; label: string }) {
  return (
    <td className="px-4 py-3 text-body-md text-on-surface md:table-cell">
      <span className="font-headline font-medium text-on-surface-variant md:hidden">{label}: </span>
      {children}
    </td>
  );
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) return 'N/A';
  return `${minutes} min`;
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

function ActionsDropdown({
  service,
  onEdit,
  onDelete,
  onUnlink,
}: {
  service: Service;
  onEdit: (s: Service) => void;
  onDelete: (s: Service) => void;
  onUnlink?: (s: Service) => void;
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

  function handleAction(fn: (s: Service) => void) {
    return () => {
      fn(service);
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
              onClick={handleAction(onEdit)}
              className="block w-full px-4 py-2 text-left text-body-md text-on-surface hover:bg-surface-container transition-colors"
            >
              Edit
            </button>
            {onUnlink ? (
              <button
                type="button"
                onClick={handleAction(onUnlink)}
                className="block w-full px-4 py-2 text-left text-body-md text-secondary-container hover:bg-secondary-container/30 transition-colors"
              >
                Unlink
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAction(onDelete)}
                className="block w-full px-4 py-2 text-left text-body-md text-error hover:bg-error-container/30 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ServiceTable({
  services,
  onEdit,
  onDelete,
  onUnlink,
}: ServiceTableProps) {
  if (services.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-12 text-center">
        <svg className="mx-auto h-12 w-12 text-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
        </svg>
        <p className="mt-4 text-body-md text-on-surface-variant">No services found.</p>
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
              Duration
            </th>
            <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">
              Price
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
          {services.map((service) => (
            <tr key={service.id} className="flex flex-col border-b border-outline-variant last:border-b-0 md:table-row md:border-b-0 hover:bg-surface-container transition-colors">
              <Td label="Name">
                <span className="font-headline font-medium text-on-surface">{service.name}</span>
              </Td>
              <Td label="Duration">{formatDuration(service.durationMinutes)}</Td>
              <Td label="Price">{formatPrice(service.price)}</Td>
              <Td label="Status">
                <StatusBadge status={service.status} />
              </Td>
              <td className="px-4 py-3 text-right md:table-cell">
                <div className="flex items-center justify-end gap-2">
                  <ActionsDropdown
                    service={service}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onUnlink={onUnlink}
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
