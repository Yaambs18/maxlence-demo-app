const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { User } = require('../database/models/user');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../services/emailService');
const { generateToken, upload } = require('../utils/helpers');

// User Registration
exports.register = [
  upload.single('profileImage'),
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const profileImage = req.file ? req.file.path : null;

      // Check if user with this email already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ message: 'Email already exists.' });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      const verificationToken = uuidv4();
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const newUser = await User.create({
        email,
        password: hashedPassword,
        profileImage,
        verificationToken,
        verificationTokenExpiry,
      });

      // Send verification email
      await sendVerificationEmail(newUser.email, verificationToken);

      res.status(201).json({ message: 'Registration successful. Please check your email for verification.' });
    } catch (error) {
      console.error('Error during registration: ', error);
      res.status(500).json({ message: 'Registration failed.' });
    }
  }
];

// User Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(400).json({ message: 'Email not verified. Please verify your email first.' });
    }
      
    const accessToken = generateToken({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ accessToken, message: 'Login successful' });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Login failed.' });
  }
};

// Email Verification
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      where: {
        verificationToken: token,
        verificationTokenExpiry: { [require('sequelize').Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token.' });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully.' });
  } catch (error) {
    console.error('Error during email verification:', error);
    res.status(500).json({ message: 'Email verification failed.' });
  }
};

// Request Password Reset
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User with this email not found.' });
    }

    // Generate password reset token
    const resetPasswordToken = uuidv4();
    const resetPasswordTokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordTokenExpiry = resetPasswordTokenExpiry;
    await user.save();

    await sendResetPasswordEmail(user.email, resetPasswordToken);

    res.status(200).json({ message: 'Password reset link sent to your email.' });
  } catch (error) {
    console.error('Error during forgot password:', error);
    res.status(500).json({ message: 'Failed to request password reset.' });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordTokenExpiry: { [require('sequelize').Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset password token.' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpiry = null;
    await user.save();

    res.status(200).json({ message: 'Password reset successful.' });
  } catch (error) {
    console.error('Error during password reset:', error);
    res.status(500).json({ message: 'Failed to reset password.' });
  }
};