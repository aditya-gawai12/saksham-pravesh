const db = require('./config/db');

async function test() {
  const [users] = await db.execute('SELECT id, full_name, email, role, password_hash FROM users');
  console.log(users);
  process.exit();
}

test();
