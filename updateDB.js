const db = require('./config/db');

async function updateDB() {
  try {
    const [result] = await db.execute('ALTER TABLE notices ADD COLUMN attachment_path VARCHAR(255) DEFAULT NULL');
    console.log('Successfully added attachment_path to notices.');
    process.exit(0);
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists.');
      process.exit(0);
    } else {
      console.error('Error:', err);
      process.exit(1);
    }
  }
}

updateDB();
