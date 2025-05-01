const jwt = require('jsonwebtoken');
const db = require('../database');
const User = db.User;

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (token == null) {
    return res.status(401).json({ message: 'Unauthorized - No token provided.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, userPayload) => {
    if (err) {
      return res.status(403).json({ message: 'Forbidden - Invalid token.' });
    }

    try {
      const user = await User.findByPk(userPayload.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found for this token.' });
      }
      req.user = user;
      next();
    } catch (error) {
      console.error('Error fetching user from token', error);
      return res.status(500).json({ message: 'Internal server error during authentication' });
    }
  });
};

module.exports = authenticateToken;