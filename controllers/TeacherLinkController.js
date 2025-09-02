// controllers/TeacherLinkController.js
const Auth = require('../models/Auth');
const Teacher = require('../models/Teacher');
const isEmpty = require('is-empty');

class TeacherLinkController {
  // Link user to teacher profile
  static async linkUserToTeacher(req, res) {
    try {
      const { userId } = req.params;
      const { teacherId } = req.body;

      if (isEmpty(teacherId)) {
        return res.status(400).json({ message: 'teacherId is required' });
      }

      // Find user
      const user = await Auth.findOne({ userId });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Find teacher
      const teacher = await Teacher.findByTeacherId(teacherId);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }

      // Check if teacher is already linked to another user
      if (teacher.linkedUserId && teacher.linkedUserId !== userId) {
        return res.status(400).json({ message: 'Teacher is already linked to another user' });
      }

      // Link teacher to user
      teacher.linkedUserId = userId;
      await teacher.save();

      res.status(200).json({
        message: 'User linked to teacher successfully',
        userId: userId,
        teacherId: teacherId,
        teacher: {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          organizations: teacher.organizations.map(org => ({
            organisationId: org.organisationId,
            subjects: org.subjects,
            classes: org.classes,
            permissions: org.permissions,
            isActive: org.isActive
          }))
        }
      });
    } catch (error) {
      res.status(400).json({ message: 'Error linking user to teacher', error: error.message });
    }
  }

  // Get user's linked teacher profile
  static async getLinkedTeacher(req, res) {
    try {
      const { userId } = req.params;

      // Find user
      const user = await Auth.findOne({ userId });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Find linked teacher
      const teacher = await Teacher.findOne({ linkedUserId: userId });
      if (!teacher) {
        return res.status(404).json({ message: 'No teacher profile linked to this user' });
      }

      res.status(200).json({
        message: 'Teacher profile retrieved successfully',
        userId: userId,
        teacher: {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          phone: teacher.phone,
          bio: teacher.bio,
          profilePicture: teacher.profilePicture,
          globalPermissions: teacher.globalPermissions,
          isActive: teacher.isActive,
          organizations: teacher.organizations.map(org => ({
            organisationId: org.organisationId,
            subjects: org.subjects,
            classes: org.classes,
            permissions: org.permissions,
            isActive: org.isActive,
            joinedAt: org.joinedAt
          }))
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching teacher profile', error: error.message });
    }
  }

  // Unlink user from teacher profile
  static async unlinkUserFromTeacher(req, res) {
    try {
      const { userId } = req.params;

      // Find user
      const user = await Auth.findOne({ userId });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Find linked teacher
      const teacher = await Teacher.findOne({ linkedUserId: userId });
      if (!teacher) {
        return res.status(404).json({ message: 'No teacher profile linked to this user' });
      }

      // Unlink teacher from user
      teacher.linkedUserId = undefined;
      await teacher.save();

      res.status(200).json({
        message: 'User unlinked from teacher successfully',
        userId: userId,
        teacherId: teacher.id
      });
    } catch (error) {
      res.status(400).json({ message: 'Error unlinking user from teacher', error: error.message });
    }
  }

  // Get user's teacher organizations with access
  static async getTeacherOrganizations(req, res) {
    try {
      const { userId } = req.params;

      // Find user
      const user = await Auth.findOne({ userId });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Find linked teacher
      const teacher = await Teacher.findOne({ linkedUserId: userId });
      if (!teacher) {
        return res.status(404).json({ message: 'No teacher profile linked to this user' });
      }

      // Get organizations where user has access and teacher is a member
      const accessibleOrganizations = user.getAccessibleOrganizations('view');
      const teacherOrganizations = teacher.organizations.filter(org => 
        accessibleOrganizations.some(accOrg => accOrg.organisationId === org.organisationId)
      );

      res.status(200).json({
        message: 'Teacher organizations retrieved successfully',
        userId: userId,
        teacherId: teacher.id,
        organizations: teacherOrganizations.map(org => ({
          organisationId: org.organisationId,
          subjects: org.subjects,
          classes: org.classes,
          permissions: org.permissions,
          isActive: org.isActive,
          joinedAt: org.joinedAt,
          userAccess: accessibleOrganizations.find(accOrg => 
            accOrg.organisationId === org.organisationId
          )?.permissions
        }))
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching teacher organizations', error: error.message });
    }
  }

  // Create teacher profile for user
  static async createTeacherProfile(req, res) {
    try {
      const { userId } = req.params;
      const { 
        id, 
        name, 
        email, 
        phone, 
        bio, 
        profilePicture, 
        globalPermissions 
      } = req.body;

      // Validate required fields
      if (isEmpty(id) || isEmpty(name) || isEmpty(email)) {
        return res.status(400).json({ 
          message: 'id, name, and email are required' 
        });
      }

      // Find user
      const user = await Auth.findOne({ userId });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if user already has a linked teacher
      const existingTeacher = await Teacher.findOne({ linkedUserId: userId });
      if (existingTeacher) {
        return res.status(400).json({ message: 'User already has a linked teacher profile' });
      }

      // Create new teacher
      const teacher = new Teacher({
        id,
        name,
        email,
        phone,
        bio,
        profilePicture,
        globalPermissions: globalPermissions || { view: true, edit: false },
        isActive: true,
        linkedUserId: userId
      });

      const savedTeacher = await teacher.save();

      res.status(201).json({
        message: 'Teacher profile created and linked successfully',
        userId: userId,
        teacher: {
          id: savedTeacher.id,
          name: savedTeacher.name,
          email: savedTeacher.email,
          phone: savedTeacher.phone,
          bio: savedTeacher.bio,
          profilePicture: savedTeacher.profilePicture,
          globalPermissions: savedTeacher.globalPermissions,
          isActive: savedTeacher.isActive
        }
      });
    } catch (error) {
      res.status(400).json({ message: 'Error creating teacher profile', error: error.message });
    }
  }

  // Upsert a user (with password) and create/link a teacher profile
  // This ensures: every teacher has an associated user, while users may or may not be teachers
  static async upsertUserAndTeacher(req, res) {
    try {
      const {
        // User fields
        userId, username, email, password, firstName, lastName,
        // Teacher fields
        teacher: {
          id: teacherId,
          name,
          email: teacherEmail,
          phone,
          bio,
          profilePicture,
          globalPermissions
        } = {}
      } = req.body;

      // Validate minimal inputs
      if (isEmpty(email) && isEmpty(username) && isEmpty(userId)) {
        return res.status(400).json({ message: 'Provide userId or username/email to identify/create user' });
      }

      // Find or create user
      let user = null;
      if (!isEmpty(userId)) {
        user = await Auth.findOne({ userId });
      }
      if (!user && (!isEmpty(username) || !isEmpty(email))) {
        user = await Auth.findOne({ $or: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email: email.toLowerCase() }] : [])
        ]});
      }

      if (!user) {
        // Creating a new user requires password and names
        if (isEmpty(password) || isEmpty(firstName) || isEmpty(lastName)) {
          return res.status(400).json({ message: 'password, firstName, and lastName are required to create a new user' });
        }
        user = new Auth({
          username: username || (email ? email.toLowerCase().split('@')[0] : undefined),
          email: email?.toLowerCase(),
          password, // NOTE: currently stored in plain text per existing codebase
          firstName,
          lastName
        });
        await user.save();
      }

      // At this point we have a user; do not force every user to be a teacher
      // Find or create teacher and link to user
      let teacher = null;
      if (!isEmpty(teacherId)) {
        teacher = await Teacher.findByTeacherId(teacherId);
      }
      if (!teacher && !isEmpty(teacherEmail)) {
        teacher = await Teacher.findOne({ email: teacherEmail.toLowerCase() });
      }

      if (!teacher) {
        // Creating a new teacher requires minimal fields
        if (isEmpty(teacherId) || isEmpty(name) || isEmpty(teacherEmail)) {
          return res.status(400).json({ message: 'teacher.id, teacher.name, and teacher.email are required to create a teacher' });
        }
        teacher = new Teacher({
          id: teacherId,
          name,
          email: teacherEmail.toLowerCase(),
          phone,
          bio,
          profilePicture,
          globalPermissions: globalPermissions || { view: true, edit: false },
          isActive: true,
          linkedUserId: user.userId
        });
        await teacher.save();
      } else {
        // Ensure teacher is linked to this user
        if (teacher.linkedUserId && teacher.linkedUserId !== user.userId) {
          return res.status(400).json({ message: 'Teacher is already linked to another user' });
        }
        if (!teacher.linkedUserId) {
          teacher.linkedUserId = user.userId;
          await teacher.save();
        }
      }

      const userResponse = user.toObject();
      delete userResponse.password;

      return res.status(200).json({
        message: 'User upserted and teacher created/linked successfully',
        user: userResponse,
        teacher: {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          phone: teacher.phone,
          bio: teacher.bio,
          profilePicture: teacher.profilePicture,
          globalPermissions: teacher.globalPermissions,
          isActive: teacher.isActive,
          linkedUserId: teacher.linkedUserId
        }
      });
    } catch (error) {
      return res.status(400).json({ message: 'Error upserting user and teacher', error: error.message });
    }
  }
}

module.exports = TeacherLinkController;
