import { body } from 'express-validator';
import { User } from '../models/User.js';
import { signToken } from '../utils/token.js';
import { validate } from '../middleware/validate.js';

export const loginValidation = [
  body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  body('password').isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate
];

export const login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email }).select('+password');
    if (!user || !(await user.comparePassword(req.body.password))) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }

    return res.json({ token: signToken(user), user: user.toSafeJSON() });
  } catch (error) {
    next(error);
  }
};

export const me = (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
};
