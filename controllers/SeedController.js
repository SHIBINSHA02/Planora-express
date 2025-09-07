const mongoose = require('mongoose');
const Auth = require('../models/Auth');
const Organisation = require('../models/Organisation');
const Teacher = require('../models/Teacher');

// Utility helpers
const pickRandom = (arr, count = 1) => {
  const copy = [...arr];
  const result = [];
  while (copy.length && result.length < count) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
};

const SUBJECT_POOL = ['Math', 'Science', 'History', 'English', 'Art', 'Music', 'PE', 'Geography', 'CS', 'Economics'];
const CLASS_POOL = ['Class A', 'Class B', 'Class C', 'Class D', 'Class E'];
const FIRST_NAMES = ['Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack', 'Kate', 'Liam', 'Maya', 'Noah', 'Olivia'];
const LAST_NAMES = ['Anderson', 'Brown', 'Clark', 'Davis', 'Evans', 'Fisher', 'Garcia', 'Harris', 'Johnson', 'King', 'Lee', 'Miller', 'Nelson', 'OConnor', 'Parker'];

async function clearCollections() {
  await Promise.all([
    Auth.deleteMany({}),
    Organisation.deleteMany({}),
    Teacher.deleteMany({})
  ]);
}

function buildOrganisation(index) {
  const organisationId = `org-${index + 1}`;
  const name = `Organisation ${index + 1}`;
  const periodCount = 6;
  const daysCount = 5;
  const assignedSubjects = pickRandom(SUBJECT_POOL, 4); // More subjects for better coverage
  
  // Generate sample timetable grid: flattened array (daysCount * periodCount cells)
  // Every cell will have at least 1 subject and will be populated with teachers later
  const totalSlots = daysCount * periodCount;
  const grid = Array.from({ length: totalSlots }, () => ({
    teachers: [], // Will be populated when teachers are linked
    subjects: pickRandom(assignedSubjects, 1) // Every cell gets at least 1 subject
  }));

  return new Organisation({
    organisation: {
      organisationId,
      name,
      admin: `admin-${index + 1}`
    },
    teachers: [],
    periodCount,
    daysCount,
    classrooms: [{
      classroomId: `cls-${index + 1}`,
      classroomName: `Classroom ${index + 1}`,
      assignedTeacher: null,
      assignedTeachers: [],
      assignedSubjects,
      grid
    }]
  });
}

function buildTeacher(index) {
  const id = 1000 + index;
  const firstName = FIRST_NAMES[index];
  const lastName = LAST_NAMES[index];
  const name = `${firstName} ${lastName}`;
  const cleanFirstName = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLastName = lastName.toLowerCase().replace(/[^a-z]/g, '');
  const email = `${cleanFirstName}.${cleanLastName}@example.com`;
  return new Teacher({
    id,
    name,
    email,
    phone: `+1-555-01${(index + 1).toString().padStart(2, '0')}`,
    bio: `Experienced educator specializing in ${pickRandom(SUBJECT_POOL, 1)[0]}`,
    profilePicture: null,
    globalPermissions: { view: true, edit: index % 3 === 0 },
    linkedUserId: null
  });
}

function buildUser(index, organisations) {
  const firstName = FIRST_NAMES[index];
  const lastName = LAST_NAMES[index];
  const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}`;
  const cleanFirstName = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLastName = lastName.toLowerCase().replace(/[^a-z]/g, '');
  const email = `${cleanFirstName}.${cleanLastName}@example.com`;
  const accessOrgs = pickRandom(organisations, 2);
  return new Auth({
    userId: `user-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
    username,
    email,
    password: 'password123',
    firstName,
    lastName,
    organizationAccess: accessOrgs.map(org => ({
      organisationId: org.organisation.organisationId,
      organisationName: org.organisation.name,
      permissions: {
        view: true,
        edit: Math.random() > 0.6,
        delete: false,
        manageTeachers: Math.random() > 0.8,
        manageClassrooms: Math.random() > 0.8
      },
      grantedBy: 'system'
    }))
  });
}

async function linkTeachersToOrganisations(teachers, organisations) {
  console.log(`Linking ${teachers.length} teachers to ${organisations.length} organisations`);
  
  for (const teacher of teachers) {
    const membershipCount = 1 + Math.floor(Math.random() * 2); // 1-2 orgs
    const chosenOrgs = pickRandom(organisations, membershipCount);
    
    for (const org of chosenOrgs) {
      const subjects = pickRandom(SUBJECT_POOL, 2 + Math.floor(Math.random() * 2));
      const classes = pickRandom(CLASS_POOL, 2);
      
      // Add teacher to organization
      await teacher.addToOrganization(org.organisation.organisationId, subjects, classes, { edit: Math.random() > 0.7 });
      await org.addTeacher(teacher._id);
      
      // Add teacher to classroom's assigned teachers
      for (const classroom of org.classrooms) {
        if (!classroom.assignedTeachers) classroom.assignedTeachers = [];
        if (classroom.assignedTeachers.length < 5) { // Allow up to 5 teachers per classroom
          classroom.assignedTeachers.push(teacher._id);
        }
        
        // Assign teacher to grid cells where subjects match
        if (classroom.grid && Array.isArray(classroom.grid)) {
          for (let cellIndex = 0; cellIndex < classroom.grid.length; cellIndex++) {
            const cell = classroom.grid[cellIndex];
            if (cell && cell.subjects && cell.subjects.length > 0) {
              // Check if teacher teaches any of the subjects in this cell
              const hasMatchingSubject = cell.subjects.some(subject => subjects.includes(subject));
              if (hasMatchingSubject && !cell.teachers.includes(teacher._id)) {
                cell.teachers.push(teacher._id);
              }
            }
          }
        }
      }
    }
    await teacher.save();
  }
  
  // Ensure every grid cell has at least 1 teacher
  for (const org of organisations) {
    for (const classroom of org.classrooms) {
      if (classroom.grid && Array.isArray(classroom.grid)) {
        for (let cellIndex = 0; cellIndex < classroom.grid.length; cellIndex++) {
          const cell = classroom.grid[cellIndex];
          if (cell && cell.teachers.length === 0) {
            // Find a teacher who teaches the subject in this cell
            const cellSubjects = cell.subjects || [];
            const availableTeachers = org.teachers.filter(teacherId => {
              const teacher = teachers.find(t => t._id.toString() === teacherId.toString());
              if (!teacher) return false;
              const orgMembership = teacher.getOrganizationMembership(org.organisation.organisationId);
              return orgMembership && orgMembership.subjects.some(subject => cellSubjects.includes(subject));
            });
            
            if (availableTeachers.length > 0) {
              const randomTeacher = pickRandom(availableTeachers, 1)[0];
              cell.teachers.push(randomTeacher);
            } else {
              // If no teacher matches, assign any teacher from this org
              if (org.teachers.length > 0) {
                const randomTeacher = pickRandom(org.teachers, 1)[0];
                cell.teachers.push(randomTeacher);
              }
            }
          }
        }
      }
    }
    await org.save();
  }
  
  console.log('Teacher linking completed - every grid cell now has at least 1 teacher');
}

async function linkUsersToTeachers(users, teachers) {
  console.log(`Starting to link ${users.length} users to ${teachers.length} teachers`);
  const usersToLink = users.slice(0, 10);
  const teachersToLink = teachers.slice(0, 10);
  console.log(`Will link ${usersToLink.length} users to ${teachersToLink.length} teachers`);
  for (let i = 0; i < usersToLink.length; i++) {
    const user = usersToLink[i];
    const teacher = teachersToLink[i];
    console.log(`Linking user ${user.username} (${user.userId}) to teacher ${teacher.name} (${teacher.id})`);
    teacher.linkedUserId = user.userId;
    await teacher.save();
    console.log(`Successfully linked user ${user.username} to teacher ${teacher.name}`);
  }
  const remainingUsers = users.slice(10);
  console.log(`Created ${remainingUsers.length} non-teacher users: ${remainingUsers.map(u => u.username).join(', ')}`);
  const linkedTeachers = await Teacher.find({ linkedUserId: { $exists: true, $ne: null } });
  console.log(`Total teachers with linkedUserId: ${linkedTeachers.length}`);
  linkedTeachers.forEach(t => {
    console.log(`Teacher ${t.name} (${t.id}) linked to user: ${t.linkedUserId}`);
  });
}

exports.seed = async (req, res) => {
  try {
    const { force } = req.query;
    if (force === 'true') {
      await clearCollections();
    }

    const [authCount, orgCount, teacherCount] = await Promise.all([
      Auth.countDocuments(),
      Organisation.countDocuments(),
      Teacher.countDocuments()
    ]);

    const organisations = [];
    const teachers = [];
    const users = [];

    const orgToCreate = Math.max(10 - orgCount, 0);
    for (let i = 0; i < orgToCreate; i++) organisations.push(buildOrganisation(i));

    const teacherToCreate = Math.max(10 - teacherCount, 0);
    for (let i = 0; i < teacherToCreate; i++) teachers.push(buildTeacher(i));

    if (organisations.length) await Organisation.insertMany(organisations);
    if (teachers.length) await Teacher.insertMany(teachers);

    const allTeachers = await Teacher.find({});
    const allOrganisations = await Organisation.find({});

    console.log(`Created ${allTeachers.length} teachers and ${allOrganisations.length} organisations`);

    // Ensure all organisations have valid classrooms with proper grids
    for (const org of allOrganisations) {
      if (!org.classrooms || org.classrooms.length === 0) {
        // Create a default classroom if none exists
        const totalSlots = org.daysCount * org.periodCount;
        const grid = Array.from({ length: totalSlots }, () => ({
          teachers: [],
          subjects: []
        }));
        
        org.classrooms = [{
          classroomId: `cls-${org.organisation.organisationId}`,
          classroomName: `Default Classroom`,
          assignedTeacher: null,
          assignedTeachers: [],
          assignedSubjects: [],
          grid
        }];
        await org.save();
      } else {
        // Ensure each classroom has a properly sized grid
        for (const classroom of org.classrooms) {
          const totalSlots = org.daysCount * org.periodCount;
          if (!classroom.grid || classroom.grid.length !== totalSlots) {
            classroom.grid = Array.from({ length: totalSlots }, () => ({
              teachers: [],
              subjects: []
            }));
          }
        }
        await org.save();
      }
    }

    await linkTeachersToOrganisations(allTeachers, allOrganisations);

    const usersToCreate = Math.max(15 - authCount, 0);
    for (let i = 0; i < usersToCreate; i++) users.push(buildUser(i, allOrganisations));
    if (users.length) await Auth.insertMany(users);

    const allUsers = await Auth.find({});
    console.log(`Created ${allUsers.length} users total`);
    await linkUsersToTeachers(allUsers, allTeachers);

    const results = {
      organisations: await Organisation.countDocuments(),
      teachers: await Teacher.countDocuments(),
      users: await Auth.countDocuments(),
      linkedTeachers: 10,
      regularUsers: 5
    };

    res.status(200).json({ message: 'Seeding completed', forceCleared: force === 'true', counts: results });
  } catch (error) {
    console.error('Seeding error:', error);
    if (error && error.code === 11000) {
      return res.status(409).json({ message: 'Duplicate key error. Try again with ?force=true to reset collections.', error: error.message });
    }
    res.status(500).json({ message: 'Seeding failed', error: error.message || error });
  }
};