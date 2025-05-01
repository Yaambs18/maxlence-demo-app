const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body } = require('express-validator');
const validate = require('../middleware/validationMiddleware');

// User registration
router.post('/register',
  [
    body('email').isEmail().withMessage('Invalid email address.'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long.')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter.')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter.')
  ],
  validate,
  authController.register
);

// User login
router.post('/login', authController.login);

// Email verification
router.get('/verify-email/:token', authController.verifyEmail);

// Request password reset
router.post('/forgot-password', authController.forgotPassword);

// Reset password
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;