const express = require('express');
const router = express.Router();
const db = require('../config/db');

// @route   GET /api/student/dashboard
// @desc    Get full student profile, payment status, package, receipt, next meeting, and notices
// @access  Private (Student only, verified in server.js middleware)
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.session.userId;

    // 1. Fetch complete student profile from DB
    const [users] = await db.execute(
      'SELECT full_name, email, phone_number, mht_cet_percentile, category, preferred_branch, selected_package, payment_status, progress_step, receipt_path FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const student = users[0];

    // 2. Fetch notices if approved
    let notices = [];
    if (student.payment_status === 'approved') {
      const [noticesData] = await db.execute(
        'SELECT id, title, meeting_link, scheduled_time, attachment_path, created_at FROM notices ORDER BY created_at DESC'
      );
      notices = noticesData;
    }

    // 3. Fetch next upcoming 1-on-1 meeting (only for premium students)
    let nextMeeting = null;
    if (student.selected_package === 'premium' && student.payment_status === 'approved') {
      const [meetings] = await db.execute(
        'SELECT id, meeting_link, scheduled_time, notes FROM meetings WHERE student_id = ? AND scheduled_time >= NOW() ORDER BY scheduled_time ASC LIMIT 1',
        [userId]
      );
      if (meetings.length > 0) {
        nextMeeting = meetings[0];
      }
    }

    // 4. Fetch resources if approved
    let resources = [];
    if (student.payment_status === 'approved') {
      const [resourcesData] = await db.execute(
        'SELECT id, title, description, file_path, created_at FROM resources ORDER BY created_at DESC'
      );
      resources = resourcesData;
    }

    return res.json({
      success: true,
      fullName: student.full_name,
      email: student.email,
      phoneNumber: student.phone_number,
      percentile: student.mht_cet_percentile,
      category: student.category,
      preferredBranch: student.preferred_branch,
      selectedPackage: student.selected_package,
      paymentStatus: student.payment_status,
      progressStep: student.progress_step,
      receiptPath: student.receipt_path,
      nextMeeting: nextMeeting,
      notices: notices,
      resources: resources
    });

  } catch (error) {
    console.error('Student Dashboard API Error:', error);
    return res.status(500).json({ error: 'Internal server error fetching dashboard data.' });
  }
});

module.exports = router;
