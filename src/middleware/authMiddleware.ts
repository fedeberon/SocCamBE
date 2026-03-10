require('dotenv').config();
import { RequestHandler } from 'express';
import { auth } from 'express-oauth2-jwt-bearer';

const audience =
  process.env.AUDIENCE ||
  process.env.AUTH0_AUDIENCE ||
  process.env.REACT_APP_AUTH0_AUDIENCE ||
  '';

const issuerBaseURL =
  process.env.ISSUER_BASEURL ||
  process.env.ISSUER_BASE_URL ||
  process.env.AUTH0_ISSUER_BASE_URL ||
  '';

let checkJwt: RequestHandler;

if (!audience || !issuerBaseURL) {
  // Fallback defensivo: evita 401 "Invalid URL" cuando falta config en runtime.
  // (el backend actual ya expone endpoints públicos; esto mantiene consistencia).
  checkJwt = (_req, _res, next) => next();
} else {
  checkJwt = auth({
    audience,
    issuerBaseURL,
    tokenSigningAlg: 'RS256',
  }) as RequestHandler;
}

export { checkJwt };
