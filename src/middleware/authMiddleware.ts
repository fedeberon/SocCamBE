const jwt = require('jsonwebtoken');
import { Request, Response, NextFunction } from 'express';
import logger from '../configs/logger';
import { auth, requiredScopes } from 'express-oauth2-jwt-bearer';

const checkJwt = auth({
  audience: `${process.env.AUDIENCE}`,
  issuerBaseURL: 'https://dev-je4nmgqlgpt4ne2e.us.auth0.com',
  tokenSigningAlg: 'RS256'
});

const handleAuthErrors = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.name === 'UnauthorizedError') {
    logger.error(`JWT Error: ${err.message}`);
    return res.status(401).json({
      error: 'invalid_token',
      message: 'Invalid or missing token. Please authenticate.'
    });
  }

  logger.error(`Error: ${err.message}`);
  return res.status(500).json({
    error: 'internal_error',
    message: 'An internal server error occurred.'
  });
};

export { checkJwt, handleAuthErrors };