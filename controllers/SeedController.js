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
  const assignedSubjects = pickRandom(SUBJECT_POOL, 3);
  
  // Generate sample timetable grid: daysCount rows, periodCount columns
  const grid = Array.from({ length: daysCount }, () =>
    Array.from({ length: periodCount }, () => ({
      subject: Math.random() > 0.2 ? pickRandom(assignedSubjects, 1)[0] : null,
      teacherId: null
    }))
  );

  return new Organisation({
    organisation: {
      organisationId,
      name,
      admin: `admin-${index + 1}`
    },
    teachers: [],
    periodCount,
    daysCount,
    classrooms: {
      classroomId: `cls-${index + 1}`,
      classroomName: `Classroom ${index + 1}`,
      assignedSubjects,
      assignedTeachers: [],
      grid
    }
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
  for (const teacher of teachers) {
    const membershipCount = 1 + Math.floor(Math.random() * 2); // 1-2 orgs
    const chosenOrgs = pickRandom(organisations, membershipCount);
    for (const org of chosenOrgs) {
      const subjects = pickRandom(SUBJECT_POOL, 2 + Math.floor(Math.random() * 2));
      const classes = pickRandom(CLASS_POOL, 2);
      await teacher.addToOrganization(org.organisation.organisationId, subjects, classes, { edit: Math.random() > 0.7 });
      await org.addTeacher(teacher._id);
      if (!org.classrooms.assignedTeachers) org.classrooms.assignedTeachers = [];
      if (org.classrooms.assignedTeachers.length < 3) {
        org.classrooms.assignedTeachers.push(teacher._id);
      }
      // Assign teacher to timetable slots where subjects match
      if (org.classrooms && org.classrooms.grid && Array.isArray(org.classrooms.grid)) {
        for (let day = 0; day < org.daysCount; day++) {
          if (org.classrooms.grid[day] && Array.isArray(org.classrooms.grid[day])) {
            for (let period = 0; period < org.periodCount; period++) {
              const slot = org.classrooms.grid[day][period];
              if (slot && slot.subject && subjects.includes(slot.subject)) {
                slot.teacherId = teacher._id;
              }
            }
          }
        }
      }
    }
    await teacher.save();
  }
  for (const org of organisations) {
    await org.save();
  }
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

    // Ensure all organisations have a valid grid
    for (const org of allOrganisations) {
      if (!org.classrooms.grid || !Array.isArray(org.classrooms.grid) || org.classrooms.grid.length !== org.daysCount) {
        org.classrooms.grid = Array.from({ length: org.daysCount }, () =>
          Array.from({ length: org.periodCount }, () => ({
            subject: Math.random() > 0.2 ? pickRandom(org.classrooms.assignedSubjects, 1)[0] : null,
            teacherId: null
          }))
        );
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