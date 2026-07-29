import express from 'express';
import {
  addComment,
  assignCase,
  assignValidation,
  commentValidation,
  createCase,
  createCaseValidation,
  getCase,
  idValidation,
  listCases,
  listCasesValidation,
  transitionCase,
  transitionValidation,
  uploadDocument
} from '../controllers/caseController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

export const caseRouter = express.Router();

caseRouter.use(requireAuth);
caseRouter.get('/', listCasesValidation, listCases);
caseRouter.post('/', requireRole('manager'), createCaseValidation, createCase);
caseRouter.get('/:id', idValidation, getCase);
caseRouter.patch('/:id/assign', requireRole('manager'), assignValidation, assignCase);
caseRouter.patch('/:id/status', transitionValidation, transitionCase);
caseRouter.post('/:id/comments', commentValidation, addComment);
caseRouter.post('/:id/documents', idValidation, upload.single('document'), uploadDocument);
