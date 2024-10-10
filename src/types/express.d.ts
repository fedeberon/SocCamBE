// express.d.ts
import { OidcContext } from 'auth0-express-openid-connect'; // Ajusta esta importación según el paquete que uses.

declare global {
  namespace Express {
    interface Request {
      oidc?: OidcContext;
    }
  }
}
