import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  useMediaQuery,
  useTheme,
  Typography
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  getFieldErrors,
  getErrorMessage,
  useCreateCaseMutation,
  useGetAgentsQuery,
  useGetCasesQuery,
  useGetDashboardQuery
} from '../api/apiSlice';
import { StatusChip } from '../components/StatusChip';
import { formatDate, isPastDate, isValidDate, todayInputValue } from '../utils/date';
import { caseTypes, statuses } from '../utils/status';

const emptyForm = { clientName: '', subjectName: '', caseType: 'KYC', dueDate: '', assignedAgent: '' };

export const CasesPage = ({ createOnMount = false }) => {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [filters, setFilters] = useState({ search: '', status: '', agent: '', page: 1 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors }
  } = useForm({ defaultValues: emptyForm });

  const params = useMemo(() => {
    const result = { page: filters.page, limit: 10 };
    if (filters.search) result.search = filters.search;
    if (filters.status) result.status = filters.status;
    if (filters.agent) result.agent = filters.agent;
    return result;
  }, [filters]);

  const { data: caseData, error: casesError, isFetching } = useGetCasesQuery(params);
  const { data: dashboardData } = useGetDashboardQuery();
  const { data: agentsData } = useGetAgentsQuery(undefined, { skip: user.role !== 'manager' });
  const [createCase, { isLoading: creatingCase, error: createError }] = useCreateCaseMutation();

  useEffect(() => {
    if (createOnMount && user.role === 'manager') setDialogOpen(true);
  }, [createOnMount, user.role]);

  const submitCase = async (values) => {
    try {
      await createCase({
        ...values,
        clientName: values.clientName.trim(),
        subjectName: values.subjectName.trim(),
        assignedAgent: values.assignedAgent || undefined
      }).unwrap();
      toast.success('Case created successfully');
      setDialogOpen(false);
      reset(emptyForm);
      if (createOnMount) navigate('/cases');
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      Object.entries(fieldErrors).forEach(([field, message]) => {
        setError(field, { type: 'server', message });
      });
      toast.error(getErrorMessage(err));
    }
  };

  const cases = caseData?.cases || [];
  const pagination = caseData?.pagination || { page: filters.page, pages: 1, total: 0 };
  const agents = agentsData?.agents || [];
  const statusCounts = dashboardData?.stats?.statusCounts || {};
  const statCounts = statuses.map((status) => ({ status, count: statusCounts[status] || 0 }));
  const error = casesError || createError;

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Cases
          </Typography>
          <Typography color="text.secondary">
            {user.role === 'manager' ? 'Review and assign client cases.' : 'Work on cases assigned to you.'}
          </Typography>
        </Box>
        {user.role === 'manager' && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/cases/new')} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            New case
          </Button>
        )}
      </Stack>

      <Grid container spacing={2}>
        {statCounts.map(({ status, count }) => (
          <Grid size={{ xs: 6, sm: 4, lg: 2 }} key={status}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" fontWeight={700}>
                  {status}
                </Typography>
                <Typography variant="h5" fontWeight={800}>
                  {count}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card variant="outlined">
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: user.role === 'manager' ? 6 : 8 }}>
              <TextField
                fullWidth
                label="Search"
                placeholder="Client, subject, or type"
                value={filters.search}
                onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value, page: 1 }))}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={filters.status}
                  onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value, page: 1 }))}
                >
                  <MenuItem value="">All statuses</MenuItem>
                  {statuses.map((status) => (
                    <MenuItem value={status} key={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {user.role === 'manager' && (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Agent</InputLabel>
                  <Select
                    label="Agent"
                    value={filters.agent}
                    onChange={(event) => setFilters((prev) => ({ ...prev, agent: event.target.value, page: 1 }))}
                  >
                    <MenuItem value="">All agents</MenuItem>
                    {agents.map((agent) => (
                      <MenuItem value={agent.id} key={agent.id}>
                        {agent.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {error && <Alert severity="error">{getErrorMessage(error)}</Alert>}

      <Card variant="outlined">
        {isMobile ? (
          <CardContent>
            <Stack spacing={1.5}>
              {cases.map((caseItem) => (
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
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                    <Chip label={caseItem.caseType} size="small" variant="outlined" />
                    <Chip label={caseItem.assignedAgent?.name || 'Unassigned'} size="small" variant="outlined" />
                    <Chip label={`Due ${formatDate(caseItem.dueDate)}`} size="small" variant="outlined" />
                  </Stack>
                </Box>
              ))}
            </Stack>
          </CardContent>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Client</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Agent</TableCell>
                  <TableCell>Due</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cases.map((caseItem) => (
                  <TableRow key={caseItem._id} hover onClick={() => navigate(`/cases/${caseItem._id}`)} sx={{ cursor: 'pointer' }}>
                    <TableCell>{caseItem.clientName}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{caseItem.subjectName}</TableCell>
                    <TableCell>
                      <Chip label={caseItem.caseType} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <StatusChip status={caseItem.status} />
                    </TableCell>
                    <TableCell>{caseItem.assignedAgent?.name || 'Unassigned'}</TableCell>
                    <TableCell>{formatDate(caseItem.dueDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {!isFetching && cases.length === 0 && (
          <CardContent>
            <Alert severity="info">No cases match the current filters.</Alert>
          </CardContent>
        )}
      </Card>

      <Stack alignItems="center">
        <Pagination
          count={pagination.pages}
          page={pagination.page}
          onChange={(_event, page) => setFilters((prev) => ({ ...prev, page }))}
          color="primary"
        />
      </Stack>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          if (createOnMount) navigate('/cases');
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Create case</DialogTitle>
        <Stack component="form" id="create-case-form" spacing={2} onSubmit={handleSubmit(submitCase)}>
          <DialogContent>
            <Stack spacing={2}>
              <Controller
                name="clientName"
                control={control}
                rules={{
                  validate: (value) => value.trim().length >= 2 || 'Client name must be at least 2 characters',
                  maxLength: { value: 120, message: 'Client name is too long' }
                }}
                render={({ field }) => (
                  <TextField {...field} label="Client name" error={Boolean(errors.clientName)} helperText={errors.clientName?.message} inputProps={{ maxLength: 120 }} required fullWidth />
                )}
              />
              <Controller
                name="subjectName"
                control={control}
                rules={{
                  validate: (value) => value.trim().length >= 2 || 'Subject name must be at least 2 characters',
                  maxLength: { value: 120, message: 'Subject name is too long' }
                }}
                render={({ field }) => (
                  <TextField {...field} label="Subject name" error={Boolean(errors.subjectName)} helperText={errors.subjectName?.message} inputProps={{ maxLength: 120 }} required fullWidth />
                )}
              />
              <Controller
                name="caseType"
                control={control}
                rules={{ validate: (value) => caseTypes.includes(value) || 'Select a valid case type' }}
                render={({ field }) => (
                  <FormControl fullWidth error={Boolean(errors.caseType)}>
                    <InputLabel>Case type</InputLabel>
                    <Select {...field} label="Case type">
                      {caseTypes.map((type) => (
                        <MenuItem value={type} key={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.caseType && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                        {errors.caseType.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
              <Controller
                name="dueDate"
                control={control}
                rules={{
                  required: 'Due date is required',
                  validate: (value) => {
                    if (!isValidDate(value)) return 'Enter a valid due date';
                    return !isPastDate(value) || 'Due date cannot be in the past';
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Due date"
                    type="date"
                    error={Boolean(errors.dueDate)}
                    helperText={errors.dueDate?.message}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: todayInputValue() }}
                    required
                    fullWidth
                  />
                )}
              />
              <Controller
                name="assignedAgent"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Assign agent</InputLabel>
                    <Select {...field} label="Assign agent">
                      <MenuItem value="">Leave unassigned</MenuItem>
                      {agents.map((agent) => (
                        <MenuItem value={agent.id} key={agent.id}>
                          {agent.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setDialogOpen(false);
                if (createOnMount) navigate('/cases');
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={creatingCase}>
              Create
            </Button>
          </DialogActions>
        </Stack>
      </Dialog>
    </Stack>
  );
};
