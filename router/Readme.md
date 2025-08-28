<!-- router/Readme.md -->
Key Changes Made:

Route Path Updates:

Changed GET /:classroomId to GET /organisation/:organisationId/classroom/:classroomId.
Changed PATCH /:classroomId/grid/:row/:col to PATCH /organisation/:organisationId/classroom/:classroomId/grid/:row/:col.
Changed PUT /:classroomId to PUT /organisation/:organisationId/classroom/:classroomId.
These changes ensure routes reflect both organisationId and classroomId as required.


Query Updates:

Updated queries in GET, PATCH, and PUT routes to use both organisation.organisationId and classrooms.classroomId in the findOne and findOneAndUpdate methods.
Example: Organisation.findOne({ 'organisation.organisationId': organisationId, 'classrooms.classroomId': classroomId }).


Error Messages:

Updated error messages to reflect that both organisation and classroom need to be found (e.g., "Classroom or Organisation not found").


POST Route:

Left unchanged since it already accepts organisationId and classroomId in the request body and creates the organisation with the nested classroom structure correctly.


Validation and Logic:

Ensured all operations (GET, PATCH, PUT) respect the nested schema structure by accessing fields like organisation.classrooms.
Maintained validation for grid indices and input fields, ensuring compatibility with the schema's rows and columns fields.
Kept the populate calls to fetch related teacher data for assignedTeacher, assignedTeachers, and grid.teachers.



These changes align the router with the requirement to use both organisationId and classroomId in the routes while maintaining full compatibility with the provided OrganisationSchema. Let me know if you need further adjustments or additional endpoints!