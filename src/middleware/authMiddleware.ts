require('dotenv').config();
import { auth, requiredScopes } from 'express-oauth2-jwt-bearer';

const checkJwt = auth({
  audience: `${process.env.AUDIENCE}`,
  issuerBaseURL: `${process.env.ISSUER_BASEURL}`,
  tokenSigningAlg: 'RS256'
});


export { checkJwt };