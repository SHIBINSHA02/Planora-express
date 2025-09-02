// controllers/UserController.js
const Auth = require('../models/Auth');

class UserController {
  // Get all users (admin only)
  static async getAllUsers(req, res) {
    try {
      const users = await Auth.find({}).select('-password');
      
      res.status(200).json({
        message: 'Users retrieved successfully',
        users
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
  }

  // Get user by ID
  static async getUserById(req, res) {
    try {
      const { userId } = req.params;
      
      const user = await Auth.findOne({ userId }).select('-password');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({
        message: 'User retrieved successfully',
        user
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
  }

  // Update user
  static async updateUser(req, res) {
    try {
      const { userId } = req.params;
      const { firstName, lastName, email } = req.body;

      const user = await Auth.findOneAndUpdate(
        { userId },
        { 
          firstName, 
          lastName, 
          email, 
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({
        message: 'User updated successfully',
        user
      });
    } catch (error) {
      res.status(400).json({ message: 'Error updating user', error: error.message });
    }
  }
}

module.exports = UserController;
