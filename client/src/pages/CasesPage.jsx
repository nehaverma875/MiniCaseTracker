import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Search } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getFieldErrors, getErrorMessage } from '../api/errorUtils';
import { Alert, Button, Card, Dialog, Field, Input, Select } from '../components/ui';
import { StatusChip } from '../components/StatusChip';
import { useCreateCaseMutation, useGetCasesQuery, useGetDashboardQuery } from '../features/cases/casesApi';
import { useGetAgentsQuery } from '../features/users/usersApi';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { formatDate, isPastDate, isValidDate, todayInputValue } from '../utils/date';
import { caseTypes, statuses } from '../utils/status';

const CASES_LIMIT = 10;
const emptyForm = { clientName: '', subjectName: '', caseType: 'KYC', dueDate: '', assignedAgent: '' };

export const CasesPage = ({ createOnMount = false }) => {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ search: '', status: '', agent: '', page: 1 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(filters.search.trim(), 400);
  const form = useForm({ defaultValues: emptyForm });

  const queryParams = useMemo(
    () => buildCaseQueryParams(filters, debouncedSearch),
    [debouncedSearch, filters.agent, filters.page, filters.status]
  );

  const { data: caseData, error: casesError, isFetching } = useGetCasesQuery(queryParams);
  const { data: dashboardData } = useGetDashboardQuery();
  const { data: agentsData } = useGetAgentsQuery(undefined, { skip: user.role !== 'manager' });
  const [createCase, { isLoading: creatingCase, error: createError }] = useCreateCaseMutation();

  const cases = caseData?.cases || [];
  const agents = agentsData?.agents || [];
  const pagination = caseData?.pagination || { page: filters.page, pages: 1 };
  const statusCounts = dashboardData?.stats?.statusCounts || {};
  const error = casesError || createError;

  useEffect(() => {
    if (createOnMount && user.role === 'manager') setDialogOpen(true);
  }, [createOnMount, user.role]);

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value, page: 1 }));
  };

  const closeDialog = () => {
    setDialogOpen(false);
    if (createOnMount) navigate('/cases');
  };

  const submitCase = async (values) => {
    try {
      await createCase(normalizeCasePayload(values)).unwrap();
      toast.success('Case created successfully');
      form.reset(emptyForm);
      closeDialog();
    } catch (err) {
      showServerFieldErrors(err, form.setError);
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="cases-page">
      <CasesHeader user={user} onCreate={() => navigate('/cases/new')} />
      <StatusStats statusCounts={statusCounts} />
      <CaseFilters filters={filters} agents={agents} user={user} onFilterChange={updateFilter} />
      {error && <Alert variant="error">{getErrorMessage(error)}</Alert>}
      <CasesList cases={cases} isFetching={isFetching} onOpenCase={(caseId) => navigate(`/cases/${caseId}`)} />
      <CasesPagination pagination={pagination} onPageChange={(page) => setFilters((current) => ({ ...current, page }))} />
      <CreateCaseDialog agents={agents} form={form} open={dialogOpen} isSubmitting={creatingCase} onClose={closeDialog} onSubmit={submitCase} />
    </div>
  );
};

const buildCaseQueryParams = (filters, debouncedSearch) => {
  const params = { page: filters.page, limit: CASES_LIMIT };
  if (debouncedSearch) params.search = debouncedSearch;
  if (filters.status) params.status = filters.status;
  if (filters.agent) params.agent = filters.agent;
  return params;
};

const normalizeCasePayload = (values) => ({
  ...values,
  clientName: values.clientName.trim(),
  subjectName: values.subjectName.trim(),
  assignedAgent: values.assignedAgent || undefined
});

const showServerFieldErrors = (error, setError) => {
  Object.entries(getFieldErrors(error)).forEach(([field, message]) => {
    setError(field, { type: 'server', message });
  });
};

const CasesHeader = ({ user, onCreate }) => (
  <div className="page-header">
    <div>
      <h1 className="page-title">Cases</h1>
      <p className="page-subtitle">{user.role === 'manager' ? 'Review and assign client cases.' : 'Work on cases assigned to you.'}</p>
    </div>
    {user.role === 'manager' && (
      <Button type="button" onClick={onCreate}>
        <Plus size={20} />
        New case
      </Button>
    )}
  </div>
);

const StatusStats = ({ statusCounts }) => (
  <div className="stats-grid">
    {statuses.map((status) => (
      <Card key={status}>
        <div className="stat-card">
          <div>
            <p className="stat-label">{status}</p>
            <p className="stat-value">{statusCounts[status] || 0}</p>
          </div>
        </div>
      </Card>
    ))}
  </div>
);

const CaseFilters = ({ filters, agents, user, onFilterChange }) => (
  <Card className="filters-card">
    <div className={user.role === 'manager' ? 'filters-grid' : 'filters-grid agent-filters'}>
      <Field label="Search">
        <div className="input-with-icon">
          <Search size={20} />
          <Input
            placeholder="Client, subject, or type"
            value={filters.search}
            onChange={(event) => onFilterChange('search', event.target.value)}
          />
        </div>
      </Field>
      <Field label="Status">
        <Select value={filters.status} onChange={(event) => onFilterChange('status', event.target.value)}>
          <option value="">All statuses</option>
          {statuses.map((status) => (
            <option value={status} key={status}>
              {status}
            </option>
          ))}
        </Select>
      </Field>
      {user.role === 'manager' && (
        <Field label="Agent">
          <Select value={filters.agent} onChange={(event) => onFilterChange('agent', event.target.value)}>
            <option value="">All agents</option>
            {agents.map((agent) => (
              <option value={agent.id} key={agent.id}>
                {agent.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
    </div>
  </Card>
);

const CasesList = ({ cases, isFetching, onOpenCase }) => (
  <Card className="table-card">
    <div className="table-scroll desktop-table">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '22%' }}>Client</th>
            <th style={{ width: '22%' }}>Subject</th>
            <th style={{ width: '14%' }}>Type</th>
            <th style={{ width: '16%' }}>Status</th>
            <th style={{ width: '14%' }}>Agent</th>
            <th style={{ width: '12%' }}>Due</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((caseItem) => (
            <tr key={caseItem._id} onClick={() => onOpenCase(caseItem._id)}>
              <td>{caseItem.clientName}</td>
              <td className="strong">{caseItem.subjectName}</td>
              <td>
                <span className="badge">{caseItem.caseType}</span>
              </td>
              <td>
                <StatusChip status={caseItem.status} />
              </td>
              <td>{caseItem.assignedAgent?.name || 'Unassigned'}</td>
              <td>{formatDate(caseItem.dueDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!isFetching && cases.length === 0 && <Alert>No cases match the current filters.</Alert>}
    </div>
    <div className="case-card-list">
      {cases.map((caseItem) => (
        <button type="button" className="case-list-card" key={caseItem._id} onClick={() => onOpenCase(caseItem._id)}>
          <div className="row-between" style={{ alignItems: 'flex-start' }}>
            <div style={{ minWidth: 0, textAlign: 'left' }}>
              <div className="strong" style={{ overflowWrap: 'anywhere' }}>
                {caseItem.subjectName}
              </div>
              <div className="muted" style={{ marginTop: 4, overflowWrap: 'anywhere' }}>
                {caseItem.clientName}
              </div>
            </div>
            <StatusChip status={caseItem.status} />
          </div>
          <div className="row" style={{ marginTop: 12, flexWrap: 'wrap' }}>
            <span className="badge">{caseItem.caseType}</span>
            <span className="badge">{caseItem.assignedAgent?.name || 'Unassigned'}</span>
            <span className="badge">Due {formatDate(caseItem.dueDate)}</span>
          </div>
        </button>
      ))}
      {!isFetching && cases.length === 0 && <Alert>No cases match the current filters.</Alert>}
    </div>
  </Card>
);

const CasesPagination = ({ pagination, onPageChange }) => {
  if (pagination.pages <= 1) return null;

  return (
    <div className="pagination">
      <Button type="button" variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>
        Previous
      </Button>
      <span className="badge badge-blue">{pagination.page}</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pagination.page >= pagination.pages}
        onClick={() => onPageChange(pagination.page + 1)}
      >
        Next
      </Button>
    </div>
  );
};

const CreateCaseDialog = ({ agents, form, open, isSubmitting, onClose, onSubmit }) => {
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = form;

  return (
    <Dialog open={open} title="Create case" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="dialog-body">
          <ControlledTextField
            control={control}
            errors={errors}
            name="clientName"
            label="Client name"
            rules={{
              validate: (value) => value.trim().length >= 2 || 'Client name must be at least 2 characters',
              maxLength: { value: 120, message: 'Client name is too long' }
            }}
          />
          <ControlledTextField
            control={control}
            errors={errors}
            name="subjectName"
            label="Subject name"
            rules={{
              validate: (value) => value.trim().length >= 2 || 'Subject name must be at least 2 characters',
              maxLength: { value: 120, message: 'Subject name is too long' }
            }}
          />
          <CaseTypeField control={control} error={errors.caseType} />
          <DueDateField control={control} error={errors.dueDate} />
          <AgentField agents={agents} control={control} />
        </div>
        <div className="dialog-actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

const ControlledTextField = ({ control, errors, name, label, rules }) => (
  <Controller
    name={name}
    control={control}
    rules={rules}
    render={({ field }) => (
      <Field label={label} error={errors[name]?.message}>
        <Input {...field} maxLength={120} required />
      </Field>
    )}
  />
);

const CaseTypeField = ({ control, error }) => (
  <Controller
    name="caseType"
    control={control}
    rules={{ validate: (value) => caseTypes.includes(value) || 'Select a valid case type' }}
    render={({ field }) => (
      <Field label="Case type" error={error?.message}>
        <Select {...field}>
          {caseTypes.map((type) => (
            <option value={type} key={type}>
              {type}
            </option>
          ))}
        </Select>
      </Field>
    )}
  />
);

const DueDateField = ({ control, error }) => (
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
      <Field label="Due date" error={error?.message}>
        <Input {...field} type="date" min={todayInputValue()} required />
      </Field>
    )}
  />
);

const AgentField = ({ agents, control }) => (
  <Controller
    name="assignedAgent"
    control={control}
    render={({ field }) => (
      <Field label="Assign agent">
        <Select {...field}>
          <option value="">Leave unassigned</option>
          {agents.map((agent) => (
            <option value={agent.id} key={agent.id}>
              {agent.name}
            </option>
          ))}
        </Select>
      </Field>
    )}
  />
);
