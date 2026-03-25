const { auth } = require('express-oauth2-jwt-bearer');

const requireJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
});

const checkJwt = (req, res, next) => {
    if (!req.headers.authorization) {
        req.auth = null;
        return next();
    }
    return requireJwt(req, res, next);
};

module.exports = { checkJwt };
