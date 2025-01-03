import Student from '../Models/Student.js' 
import asyncHandler from 'express-async-handler'
import Exam from '../Models/ExamShedule.js';
import Routine from '../Models/Routine.js';
import Lesson from '../Models/Lesson.js';
import Homework from '../Models/Homework.js';
import Assignment from '../Models/Assignment.js';
import Syllabus from '../Models/Syllabus.js';
import Marks from '../Models/Mark.js';
import Notice from '../Models/Notice.js';
import jwt from 'jsonwebtoken'
import PDFDocument from 'pdfkit';
import dotenv from 'dotenv';
import Transport from '../Models/Transport.js';

dotenv.config()



const getStudents = asyncHandler(async (req, res) => {
    const students = await Student.find();
    res.json(students);
});

const getStudentById = asyncHandler(async (req, res) => {
    const student = await Student.findById(req.params.id);
    if (!student) {
        res.status(404);
        throw new Error('Student not found');
    }
    res.json(student);
});

const createStudent = asyncHandler(async (req, res) => {
    const { name, age, classId } = req.body;
    const student = new Student({ name, age, classId });
    const createdStudent = await student.save();
    res.status(201).json(createdStudent);
});

const updateStudent = asyncHandler(async (req, res) => {
    const student = await Student.findById(req.params.id);
    if (!student) {
        res.status(404);
        throw new Error('Student not found');
    }
    Object.assign(student, req.body);
    const updatedStudent = await student.save();
    res.json(updatedStudent);
});

const deleteStudent = asyncHandler(async (req, res) => {
    const student = await Student.findById(req.params.id);
    if (!student) {
        res.status(404);
        throw new Error('Student not found');
    }
    await student.remove();
    res.json({ message: 'Student removed' });
});

// Controller function to get exam schedules by studentId (class and section based on student)
const getExamScheduleByStudent = async (req, res) => {
    const { studentId } = req.params; // Extract studentId from params
  
    try {
      // Fetch the student based on studentId
      const student = await Student.findById(studentId);
  
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
  
      // Fetch the exam schedules based on student's class and section
      const examSchedules = await Exam.find({
        class: student.class,
        section: student.section
      });
  
      if (examSchedules.length === 0) {
        return res.status(404).json({ message: 'No exam schedules found for the student' });
      }
  
      // Return the filtered list of exam schedules
      res.status(200).json({ message: 'Exam schedules fetched successfully', examSchedules });
    } catch (error) {
      // Handle errors during the fetch operation
      res.status(500).json({ message: 'Error fetching exam schedules', error: error.message });
    }
  };

  const getAdmitCard = async (req, res) => {
    const { studentId } = req.params; // Extract studentId from params
  
    try {
      // Fetch the student based on studentId
      const student = await Student.findById(studentId);
  
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
  
      // Fetch the exam schedules based on student's class and section and filter for isAdmitCardGenerated: true
      const examSchedules = await Exam.find({
        class: student.class,
        section: student.section,
        isAdmitCardGenerated: true, // Filter for schedules where admit card is generated
      });
  
      if (examSchedules.length === 0) {
        return res.status(404).json({ message: 'No exam schedules found for the student with admit cards generated' });
      }
  
      // Create a new PDF document
      const doc = new PDFDocument({ margin: 30 });
  
      // Set response headers for PDF download
      const filename = `AdmitCard_${student.firstName}_${student.lastName}.pdf`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/pdf');
  
      // Add header
      doc.fontSize(20).text('Admit Card', { align: 'center' }).moveDown(2);
  
      // Add student details
      doc
        .fontSize(14)
        .text(`Student Name: ${student.firstName} ${student.lastName}`, { align: 'left' })
        .text(`Class: ${student.class}`, { align: 'left' })
        .text(`Section: ${student.section}`, { align: 'left' })
        .text(`Roll Number: ${student.rollNumber}`, { align: 'left' })
        .moveDown(2);
  
      // Table Headers
      const tableHeaders = ['S.No.', 'Exam Title', 'Subject', 'Date', 'Time', 'Type'];
      const columnWidths = [50, 100, 100, 100, 150, 100]; // Define column widths
      let startX = 50; // Start position for the table
      let startY = doc.y;
  
      // Draw table headers
      doc.fontSize(12).font('Helvetica-Bold');
      tableHeaders.forEach((header, index) => {
        doc.text(header, startX, startY, { width: columnWidths[index], align: 'center' });
        startX += columnWidths[index];
      });
  
      // Draw line below headers
      startY += 20; // Move down for row height
      doc
        .moveTo(50, startY - 10)
        .lineTo(550, startY - 10)
        .strokeColor('black')
        .lineWidth(1)
        .stroke();
  
      // Reset starting X for rows
      startX = 50;
  
      // Draw table rows
      doc.font('Helvetica').fontSize(10);
      examSchedules.forEach((exam, rowIndex) => {
        const rowHeight = 20;
  
        const rowData = [
          rowIndex + 1,
          exam.examTitle,
          exam.subject,
          new Date(exam.examDate).toLocaleDateString(),
          `${exam.startTime} - ${exam.endTime}`,
          exam.examType || 'N/A',
        ];
  
        rowData.forEach((data, colIndex) => {
          doc.text(data, startX, startY, { width: columnWidths[colIndex], align: 'center' });
          startX += columnWidths[colIndex];
        });
  
        // Move down to the next row
        startY += rowHeight;
        startX = 50; // Reset X position for the next row
      });
  
      // Pipe the PDF to the response
      doc.pipe(res);
      doc.end();
    } catch (error) {
      // Handle errors during the fetch operation
      res.status(500).json({ message: 'Error generating admit card', error: error.message });
    }
  };
  

  const getClassRoutine = async (req, res) => {
    const { studentId } = req.params;  // Get studentId from request params
  
    try {
      // Fetch the student data based on studentId
      const student = await Student.findById(studentId);  // Adjust this if you're using a different method to fetch student
  
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
  
      // Now, use the class and section of the student to fetch the routine
      const { class: studentClass, section } = student;  // Get class and section
  
      // Fetch the routine based on class and section
      const routine = await Routine.findOne({ class: studentClass, section });
  
      if (!routine) {
        return res.status(404).json({ message: "No routine found for the student's class" });
      }
  
      // Return the fetched routine
      return res.status(200).json(routine);
    } catch (error) {
      console.error("Error fetching class routine:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };
  
 const getLessonsByStudent = async (req, res) => {
    const { studentId } = req.params;  // Get studentId from request parameters
  
    try {
      // Fetch the student based on studentId
      const student = await Student.findById(studentId);
  
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
  
      // Extract the class and section of the student
      const { class: studentClass } = student;
  
      // Fetch lessons for the student's class and section
      const lessons = await Lesson.find({ class: studentClass });
  
      if (lessons.length === 0) {
        return res.status(404).json({ message: "No lessons found for the student's class" });
      }
  
      // Return the fetched lessons
      return res.status(200).json({ message: "Lessons retrieved successfully", lessons });
    } catch (error) {
      // Handle any errors during fetch
      console.error("Error fetching lessons:", error);
      return res.status(500).json({ message: "Error fetching lessons", error: error.message });
    }
  };


// Controller to get homework for a specific student
const getHomeworkByStudent = async (req, res) => {
    try {
      const { studentId } = req.params; // Get studentId from URL parameters
  
      // Fetch student details to get class and section
      const student = await Student.findById(studentId);
  
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
  
      // Fetch homework based on class and section
      const homework = await Homework.find({
        class: student.class,
        section: student.section,
      });
  
      res.status(200).json(homework); // Send homework data as JSON response
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching homework' });
    }
  };

// Controller to get assignments for a specific student based on their class and section
 const getAssignmentsForStudent = async (req, res) => {
    try {
      const { studentId } = req.params;
  
      // Fetch student details to get class and section
      const student = await Student.findById(studentId);
  
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
  
      const { class: className, section } = student;
  
      // Fetch assignments based on class and section
      const assignments = await Assignment.find({
        class: className,
        section: section,
      });
  
      if (assignments.length === 0) {
        return res.status(404).json({ message: "No assignments found" });
      }
  
      res.status(200).json(assignments);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching assignments" });
    }
  };

  const getSyllabusForStudent = async (req, res) => {
    try {
      const { studentId } = req.params; // Extract studentId from request params
  
      // Fetch student details to get class and section
      const student = await Student.findById(studentId);
  
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
  
      const { class: className, section } = student;
  
      // Fetch syllabus data based on class and section
      const syllabus = await Syllabus.find({
        class: className,
        section: section,
      });
  
      if (syllabus.length === 0) {
        return res.status(404).json({ message: "No syllabus found" });
      }
  
      res.status(200).json(syllabus);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching syllabus for the student" });
    }
  };
  
  const getAttendanceByStudent = asyncHandler(async (req, res) => {
    const { studentId } = req.params;

    // Step 1: Find the student by ID
    const student = await Student.findById(studentId);

    if (!student) {
        return res.status(404).json({ message: "Student not found" });
    }

    // Step 2: Retrieve the attendance array
    const attendance = student.attendance;

    // Step 3: Respond with the attendance data
    res.status(200).json({
        message: "Attendance retrieved successfully",
        attendance,
    });
});

const applyForLeave = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { startDate, endDate, reason } = req.body;

  // Step 1: Find the student by ID
  const student = await Student.findById(studentId);

  if (!student) {
      return res.status(404).json({ message: "Student not found" });
  }

  // Step 2: Add the leave request
  const newLeave = {
      startDate,
      endDate,
      reason,
      status: 'Pending', // Default status
  };

  student.leaves.push(newLeave);

  // Step 3: Save the updated student document
  await student.save();

  res.status(201).json({
      message: "Leave applied successfully",
      leave: newLeave,
  });
});

const getLeavesByStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  // Step 1: Find the student by ID
  const student = await Student.findById(studentId);

  if (!student) {
      return res.status(404).json({ message: "Student not found" });
  }

  // Step 2: Retrieve the leave requests
  const leaves = student.leaves;

  // Step 3: Respond with the leave data
  res.status(200).json({
      message: "Leaves retrieved successfully",
      leaves,
  });
});


const getMarksByStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  // Step 1: Find marks by student ID
  const marks = await Marks.find({ studentId });

  if (!marks || marks.length === 0) {
      return res.status(404).json({ message: "Marks not found for this student" });
  }

  // Step 2: Respond with the marks data
  res.status(200).json({
      message: "Marks retrieved successfully",
      marks,
  });
});


const getStudentExamSchedule = asyncHandler(async (req, res) => {
  const { studentId } = req.params;  // Get studentId from params

  // Step 1: Find the student by studentId
  const student = await Student.findById(studentId);

  if (!student) {
      return res.status(404).json({ message: "Student not found" });
  }

  // Step 2: Get the student's examSchedule
  const examSchedule = student.examSchedule;

  if (!examSchedule || examSchedule.length === 0) {
      return res.status(404).json({ message: "No exam schedule found for this student" });
  }

  // Step 3: Return the exam schedule
  res.status(200).json({
      message: "Student exam schedule fetched successfully",
      examSchedule
  });
});

const getStudentNotices = asyncHandler(async (req, res) => {
  const { studentId } = req.params;  // Get studentId from request params

  // Step 1: Find the student by studentId to get their class and section
  const student = await Student.findById(studentId);

  if (!student) {
      return res.status(404).json({ message: "Student not found" });
  }

  // Step 2: Get the student's class and section
  const { className, section } = student;

  // Step 3: Find notices that are either general or specific to the student's class/section
  const notices = await Notice.find({
      $or: [
          { targetAudience: { $in: ["All"] } }, // General notices
          { class: className, section: section }, // Class and Section-specific notices
      ]
  }).sort({ date: -1 }); // Sort by date, most recent first

  if (!notices || notices.length === 0) {
      return res.status(404).json({ message: "No notices found for this student" });
  }

  // Step 4: Return the notices
  res.status(200).json({
      message: "Student notices fetched successfully",
      notices
  });
});


const getStudentSubjects = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  // Fetch student by ID and populate their subjects field
  const student = await Student.findById(studentId).populate('subjects');

  if (!student) {
      return res.status(404).json({ message: "Student not found" });
  }

  // Return student details with populated subjects
  res.status(200).json({
      message: "Student details fetched successfully",
      student: {
          name: student.name,
          rollNumber: student.rollNumber,
          class: student.class,
          section: student.section,
          subjects: student.subjects,  // This will now contain full subject data
      },
  });
});

const getStudentSubjectsTeachers = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  // Fetch student by ID and populate only the teacher field in subjects
  const student = await Student.findById(studentId).populate({
    path: 'subjects', // Populate the subjects field
    select: 'teacher', // Only select the 'teacher' field for each subject
  });

  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  // Return student details with populated subjects containing only the teacher info
  res.status(200).json({
    message: "Student details fetched successfully",
    student: {
      class: student.class,
      section: student.section,
      subjects: student.subjects.map(subject => ({
        teacher: subject.teacher, // Only include the teacher for each subject
      })),
    },
  });
});

// Controller to get student details along with their assigned transport
const getStudentTransport = asyncHandler(async (req, res) => {
  const { studentId } = req.params;  // Get studentId from the request params

  // Step 1: Find the student by ID and populate the transport field
  const student = await Student.findById(studentId).populate('transport');

  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  // Step 2: Check if the student has assigned transport
  if (!student.transport) {
    return res.status(404).json({ message: "No transport assigned to this student" });
  }

  // Step 3: Respond with the student details including transport
  res.status(200).json({
    message: "Student's transport details fetched successfully",
    student: {
      name: student.name,
      rollNumber: student.rollNumber,
      class: student.class,
      section: student.section,
      gender: student.gender,
      name: student.firstName,
      transport: student.transport,  // This will contain the transport details
    },
  });
});

const studentLogin = asyncHandler(async (req, res) => {
  const { firstName, class: className, section, roll, dateOfBirth } = req.body;

  // Convert provided dateOfBirth to a Date object to match the stored format
  const formattedDOB = new Date(dateOfBirth);

  // Step 1: Find the student by firstName, class, section, roll number, and formatted dateOfBirth
  const student = await Student.findOne({ 
    firstName, 
    class: className, 
    section, 
    roll, 
    dateOfBirth: formattedDOB // Compare with the Date object
  });

  if (!student) {
    return res.status(404).json({ message: "Invalid credentials" });
  }

  // Step 2: Generate a JWT token with role
  const token = jwt.sign(
    { studentId: student._id, rollNumber: student.rollNumber, role: student.role }, // Payload
    process.env.JWT_SECRET_KEY, // Secret key from environment variables
    { expiresIn: '1h' } // Expiration time
  );

  // Step 3: Send a successful response with the token and student ID
  res.status(200).json({
    message: "Login successful",
    token: token,
    student: {
      studentId: student._id, // Include student ID in the response
      firstName: student.firstName,
      name: student.name,
      roll: student.roll,
      class: student.class,
      section: student.section,
      role: student.role,
    },
  });
});


 // Controller to get student details by parent
 const getStudentDetails = async (req, res) => {
  const { studentId } = req.params;

  try {

    // Step 2: Fetch student details
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Step 3: Return the student details
    res.status(200).json({
      message: "Student details fetched successfully",
      student: student,
    });
  } catch (error) {
    console.error("Error fetching student details:", error);
    res.status(500).json({ message: "Error fetching student details", error: error.message });
  }
};

export  {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
    getExamScheduleByStudent,
    getClassRoutine,
    getLessonsByStudent,
    getHomeworkByStudent,
    getAssignmentsForStudent,
    getSyllabusForStudent,
    getAttendanceByStudent,
    applyForLeave,
    getLeavesByStudent,
    getMarksByStudent,
    getStudentExamSchedule,
    getStudentNotices,
    getStudentSubjects,
    getStudentSubjectsTeachers,
    getStudentTransport,
    studentLogin,
    getAdmitCard,
    getStudentDetails
};
