import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDb } from '../config/db.js';
import { Case } from '../models/Case.js';
import { User } from '../models/User.js';

dotenv.config();

const users = [
  { name: 'Maya Manager', email: 'manager@example.com', password: 'Password123!', role: 'manager' },
  { name: 'Arjun Agent', email: 'agent@example.com', password: 'Password123!', role: 'agent' },
  { name: 'Priya Agent', email: 'priya.agent@example.com', password: 'Password123!', role: 'agent' }
];

const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const addAudit = (caseDoc, actor, fromStatus, toStatus, action, note = '') => {
  caseDoc.auditLog.push({ fromStatus, toStatus, action, actor: actor._id, note });
};

const run = async () => {
  await connectDb();
  await Promise.all([User.deleteMany({}), Case.deleteMany({})]);

  const [manager, arjun, priya] = await User.create(users);

  const caseDocs = [
    new Case({
      clientName: 'BluePeak Finance',
      subjectName: 'Riya Sharma',
      caseType: 'KYC',
      dueDate: daysFromNow(3),
      status: 'Assigned',
      assignedAgent: arjun._id,
      createdBy: manager._id,
      comments: [{ body: 'Client asked for same-day acknowledgement.', author: manager._id }]
    }),
    new Case({
      clientName: 'Northstar Retail',
      subjectName: 'Dev Malhotra',
      caseType: 'Employment',
      dueDate: daysFromNow(5),
      status: 'In Progress',
      assignedAgent: arjun._id,
      createdBy: manager._id,
      comments: [{ body: 'Waiting for HR contact confirmation.', author: arjun._id }]
    }),
    new Case({
      clientName: 'Acme Logistics',
      subjectName: 'Sara Khan',
      caseType: 'Address',
      dueDate: daysFromNow(1),
      status: 'Submitted',
      assignedAgent: priya._id,
      createdBy: manager._id,
      documents: [
        {
          originalName: 'address-proof.pdf',
          filename: 'sample-address-proof.pdf',
          mimetype: 'application/pdf',
          size: 20480,
          path: '/uploads/sample-address-proof.pdf',
          uploadedBy: priya._id
        }
      ],
      comments: [{ body: 'All documents uploaded for review.', author: priya._id }]
    }),
    new Case({
      clientName: 'Helio Health',
      subjectName: 'Anika Bose',
      caseType: 'Education',
      dueDate: daysFromNow(8),
      status: 'Cleared',
      assignedAgent: priya._id,
      createdBy: manager._id,
      verdictNote: 'University records matched the submitted certificates.'
    }),
    new Case({
      clientName: 'Vector Bank',
      subjectName: 'Karan Mehta',
      caseType: 'Criminal',
      dueDate: daysFromNow(2),
      status: 'Discrepant',
      assignedAgent: arjun._id,
      createdBy: manager._id,
      verdictNote: 'Name mismatch requires a fresh affidavit.'
    })
  ];

  caseDocs.forEach((caseDoc) => {
    addAudit(caseDoc, manager, undefined, 'New', 'Case created');
    if (caseDoc.status !== 'New') addAudit(caseDoc, manager, 'New', 'Assigned', 'Assigned during seed');
    if (['In Progress', 'Submitted', 'Cleared', 'Discrepant'].includes(caseDoc.status)) {
      addAudit(caseDoc, caseDoc.assignedAgent.equals(arjun._id) ? arjun : priya, 'Assigned', 'In Progress', 'Work started');
    }
    if (['Submitted', 'Cleared', 'Discrepant'].includes(caseDoc.status)) {
      addAudit(caseDoc, caseDoc.assignedAgent.equals(arjun._id) ? arjun : priya, 'In Progress', 'Submitted', 'Submitted for review');
    }
    if (['Cleared', 'Discrepant'].includes(caseDoc.status)) {
      addAudit(caseDoc, manager, 'Submitted', caseDoc.status, `Marked ${caseDoc.status}`, caseDoc.verdictNote);
    }
  });

  await Case.insertMany(caseDocs);

  console.log('Seed complete');
  console.table(
    users.map(({ name, email, role }) => ({
      name,
      email,
      role,
      password: 'Password123!'
    }))
  );

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
