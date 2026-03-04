import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { createErrorResponse, ERROR_CODES } from '@educore/shared';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const firstError = result.error.errors[0];
      res
        .status(400)
        .json(
          createErrorResponse(
            ERROR_CODES.VALIDATION_ERROR,
            firstError.message,
            firstError.path.join('.'),
          ),
        );
      return;
    }
    next();
  };
};
