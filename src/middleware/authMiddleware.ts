const jwt = require('jsonwebtoken');
import { Request, Response, NextFunction } from 'express';
import logger from '../configs/logger';

export default function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized access' });
  }

  const token = authHeader.substring(7);
  const jwtSecret = process.env.JWT_SECRET || 'miClaveSecreta';

  try {
    req.user = jwt.verify(token, jwtSecret);
    next();
  } catch (error) {
    logger.error(error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}
