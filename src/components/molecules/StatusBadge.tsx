import Badge from '@/components/atoms/Badge';

export interface StatusBadgeProps {
  status: 'active' | 'inactive';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'active') {
    return <Badge color="green">Active</Badge>;
  }

  return <Badge color="gray">Inactive</Badge>;
}
