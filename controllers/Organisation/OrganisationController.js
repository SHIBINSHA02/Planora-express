// controllers/Organisation/OrganisationController.js
const Organisation = require('../../models/Organisation');
const isEmpty = require('is-empty');

class OrganisationController {
  // Get all organizations
  static async getAllOrganisations(req, res) {
    try {
      const organisations = await Organisation.find({});
      res.status(200).json({
        message: 'Organizations retrieved successfully',
        organisations: organisations.map(org => ({
          organisationId: org.organisation.organisationId,
          name: org.organisation.name,
          admin: org.organisation.admin,
          periodCount: org.periodCount,
          daysCount: org.daysCount,
          teacherCount: org.teachers ? org.teachers.length : 0,
          classroomCount: org.classrooms ? 1 : 0,
          createdAt: org.createdAt,
          updatedAt: org.updatedAt
        }))
      });
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving organizations', error: error.message });
    }
  }

  // Get specific organization by ID
  static async getOrganisationById(req, res) {
    try {
      const { organisationId } = req.params;
      
      const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId })
        .populate('teachers')
        .populate('classrooms.assignedTeacher')
        .populate('classrooms.assignedTeachers')
        .populate('classrooms.grid.teachers');

      if (!organisation) {
        return res.status(404).json({ message: 'Organization not found' });
      }

      res.status(200).json({
        message: 'Organization retrieved successfully',
        organisation: {
          organisationId: organisation.organisation.organisationId,
          name: organisation.organisation.name,
          admin: organisation.organisation.admin,
          periodCount: organisation.periodCount,
          daysCount: organisation.daysCount,
          teachers: organisation.teachers || [],
          classrooms: organisation.classrooms || null,
          createdAt: organisation.createdAt,
          updatedAt: organisation.updatedAt
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving organization', error: error.message });
    }
  }

  // Create new organization
  static async createOrganisation(req, res) {
    try {
      const { organisationId, name, admin, periodCount, daysCount } = req.body;

      // Validate input
      if (isEmpty(organisationId) || isEmpty(name) || isEmpty(admin)) {
        return res.status(400).json({ 
          message: 'organisationId, name, and admin are required' 
        });
      }

      // Check if organization already exists
      const existingOrg = await Organisation.findOne({ 'organisation.organisationId': organisationId });
      if (existingOrg) {
        return res.status(400).json({ message: 'Organization with this ID already exists' });
      }

      // Create new organization
      const organisation = new Organisation({
        organisation: {
          organisationId,
          name,
          admin
        },
        periodCount: periodCount || 8,
        daysCount: daysCount || 5,
        teachers: [],
        classrooms: null
      });

      await organisation.save();

      res.status(201).json({
        message: 'Organization created successfully',
        organisation: {
          organisationId: organisation.organisation.organisationId,
          name: organisation.organisation.name,
          admin: organisation.organisation.admin,
          periodCount: organisation.periodCount,
          daysCount: organisation.daysCount,
          teacherCount: 0,
          classroomCount: 0,
          createdAt: organisation.createdAt,
          updatedAt: organisation.updatedAt
        }
      });
    } catch (error) {
      res.status(400).json({ message: 'Error creating organization', error: error.message });
    }
  }

  // Update organization
  static async updateOrganisation(req, res) {
    try {
      const { organisationId } = req.params;
      const { name, admin, periodCount, daysCount } = req.body;

      // Validate input
      if (isEmpty(name) && isEmpty(admin) && isEmpty(periodCount) && isEmpty(daysCount)) {
        return res.status(400).json({ 
          message: 'At least one field (name, admin, periodCount, daysCount) must be provided' 
        });
      }

      // Find and update organization
      const updateData = {};
      if (name) updateData['organisation.name'] = name;
      if (admin) updateData['organisation.admin'] = admin;
      if (periodCount !== undefined) updateData.periodCount = periodCount;
      if (daysCount !== undefined) updateData.daysCount = daysCount;

      const organisation = await Organisation.findOneAndUpdate(
        { 'organisation.organisationId': organisationId },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!organisation) {
        return res.status(404).json({ message: 'Organization not found' });
      }

      res.status(200).json({
        message: 'Organization updated successfully',
        organisation: {
          organisationId: organisation.organisation.organisationId,
          name: organisation.organisation.name,
          admin: organisation.organisation.admin,
          periodCount: organisation.periodCount,
          daysCount: organisation.daysCount,
          teacherCount: organisation.teachers ? organisation.teachers.length : 0,
          classroomCount: organisation.classrooms ? 1 : 0,
          createdAt: organisation.createdAt,
          updatedAt: organisation.updatedAt
        }
      });
    } catch (error) {
      res.status(400).json({ message: 'Error updating organization', error: error.message });
    }
  }

  // Delete organization
  static async deleteOrganisation(req, res) {
    try {
      const { organisationId } = req.params;

      const organisation = await Organisation.findOneAndDelete({ 'organisation.organisationId': organisationId });

      if (!organisation) {
        return res.status(404).json({ message: 'Organization not found' });
      }

      res.status(200).json({
        message: 'Organization deleted successfully',
        organisation: {
          organisationId: organisation.organisation.organisationId,
          name: organisation.organisation.name,
          admin: organisation.organisation.admin
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting organization', error: error.message });
    }
  }

  // Get organization statistics
  static async getOrganisationStats(req, res) {
    try {
      const { organisationId } = req.params;

      const organisation = await Organisation.findOne({ 'organisation.organisationId': organisationId })
        .populate('teachers');

      if (!organisation) {
        return res.status(404).json({ message: 'Organization not found' });
      }

      const stats = {
        organisationId: organisation.organisation.organisationId,
        name: organisation.organisation.name,
        admin: organisation.organisation.admin,
        periodCount: organisation.periodCount,
        daysCount: organisation.daysCount,
        teacherCount: organisation.teachers ? organisation.teachers.length : 0,
        activeTeacherCount: organisation.teachers ? organisation.teachers.filter(t => t.isActive).length : 0,
        classroomCount: organisation.classrooms ? 1 : 0,
        totalSubjects: organisation.teachers ? 
          [...new Set(organisation.teachers.flatMap(t => t.organizationMembership?.find(om => om.organisationId === organisationId)?.subjects || []))].length : 0,
        totalClasses: organisation.teachers ? 
          [...new Set(organisation.teachers.flatMap(t => t.organizationMembership?.find(om => om.organisationId === organisationId)?.classes || []))].length : 0,
        createdAt: organisation.createdAt,
        updatedAt: organisation.updatedAt
      };

      res.status(200).json({
        message: 'Organization statistics retrieved successfully',
        stats
      });
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving organization statistics', error: error.message });
    }
  }
}

module.exports = OrganisationController;
