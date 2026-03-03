import { Request, Response, NextFunction } from 'express';
import { createErrorResponse, ERROR_CODES } from '@educore/shared';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  console.error('❌ Erreur:', error);

  // Erreur métier (avec code)
  if (error.code && error.status) {
    res
      .status(error.status)
      .json(createErrorResponse(error.code, error.message || error.code));
    return;
  }

  // Erreur serveur
  res
    .status(500)
    .json(
      createErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        'Une erreur interne est survenue',
      ),
    );
};
