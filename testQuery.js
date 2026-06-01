const db = require('./config/db');

async function testQuery() {
  try {
    const [students] = await db.execute(
      `SELECT u.id, u.full_name, u.email, u.phone_number, u.mht_cet_percentile, u.category, u.preferred_branch, u.selected_package, u.payment_status, u.receipt_path, u.created_at, m.meeting_link 
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
    console.log('Query successful. Rows:', students.length);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testQuery();
