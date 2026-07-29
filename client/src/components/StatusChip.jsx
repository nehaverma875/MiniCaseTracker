import { Badge } from './ui';

const statusTone = {
  New: 'default',
  Assigned: 'blue',
  'In Progress': 'orange',
  Submitted: 'purple',
  Cleared: 'green',
  Discrepant: 'red'
};

export const StatusChip = ({ status }) => <Badge tone={statusTone[status] || 'default'}>{status}</Badge>;
