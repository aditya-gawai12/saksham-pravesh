const db = require('./config/db');

async function makeAdmin() {
  try {
    const email = 'adityagawai@gmail.com';
    const sql = `
      INSERT INTO users 
      (full_name, email, phone_number, password_hash, mht_cet_percentile, category, preferred_branch, selected_package, role, payment_status)
      VALUES ('Aditya Gawai', ?, '9011388302', 'adminPassword123', 0, 'OPEN', 'N/A', 'premium', 'admin', 'approved')
      ON DUPLICATE KEY UPDATE role = 'admin', payment_status = 'approved'
    `;
    const [result] = await db.execute(sql, [email]);
    console.log('Successfully added/updated adityagawai@gmail.com to admin.');
    process.exit(0);
  } catch (err) {
    console.error('Error making admin:', err);
    process.exit(1);
  }
}

makeAdmin();
