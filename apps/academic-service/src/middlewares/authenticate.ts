import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { createErrorResponse, ERROR_CODES } from '@educore/shared';

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res
        .status(401)
        .json(createErrorResponse(ERROR_CODES.UNAUTHORIZED, 'Token manquant'));
      return;
    }

    const token = authHeader.split(' ')[1];
    console.log('🔐 Token reçu:', token.substring(0, 40));
    console.log('🔑 Secret:', env.JWT_ACCESS_SECRET);

    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;
    console.log('✅ Payload:', payload);
    (req as any).user = payload;
    next();
  } catch (err: any) {
    console.log('❌ JWT Error:', err.message);
    res
      .status(401)
      .json(createErrorResponse(ERROR_CODES.TOKEN_INVALID, 'Token invalide'));
  }
};
