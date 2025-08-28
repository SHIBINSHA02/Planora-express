// models/Organisation.js
// models/Classroom.js
const mongoose = require('mongoose');

const OrganisationSchema = new mongoose.Schema({
  organisation:{
     organisationId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  admin :{
    type:String,
    required:true,
    unique:true,
    trime:true
  }
  },
  classrooms: {
  classroomId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  assignedTeacher: {
    type: Number, // Primary teacher ID
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
    type: Number, // Array of teacher IDs
    ref: 'Teachers',
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
        for (const teacherId of this.assignedTeachers) {
          const teacher = await mongoose.model('Teacher').findOne({ id: teacherId });
          if (teacher && teacher.subjects.includes(value)) {
            return true;
          }
        }
        return false;
      },
      message: 'Subject must be taught by at least one assigned teacher'
    }
  }],
  rows: {
    type: Number,
    required: true,
    min: 1
  },
  columns: {
    type: Number,
    required: true,
    min: 1
  },
  grid: [{
    teachers: [{
      type: Number, // Teacher IDs
      ref: 'Teacher',
      validate: {
        validator: async function(value) {
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
          const cell = this;
          for (const teacherId of cell.teachers) {
            const teacher = await mongoose.model('Teacher').findOne({ id: teacherId });
            if (teacher && teacher.subjects.includes(value)) {
              return true;
            }
          }
          return false;
        },
        message: 'Subject must be taught by one of the cell teachers'
      }
    }]
  }]
}
},{
  timestamps :true
});

// Method to get cell by row and column indices
OrganisationSchema.methods.getCell = function(row, col) {
  const index = row * this.columns + col;
  return this.grid[index];
};

// Method to set cell by row and column indices
OrganisationSchema.methods.setCell = function(row, col, cellData) {
  const index = row * this.columns + col;
  this.grid[index] = cellData;
};

// Validate grid size matches rows * columns
OrganisationSchema.pre('save', function(next) {
  const expectedSize = this.rows * this.columns;
  if (this.grid.length !== expectedSize) {
    return next(new Error(`Grid size ${this.grid.length} doesn't match rows×columns ${expectedSize}`));
  }
  next();
});

// Indexes for efficient querying
OrganisationSchema.index({ classroomId: 1 });
OrganisationSchema.index({ assignedTeacher: 1 });
OrganisationSchema.index({ assignedTeachers: 1 });

const Organisation = mongoose.model('Organisation', OrganisationSchema);
module.exports = OrganisationSchema;