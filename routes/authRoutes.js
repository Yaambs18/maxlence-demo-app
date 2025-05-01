const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body } = require('express-validator');
const validate = require('../middleware/validationMiddleware');
const { upload } = require('../utils/helpers');

// User registration
router.post('/register',
  [
    upload.single('profileImage'),
    body('email').isEmail().withMessage('Invalid email address.'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long.')
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