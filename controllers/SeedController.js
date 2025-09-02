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
  return new Organisation({
    organisation: {
      organisationId,
      name,
      admin: `admin-${index + 1}`
    },
    teachers: [],
    periodCount: 6,
    daysCount: 5,
    classrooms: {
      classroomId: `cls-${index + 1}`,
      classroomName: `Classroom ${index + 1}`,
      assignedSubjects: pickRandom(SUBJECT_POOL, 3),
      assignedTeachers: [],
      grid: []
    }
  });
}

function buildTeacher(index) {
  const id = 1000 + index;
  const name = `Teacher ${index + 1}`;
  const email = `teacher${index + 1}@example.com`;
  return new Teacher({
    id,
    name,
    email,
    phone: `+1-555-01${(index + 1).toString().padStart(2, '0')}`,
    bio: `Bio for ${name}`,
    profilePicture: null,
    globalPermissions: { view: true, edit: index % 3 === 0 }
  });
}

function buildUser(index, organisations) {
  const username = `user${index + 1}`;
  const email = `user${index + 1}@example.com`;
  const nameFirst = `First${index + 1}`;
  const nameLast = `Last${index + 1}`;
  const accessOrgs = pickRandom(organisations, 2);
  return new Auth({
    userId: `user-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
    username,
    email,
    password: 'password123',
    firstName: nameFirst,
    lastName: nameLast,
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
      // Optionally assign some teachers to organisation classroom
      if (!org.classrooms.assignedTeachers) org.classrooms.assignedTeachers = [];
      if (org.classrooms.assignedTeachers.length < 3) {
        org.classrooms.assignedTeachers.push(teacher._id);
      }
    }
    await teacher.save();
  }
  // Save updated organisations with assigned teachers
  for (const org of organisations) {
    await org.save();
  }
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

    // Ensure at least 10 per model
    const orgToCreate = Math.max(10 - orgCount, 0);
    for (let i = 0; i < orgToCreate; i++) organisations.push(buildOrganisation(i));

    const teacherToCreate = Math.max(10 - teacherCount, 0);
    for (let i = 0; i < teacherToCreate; i++) teachers.push(buildTeacher(i));

    // Save orgs and teachers first (relationships depend on them)
    if (organisations.length) await Organisation.insertMany(organisations);
    if (teachers.length) await Teacher.insertMany(teachers);

    // Reload from DB to get persistent refs
    const allOrganisations = await Organisation.find({});
    const allTeachers = await Teacher.find({});

    // Link memberships and classroom assignments
    await linkTeachersToOrganisations(allTeachers, allOrganisations);

    const usersToCreate = Math.max(10 - authCount, 0);
    for (let i = 0; i < usersToCreate; i++) users.push(buildUser(i, allOrganisations));
    if (users.length) await Auth.insertMany(users);

    const results = {
      organisations: await Organisation.countDocuments(),
      teachers: await Teacher.countDocuments(),
      users: await Auth.countDocuments()
    };

    res.status(200).json({ message: 'Seeding completed', forceCleared: force === 'true', counts: results });
  } catch (error) {
    // Handle duplicate key races by suggesting force=true
    if (error && error.code === 11000) {
      return res.status(409).json({ message: 'Duplicate key error. Try again with ?force=true to reset collections.', error });
    }
    res.status(500).json({ message: 'Seeding failed', error: error.message || error });
  }
};


