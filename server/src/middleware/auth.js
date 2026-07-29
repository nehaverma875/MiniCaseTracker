import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [, token] = header.split(' ');

    if (!token) {
      return res.status(401).json({ code: 'AUTH_REQUIRED', message: 'Authentication required' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);

    if (!user || !user.active) {
      return res.status(401).json({ code: 'USER_INACTIVE', message: 'User is not active' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ code: 'TOKEN_INVALID', message: 'Invalid or expired token' });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'You do not have permission for this action' });
  }
  next();
};
