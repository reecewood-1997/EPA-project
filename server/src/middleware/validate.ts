import { Request, Response, NextFunction } from 'express';
import * as yup from 'yup';
import { logger } from '../utils/logger';

export const validate = (schema: yup.ObjectSchema<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.validate(req.body, { abortEarly: false });
      next();
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        logger.warn('Validation error:', error.errors);
        
        const validationErrors = error.inner.map(err => ({
          field: err.path || 'unknown',
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: validationErrors,
        });
      }
      
      next(error);
    }
  };
};