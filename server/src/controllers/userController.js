import { User } from '../models/User.js';

export const listAgents = async (_req, res, next) => {
  try {
    const agents = await User.find({ role: 'agent', active: true }).sort({ name: 1 });
    res.json({ agents: agents.map((agent) => agent.toSafeJSON()) });
  } catch (error) {
    next(error);
  }
};
