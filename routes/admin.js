const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const db = require('../config/db');
const { sendPaymentApprovalEmail } = require('../config/mailer');

// --- MULTER SETUP: Receipt PDF Uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'uploads', 'receipts'));
  },
  filename: (req, file, cb) => {
    const studentId = req.params.id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `receipt_${studentId}_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed.'), false);
    }
  }
});

// --- MULTER SETUP: Notice Attachments ---
const noticeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'uploads', 'notices'));
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `notice_${timestamp}${ext}`);
  }
});

const uploadNoticeAttachment = multer({
  storage: noticeStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF or Image files are allowed.'), false);
    }
  }
});

// --- MULTER SETUP: Resource Attachments ---
const resourceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'uploads', 'resources'));
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `resource_${timestamp}${ext}`);
  }
});

const uploadResourceAttachment = multer({
  storage: resourceStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max for resources
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/') || file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls') || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, Image, or Excel files are allowed for resources.'), false);
    }
  }
});

// @route   GET /api/admin/stats
// @desc    Get dashboard summary statistics
// @access  Private (Admin only)
router.get('/stats', async (req, res) => {
  try {
    const [totalResult] = await db.execute(
      'SELECT COUNT(*) as total FROM users WHERE role = "student"'
    );
    const [pendingResult] = await db.execute(
      'SELECT COUNT(*) as pending FROM users WHERE role = "student" AND payment_status = "pending"'
    );
    const [approvedResult] = await db.execute(
      'SELECT COUNT(*) as approved FROM users WHERE role = "student" AND payment_status = "approved"'
    );
    const [basicResult] = await db.execute(
      'SELECT COUNT(*) as basic FROM users WHERE role = "student" AND selected_package = "basic"'
    );
    const [premiumResult] = await db.execute(
      'SELECT COUNT(*) as premium FROM users WHERE role = "student" AND selected_package = "premium"'
    );

    return res.json({
      success: true,
      stats: {
        totalStudents: totalResult[0].total,
        pendingPayments: pendingResult[0].pending,
        approvedStudents: approvedResult[0].approved,
        basicPackage: basicResult[0].basic,
        premiumPackage: premiumResult[0].premium
      }
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    return res.status(500).json({ error: 'Internal server error fetching stats.' });
  }
});

// @route   GET /api/admin/students
// @desc    Get list of all registered students
// @access  Private (Admin only, verified in server.js middleware)
router.get('/students', async (req, res) => {
  try {
    const [students] = await db.execute(
      `SELECT u.id, u.full_name, u.email, u.phone_number, u.mht_cet_percentile, u.category, u.preferred_branch, u.selected_package, u.payment_status, u.progress_step, u.receipt_path, u.created_at, m.meeting_link 
       FROM users u 
       LEFT JOIN (
         SELECT m1.student_id, m1.meeting_link 
         FROM meetings m1 
         INNER JOIN (SELECT student_id, MAX(id) as max_id FROM meetings GROUP BY student_id) m2 
         ON m1.id = m2.max_id
       ) m ON u.id = m.student_id 
       WHERE u.role = "student" 
       ORDER BY u.created_at DESC`
    );
    return res.json({ success: true, students });
  } catch (error) {
    console.error('Admin Fetch Students Error:', error);
    return res.status(500).json({ error: 'Internal server error fetching students.' });
  }
});

// @route   POST /api/admin/approve/:id
// @desc    Approve/pending payment status of a student + send email on approval
// @access  Private (Admin only)
router.post('/approve/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    const { payment_status } = req.body;

    if (!payment_status || (payment_status !== 'approved' && payment_status !== 'pending')) {
      return res.status(400).json({ error: 'Invalid payment status. Must be "approved" or "pending".' });
    }

    // Fetch student details for email
    const [students] = await db.execute(
      'SELECT full_name, email, selected_package, payment_status as current_status FROM users WHERE id = ? AND role = "student"',
      [studentId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found or user is not a student.' });
    }

    const student = students[0];

    const newProgressStep = payment_status === 'approved' ? 2 : 1;

    // Update student payment status in DB
    const [result] = await db.execute(
      'UPDATE users SET payment_status = ?, progress_step = ? WHERE id = ? AND role = "student"',
      [payment_status, newProgressStep, studentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student not found or user is not a student.' });
    }

    // Send automated email ONLY when transitioning to 'approved' (not when already approved)
    let emailResult = null;
    if (payment_status === 'approved' && student.current_status !== 'approved') {
      emailResult = await sendPaymentApprovalEmail(
        student.email,
        student.full_name,
        student.selected_package
      );
    }

    return res.json({
      success: true,
      message: `Student payment status updated to ${payment_status}.`,
      emailSent: emailResult ? emailResult.success : false
    });

  } catch (error) {
    console.error('Admin Approve Student Error:', error);
    return res.status(500).json({ error: 'Internal server error updating payment status.' });
  }
});

// @route   POST /api/admin/upload-receipt/:id
// @desc    Upload a payment receipt PDF for a student
// @access  Private (Admin only)
router.post('/upload-receipt/:id', (req, res) => {
  upload.single('receipt')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }
      return res.status(400).json({ error: err.message || 'File upload failed.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file was uploaded.' });
    }

    try {
      const studentId = req.params.id;
      const receiptPath = `/uploads/receipts/${req.file.filename}`;

      const [result] = await db.execute(
        'UPDATE users SET receipt_path = ? WHERE id = ? AND role = "student"',
        [receiptPath, studentId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Student not found.' });
      }

      return res.json({
        success: true,
        message: 'Receipt uploaded successfully!',
        receiptPath: receiptPath
      });
    } catch (error) {
      console.error('Receipt Upload DB Error:', error);
      return res.status(500).json({ error: 'Internal server error saving receipt.' });
    }
  });
});

// @route   POST /api/admin/schedule-meeting/:id
// @desc    Schedule a 1-on-1 meeting for a premium student
// @access  Private (Admin only)
router.post('/schedule-meeting/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    const { meeting_link, scheduled_time, notes } = req.body;

    if (!meeting_link || !scheduled_time) {
      return res.status(400).json({ error: 'Meeting link and scheduled time are required.' });
    }

    // Verify student is premium
    const [students] = await db.execute(
      'SELECT selected_package FROM users WHERE id = ? AND role = "student"',
      [studentId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    if (students[0].selected_package !== 'premium') {
      return res.status(400).json({ error: '1-on-1 meetings can only be scheduled for Premium students.' });
    }

    // Format scheduled_time for MySQL
    let dbTime = scheduled_time.replace('T', ' ');
    if (dbTime.length === 16) dbTime += ':00'; // Add seconds if missing

    const [result] = await db.execute(
      'INSERT INTO meetings (student_id, meeting_link, scheduled_time, notes) VALUES (?, ?, ?, ?)',
      [studentId, meeting_link.trim(), dbTime, notes ? notes.trim() : null]
    );

    return res.status(201).json({
      success: true,
      message: 'Meeting scheduled successfully!',
      meetingId: result.insertId
    });

  } catch (error) {
    console.error('Schedule Meeting Error:', error);
    return res.status(500).json({ error: 'Internal server error scheduling meeting.' });
  }
});

// @route   POST /api/admin/notice
// @desc    Post a new counseling announcement / meeting link
// @access  Private (Admin only)
router.post('/notice', uploadNoticeAttachment.single('notice_file'), async (req, res) => {
  try {
    const { title, meeting_link, scheduled_time } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Announcement title is required.' });
    }

    // Format scheduled_time or use null
    let dbTime = null;
    if (scheduled_time && scheduled_time !== 'null' && scheduled_time !== '') {
      // Input from datetime-local input is usually 'YYYY-MM-DDTHH:MM'
      // MySQL DATETIME accepts 'YYYY-MM-DD HH:MM:SS'
      dbTime = scheduled_time.replace('T', ' ') + ':00';
    }

    // File attachment path
    let attachmentPath = null;
    if (req.file) {
      attachmentPath = `/uploads/notices/${req.file.filename}`;
    }

    const [result] = await db.execute(
      'INSERT INTO notices (title, meeting_link, scheduled_time, attachment_path) VALUES (?, ?, ?, ?)',
      [title.trim(), meeting_link && meeting_link !== 'null' ? meeting_link.trim() : null, dbTime, attachmentPath]
    );

    return res.status(201).json({
      success: true,
      message: 'Announcement posted successfully!',
      noticeId: result.insertId
    });

  } catch (error) {
    console.error('Admin Create Notice Error:', error);
    return res.status(500).json({ error: 'Internal server error posting announcement.' });
  }
});

// @route   POST /api/admin/resource
// @desc    Upload a new resource and notify students
// @access  Private (Admin only)
router.post('/resource', uploadResourceAttachment.single('resource_file'), async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !req.file) {
      return res.status(400).json({ error: 'Title and file attachment are required.' });
    }

    const filePath = `/uploads/resources/${req.file.filename}`;

    // 1. Insert into resources
    const [resourceResult] = await db.execute(
      'INSERT INTO resources (title, description, file_path) VALUES (?, ?, ?)',
      [title.trim(), description ? description.trim() : null, filePath]
    );

    // 2. Automatically publish notice
    await db.execute(
      'INSERT INTO notices (title, attachment_path) VALUES (?, ?)',
      [`New Resource Uploaded: ${title.trim()}`, filePath]
    );

    return res.status(201).json({
      success: true,
      message: 'Resource uploaded successfully!',
      resourceId: resourceResult.insertId
    });
  } catch (error) {
    console.error('Admin Resource Upload Error:', error);
    return res.status(500).json({ error: 'Internal server error uploading resource.' });
  }
});

// @route   POST /api/admin/progress/:id
// @desc    Update progress step for a student
// @access  Private (Admin only)
router.post('/progress/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    const { progress_step } = req.body;

    if (!progress_step) {
      return res.status(400).json({ error: 'Progress step is required.' });
    }

    const [result] = await db.execute(
      'UPDATE users SET progress_step = ? WHERE id = ? AND role = "student"',
      [progress_step, studentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    return res.json({ success: true, message: 'Progress updated successfully!' });
  } catch (error) {
    console.error('Admin Progress Update Error:', error);
    return res.status(500).json({ error: 'Internal server error updating progress.' });
  }
});

module.exports = router;
