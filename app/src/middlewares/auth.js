const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const checkJwt = jwt({
  // Proveer el URI del JWKS
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),

  // Validar el algoritmo del token JWT
  algorithms: ['RS256'],
  audience: 'https://flights_api.auth', // Reemplaza con tu audiencia correcta
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
});

module.exports = checkJwt;
