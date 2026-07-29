import { useMemo } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useMediaQuery,
  useTheme,
  Typography
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import AddIcon from '@mui/icons-material/Add';
import AssignmentIcon from '@mui/icons-material/AssignmentOutlined';
import ErrorIcon from '@mui/icons-material/ErrorOutline';
import EventIcon from '@mui/icons-material/EventOutlined';
import FactCheckIcon from '@mui/icons-material/FactCheckOutlined';
import GroupsIcon from '@mui/icons-material/GroupsOutlined';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage, useGetDashboardQuery } from '../api/apiSlice';
import { StatusChip } from '../components/StatusChip';
import { formatDate } from '../utils/date';
import { statuses } from '../utils/status';

const emptyDashboard = {
  stats: { total: 0, overdue: 0, dueSoon: 0, pendingReview: 0, statusCounts: {} },
  recentCases: [],
  agentWorkload: []
};

const StatCard = ({ icon, label, value, color = 'primary.main' }) => (
  <Card variant="outlined" sx={{ height: '100%' }}>
    <CardContent sx={{ height: '100%' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={700}>
            {label}
          </Typography>
          <Typography variant="h4" fontWeight={800}>
            {value}
          </Typography>
        </Box>
        <Box sx={{ display: 'grid', placeItems: 'center', width: 44, height: 44, borderRadius: 1, bgcolor: '#f1f5f9', color }}>
          {icon}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

export const DashboardPage = () => {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { data: dashboard = emptyDashboard, error, isLoading } = useGetDashboardQuery();

  const statusCards = useMemo(
    () => statuses.map((status) => ({ status, count: dashboard.stats.statusCounts?.[status] || 0 })),
    [dashboard.stats.statusCounts]
  );

  if (isLoading) return <Alert severity="info">Loading dashboard...</Alert>;

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Dashboard
          </Typography>
          <Typography color="text.secondary">
            {user.role === 'manager' ? 'Monitor team workload and case health.' : 'Track your assigned case workload.'}
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          {user.role === 'manager' && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/cases/new')} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              Create case
            </Button>
          )}
          <Button variant="outlined" startIcon={<AssignmentIcon />} onClick={() => navigate('/cases')} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            View cases
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error">{getErrorMessage(error)}</Alert>}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard icon={<AssignmentIcon />} label="Total cases" value={dashboard.stats.total} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard icon={<FactCheckIcon />} label="Pending review" value={dashboard.stats.pendingReview} color="secondary.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard icon={<EventIcon />} label="Due soon" value={dashboard.stats.dueSoon} color="warning.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard icon={<ErrorIcon />} label="Overdue" value={dashboard.stats.overdue} color="error.main" />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {statusCards.map(({ status, count }) => (
          <Grid size={{ xs: 6, sm: 4, lg: 2 }} key={status}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                  <StatusChip status={status} />
                  <Typography variant="h6" fontWeight={800}>
                    {count}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card variant="outlined">
            <CardHeader title="Recent cases" />
            {isMobile ? (
              <CardContent>
                <Stack spacing={1.5}>
                  {dashboard.recentCases.map((caseItem) => (
                    <Box
                      key={caseItem._id}
                      onClick={() => navigate(`/cases/${caseItem._id}`)}
                      sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5, cursor: 'pointer' }}
                    >
                      <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight={800} noWrap>
                            {caseItem.subjectName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {caseItem.clientName}
                          </Typography>
                        </Box>
                        <StatusChip status={caseItem.status} />
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Due {formatDate(caseItem.dueDate)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Subject</TableCell>
                      <TableCell>Client</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Due</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboard.recentCases.map((caseItem) => (
                      <TableRow key={caseItem._id} hover onClick={() => navigate(`/cases/${caseItem._id}`)} sx={{ cursor: 'pointer' }}>
                        <TableCell sx={{ fontWeight: 700 }}>{caseItem.subjectName}</TableCell>
                        <TableCell>{caseItem.clientName}</TableCell>
                        <TableCell>
                          <StatusChip status={caseItem.status} />
                        </TableCell>
                        <TableCell>{formatDate(caseItem.dueDate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            {dashboard.recentCases.length === 0 && (
              <CardContent>
                <Alert severity="info">No cases available yet.</Alert>
              </CardContent>
            )}
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2}>
            <Card variant="outlined">
              <CardHeader title={user.role === 'manager' ? 'Review queue' : 'My focus'} />
              <CardContent>
                <Stack spacing={1.5}>
                  <SummaryRow label="Submitted cases" value={dashboard.stats.pendingReview} />
                  <SummaryRow label="Due in 7 days" value={dashboard.stats.dueSoon} />
                  <SummaryRow label="Overdue" value={dashboard.stats.overdue} />
                </Stack>
              </CardContent>
            </Card>

            {user.role === 'manager' && (
              <Card variant="outlined">
                <CardHeader avatar={<GroupsIcon color="action" />} title="Agent workload" />
                <CardContent>
                  <Stack spacing={1.5}>
                    {dashboard.agentWorkload.map((agent) => (
                      <Box key={agent._id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                        <Typography fontWeight={700}>{agent.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {agent.email}
                        </Typography>
                        <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                          <Typography variant="body2">Active</Typography>
                          <Typography variant="body2" fontWeight={800}>
                            {agent.active}
                          </Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2">Total assigned</Typography>
                          <Typography variant="body2" fontWeight={800}>
                            {agent.total}
                          </Typography>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
};

const SummaryRow = ({ label, value }) => (
  <Stack direction="row" justifyContent="space-between" sx={{ bgcolor: '#f8fafc', borderRadius: 1, p: 1.5 }}>
    <Typography variant="body2" fontWeight={700}>
      {label}
    </Typography>
    <Typography fontWeight={800}>{value}</Typography>
  </Stack>
);
