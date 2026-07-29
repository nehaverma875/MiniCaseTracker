import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  Link,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutline';
import SendIcon from '@mui/icons-material/Send';
import UploadIcon from '@mui/icons-material/UploadFile';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getErrorMessage,
  UPLOAD_BASE_URL,
  useAddCommentMutation,
  useAssignCaseMutation,
  useGetAgentsQuery,
  useGetCaseQuery,
  useUpdateCaseStatusMutation,
  useUploadDocumentMutation
} from '../api/apiSlice';
import { StatusChip } from '../components/StatusChip';
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
    const data = new FormData();
    data.append('document', file);
    try {
      await uploadDocument({ id, formData: data }).unwrap();
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
      setReviewOpen(false);
      setNote('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const assign = async (event) => {
    event.preventDefault();
    try {
      await assignCase({ id, agentId, note }).unwrap();
      toast.success('Case assigned');
      setAssignOpen(false);
      setNote('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (error && !caseItem) return <Alert severity="error">{getErrorMessage(error)}</Alert>;
  if (isLoading || !caseItem) return <Alert severity="info">Loading case...</Alert>;

  const activeStep = Math.max(0, statuses.indexOf(caseItem.status));
  const canUpload = user.role === 'agent' && ['Assigned', 'In Progress'].includes(caseItem.status);

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
        <Box>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/cases')} sx={{ mb: 1 }}>
            Back
          </Button>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Typography variant="h4" fontWeight={800}>
              {caseItem.subjectName}
            </Typography>
            <StatusChip status={caseItem.status} />
          </Stack>
          <Typography color="text.secondary">
            {caseItem.clientName} / {caseItem.caseType} / Due {formatDate(caseItem.dueDate)}
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
          {user.role === 'manager' && allowedTransitions.includes('Assigned') && (
            <Button variant="contained" onClick={() => setAssignOpen(true)} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              Assign
            </Button>
          )}
          {user.role === 'manager' && caseItem.status === 'Submitted' && (
            <Button variant="contained" startIcon={<CheckCircleIcon />} onClick={() => setReviewOpen(true)} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              Review
            </Button>
          )}
          {user.role === 'agent' && allowedTransitions.includes('In Progress') && (
            <Button variant="outlined" onClick={() => transition('In Progress')} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              Start work
            </Button>
          )}
          {user.role === 'agent' && allowedTransitions.includes('Submitted') && (
            <Button variant="contained" startIcon={<SendIcon />} onClick={() => transition('Submitted')} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              Submit
            </Button>
          )}
        </Stack>
      </Stack>

      {error && <Alert severity="error">{getErrorMessage(error)}</Alert>}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2}>
            <Card variant="outlined">
              <CardHeader title="Status timeline" />
              <CardContent>
                <Stepper activeStep={activeStep} alternativeLabel sx={{ display: { xs: 'none', md: 'flex' } }}>
                  {statuses.map((status) => (
                    <Step key={status}>
                      <StepLabel>{status}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
                <Stepper activeStep={activeStep} orientation="vertical" sx={{ display: { xs: 'block', md: 'none' } }}>
                  {statuses.map((status) => (
                    <Step key={status}>
                      <StepLabel>{status}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardHeader
                title="Documents"
                action={
                  canUpload && (
                    <Button component="label" variant="outlined" startIcon={<UploadIcon />} disabled={uploadingDocument}>
                      {uploadingDocument ? 'Uploading...' : 'Upload'}
                      <input hidden type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={uploadFile} />
                    </Button>
                  )
                }
              />
              <CardContent>
                <Stack spacing={1.5}>
                  {uploadingDocument && <LinearProgress />}
                  {caseItem.documents.length === 0 && <Alert severity="info">No documents uploaded yet.</Alert>}
                  {caseItem.documents.map((doc) => (
                    <Box key={doc._id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                        <Box>
                          <Link href={`${UPLOAD_BASE_URL}${doc.path}`} target="_blank" rel="noreferrer" fontWeight={800}>
                            {doc.originalName}
                          </Link>
                          <Typography variant="body2" color="text.secondary">
                            Uploaded by {doc.uploadedBy?.name} / {Math.ceil(doc.size / 1024)} KB
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {formatDateTime(doc.createdAt)}
                        </Typography>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardHeader title="Comments" />
              <CardContent>
                <Stack component="form" direction={{ xs: 'column', sm: 'row' }} spacing={1.5} onSubmit={addComment} sx={{ mb: 2 }}>
                  <TextField label="Add comment" value={comment} onChange={(event) => setComment(event.target.value)} multiline minRows={1} fullWidth />
                  <Button type="submit" variant="contained" disabled={addingComment}>
                    Add
                  </Button>
                </Stack>
                <Stack spacing={1.5}>
                  {caseItem.comments.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No comments yet.
                    </Typography>
                  )}
                  {caseItem.comments
                    .slice()
                    .reverse()
                    .map((item) => (
                      <Box key={item._id} sx={{ bgcolor: '#f8fafc', borderRadius: 1, p: 1.5 }}>
                        <Typography>{item.body}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.author?.name} / {formatDateTime(item.createdAt)}
                        </Typography>
                      </Box>
                    ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2}>
            <Card variant="outlined">
              <CardHeader title="Case summary" />
              <CardContent>
                <Stack spacing={1.5}>
                  <Row label="Client" value={caseItem.clientName} />
                  <Row label="Subject" value={caseItem.subjectName} />
                  <Row label="Agent" value={caseItem.assignedAgent?.name || 'Unassigned'} />
                  <Row label="Created by" value={caseItem.createdBy?.name} />
                  {caseItem.verdictNote && <Row label="Verdict note" value={caseItem.verdictNote} />}
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardHeader title="Audit log" />
              <CardContent>
                <Stack divider={<Divider />} spacing={1}>
                  {caseItem.auditLog
                    .slice()
                    .reverse()
                    .map((item) => (
                      <Box key={item._id} sx={{ py: 1 }}>
                        <Typography fontWeight={800}>{item.action}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.fromStatus || 'Start'} to {item.toStatus}
                        </Typography>
                        {item.note && <Typography variant="body2">{item.note}</Typography>}
                        <Typography variant="caption" color="text.secondary">
                          {item.actor?.name} / {formatDateTime(item.createdAt)}
                        </Typography>
                      </Box>
                    ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} fullWidth maxWidth="sm">
        <Stack component="form" onSubmit={assign}>
          <DialogTitle>Assign case</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <FormControl fullWidth required>
                <InputLabel>Agent</InputLabel>
                <Select label="Agent" value={agentId} onChange={(event) => setAgentId(event.target.value)}>
                  <MenuItem value="" disabled>Select agent</MenuItem>
                  {agents.map((agent) => (
                    <MenuItem value={agent.id} key={agent.id}>
                      {agent.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="Note" value={note} onChange={(event) => setNote(event.target.value)} multiline minRows={3} fullWidth />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={assigningCase}>
              Assign
            </Button>
          </DialogActions>
        </Stack>
      </Dialog>

      <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Review submission</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Verdict</InputLabel>
              <Select label="Verdict" value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value)}>
                <MenuItem value="Cleared">Cleared</MenuItem>
                <MenuItem value="Discrepant">Discrepant</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Verdict note" value={note} onChange={(event) => setNote(event.target.value)} multiline minRows={3} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => transition(reviewStatus, note)} disabled={changingStatus}>
            Save verdict
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

const Row = ({ label, value }) => (
  <Stack direction="row" justifyContent="space-between" spacing={2}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={800} textAlign="right">
      {value}
    </Typography>
  </Stack>
);
