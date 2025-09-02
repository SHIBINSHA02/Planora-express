// controllers/OrganisationAccessController.js
const Auth = require('../models/Auth');
const Organisation = require('../models/Organisation');
const isEmpty = require('is-empty');

class OrganisationAccessController {
  // Grant organization access to user
  static async grantOrganizationAccess(req, res) {
    try {
      const { userId } = req.params;
      const { organisationId, permissions, grantedBy } = req.body;

      // Validate input
      if (isEmpty(organisationId) || isEmpty(permissions) || isEmpty(grantedBy)) {
        return res.status(400).json({ message: 'organisationId, permissions, and grantedBy are required' });
      }

      // Check if organization exists
      const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId });
      if (!organisation) {
        return res.status(404).json({ message: 'Organization not found' });
      }

      // Find user
      const user = await Auth.findOne({ userId });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Grant access
      await user.grantOrganizationAccess(
        organisationId,
        organisation.organisation.name,
        permissions,
        grantedBy
      );

      const updatedUser = await Auth.findOne({ userId }).select('-password');

      res.status(200).json({
        message: 'Organization access granted successfully',
        user: updatedUser
      });
    } catch (error) {
      res.status(400).json({ message: 'Error granting organization access', error: error.message });
    }
  }

  // Revoke organization access from user
  static async revokeOrganizationAccess(req, res) {
    try {
      const { userId, organisationId } = req.params;

      // Find user
      const user = await Auth.findOne({ userId });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Revoke access
      await user.revokeOrganizationAccess(organisationId);

      const updatedUser = await Auth.findOne({ userId }).select('-password');

      res.status(200).json({
        message: 'Organization access revoked successfully',
        user: updatedUser
      });
    } catch (error) {
      res.status(400).json({ message: 'Error revoking organization access', error: error.message });
    }
  }

  // Get user's accessible organizations
  static async getAccessibleOrganizations(req, res) {
    try {
      const { userId } = req.params;
      const { permission = 'view' } = req.query;

      // Find user
      const user = await Auth.findOne({ userId });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Get accessible organizations
      const accessibleOrganizations = user.getAccessibleOrganizations(permission);

      res.status(200).json({
        message: 'Accessible organizations retrieved successfully',
        organizations: accessibleOrganizations
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching accessible organizations', error: error.message });
    }
  }

  // Check if user has access to organization
  static async checkAccess(req, res) {
    try {
      const { userId, organisationId, permission = 'view' } = req.body;

      // Validate input
      if (isEmpty(userId) || isEmpty(organisationId)) {
        return res.status(400).json({ message: 'userId and organisationId are required' });
      }

      // Find user
      const user = await Auth.findOne({ userId });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check access
      const hasAccess = user.hasAccessToOrganization(organisationId, permission);

      res.status(200).json({
        message: 'Access check completed',
        hasAccess,
        userId,
        organisationId,
        permission
      });
    } catch (error) {
      res.status(500).json({ message: 'Error checking access', error: error.message });
    }
  }
}

module.exports = OrganisationAccessController;
