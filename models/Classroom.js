// models/Classroom.js
const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  classroomId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  assignedTeacher: {
    type: Number, // Primary teacher ID, matches 'id' field in Teacher model
    ref: 'Teacher',
    required: true,
    validate: {
      validator: async function(value) {
        const teacher = await mongoose.model('Teacher').findOne({ id: value });
        return !!teacher;
      },
      message: 'Invalid primary teacher ID'
    }
  },
  assignedTeachers: [{
    type: Number, // Array of teacher IDs, matches 'id' field in Teacher model
    ref: 'Teacher',
    validate: {
      validator: async function(value) {
        const teacher = await mongoose.model('Teacher').findOne({ id: value });
        return !!teacher;
      },
      message: 'Invalid teacher ID in assignedTeachers'
    }
  }],
  assignedSubjects: [{
    type: String,
    trim: true,
    validate: {
      validator: async function(value) {
        // Ensure the subject is valid for at least one teacher in assignedTeachers
        for (const teacherId of this.assignedTeachers) {
          const teacher = await mongoose.model('Teacher').findOne({ id: teacherId });
          if (teacher && teacher.subjects.includes(value)) {
            return true;
          }
        }
        return false;
      },
      message: 'Subject in assignedSubjects must be taught by at least one assigned teacher'
    }
  }],
  grid: {
    type: [[{
      teachers: [{
        type: Number, // Matches 'id' field in Teacher model
        ref: 'Teacher',
        validate: {
          validator: async function(value) {
            // Ensure the teacher ID exists in the Teacher collection
            const teacher = await mongoose.model('Teacher').findOne({ id: value });
            return !!teacher;
          },
          message: 'Invalid teacher ID in grid'
        }
      }],
      subjects: [{
        type: String,
        trim: true,
        validate: {
          validator: async function(value) {
            // Ensure the subject is valid for at least one teacher in the cell
            const cell = this; // Refers to the current grid cell
            for (const teacherId of cell.teachers) {
              const teacher = await mongoose.model('Teacher').findOne({ id: teacherId });
              if (teacher && teacher.subjects.includes(value)) {
                return true;
              }
            }
            return false;
          },
          message: 'Subject in grid must be one of the assigned teachers\' subjects'
        }
      }]
    }]],
    required: true,
    validate: {
      validator: function(grid) {
        // Validate that grid is a 2D array
        if (!Array.isArray(grid)) return false;
        for (const row of grid) {
          if (!Array.isArray(row)) return false;
          for (const cell of row) {
            if (!cell || !Array.isArray(cell.teachers) || !Array.isArray(cell.subjects)) return false;
          }
        }
        return true;
      },
      message: 'Grid must be a 2D array with each cell containing teachers and subjects arrays'
    }
  }
}, {
  timestamps: true // Add createdAt and updatedAt fields
});

// Ensure indexes for efficient querying
classroomSchema.index({ classroomId: 1 });
classroomSchema.index({ assignedTeacher: 1 });
classroomSchema.index({ assignedTeachers: 1 });

const Classroom = mongoose.model('Classroom', classroomSchema);
module.exports = Classroom;







// const mongoose = require('mongoose');
// const Classroom = require('./models/Classroom');
// const Teacher = require('./models/Teacher');

// mongoose.connect('mongodb://localhost:27017/school', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// }).then(() => {
//   console.log('Connected to MongoDB');
// }).catch(err => {
//   console.error('MongoDB connection error:', err);
// });

// async function addTeachersAndClassroom() {
//   try {
//     // Add teachers first
//     await Teacher.deleteMany({}); // Clear existing teachers for clean slate
//     await Teacher.insertMany([
//       { id: 1, name: "John Doe", subjects: ["Math", "Physics"], classes: ["10A"] },
//       { id: 2, name: "Jane Smith", subjects: ["Physics"], classes: ["10B"] },
//       { id: 3, name: "Alice Brown", subjects: ["Chemistry"], classes: ["10A"] }
//     ]);
//     console.log('Teachers added');

//     // Add a classroom
//     const classroomData = {
//       classroomId: "Room101",
//       assignedTeacher: 1, // Primary teacher
//       assignedTeachers: [1, 2, 3], // All teachers assigned to the classroom
//       assignedSubjects: ["Math", "Physics", "Chemistry"], // All subjects taught in the classroom
//       grid: [
//         [
//           { teachers: [1, 2], subjects: ["Math", "Physics"] },
//           { teachers: [1], subjects: ["Math"] },
//           { teachers: [], subjects: [] }
//         ],
//         [
//           { teachers: [2], subjects: ["Physics"] },
//           { teachers: [], subjects: [] },
//           { teachers: [1, 3], subjects: ["Math", "Chemistry"] }
//         ]
//       ]
//     };

//     await Classroom.deleteMany({}); // Clear existing classrooms for clean slate
//     const classroom = await Classroom.create(classroomData);
//     console.log('Classroom created:', JSON.stringify(classroom, null, 2));
//   } catch (error) {
//     console.error('Error:', error.message);
//   } finally {
//     await mongoose.connection.close();
//   }
// }

// addTeachersAndClassroom();