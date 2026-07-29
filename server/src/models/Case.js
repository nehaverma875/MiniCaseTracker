import mongoose from 'mongoose';

export const CASE_STATUSES = ['New', 'Assigned', 'In Progress', 'Submitted', 'Cleared', 'Discrepant'];
export const CASE_TYPES = ['KYC', 'Employment', 'Address', 'Education', 'Criminal', 'Other'];

const documentSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    filename: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

const commentSchema = new mongoose.Schema(
  {
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

const auditLogSchema = new mongoose.Schema(
  {
    fromStatus: { type: String, enum: CASE_STATUSES },
    toStatus: { type: String, enum: CASE_STATUSES, required: true },
    action: { type: String, required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, trim: true, maxlength: 500 }
  },
  { timestamps: true }
);

const caseSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true, trim: true, maxlength: 120 },
    subjectName: { type: String, required: true, trim: true, maxlength: 120 },
    caseType: { type: String, enum: CASE_TYPES, required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: CASE_STATUSES, default: 'New', index: true },
    assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    verdictNote: { type: String, trim: true, maxlength: 1000 },
    documents: [documentSchema],
    comments: [commentSchema],
    auditLog: [auditLogSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

caseSchema.index({ clientName: 'text', subjectName: 'text', caseType: 'text' });
caseSchema.index({ updatedAt: -1 });
caseSchema.index({ status: 1, updatedAt: -1 });
caseSchema.index({ assignedAgent: 1, updatedAt: -1 });
caseSchema.index({ assignedAgent: 1, status: 1, updatedAt: -1 });
caseSchema.index({ dueDate: 1, status: 1 });

export const Case = mongoose.model('Case', caseSchema);
