import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Send, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { UPLOAD_BASE_URL } from '../api/config';
import { getErrorMessage } from '../api/errorUtils';
import { Alert, Button, Card, CardContent, CardHeader, Dialog, Field, Select, Textarea } from '../components/ui';
import { StatusChip } from '../components/StatusChip';
import {
  useAddCommentMutation,
  useAssignCaseMutation,
  useGetCaseQuery,
  useUpdateCaseStatusMutation,
  useUploadDocumentMutation
} from '../features/cases/casesApi';
import { useGetAgentsQuery } from '../features/users/usersApi';
import { formatDate, formatDateTime } from '../utils/date';
import { statuses } from '../utils/status';

export const CaseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [comment, setComment] = useState('');
  const [note, setNote] = useState('');
  const [agentId, setAgentId] = useState('');
  const [assignOpen, setAssignOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('Cleared');

  const { data, error, isLoading } = useGetCaseQuery(id);
  const { data: agentsData } = useGetAgentsQuery(undefined, { skip: user.role !== 'manager' });
  const [addCommentMutation, { isLoading: addingComment }] = useAddCommentMutation();
  const [uploadDocument, { isLoading: uploadingDocument }] = useUploadDocumentMutation();
  const [updateCaseStatus, { isLoading: changingStatus }] = useUpdateCaseStatusMutation();
  const [assignCase, { isLoading: assigningCase }] = useAssignCaseMutation();

  const caseItem = data?.case;
  const allowedTransitions = data?.allowedTransitions || [];
  const agents = agentsData?.agents || [];

  useEffect(() => {
    if (caseItem) setAgentId(caseItem.assignedAgent?._id || '');
  }, [caseItem]);

  const addComment = async (event) => {
    event.preventDefault();
    if (!comment.trim()) return;
    try {
      await addCommentMutation({ id, body: comment.trim() }).unwrap();
      toast.success('Comment added');
      setComment('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const uploadFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('document', file);

    try {
      await uploadDocument({ id, formData }).unwrap();
      toast.success('Document uploaded');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      event.target.value = '';
    }
  };

  const transition = async (toStatus, transitionNote = '') => {
    try {
      await updateCaseStatus({ id, toStatus, note: transitionNote }).unwrap();
      toast.success(`Case moved to ${toStatus}`);
      closeReviewDialog();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const assign = async (event) => {
    event.preventDefault();
    try {
      await assignCase({ id, agentId, note }).unwrap();
      toast.success('Case assigned');
      closeAssignDialog();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const closeAssignDialog = () => {
    setAssignOpen(false);
    setNote('');
  };

  const closeReviewDialog = () => {
    setReviewOpen(false);
    setNote('');
  };

  if (error && !caseItem) return <Alert variant="error">{getErrorMessage(error)}</Alert>;
  if (isLoading || !caseItem) return <Alert>Loading case...</Alert>;

  const canUpload = user.role === 'agent' && ['Assigned', 'In Progress'].includes(caseItem.status);

  return (
    <div className="page-stack">
      <CaseHeader
        allowedTransitions={allowedTransitions}
        caseItem={caseItem}
        user={user}
        onAssign={() => setAssignOpen(true)}
        onBack={() => navigate('/cases')}
        onReview={() => setReviewOpen(true)}
        onTransition={transition}
      />

      {error && <Alert variant="error">{getErrorMessage(error)}</Alert>}

      <div className="detail-grid">
        <div className="stack">
          <TimelineCard status={caseItem.status} />
          <DocumentsCard canUpload={canUpload} documents={caseItem.documents} isUploading={uploadingDocument} onUpload={uploadFile} />
          <CommentsCard comment={comment} comments={caseItem.comments} isSubmitting={addingComment} onChangeComment={setComment} onSubmit={addComment} />
        </div>

        <div className="stack">
          <SummaryCard caseItem={caseItem} />
          <AuditLogCard auditLog={caseItem.auditLog} />
        </div>
      </div>

      <AssignDialog
        agentId={agentId}
        agents={agents}
        isSubmitting={assigningCase}
        note={note}
        open={assignOpen}
        onAgentChange={setAgentId}
        onClose={closeAssignDialog}
        onNoteChange={setNote}
        onSubmit={assign}
      />

      <ReviewDialog
        isSubmitting={changingStatus}
        note={note}
        open={reviewOpen}
        status={reviewStatus}
        onClose={closeReviewDialog}
        onNoteChange={setNote}
        onStatusChange={setReviewStatus}
        onSubmit={() => transition(reviewStatus, note)}
      />
    </div>
  );
};

const CaseHeader = ({ allowedTransitions, caseItem, user, onAssign, onBack, onReview, onTransition }) => (
  <div className="page-header">
    <div>
      <Button type="button" variant="ghost" onClick={onBack} className="btn-sm" style={{ marginBottom: 10 }}>
        <ArrowLeft size={18} />
        Back
      </Button>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <h1 className="page-title">{caseItem.subjectName}</h1>
        <StatusChip status={caseItem.status} />
      </div>
      <p className="page-subtitle">
        {caseItem.clientName} / {caseItem.caseType} / Due {formatDate(caseItem.dueDate)}
      </p>
    </div>
    <CaseActions allowedTransitions={allowedTransitions} caseItem={caseItem} user={user} onAssign={onAssign} onReview={onReview} onTransition={onTransition} />
  </div>
);

const CaseActions = ({ allowedTransitions, caseItem, user, onAssign, onReview, onTransition }) => (
  <div className="row" style={{ flexWrap: 'wrap' }}>
    {user.role === 'manager' && allowedTransitions.includes('Assigned') && (
      <Button type="button" onClick={onAssign}>
        Assign
      </Button>
    )}
    {user.role === 'manager' && caseItem.status === 'Submitted' && (
      <Button type="button" onClick={onReview}>
        <CheckCircle2 size={20} />
        Review
      </Button>
    )}
    {user.role === 'agent' && allowedTransitions.includes('In Progress') && (
      <Button type="button" variant="outline" onClick={() => onTransition('In Progress')}>
        Start work
      </Button>
    )}
    {user.role === 'agent' && allowedTransitions.includes('Submitted') && (
      <Button type="button" onClick={() => onTransition('Submitted')}>
        <Send size={20} />
        Submit
      </Button>
    )}
  </div>
);

const TimelineCard = ({ status }) => {
  const activeStep = Math.max(0, statuses.indexOf(status));

  return (
    <Card>
      <CardHeader title="Status timeline" />
      <CardContent>
        <div className="timeline">
          {statuses.map((item, index) => (
            <div className={index <= activeStep ? 'timeline-step active' : 'timeline-step'} key={item}>
              {item}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const DocumentsCard = ({ canUpload, documents, isUploading, onUpload }) => (
  <Card>
    <CardHeader
      title="Documents"
      action={
        canUpload && (
          <Button as="label" variant="outline" className="btn btn-outline btn-md">
            <Upload size={20} />
            {isUploading ? 'Uploading...' : 'Upload'}
            <input hidden type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={onUpload} />
          </Button>
        )
      }
    />
    <CardContent className="stack">
      {isUploading && <div className="progress" />}
      {documents.length === 0 && <Alert>No documents uploaded yet.</Alert>}
      {documents.map((document) => (
        <DocumentItem document={document} key={document._id} />
      ))}
    </CardContent>
  </Card>
);

const DocumentItem = ({ document }) => (
  <div className="document-item row-between" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
    <div style={{ minWidth: 0 }}>
      <a href={`${UPLOAD_BASE_URL}${document.path}`} target="_blank" rel="noreferrer" className="strong">
        {document.originalName}
      </a>
      <div className="muted" style={{ fontSize: 13 }}>
        Uploaded by {document.uploadedBy?.name} / {Math.ceil(document.size / 1024)} KB
      </div>
    </div>
    <div className="muted" style={{ fontSize: 13 }}>
      {formatDateTime(document.createdAt)}
    </div>
  </div>
);

const CommentsCard = ({ comment, comments, isSubmitting, onChangeComment, onSubmit }) => (
  <Card>
    <CardHeader title="Comments" />
    <CardContent>
      <form className="comments-form" onSubmit={onSubmit}>
        <Textarea placeholder="Add comment" value={comment} onChange={(event) => onChangeComment(event.target.value)} />
        <Button type="submit" disabled={isSubmitting}>
          Add
        </Button>
      </form>
      <div className="stack">
        {comments.length === 0 && <div className="muted">No comments yet.</div>}
        {comments
          .slice()
          .reverse()
          .map((item) => (
            <CommentItem comment={item} key={item._id} />
          ))}
      </div>
    </CardContent>
  </Card>
);

const CommentItem = ({ comment }) => (
  <div className="comment-item">
    <div>{comment.body}</div>
    <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
      {comment.author?.name} / {formatDateTime(comment.createdAt)}
    </div>
  </div>
);

const SummaryCard = ({ caseItem }) => (
  <Card>
    <CardHeader title="Case summary" />
    <CardContent className="stack">
      <SummaryRow label="Client" value={caseItem.clientName} />
      <SummaryRow label="Subject" value={caseItem.subjectName} />
      <SummaryRow label="Agent" value={caseItem.assignedAgent?.name || 'Unassigned'} />
      <SummaryRow label="Created by" value={caseItem.createdBy?.name} />
      {caseItem.verdictNote && <SummaryRow label="Verdict note" value={caseItem.verdictNote} />}
    </CardContent>
  </Card>
);

const AuditLogCard = ({ auditLog }) => (
  <Card>
    <CardHeader title="Audit log" />
    <CardContent className="stack">
      {auditLog
        .slice()
        .reverse()
        .map((item) => (
          <AuditItem item={item} key={item._id} />
        ))}
    </CardContent>
  </Card>
);

const AuditItem = ({ item }) => (
  <div className="comment-item">
    <div className="strong">{item.action}</div>
    <div className="muted" style={{ fontSize: 13 }}>
      {item.fromStatus || 'Start'} to {item.toStatus}
    </div>
    {item.note && <div style={{ marginTop: 6 }}>{item.note}</div>}
    <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
      {item.actor?.name} / {formatDateTime(item.createdAt)}
    </div>
  </div>
);

const AssignDialog = ({ agentId, agents, isSubmitting, note, open, onAgentChange, onClose, onNoteChange, onSubmit }) => (
  <Dialog open={open} title="Assign case" onClose={onClose}>
    <form onSubmit={onSubmit}>
      <div className="dialog-body">
        <Field label="Agent">
          <Select required value={agentId} onChange={(event) => onAgentChange(event.target.value)}>
            <option value="" disabled>
              Select agent
            </option>
            {agents.map((agent) => (
              <option value={agent.id} key={agent.id}>
                {agent.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Note">
          <Textarea value={note} onChange={(event) => onNoteChange(event.target.value)} />
        </Field>
      </div>
      <div className="dialog-actions">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Assign
        </Button>
      </div>
    </form>
  </Dialog>
);

const ReviewDialog = ({ isSubmitting, note, open, status, onClose, onNoteChange, onStatusChange, onSubmit }) => (
  <Dialog open={open} title="Review submission" onClose={onClose}>
    <div className="dialog-body">
      <Field label="Verdict">
        <Select value={status} onChange={(event) => onStatusChange(event.target.value)}>
          <option value="Cleared">Cleared</option>
          <option value="Discrepant">Discrepant</option>
        </Select>
      </Field>
      <Field label="Verdict note">
        <Textarea value={note} onChange={(event) => onNoteChange(event.target.value)} />
      </Field>
    </div>
    <div className="dialog-actions">
      <Button type="button" variant="ghost" onClick={onClose}>
        Cancel
      </Button>
      <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
        Save verdict
      </Button>
    </div>
  </Dialog>
);

const SummaryRow = ({ label, value }) => (
  <div className="summary-row">
    <span className="muted">{label}</span>
    <span>{value}</span>
  </div>
);
