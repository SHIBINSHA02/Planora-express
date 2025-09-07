// controllers/Organisation/GridController.js
const Organisation = require('../../models/Organisation');
const isEmpty = require('is-empty');

class GridController {
  // Update a specific grid cell in a classroom
  static async updateGridCell(req, res) {
    try {
      const { organisationId, classroomId, row, col } = req.params;
      const { teachers, subjects } = req.body;

      // Validate input
      if (isEmpty(teachers) || !Array.isArray(teachers) || isEmpty(subjects) || !Array.isArray(subjects)) {
        return res.status(400).json({ message: 'Teachers and subjects must be arrays' });
      }

      // Find organisation
      const organisation = await Organisation.findByOrganisationId(organisationId);
      if (!organisation) {
        return res.status(404).json({ message: 'Organisation not found' });
      }

      // Find the specific classroom
      const classroom = organisation.getClassroomById(classroomId);
      if (!classroom) {
        return res.status(404).json({ message: 'Classroom not found' });
      }

      const rowIndex = parseInt(row);
      const colIndex = parseInt(col);
      const { periodCount, daysCount } = organisation;
      
      if (
        isNaN(rowIndex) || rowIndex < 0 || rowIndex >= daysCount ||
        isNaN(colIndex) || colIndex < 0 || colIndex >= periodCount
      ) {
        return res.status(400).json({ message: 'Invalid row or column index' });
      }

      // Calculate flattened index (row * periodCount + col)
      const cellIndex = rowIndex * periodCount + colIndex;
      
      // Ensure grid array is properly sized
      if (!classroom.grid || classroom.grid.length !== daysCount * periodCount) {
        // Initialize grid if not properly sized
        const totalSlots = daysCount * periodCount;
        classroom.grid = Array.from({ length: totalSlots }, () => ({
          teachers: [],
          subjects: []
        }));
      }

      // Update the specific grid cell
      classroom.grid[cellIndex] = {
        teachers,
        subjects
      };

      // Save the updated organisation
      await organisation.save();
      
      res.status(200).json({ 
        message: 'Grid cell updated successfully', 
        classroom: classroom,
        organisation: organisationId,
        cellIndex: cellIndex,
        row: rowIndex,
        col: colIndex
      });
    } catch (error) {
      res.status(400).json({ message: 'Error updating grid cell', error: error.message });
    }
  }
}

module.exports = GridController;
