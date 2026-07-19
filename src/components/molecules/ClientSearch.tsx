import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Client } from '@/types/client';
import { searchClients } from '@/services/client';

export interface ClientSearchProps {
  onSelect: (client: Client) => void;
  selectedClientId?: number;
}

/**
 * Debounced FTS search input for clients.
 * 300ms debounce + 3-char minimum gate.
 * Renders a dropdown of matching clients on success.
 */
export default function ClientSearch({ onSelect, selectedClientId }: ClientSearchProps) {
  const { t } = useTranslation('appointments');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Client[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      const trimmed = value.trim();

      if (trimmed.length < 3) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);

      debounceRef.current = setTimeout(async () => {
        try {
          const clients = await searchClients(trimmed);
          setResults(clients);
          setIsOpen(clients.length > 0);
        } catch {
          setResults([]);
          setIsOpen(false);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    },
    [],
  );

  const handleSelect = (client: Client) => {
    setSelectedClient(client);
    setQuery(client.name);
    setIsOpen(false);
    onSelect(client);
  };

  return (
    <div className="relative">
      <label
        htmlFor="client-search"
        className="mb-1 block font-label text-label-sm text-on-surface-variant"
      >
        {t('form.selectClient')}
      </label>
      <input
        id="client-search"
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={t('form.selectClient')}
        className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        autoComplete="off"
      />
      {isLoading && (
        <span className="absolute right-3 top-9 text-sm text-on-surface-variant">
          ...
        </span>
      )}
      {isOpen && results.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-outline-variant bg-surface-container shadow-lg">
          {results.map((client) => (
            <li key={client.id}>
              <button
                type="button"
                onClick={() => handleSelect(client)}
                className={`w-full px-3 py-2 text-left font-body text-body-md transition-colors hover:bg-secondary-container ${
                  client.id === selectedClientId
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-surface'
                }`}
              >
                <span className="font-semibold">{client.name}</span>
                <span className="ml-2 text-sm text-on-surface-variant">
                  {client.email}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
