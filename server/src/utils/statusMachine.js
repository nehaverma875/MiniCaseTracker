const roleTransitions = {
  manager: {
    New: ['Assigned'],
    Submitted: ['Cleared', 'Discrepant'],
    Discrepant: ['Assigned']
  },
  agent: {
    Assigned: ['In Progress'],
    'In Progress': ['Submitted']
  }
};

export const canTransition = (role, fromStatus, toStatus) => {
  return roleTransitions[role]?.[fromStatus]?.includes(toStatus) ?? false;
};

export const describeAllowedTransitions = (role, status) => roleTransitions[role]?.[status] ?? [];
