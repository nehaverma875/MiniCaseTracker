import { Chip } from '@mui/material';
import { statusColor } from '../utils/status';

export const StatusChip = ({ status }) => (
  <Chip size="small" label={status} color={statusColor[status] || 'default'} variant="outlined" sx={{ fontWeight: 700 }} />
);
