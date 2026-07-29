import fs from 'fs';
import { body, param, query } from 'express-validator';
import { Case, CASE_STATUSES, CASE_TYPES } from '../models/Case.js';
import { User } from '../models/User.js';
import { canTransition, describeAllowedTransitions } from '../utils/statusMachine.js';
import { validate } from '../middleware/validate.js';

const objectIdMessage = 'Invalid id';
const populateCase = (queryBuilder) =>
  queryBuilder
    .populate('assignedAgent', 'name email role')
    .populate('createdBy', 'name email role')
    .populate('documents.uploadedBy', 'name email role')
    .populate('comments.author', 'name email role')
    .populate('auditLog.actor', 'name email role');

const addAudit = (caseDoc, actor, fromStatus, toStatus, action, note = '') => {
  caseDoc.auditLog.push({ fromStatus, toStatus, action, actor: actor._id, note });
};

const ensureCaseAccess = (caseDoc, user) => {
  if (user.role === 'manager') return true;
  return String(caseDoc.assignedAgent?._id || caseDoc.assignedAgent) === String(user._id);
};

export const createCaseValidation = [
  body('clientName').trim().isLength({ min: 2, max: 120 }),
  body('subjectName').trim().isLength({ min: 2, max: 120 }),
  body('caseType').isIn(CASE_TYPES),
  body('dueDate').isISO8601().toDate(),
  body('assignedAgent').optional({ nullable: true, checkFalsy: true }).isMongoId(),
  validate
];

export const listCasesValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('status').optional().isIn(CASE_STATUSES),
  query('agent').optional().isMongoId(),
  query('search').optional().trim().isLength({ max: 80 }),
  validate
];

export const idValidation = [param('id').isMongoId().withMessage(objectIdMessage), validate];

export const commentValidation = [
  param('id').isMongoId().withMessage(objectIdMessage),
  body('body').trim().isLength({ min: 1, max: 2000 }),
  validate
];

export const transitionValidation = [
  param('id').isMongoId().withMessage(objectIdMessage),
  body('toStatus').isIn(CASE_STATUSES),
  body('note').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  validate
];

export const assignValidation = [
  param('id').isMongoId().withMessage(objectIdMessage),
  body('agentId').isMongoId(),
  body('note').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  validate
];

export const createCase = async (req, res, next) => {
  try {
    let assignedAgent = null;
    let status = 'New';

    if (req.body.assignedAgent) {
      assignedAgent = await User.findOne({ _id: req.body.assignedAgent, role: 'agent', active: true });
      if (!assignedAgent) return res.status(422).json({ message: 'Assigned agent was not found' });
      status = 'Assigned';
    }

    const caseDoc = new Case({
      clientName: req.body.clientName,
      subjectName: req.body.subjectName,
      caseType: req.body.caseType,
      dueDate: req.body.dueDate,
      assignedAgent: assignedAgent?._id ?? null,
      status,
      createdBy: req.user._id
    });

    addAudit(caseDoc, req.user, undefined, 'New', 'Case created');
    if (status === 'Assigned') {
      addAudit(caseDoc, req.user, 'New', 'Assigned', `Assigned to ${assignedAgent.name}`);
    }

    await caseDoc.save();
    const populated = await populateCase(Case.findById(caseDoc._id));
    res.status(201).json({ case: populated });
  } catch (error) {
    next(error);
  }
};

export const listCases = async (req, res, next) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const filter = {};

    if (req.user.role === 'agent') filter.assignedAgent = req.user._id;
    if (req.query.status) filter.status = req.query.status;
    if (req.user.role === 'manager' && req.query.agent) filter.assignedAgent = req.query.agent;
    if (req.query.search) {
      const search = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { clientName: new RegExp(search, 'i') },
        { subjectName: new RegExp(search, 'i') },
        { caseType: new RegExp(search, 'i') }
      ];
    }

    const [items, total] = await Promise.all([
      populateCase(Case.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit)),
      Case.countDocuments(filter)
    ]);

    res.json({
      cases: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 }
    });
  } catch (error) {
    next(error);
  }
};

export const getCase = async (req, res, next) => {
  try {
    const caseDoc = await populateCase(Case.findById(req.params.id));
    if (!caseDoc) return res.status(404).json({ message: 'Case not found' });
    if (!ensureCaseAccess(caseDoc, req.user)) return res.status(403).json({ message: 'Access denied' });

    res.json({
      case: caseDoc,
      allowedTransitions: describeAllowedTransitions(req.user.role, caseDoc.status)
    });
  } catch (error) {
    next(error);
  }
};

export const assignCase = async (req, res, next) => {
  try {
    const [caseDoc, agent] = await Promise.all([
      Case.findById(req.params.id),
      User.findOne({ _id: req.body.agentId, role: 'agent', active: true })
    ]);

    if (!caseDoc) return res.status(404).json({ message: 'Case not found' });
    if (!agent) return res.status(422).json({ message: 'Agent was not found' });
    if (!canTransition(req.user.role, caseDoc.status, 'Assigned')) {
      return res.status(409).json({ message: `Cannot assign from ${caseDoc.status}` });
    }

    const fromStatus = caseDoc.status;
    caseDoc.assignedAgent = agent._id;
    caseDoc.status = 'Assigned';
    caseDoc.verdictNote = undefined;
    addAudit(caseDoc, req.user, fromStatus, 'Assigned', `Assigned to ${agent.name}`, req.body.note);
    await caseDoc.save();

    const populated = await populateCase(Case.findById(caseDoc._id));
    res.json({ case: populated });
  } catch (error) {
    next(error);
  }
};

export const transitionCase = async (req, res, next) => {
  try {
    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) return res.status(404).json({ message: 'Case not found' });
    if (!ensureCaseAccess(caseDoc, req.user)) return res.status(403).json({ message: 'Access denied' });
    if (!canTransition(req.user.role, caseDoc.status, req.body.toStatus)) {
      return res.status(409).json({ message: `Cannot move ${caseDoc.status} to ${req.body.toStatus}` });
    }
    if (req.body.toStatus === 'Submitted' && caseDoc.documents.length === 0) {
      return res.status(422).json({ message: 'Upload at least one document before submitting' });
    }

    const fromStatus = caseDoc.status;
    caseDoc.status = req.body.toStatus;
    if (['Cleared', 'Discrepant'].includes(req.body.toStatus)) {
      caseDoc.verdictNote = req.body.note || '';
    }
    addAudit(caseDoc, req.user, fromStatus, req.body.toStatus, `Status changed to ${req.body.toStatus}`, req.body.note);
    await caseDoc.save();

    const populated = await populateCase(Case.findById(caseDoc._id));
    res.json({ case: populated });
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req, res, next) => {
  try {
    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) return res.status(404).json({ message: 'Case not found' });
    if (!ensureCaseAccess(caseDoc, req.user)) return res.status(403).json({ message: 'Access denied' });

    caseDoc.comments.push({ body: req.body.body, author: req.user._id });
    await caseDoc.save();

    const populated = await populateCase(Case.findById(caseDoc._id));
    res.status(201).json({ case: populated });
  } catch (error) {
    next(error);
  }
};

export const uploadDocument = async (req, res, next) => {
  try {
    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Case not found' });
    }
    if (!ensureCaseAccess(caseDoc, req.user)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.role === 'agent' && !['Assigned', 'In Progress'].includes(caseDoc.status)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(409).json({ message: `Cannot upload documents while case is ${caseDoc.status}` });
    }
    if (!req.file) return res.status(422).json({ message: 'A PDF or image file is required' });

    caseDoc.documents.push({
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: `/uploads/${req.file.filename}`,
      uploadedBy: req.user._id
    });

    if (req.user.role === 'agent' && caseDoc.status === 'Assigned') {
      addAudit(caseDoc, req.user, 'Assigned', 'In Progress', 'Work started by document upload');
      caseDoc.status = 'In Progress';
    }

    await caseDoc.save();
    const populated = await populateCase(Case.findById(caseDoc._id));
    res.status(201).json({ case: populated });
  } catch (error) {
    next(error);
  }
};
