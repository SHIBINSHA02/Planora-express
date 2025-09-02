// example_usage.js
// Example demonstrating the connection between Organisation and Teacher schemas

const Organisation = require('./models/Organisation');
const Teacher = require('./models/Teacher');

async function demonstrateConnection() {
  try {
    // Example 1: Create an organisation
    const organisation = new Organisation({
      organisation: {
        organisationId: 'ORG001',
        name: 'Example School',
        admin: 'admin@example.com'
      },
      periodCount: 8,
      daysCount: 5,
      classrooms: {
        classroomId: '10A',
        classroomName: 'Grade 10A',
        assignedTeacher: null,
        assignedTeachers: [],
        assignedSubjects: [],
        grid: []
      }
    });
    await organisation.save();
    console.log('✅ Organisation created');

    // Example 2: Create a teacher
    const teacher = new Teacher({
      id: 1,
      organisationId: 'ORG001',
      name: 'John Smith',
      subjects: ['Mathematics', 'Physics'],
      classes: ['10A', '11B'],
      schedule: Array(30).fill({ classroom: null, subject: null }), // 6 periods * 5 days = 30
      permissions: {
        view: true,
        edit: true
      }
    });
    await teacher.save();
    console.log('✅ Teacher created');

    // Example 3: Add teacher to organisation
    await organisation.addTeacher(teacher._id);
    console.log('✅ Teacher added to organisation');

    // Example 4: Get all teachers in organisation
    const orgWithTeachers = await organisation.getTeachers();
    console.log('✅ Teachers in organisation:', orgWithTeachers.teachers.length);

    // Example 5: Get teacher's organisation
    const teacherOrg = await teacher.getOrganisation();
    console.log('✅ Teacher\'s organisation:', teacherOrg.organisation.name);

    // Example 6: Check if teacher has edit access
    const hasEditAccess = teacher.hasEditAccess();
    console.log('✅ Teacher has edit access:', hasEditAccess);

    console.log('\n🎉 All examples completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Uncomment to run the example
// demonstrateConnection();

module.exports = { demonstrateConnection };
