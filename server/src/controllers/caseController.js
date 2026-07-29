import fs from 'fs';
import { body, param, query } from 'express-validator';
import { Case, CASE_STATUSES, CASE_TYPES } from '../models/Case.js';
import { User } from '../models/User.js';
import { canTransition, describeAllowedTransitions } from '../utils/statusMachine.js';
import { validate } from '../middleware/validate.js';

const objectIdMessage = 'Invalid id';
const DASHBOARD_ITEM_LIMIT = 10;
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

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildCaseFilter = (query, user) => {
  const filter = {};

  if (user.role === 'agent') filter.assignedAgent = user._id;
  if (query.status) filter.status = query.status;
  if (user.role === 'manager' && query.agent) filter.assignedAgent = query.agent;
  if (query.search) {
    const search = escapeRegex(query.search);
    filter.$or = [
      { clientName: new RegExp(search, 'i') },
      { subjectName: new RegExp(search, 'i') },
      { caseType: new RegExp(search, 'i') }
    ];
  }

  return filter;
};

export const createCaseValidation = [
  body('clientName').trim().isLength({ min: 2, max: 120 }).withMessage('Client name must be 2 to 120 characters'),
  body('subjectName').trim().isLength({ min: 2, max: 120 }).withMessage('Subject name must be 2 to 120 characters'),
  body('caseType').isIn(CASE_TYPES).withMessage('Select a valid case type'),
  body('dueDate').isISO8601().withMessage('Due date must be a valid date').toDate(),
  body('assignedAgent').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Select a valid agent'),
  validate
];

export const listCasesValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be 1 or greater').toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50').toInt(),
  query('status').optional().isIn(CASE_STATUSES).withMessage('Select a valid status'),
  query('agent').optional().isMongoId().withMessage('Select a valid agent'),
  query('search').optional().trim().isLength({ max: 80 }).withMessage('Search must be 80 characters or less'),
  validate
];

export const idValidation = [param('id').isMongoId().withMessage(objectIdMessage), validate];

export const commentValidation = [
  param('id').isMongoId().withMessage(objectIdMessage),
  body('body').trim().isLength({ min: 1, max: 2000 }).withMessage('Comment must be 1 to 2000 characters'),
  validate
];

export const transitionValidation = [
  param('id').isMongoId().withMessage(objectIdMessage),
  body('toStatus').isIn(CASE_STATUSES).withMessage('Select a valid target status'),
  body('note').optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Note must be 500 characters or less'),
  validate
];

export const assignValidation = [
  param('id').isMongoId().withMessage(objectIdMessage),
  body('agentId').isMongoId().withMessage('Select a valid agent'),
  body('note').optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Note must be 500 characters or less'),
  validate
];

export const createCase = async (req, res, next) => {
  try {
    let assignedAgent = null;
    let status = 'New';

    if (req.body.assignedAgent) {
      assignedAgent = await User.findOne({ _id: req.body.assignedAgent, role: 'agent', active: true });
      if (!assignedAgent) return res.status(422).json({ code: 'AGENT_NOT_FOUND', message: 'Assigned agent was not found' });
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
    const skip = (page - 1) * limit;
    const filter = buildCaseFilter(req.query, req.user);

    const [items, total] = await Promise.all([
      populateCase(Case.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean()),
      Case.countDocuments(filter)
    ]);

    res.json({
      cases: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const dueSoonLimit = new Date(now);
    dueSoonLimit.setDate(dueSoonLimit.getDate() + 7);

    const filter = {};
    if (req.user.role === 'agent') filter.assignedAgent = req.user._id;

    const [statusGroups, total, overdue, dueSoon, recentCases, agentWorkload] = await Promise.all([
      Case.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Case.countDocuments(filter),
      Case.countDocuments({
        ...filter,
        dueDate: { $lt: now },
        status: { $nin: ['Cleared'] }
      }),
      Case.countDocuments({
        ...filter,
        dueDate: { $gte: now, $lte: dueSoonLimit },
        status: { $nin: ['Cleared'] }
      }),
      populateCase(Case.find(filter).sort({ updatedAt: -1 }).limit(DASHBOARD_ITEM_LIMIT).lean()),
      req.user.role === 'manager'
        ? User.aggregate([
            { $match: { role: 'agent', active: true } },
            {
              $lookup: {
                from: 'cases',
                localField: '_id',
                foreignField: 'assignedAgent',
                as: 'cases'
              }
            },
            {
              $project: {
                name: 1,
                email: 1,
                total: { $size: '$cases' },
                active: {
                  $size: {
                    $filter: {
                      input: '$cases',
                      as: 'caseItem',
                      cond: { $in: ['$$caseItem.status', ['Assigned', 'In Progress', 'Submitted', 'Discrepant']] }
                    }
                  }
                }
              }
            },
            { $sort: { active: -1, name: 1 } },
            { $limit: DASHBOARD_ITEM_LIMIT }
          ])
        : Promise.resolve([])
    ]);

    const statusCounts = CASE_STATUSES.reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {});
    statusGroups.forEach((item) => {
      statusCounts[item._id] = item.count;
    });

    res.json({
      stats: {
        total,
        overdue,
        dueSoon,
        pendingReview: statusCounts.Submitted,
        statusCounts
      },
      recentCases,
      agentWorkload
    });
  } catch (error) {
    next(error);
  }
};

export const getCase = async (req, res, next) => {
  try {
    const caseDoc = await populateCase(Case.findById(req.params.id));
    if (!caseDoc) return res.status(404).json({ code: 'CASE_NOT_FOUND', message: 'Case not found' });
    if (!ensureCaseAccess(caseDoc, req.user)) return res.status(403).json({ code: 'ACCESS_DENIED', message: 'Access denied' });

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

    if (!caseDoc) return res.status(404).json({ code: 'CASE_NOT_FOUND', message: 'Case not found' });
    if (!agent) return res.status(422).json({ code: 'AGENT_NOT_FOUND', message: 'Agent was not found' });
    if (!canTransition(req.user.role, caseDoc.status, 'Assigned')) {
      return res.status(409).json({ code: 'INVALID_STATUS_TRANSITION', message: `Cannot assign from ${caseDoc.status}` });
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
    if (!caseDoc) return res.status(404).json({ code: 'CASE_NOT_FOUND', message: 'Case not found' });
    if (!ensureCaseAccess(caseDoc, req.user)) return res.status(403).json({ code: 'ACCESS_DENIED', message: 'Access denied' });
    if (!canTransition(req.user.role, caseDoc.status, req.body.toStatus)) {
      return res.status(409).json({ code: 'INVALID_STATUS_TRANSITION', message: `Cannot move ${caseDoc.status} to ${req.body.toStatus}` });
    }
    if (req.body.toStatus === 'Submitted' && caseDoc.documents.length === 0) {
      return res.status(422).json({ code: 'DOCUMENT_REQUIRED', message: 'Upload at least one document before submitting' });
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
    if (!caseDoc) return res.status(404).json({ code: 'CASE_NOT_FOUND', message: 'Case not found' });
    if (!ensureCaseAccess(caseDoc, req.user)) return res.status(403).json({ code: 'ACCESS_DENIED', message: 'Access denied' });

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
      return res.status(404).json({ code: 'CASE_NOT_FOUND', message: 'Case not found' });
    }
    if (!ensureCaseAccess(caseDoc, req.user)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({ code: 'ACCESS_DENIED', message: 'Access denied' });
    }
    if (req.user.role === 'agent' && !['Assigned', 'In Progress'].includes(caseDoc.status)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(409).json({ code: 'INVALID_UPLOAD_STATUS', message: `Cannot upload documents while case is ${caseDoc.status}` });
    }
    if (!req.file) return res.status(422).json({ code: 'FILE_REQUIRED', message: 'A PDF or image file is required' });

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
