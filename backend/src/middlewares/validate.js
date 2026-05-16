import { z } from 'zod';
import { AppError } from '../utils/AppError.js';

export const goalSchema = z.object({
  title: z.string().min(1, 'Goal title is required'),
  description: z.string().optional().default(''),
  thrust_area: z.string().min(1, 'Thrust area is required'),
  uom: z.string().min(1, 'Unit of measure is required'),
  target_value: z.number({ required_error: 'Target must be a valid number', invalid_type_error: 'Target must be a valid number' }).finite(),
  weightage: z.number({ required_error: 'Weightage must be a valid number', invalid_type_error: 'Weightage must be a valid number' }).min(10, 'Weightage must be between 10 and 100').max(100, 'Weightage must be between 10 and 100'),
});

export const goalPatchSchema = goalSchema.partial();

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
