import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DataTable, { type ColumnConfig, type RowAction, type CrossRefAction } from '@/components/organisms/DataTable';

/* ── Test helpers ── */

interface TestItem {
  id: number;
  name: string;
  email: string;
}

const columns: ColumnConfig<TestItem>[] = [
  { header: 'Name', render: (item) => item.name, span: 'sm:col-span-4' },
  {
    header: 'Email',
    render: (item) => (
      <span className="text-sm text-on-surface-variant">{item.email}</span>
    ),
    span: 'sm:col-span-4',
  },
];

const _rowActions: RowAction<TestItem>[] = [
  {
    key: 'edit',
    label: 'Edit',
    icon: 'edit',
    onAction: vi.fn(),
  },
  {
    key: 'delete',
    label: 'Delete',
    icon: 'delete',
    destructive: true,
    onAction: vi.fn(),
  },
];

const sampleData: TestItem[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
];

describe('DataTable', () => {
  /* ── Loading ── */
  it('renders loading spinner when loading with no data', () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        rowKey={(r) => r.id}
        loading
      />,
    );
    expect(screen.getByTestId('datatable-loading')).toBeInTheDocument();
  });

  /* ── Error ── */
  it('renders error state with retry button', () => {
    const onRetry = vi.fn();
    render(
      <DataTable
        data={[]}
        columns={columns}
        rowKey={(r) => r.id}
        error="Something went wrong"
        onRetry={onRetry}
      />,
    );
    expect(screen.getByTestId('datatable-error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('datatable-retry'));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  /* ── Empty ── */
  it('renders empty state when no data', () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        rowKey={(r) => r.id}
        emptyMessage="No clients found."
      />,
    );
    expect(screen.getByTestId('datatable-empty')).toBeInTheDocument();
    expect(screen.getByText('No clients found.')).toBeInTheDocument();
  });

  /* ── Rows ── */
  it('renders all rows', () => {
    render(
      <DataTable
        data={sampleData}
        columns={columns}
        rowKey={(r) => r.id}
      />,
    );
    const rows = screen.getAllByTestId('datatable-row');
    expect(rows).toHaveLength(2);
  });

  it('renders column data in rows', () => {
    render(
      <DataTable
        data={sampleData}
        columns={columns}
        rowKey={(r) => r.id}
      />,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
  });

  /* ── Avatar ── */
  it('renders avatar when avatarName is provided', () => {
    render(
      <DataTable
        data={sampleData}
        columns={columns}
        rowKey={(r) => r.id}
        avatarName={(r) => r.name}
      />,
    );
    const avatars = screen.getAllByTestId('avatar');
    expect(avatars.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  /* ── Row actions ── */
  it('renders row action buttons', () => {
    const editAction = vi.fn();
    const actions: RowAction<TestItem>[] = [
      { key: 'edit', label: 'Edit', icon: 'edit', onAction: editAction },
    ];

    render(
      <DataTable
        data={sampleData}
        columns={columns}
        rowKey={(r) => r.id}
        rowActions={actions}
      />,
    );

    const editButtons = screen.getAllByTestId('row-action-edit');
    expect(editButtons).toHaveLength(2);
  });

  it('calls row action on click', () => {
    const editAction = vi.fn();
    const actions: RowAction<TestItem>[] = [
      { key: 'edit', label: 'Edit', icon: 'edit', onAction: editAction },
    ];

    render(
      <DataTable
        data={sampleData}
        columns={columns}
        rowKey={(r) => r.id}
        rowActions={actions}
      />,
    );

    fireEvent.click(screen.getAllByTestId('row-action-edit')[0]);
    expect(editAction).toHaveBeenCalledWith(sampleData[0]);
  });

  /* ── Desktop header ── */
  it('renders desktop header with column names', () => {
    render(
      <DataTable
        data={sampleData}
        columns={columns}
        rowKey={(r) => r.id}
        showHeader
      />,
    );
    // Desktop header uses uppercase tracking-wider text; look for the header row
    const headerNames = screen.getAllByText('Name');
    // At least the desktop header + each row's mobile label = 1 + 2 = 3
    expect(headerNames.length).toBeGreaterThanOrEqual(3);
    const emailHeaders = screen.getAllByText('Email');
    expect(emailHeaders.length).toBeGreaterThanOrEqual(3);
  });

  /* ── Hidden header ── */
  it('can hide the header', () => {
    render(
      <DataTable
        data={sampleData}
        columns={columns}
        rowKey={(r) => r.id}
        showHeader={false}
      />,
    );
    // The desktop header is not rendered when showHeader is false.
    // Desktop header uses `hidden sm:grid` — let's check it doesn't exist
    const desktopHeader = document.querySelector('.hidden.sm\\:grid');
    expect(desktopHeader).toBeNull();
  });

  /* ── Mobile labels ── */
  it('renders mobile column labels on small screens', () => {
    render(
      <DataTable
        data={sampleData}
        columns={columns}
        rowKey={(r) => r.id}
      />,
    );
    // Mobile labels are hidden on desktop (sm:hidden) but present in DOM
    const mobileLabels = document.querySelectorAll('.sm\\:hidden');
    // Each row has at least one mobile label (Name and Email)
    expect(mobileLabels.length).toBeGreaterThanOrEqual(2);
  });

  /* ── CrossRefActions ── */
  it('renders crossRefActions as labeled bordered buttons with icon', () => {
    const crossRefActions: CrossRefAction<TestItem>[] = [
      {
        key: 'view-pets',
        label: 'Ver Mascotas',
        icon: 'pets',
        onClick: vi.fn(),
      },
    ];

    render(
      <DataTable
        data={sampleData}
        columns={columns}
        rowKey={(r) => r.id}
        crossRefActions={crossRefActions}
      />,
    );

    const buttons = screen.getAllByTestId('crossref-action-view-pets');
    expect(buttons).toHaveLength(2); // one per row

    const firstBtn = buttons[0];
    expect(firstBtn).toHaveTextContent('Ver Mascotas');
    // Icon is inside a span with material-symbols-outlined class
    const icon = firstBtn.querySelector('.material-symbols-outlined');
    expect(icon).toBeInTheDocument();
    expect(icon?.textContent).toBe('pets');
  });

  it('sets disabled attribute when disabled predicate returns true', () => {
    const crossRefActions: CrossRefAction<TestItem>[] = [
      {
        key: 'view-client',
        label: 'Ver Cliente',
        icon: 'person',
        onClick: vi.fn(),
        disabled: (item) => item.id === 1, // Alice disabled, Bob enabled
      },
    ];

    render(
      <DataTable
        data={sampleData}
        columns={columns}
        rowKey={(r) => r.id}
        crossRefActions={crossRefActions}
      />,
    );

    const buttons = screen.getAllByTestId('crossref-action-view-client');
    expect(buttons).toHaveLength(2);

    // Alice (id=1) should be disabled
    expect(buttons[0]).toBeDisabled();

    // Bob (id=2) should be enabled
    expect(buttons[1]).not.toBeDisabled();
  });

  it('applies actionSpan class to actions cell and header', () => {
    const crossRefActions: CrossRefAction<TestItem>[] = [
      {
        key: 'view-pets',
        label: 'Ver Mascotas',
        icon: 'pets',
        onClick: vi.fn(),
      },
    ];

    render(
      <DataTable
        data={sampleData}
        columns={columns}
        rowKey={(r) => r.id}
        crossRefActions={crossRefActions}
        actionSpan="sm:col-span-4"
      />,
    );

    // Find the actions header cell — i18n'd in PR2
    const actionHeader = screen.getByText('actions.actions');
    expect(actionHeader.className).toContain('sm:col-span-4');

    // Each row's actions cell should have the span class
    const actionCells = document.querySelectorAll('[data-testid="datatable-actions-cell"]');
    expect(actionCells.length).toBe(2);
    actionCells.forEach((cell) => {
      expect(cell.className).toContain('sm:col-span-4');
    });
  });
});
