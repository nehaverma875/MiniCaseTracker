import { validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const fieldErrors = errors.array().reduce((acc, error) => {
    if (!acc[error.path]) acc[error.path] = error.msg;
    return acc;
  }, {});

  return res.status(422).json({
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    fieldErrors,
    errors: errors.array().map((error) => ({ field: error.path, message: error.msg }))
  });
};
