const db = require('../database');
const User = db.User;
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');

const {upload} = require('../utils/helpers')

// Get all users with pagination and search
exports.getAllUsers = async (req, res) => {
    try {
      const { page = 1, pageSize = 10, name, email } = req.query;
      const offset = (page - 1) * pageSize;
      const limit = parseInt(pageSize);
  
      const where = {};
      const orConditions = [];
  
      if (name) {
        orConditions.push({ name: { [Op.iLike]: `%${name}%` } });
      }
  
      if (email) {
        orConditions.push({ email: { [Op.iLike]: `%${email}%` } });
      }
  
      if (orConditions.length > 0) {
        where[Op.or] = orConditions;
      }
  
      const { count, rows: users } = await User.findAndCountAll({
        where,
        offset,
        limit,
        attributes: ['id', 'email', 'name', 'profileImage', 'role'], // Include 'name'
      });
  
      res.status(200).json({
        totalItems: count,
        totalPages: Math.ceil(count / pageSize),
        currentPage: parseInt(page),
        pageSize: limit,
        users,
        message: 'Users fetched successfully.',
      });
    } catch (error) {
      console.error('Error fetching all users:', error);
      res.status(500).json({ message: 'Failed to fetch users.' });
    }
  };

// Get a specific user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: ['id', 'email', 'profileImage', 'role', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      return res.status(404).json({ message: `User with ID ${id} not found.` });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(`Error fetching user with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch user details.' });
  }
};

// Get the current user's profile
exports.getCurrentUserProfile = async (req, res) => {
  try {
    
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'profileImage', 'role', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      return res.status(404).json({ message: 'Current user not found.' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    res.status(500).json({ message: 'Failed to fetch current user profile.' });
  }
};

// Edit the current user's profile
exports.editCurrentUserProfile = [
  upload.single('profileImage'),
  async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const newProfileImage = req.file ? req.file.path : undefined;
      const userId = req.user.id;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'Current user not found for update.' });
      }

      const updates = {};
      if (name) {
        updates.name = name;
      }
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser && existingUser.id !== userId) {
          return res.status(409).json({ message: 'Email already exists.' });
        }
        updates.email = email;
      }
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updates.password = hashedPassword;
      }
      if (newProfileImage) {
        updates.profileImage = newProfileImage;
      }

      await User.update(updates, { where: { id: userId } });

      const updatedUser = await User.findByPk(userId, {
        attributes: ['id', 'name', 'email', 'profileImage', 'role', 'createdAt', 'updatedAt'],
      });

      res.status(200).json({ user: updatedUser, message: 'Profile updated successfully.' });
    } catch (error) {
      console.error('Error updating current user profile:', error);
      res.status(500).json({ message: 'Failed to update profile.' });
    }
  },
];


exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the user to be deleted exists
    const userToDelete = await User.findByPk(id);
    if (!userToDelete) {
      return res.status(404).json({ message: `User with ID ${id} not found for deletion.` });
    }

    // Prevent deleting yourself (optional but often a good idea)
    if (req.user.id === parseInt(id)) {
      return res.status(403).json({ message: 'You cannot delete your own account.' });
    }

    // Delete the user
    await User.destroy({
      where: {
        id: id,
      },
    });

    res.status(200).json({ message: `User with ID ${id} deleted successfully.` });
  } catch (error) {
    console.error(`Error deleting user with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to delete user.' });
  }
};