import { Request, Response, NextFunction } from 'express';
import { createErrorResponse, ERROR_CODES } from '@educore/shared';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  console.error('❌ Erreur:', error);
  if (error.code && error.status) {
    res
      .status(error.status)
      .json(createErrorResponse(error.code, error.message || error.code));
    return;
  }
  res
    .status(500)
    .json(
      createErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        'Erreur interne du serveur',
      ),
    );
};
