import { z } from 'zod';
import { AppError } from '../utils/AppError.js';

export const goalSchema = z.object({
  title: z.string().min(1, 'Goal title is required'),
  description: z.string().optional().default(''),
  thrust_area: z.string().min(1, 'Thrust area is required'),
  uom: z.string().optional(),
  uomType: z.string().optional(),
  target_value: z.number().finite().optional(),
  target: z.number().finite().optional(),
  weightage: z.number({ required_error: 'Weightage must be a valid number' }).min(10, 'Weightage must be at least 10%').max(100, 'Weightage cannot exceed 100%'),
}).refine(data => {
  return (data.uom !== undefined || data.uomType !== undefined);
}, {
  message: 'Unit of measure is required (uom or uomType)',
  path: ['uom']
}).refine(data => {
  return (data.target_value !== undefined || data.target !== undefined);
}, {
  message: 'Target must be a valid number',
  path: ['target_value']
});

export const goalPatchSchema = z.object({
  title: z.string().min(1, 'Goal title is required').optional(),
  description: z.string().optional(),
  thrust_area: z.string().min(1, 'Thrust area is required').optional(),
  uom: z.string().optional(),
  uomType: z.string().optional(),
  target_value: z.number().finite().optional(),
  target: z.number().finite().optional(),
  weightage: z.number().min(10, 'Weightage must be at least 10%').max(100, 'Weightage cannot exceed 100%').optional(),
});

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req.body);
    req.validatedBody = parsed;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => e.message).join(', ');
      return next(new AppError(messages, 400));
    }
    next(error);
  }
};
