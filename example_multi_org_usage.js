// example_multi_org_usage.js
// Example demonstrating the new multi-organization Teacher schema

const mongoose = require('mongoose');
const Teacher = require('./models/Teacher');
const Organisation = require('./models/Organisation');

// Connect to MongoDB (adjust connection string as needed)
mongoose.connect('mongodb://localhost:27017/planora', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function demonstrateMultiOrgTeacherSystem() {
  try {
    console.log('🚀 Demonstrating Multi-Organization Teacher System\n');

    // 1. Create Organizations
    console.log('1. Creating Organizations...');
    
    const org1 = new Organisation({
      organisation: {
        organisationId: 'ORG001',
        name: 'ABC School',
        admin: 'admin@abcschool.com'
      },
      periodCount: 6,
      daysCount: 5,
      classrooms: {
        classroomId: 'CLASS001',
        classroomName: 'Mathematics Lab',
        assignedTeacher: null,
        assignedTeachers: [],
        assignedSubjects: ['Math', 'Science'],
        grid: []
      }
    });
    await org1.save();

    const org2 = new Organisation({
      organisation: {
        organisationId: 'ORG002',
        name: 'XYZ College',
        admin: 'admin@xyzcollege.com'
      },
      periodCount: 8,
      daysCount: 6,
      classrooms: {
        classroomId: 'CLASS002',
        classroomName: 'Science Laboratory',
        assignedTeacher: null,
        assignedTeachers: [],
        assignedSubjects: ['Physics', 'Chemistry', 'Biology'],
        grid: []
      }
    });
    await org2.save();

    console.log('✅ Organizations created successfully\n');

    // 2. Create a Teacher
    console.log('2. Creating a Teacher...');
    
    const teacher = new Teacher({
      id: 1001,
      name: 'Dr. John Smith',
      email: 'john.smith@example.com',
      phone: '+1234567890',
      bio: 'Experienced educator with expertise in multiple subjects',
      globalPermissions: {
        view: true,
        edit: true
      },
      isActive: true
    });

    // 3. Add Teacher to First Organization
    console.log('3. Adding Teacher to ABC School...');
    
    await teacher.addToOrganization('ORG001', {
      subjects: ['Mathematics', 'Physics'],
      classes: ['Grade 10', 'Grade 11'],
      permissions: {
        view: true,
        edit: true,
        delete: false,
        manageTeachers: false,
        manageClassrooms: true
      }
    });

    // Add teacher to organization's teachers array
    await org1.addTeacher(teacher._id);

    console.log('✅ Teacher added to ABC School\n');

    // 4. Add Teacher to Second Organization
    console.log('4. Adding Teacher to XYZ College...');
    
    await teacher.addToOrganization('ORG002', {
      subjects: ['Advanced Physics', 'Chemistry'],
      classes: ['Year 1', 'Year 2'],
      permissions: {
        view: true,
        edit: false,
        delete: false,
        manageTeachers: false,
        manageClassrooms: false
      }
    });

    // Add teacher to organization's teachers array
    await org2.addTeacher(teacher._id);

    console.log('✅ Teacher added to XYZ College\n');

    // 5. Demonstrate Schedule Management
    console.log('5. Managing Schedules for Different Organizations...');
    
    // Get schedule size for each organization
    const org1ScheduleSize = await teacher.getScheduleSize('ORG001');
    const org2ScheduleSize = await teacher.getScheduleSize('ORG002');
    
    console.log(`ABC School Schedule: ${org1ScheduleSize.daysCount} days × ${org1ScheduleSize.periodCount} periods = ${org1ScheduleSize.totalSlots} slots`);
    console.log(`XYZ College Schedule: ${org2ScheduleSize.daysCount} days × ${org2ScheduleSize.periodCount} periods = ${org2ScheduleSize.totalSlots} slots\n`);

    // Set schedule for ABC School (Monday, Period 1)
    teacher.setScheduleSlot('ORG001', 0, 0, {
      classroom: 'Room 101',
      subject: 'Mathematics'
    }, org1ScheduleSize.periodCount);

    // Set schedule for XYZ College (Monday, Period 1)
    teacher.setScheduleSlot('ORG002', 0, 0, {
      classroom: 'Lab A',
      subject: 'Advanced Physics'
    }, org2ScheduleSize.periodCount);

    await teacher.save();
    console.log('✅ Schedules set for both organizations\n');

    // 6. Demonstrate Querying
    console.log('6. Querying Teacher Data...');
    
    // Get teacher's organizations
    const teacherOrgs = teacher.getOrganizations();
    console.log(`Teacher belongs to organizations: ${teacherOrgs.join(', ')}`);

    // Get organization-specific data
    const org1Data = teacher.getOrganizationMembership('ORG001');
    const org2Data = teacher.getOrganizationMembership('ORG002');
    
    console.log(`ABC School - Subjects: ${org1Data.subjects.join(', ')}, Classes: ${org1Data.classes.join(', ')}`);
    console.log(`XYZ College - Subjects: ${org2Data.subjects.join(', ')}, Classes: ${org2Data.classes.join(', ')}\n`);

    // 7. Demonstrate Organization Queries
    console.log('7. Organization Queries...');
    
    // Get all teachers in ABC School
    const abcTeachers = await org1.getAllTeachers();
    console.log(`ABC School has ${abcTeachers.length} teachers`);

    // Get teachers by subject
    const mathTeachers = await org1.getTeachersBySubject('Mathematics');
    console.log(`ABC School has ${mathTeachers.length} math teachers`);

    // Check if teacher exists in organization
    const hasTeacher = await org1.hasTeacher(1001);
    console.log(`Teacher 1001 exists in ABC School: ${hasTeacher}\n`);

    // 8. Demonstrate Schedule Retrieval
    console.log('8. Schedule Retrieval...');
    
    // Get schedule for ABC School
    const abcSchedule = teacher.getScheduleForOrganization('ORG001');
    console.log('ABC School Schedule (first few slots):');
    abcSchedule.slice(0, 3).forEach((slot, index) => {
      console.log(`  Slot ${index}: ${slot.classroom || 'Unassigned'} - ${slot.subject || 'Free'}`);
    });

    // Get schedule for XYZ College
    const xyzSchedule = teacher.getScheduleForOrganization('ORG002');
    console.log('\nXYZ College Schedule (first few slots):');
    xyzSchedule.slice(0, 3).forEach((slot, index) => {
      console.log(`  Slot ${index}: ${slot.classroom || 'Unassigned'} - ${slot.subject || 'Free'}`);
    });

    console.log('\n✅ Multi-Organization Teacher System demonstration completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Clean up - remove test data
    await Teacher.deleteMany({});
    await Organisation.deleteMany({});
    console.log('\n🧹 Test data cleaned up');
    mongoose.connection.close();
  }
}

// Run the demonstration
if (require.main === module) {
  demonstrateMultiOrgTeacherSystem();
}

module.exports = { demonstrateMultiOrgTeacherSystem };
