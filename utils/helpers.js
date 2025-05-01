const jwt = require('jsonwebtoken');

// JWT token
exports.generateToken = (payload, secretKey, options = {}) => {
  return jwt.sign(payload, secretKey, options);
};