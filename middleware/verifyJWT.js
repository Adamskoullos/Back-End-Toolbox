const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  // if there is no auth header or if the auth header does not start with Bearer just return
  if (!authHeader?.startsWith("Bearer ")) return res.sendStatus(401); // Unauthorised
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decodedUser) => {
    if (err) return res.sendStatus(403); // Invalid token
    req.user = decodedUser.UserInfo.username;
    req.roles = decodedUser.UserInfo.roles;
    next();
  });
};

module.exports = verifyJWT;
