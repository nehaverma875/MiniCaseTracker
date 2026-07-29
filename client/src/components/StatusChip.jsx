import { Badge } from './ui';

const variants = {
  New: 'secondary',
  Assigned: 'blue',
  'In Progress': 'amber',
  Submitted: 'violet',
  Cleared: 'green',
  Discrepant: 'red'
};

export const StatusChip = ({ status }) => <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
