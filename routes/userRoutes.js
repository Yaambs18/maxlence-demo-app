const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// Get all users with pagination and search
router.get('/', checkRole('admin'), userController.getAllUsers);

// Get the current user's profile
router.get('/me', userController.getCurrentUserProfile);

// Edit the current user's profile
router.put('/me', userController.editCurrentUserProfile);

// Get a specific user by ID
router.get('/:id', checkRole('admin'), userController.getUserById);

// Route to delete a user by ID
router.delete('/users/:id', checkRole('admin'), userController.deleteUser);


module.exports = router;