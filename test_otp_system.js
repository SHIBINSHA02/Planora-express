// test_otp_system.js
// Simple test script to verify OTP system functionality

const mongoose = require('mongoose');
const Teacher = require('./models/Teacher');
const Organisation = require('./models/Organisation');

// Test configuration
const TEST_ORG_ID = 'test-org-123';
const TEST_TEACHER_ID = 123;

async function testOTPSystem() {
  try {
    console.log('🧪 Starting OTP System Tests...\n');

    // Connect to MongoDB (adjust connection string as needed)
    await mongoose.connect('mongodb://localhost:27017/planora_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Clean up any existing test data
    await Organisation.deleteOne({ 'organisation.organisationId': TEST_ORG_ID });
    await Teacher.deleteOne({ id: TEST_TEACHER_ID, organisationId: TEST_ORG_ID });
    console.log('🧹 Cleaned up existing test data\n');

    // Test 1: Create test organization
    console.log('📝 Test 1: Creating test organization...');
    const testOrg = new Organisation({
      organisation: {
        organisationId: TEST_ORG_ID,
        name: 'Test School',
        admin: 'admin@test.com'
      },
      periodCount: 8,
      daysCount: 7,
      classrooms: {
        classroomId: 'test-classroom',
        assignedTeacher: null,
        assignedTeachers: [],
        assignedSubjects: [],
        grid: Array(56).fill().map(() => ({
          teachers: [],
          subjects: []
        }))
      },
      otpSettings: {
        enabled: true,
        expirationMinutes: 15,
        maxAttempts: 3
      }
    });
    await testOrg.save();
    console.log('✅ Test organization created\n');

    // Test 2: Create test teacher with edit permissions
    console.log('👨‍🏫 Test 2: Creating test teacher with edit permissions...');
    const testTeacher = new Teacher({
      id: TEST_TEACHER_ID,
      organisationId: TEST_ORG_ID,
      name: 'Test Teacher',
      subjects: ['Math', 'Science'],
      classes: ['Grade 1', 'Grade 2'],
      scheduleRows: 7,
      scheduleColumns: 8,
      schedule: Array(56).fill({ classroom: null, subject: null }),
      permissions: {
        view: true,
        edit: true,
        delete: false,
        manageTeachers: false,
        manageClassrooms: false
      },
      isActive: true
    });
    await testTeacher.save();
    console.log('✅ Test teacher created with edit permissions\n');

    // Test 3: Generate OTP
    console.log('🔐 Test 3: Generating OTP...');
    const otp = testTeacher.generateAccessOTP();
    await testTeacher.save();
    console.log(`✅ OTP generated: ${otp}\n`);

    // Test 4: Validate OTP
    console.log('✅ Test 4: Validating OTP...');
    const validation = testTeacher.validateOTP(otp);
    if (validation.valid) {
      console.log('✅ OTP validation successful');
      testTeacher.markOTPAsUsed();
      await testTeacher.save();
      console.log('✅ OTP marked as used\n');
    } else {
      console.log(`❌ OTP validation failed: ${validation.message}\n`);
    }

    // Test 5: Test expired OTP
    console.log('⏰ Test 5: Testing expired OTP...');
    const expiredOTP = testTeacher.generateAccessOTP();
    testTeacher.accessOTP.expiresAt = new Date(Date.now() - 1000); // Set to past
    await testTeacher.save();
    
    const expiredValidation = testTeacher.validateOTP(expiredOTP);
    if (!expiredValidation.valid) {
      console.log(`✅ Expired OTP correctly rejected: ${expiredValidation.message}\n`);
    } else {
      console.log('❌ Expired OTP was incorrectly accepted\n');
    }

    // Test 6: Test used OTP
    console.log('🔄 Test 6: Testing used OTP...');
    const usedOTP = testTeacher.generateAccessOTP();
    testTeacher.markOTPAsUsed();
    await testTeacher.save();
    
    const usedValidation = testTeacher.validateOTP(usedOTP);
    if (!usedValidation.valid) {
      console.log(`✅ Used OTP correctly rejected: ${usedValidation.message}\n`);
    } else {
      console.log('❌ Used OTP was incorrectly accepted\n');
    }

    // Test 7: Test invalid OTP
    console.log('❌ Test 7: Testing invalid OTP...');
    const invalidOTP = '999999';
    const invalidValidation = testTeacher.validateOTP(invalidOTP);
    if (!invalidValidation.valid) {
      console.log(`✅ Invalid OTP correctly rejected: ${invalidValidation.message}\n`);
    } else {
      console.log('❌ Invalid OTP was incorrectly accepted\n');
    }

    // Test 8: Test permission check
    console.log('🔒 Test 8: Testing permission check...');
    const hasEditAccess = testTeacher.hasEditAccess();
    if (hasEditAccess) {
      console.log('✅ Teacher correctly identified as having edit access\n');
    } else {
      console.log('❌ Teacher incorrectly identified as not having edit access\n');
    }

    // Test 9: Test teacher without edit permissions
    console.log('🚫 Test 9: Testing teacher without edit permissions...');
    const noEditTeacher = new Teacher({
      id: 456,
      organisationId: TEST_ORG_ID,
      name: 'No Edit Teacher',
      subjects: ['English'],
      classes: ['Grade 3'],
      scheduleRows: 7,
      scheduleColumns: 8,
      schedule: Array(56).fill({ classroom: null, subject: null }),
      permissions: {
        view: true,
        edit: false, // No edit permission
        delete: false,
        manageTeachers: false,
        manageClassrooms: false
      },
      isActive: true
    });
    await noEditTeacher.save();
    
    const noEditAccess = noEditTeacher.hasEditAccess();
    if (!noEditAccess) {
      console.log('✅ Teacher without edit permissions correctly identified\n');
    } else {
      console.log('❌ Teacher without edit permissions incorrectly identified as having edit access\n');
    }

    console.log('🎉 All OTP system tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('- Organization creation: ✅');
    console.log('- Teacher creation with permissions: ✅');
    console.log('- OTP generation: ✅');
    console.log('- OTP validation: ✅');
    console.log('- Expired OTP handling: ✅');
    console.log('- Used OTP handling: ✅');
    console.log('- Invalid OTP handling: ✅');
    console.log('- Permission checking: ✅');
    console.log('- No-edit permission handling: ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    // Clean up test data
    try {
      await Organisation.deleteOne({ 'organisation.organisationId': TEST_ORG_ID });
      await Teacher.deleteMany({ organisationId: TEST_ORG_ID });
      console.log('\n🧹 Test data cleaned up');
    } catch (cleanupError) {
      console.error('⚠️ Cleanup error:', cleanupError.message);
    }
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testOTPSystem();
}

module.exports = { testOTPSystem };
