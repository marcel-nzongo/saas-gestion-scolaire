import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.service';
import { createErrorResponse, ERROR_CODES } from '@educore/shared';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // 1. Récupérer le token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res
        .status(401)
        .json(createErrorResponse(ERROR_CODES.UNAUTHORIZED, 'Token manquant'));
      return;
    }

    const token = authHeader.split(' ')[1];

    // 2. Vérifier le token
    const payload = TokenService.verifyAccessToken(token);

    // 3. Vérifier si blacklisté
    const isBlacklisted = await TokenService.isTokenBlacklisted(payload.jti);
    if (isBlacklisted) {
      res
        .status(401)
        .json(createErrorResponse(ERROR_CODES.TOKEN_INVALID, 'Token révoqué'));
      return;
    }

    // 4. Attacher l'utilisateur à la requête
    (req as any).user = payload;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res
        .status(401)
        .json(createErrorResponse(ERROR_CODES.TOKEN_EXPIRED, 'Token expiré'));
      return;
    }
    res
      .status(401)
      .json(createErrorResponse(ERROR_CODES.TOKEN_INVALID, 'Token invalide'));
  }
};
