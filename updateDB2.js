const db = require('./config/db');

async function updateDB() {
  try {
    // 1. Add progress_step to users table
    try {
      await db.execute('ALTER TABLE users ADD COLUMN progress_step INT DEFAULT 1');
      console.log('Successfully added progress_step to users.');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('Column progress_step already exists.');
      } else {
        throw err;
      }
    }
    
    // 2. Set progress_step to 2 for approved users
    await db.execute('UPDATE users SET progress_step = 2 WHERE payment_status = "approved" AND progress_step = 1');

    // 3. Create resources table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS resources (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_path VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);
    console.log('Successfully created resources table.');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

updateDB();
