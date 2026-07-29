import { format } from 'date-fns';
import { ArrowLeft, CheckCircle2, Send, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getErrorMessage, http, UPLOAD_BASE_URL } from '../api/http';
import { StatusChip } from '../components/StatusChip';
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Dialog, Field, Select, Textarea } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { getCaseIdFromPath, useRouter } from '../context/RouterContext';
import { statuses } from '../utils/status';

export const CaseDetailPage = () => {
  const { path, navigate } = useRouter();
  const id = getCaseIdFromPath(path);
  const { user } = useAuth();
  const [caseItem, setCaseItem] = useState(null);
  const [allowedTransitions, setAllowedTransitions] = useState([]);
  const [agents, setAgents] = useState([]);
  const [comment, setComment] = useState('');
  const [note, setNote] = useState('');
  const [agentId, setAgentId] = useState('');
  const [assignOpen, setAssignOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('Cleared');
  const [error, setError] = useState('');

  const loadCase = async () => {
    setError('');
    try {
      const { data } = await http.get(`/cases/${id}`);
      setCaseItem(data.case);
      setAllowedTransitions(data.allowedTransitions);
      setAgentId(data.case.assignedAgent?._id || '');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    loadCase();
  }, [id]);

  useEffect(() => {
    if (user.role !== 'manager') return;
    http.get('/users/agents').then(({ data }) => setAgents(data.agents));
  }, [user.role]);

  const refreshFromResponse = ({ data }) => {
    setCaseItem(data.case);
    setError('');
  };

  const addComment = async (event) => {
    event.preventDefault();
    if (!comment.trim()) return;
    try {
      refreshFromResponse(await http.post(`/cases/${id}/comments`, { body: comment }));
      setComment('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const uploadFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const data = new FormData();
    data.append('document', file);
    try {
      refreshFromResponse(await http.post(`/cases/${id}/documents`, data));
      await loadCase();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      event.target.value = '';
    }
  };

  const transition = async (toStatus, transitionNote = '') => {
    try {
      refreshFromResponse(await http.patch(`/cases/${id}/status`, { toStatus, note: transitionNote }));
      await loadCase();
      setReviewOpen(false);
      setNote('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const assign = async (event) => {
    event.preventDefault();
    try {
      refreshFromResponse(await http.patch(`/cases/${id}/assign`, { agentId, note }));
      await loadCase();
      setAssignOpen(false);
      setNote('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (error && !caseItem) return <Alert variant="error">{error}</Alert>;
  if (!caseItem) return <Alert>Loading case...</Alert>;

  const activeStep = Math.max(0, statuses.indexOf(caseItem.status));
  const canUpload = user.role === 'agent' && ['Assigned', 'In Progress'].includes(caseItem.status);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" className="px-0" onClick={() => navigate('/cases')}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">{caseItem.subjectName}</h1>
              <StatusChip status={caseItem.status} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {caseItem.clientName} / {caseItem.caseType} / Due {format(new Date(caseItem.dueDate), 'dd MMM yyyy')}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {user.role === 'manager' && allowedTransitions.includes('Assigned') && (
            <Button onClick={() => setAssignOpen(true)}>Assign</Button>
          )}
          {user.role === 'manager' && caseItem.status === 'Submitted' && (
            <Button onClick={() => setReviewOpen(true)}>
              <CheckCircle2 className="h-4 w-4" />
              Review
            </Button>
          )}
          {user.role === 'agent' && allowedTransitions.includes('In Progress') && (
            <Button variant="outline" onClick={() => transition('In Progress')}>Start work</Button>
          )}
          {user.role === 'agent' && allowedTransitions.includes('Submitted') && (
            <Button onClick={() => transition('Submitted')}>
              <Send className="h-4 w-4" />
              Submit
            </Button>
          )}
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Status timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="hidden items-center md:flex">
                {statuses.map((status, index) => {
                  const complete = index <= activeStep;
                  return (
                    <div className="flex flex-1 items-center" key={status}>
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div className={`grid h-8 w-8 place-items-center rounded-full border text-xs font-semibold ${complete ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-500'}`}>
                          {index + 1}
                        </div>
                        <span className={`text-xs font-medium ${status === caseItem.status ? 'text-slate-950' : 'text-slate-500'}`}>{status}</span>
                      </div>
                      {index < statuses.length - 1 && <div className={`mx-3 h-px flex-1 ${index < activeStep ? 'bg-blue-600' : 'bg-slate-200'}`} />}
                    </div>
                  );
                })}
              </div>
              <div className="grid gap-3 md:hidden">
                {statuses.map((status, index) => (
                  <div className="flex items-center gap-3" key={status}>
                    <div className={`h-3 w-3 rounded-full ${index <= activeStep ? 'bg-blue-600' : 'bg-slate-300'}`} />
                    <span className={`text-sm ${status === caseItem.status ? 'font-semibold text-slate-950' : 'text-slate-500'}`}>{status}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Documents</CardTitle>
              {canUpload && (
                <Button variant="outline" size="sm" className="relative">
                  <Upload className="h-4 w-4" />
                  Upload
                  <input className="absolute inset-0 cursor-pointer opacity-0" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={uploadFile} />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {caseItem.documents.length === 0 && <Alert>No documents uploaded yet.</Alert>}
              {caseItem.documents.map((doc) => (
                <div key={doc._id} className="flex flex-col justify-between gap-2 rounded-md border border-slate-200 p-3 sm:flex-row">
                  <div>
                    <a className="font-semibold text-blue-700 hover:underline" href={`${UPLOAD_BASE_URL}${doc.path}`} target="_blank" rel="noreferrer">
                      {doc.originalName}
                    </a>
                    <p className="mt-1 text-sm text-slate-500">Uploaded by {doc.uploadedBy?.name} / {Math.ceil(doc.size / 1024)} KB</p>
                  </div>
                  <p className="text-sm text-slate-500">{format(new Date(doc.createdAt), 'dd MMM yyyy, p')}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="mb-4 flex flex-col gap-3 sm:flex-row" onSubmit={addComment}>
                <Textarea
                  className="min-h-10 sm:min-h-10"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Add comment"
                />
                <Button type="submit">Add</Button>
              </form>
              <div className="space-y-3">
                {caseItem.comments.length === 0 && <p className="text-sm text-slate-500">No comments yet.</p>}
                {caseItem.comments
                  .slice()
                  .reverse()
                  .map((item) => (
                    <div key={item._id} className="rounded-md bg-slate-50 p-3">
                      <p>{item.body}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.author?.name} / {format(new Date(item.createdAt), 'dd MMM yyyy, p')}</p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Case summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Row label="Client" value={caseItem.clientName} />
              <Row label="Subject" value={caseItem.subjectName} />
              <Row label="Agent" value={caseItem.assignedAgent?.name || 'Unassigned'} />
              <Row label="Created by" value={caseItem.createdBy?.name} />
              {caseItem.verdictNote && <Row label="Verdict note" value={caseItem.verdictNote} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audit log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-200">
                {caseItem.auditLog
                  .slice()
                  .reverse()
                  .map((item) => (
                    <div key={item._id} className="py-3 first:pt-0 last:pb-0">
                      <p className="font-semibold">{item.action}</p>
                      <p className="text-sm text-slate-500">{item.fromStatus || 'Start'} to {item.toStatus}</p>
                      {item.note && <p className="mt-1 text-sm">{item.note}</p>}
                      <p className="mt-1 text-xs text-slate-500">{item.actor?.name} / {format(new Date(item.createdAt), 'dd MMM yyyy, p')}</p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog
        open={assignOpen}
        title="Assign case"
        onClose={() => setAssignOpen(false)}
        className="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button type="submit" form="assign-case-form">Assign</Button>
          </>
        }
      >
        <form id="assign-case-form" className="grid gap-4" onSubmit={assign}>
          <Field label="Agent">
            <Select required value={agentId} onChange={(event) => setAgentId(event.target.value)}>
              <option value="" disabled>Select agent</option>
              {agents.map((agent) => (
                <option value={agent.id} key={agent.id}>
                  {agent.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Note">
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} />
          </Field>
        </form>
      </Dialog>

      <Dialog
        open={reviewOpen}
        title="Review submission"
        onClose={() => setReviewOpen(false)}
        className="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>Cancel</Button>
            <Button onClick={() => transition(reviewStatus, note)}>Save verdict</Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Field label="Verdict">
            <Select value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value)}>
              <option value="Cleared">Cleared</option>
              <option value="Discrepant">Discrepant</option>
            </Select>
          </Field>
          <Field label="Verdict note">
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} />
          </Field>
        </div>
      </Dialog>
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-4 text-sm">
    <span className="text-slate-500">{label}</span>
    <span className="max-w-[60%] text-right font-semibold">{value}</span>
  </div>
);
