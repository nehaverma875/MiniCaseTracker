import { format } from 'date-fns';
import { Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getErrorMessage, http } from '../api/http';
import { StatusChip } from '../components/StatusChip';
import { Alert, Badge, Button, Card, CardContent, Dialog, Field, Input, Select } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { caseTypes, statuses } from '../utils/status';

const emptyForm = {
  clientName: '',
  subjectName: '',
  caseType: 'KYC',
  dueDate: '',
  assignedAgent: ''
};

export const CasesPage = () => {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [cases, setCases] = useState([]);
  const [agents, setAgents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', status: '', agent: '', page: 1 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const params = useMemo(() => {
    const result = { page: filters.page, limit: 10 };
    if (filters.search) result.search = filters.search;
    if (filters.status) result.status = filters.status;
    if (filters.agent) result.agent = filters.agent;
    return result;
  }, [filters]);

  const loadCases = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await http.get('/cases', { params });
      setCases(data.cases);
      setPagination(data.pagination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [params]);

  useEffect(() => {
    if (user.role !== 'manager') return;
    http.get('/users/agents').then(({ data }) => setAgents(data.agents));
  }, [user.role]);

  const submitCase = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await http.post('/cases', { ...form, assignedAgent: form.assignedAgent || undefined });
      setDialogOpen(false);
      setForm(emptyForm);
      loadCases();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const statCounts = statuses.map((status) => ({
    status,
    count: cases.filter((caseItem) => caseItem.status === status).length
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Cases</h1>
          <p className="mt-1 text-sm text-slate-500">
            {user.role === 'manager' ? 'Review and assign client cases.' : 'Work on cases assigned to you.'}
          </p>
        </div>
        {user.role === 'manager' && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            New case
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statCounts.map(({ status, count }) => (
          <Card key={status}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-slate-500">{status}</p>
              <p className="mt-1 text-2xl font-semibold">{count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 lg:grid-cols-[1fr_180px_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Search client, subject, or type"
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value, page: 1 }))}
            />
          </div>
          <Select
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value, page: 1 }))}
          >
            <option value="">All statuses</option>
            {statuses.map((status) => (
              <option value={status} key={status}>
                {status}
              </option>
            ))}
          </Select>
          {user.role === 'manager' && (
            <Select
              value={filters.agent}
              onChange={(event) => setFilters((prev) => ({ ...prev, agent: event.target.value, page: 1 }))}
            >
              <option value="">All agents</option>
              {agents.map((agent) => (
                <option value={agent.id} key={agent.id}>
                  {agent.name}
                </option>
              ))}
            </Select>
          )}
        </CardContent>
      </Card>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid gap-3 md:hidden">
        {cases.map((caseItem) => (
          <Card key={caseItem._id} className="cursor-pointer transition hover:border-blue-300" onClick={() => navigate(`/cases/${caseItem._id}`)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{caseItem.subjectName}</h2>
                  <p className="mt-1 text-sm text-slate-500">{caseItem.clientName}</p>
                </div>
                <StatusChip status={caseItem.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline">{caseItem.caseType}</Badge>
                <Badge variant="outline">Due {format(new Date(caseItem.dueDate), 'dd MMM yyyy')}</Badge>
                <Badge variant="outline">{caseItem.assignedAgent?.name || 'Unassigned'}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Subject</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Agent</th>
                <th className="px-4 py-3 font-semibold">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {cases.map((caseItem) => (
                <tr
                  key={caseItem._id}
                  className="cursor-pointer bg-white transition hover:bg-slate-50"
                  onClick={() => navigate(`/cases/${caseItem._id}`)}
                >
                  <td className="px-4 py-3">{caseItem.clientName}</td>
                  <td className="px-4 py-3 font-medium">{caseItem.subjectName}</td>
                  <td className="px-4 py-3">{caseItem.caseType}</td>
                  <td className="px-4 py-3"><StatusChip status={caseItem.status} /></td>
                  <td className="px-4 py-3">{caseItem.assignedAgent?.name || 'Unassigned'}</td>
                  <td className="px-4 py-3">{format(new Date(caseItem.dueDate), 'dd MMM yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {!loading && cases.length === 0 && <Alert>No cases match the current filters.</Alert>}

      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={pagination.page <= 1}
          onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
        >
          Previous
        </Button>
        <span className="text-sm text-slate-600">
          Page {pagination.page} of {pagination.pages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={pagination.page >= pagination.pages}
          onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
        >
          Next
        </Button>
      </div>

      <Dialog
        open={dialogOpen}
        title="Create case"
        onClose={() => setDialogOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" form="create-case-form">Create</Button>
          </>
        }
      >
        <form id="create-case-form" className="grid gap-4" onSubmit={submitCase}>
          <Field label="Client name">
            <Input
              value={form.clientName}
              onChange={(event) => setForm((prev) => ({ ...prev, clientName: event.target.value }))}
              required
            />
          </Field>
          <Field label="Subject name">
            <Input
              value={form.subjectName}
              onChange={(event) => setForm((prev) => ({ ...prev, subjectName: event.target.value }))}
              required
            />
          </Field>
          <Field label="Case type">
            <Select value={form.caseType} onChange={(event) => setForm((prev) => ({ ...prev, caseType: event.target.value }))}>
              {caseTypes.map((type) => (
                <option value={type} key={type}>
                  {type}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Due date">
            <Input
              type="date"
              value={form.dueDate}
              onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
              required
            />
          </Field>
          <Field label="Assign agent">
            <Select value={form.assignedAgent} onChange={(event) => setForm((prev) => ({ ...prev, assignedAgent: event.target.value }))}>
              <option value="">Leave unassigned</option>
              {agents.map((agent) => (
                <option value={agent.id} key={agent.id}>
                  {agent.name}
                </option>
              ))}
            </Select>
          </Field>
        </form>
      </Dialog>
    </div>
  );
};
