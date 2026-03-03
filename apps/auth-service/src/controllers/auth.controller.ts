import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { createSuccessResponse } from '@educore/shared';

export class AuthController {
  // POST /auth/login
  static async login(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
      res.status(200).json(createSuccessResponse(result, 'Connexion réussie'));
    } catch (error) {
      next(error);
    }
  }

  // POST /auth/refresh
  static async refresh(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { refresh_token } = req.body;
      const tokens = await AuthService.refreshToken(refresh_token);
      res.status(200).json(createSuccessResponse(tokens, 'Token rafraîchi'));
    } catch (error) {
      next(error);
    }
  }

  // POST /auth/logout
  static async logout(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = (req as any).user;
      await AuthService.logout(user.sub, user.jti, user.exp);
      res.status(200).json(createSuccessResponse(null, 'Déconnexion réussie'));
    } catch (error) {
      next(error);
    }
  }

  // GET /auth/me
  static async me(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = (req as any).user;
      res.status(200).json(
        createSuccessResponse({
          id: user.sub,
          role: user.role,
          permissions: user.perms,
          tenant_id: user.tid,
        }),
      );
    } catch (error) {
      next(error);
    }
  }
}
