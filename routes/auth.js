const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Helper function to send WhatsApp automated message using Meta Cloud API
const sendWhatsAppMessage = async (toPhone, userName) => {
  try {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    
    if (!token || !phoneId) {
      console.log("WhatsApp API credentials missing. Skipping automated message.");
      return; 
    }
    
    // Format phone number: remove non-digits
    const cleanPhone = toPhone.replace(/\D/g, '');
    // Ensure it has country code, default to 91 if length is 10
    const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      to: finalPhone,
      type: "template",
      template: {
        name: "hello_world", // You will need to create and approve a template in Meta Dashboard
        language: { code: "en_US" }
      }
    };
    
    // Using global fetch (available in Node 18+)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("WhatsApp API Error Response:", errorData);
    } else {
      console.log(`WhatsApp automated message sent to ${finalPhone}`);
    }
  } catch (err) {
    console.error("WhatsApp API Request Error:", err);
  }
};

// @route   POST /api/auth/register
// @desc    Register a new student
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const {
      full_name,
      email,
      phone_number,
      password,
      mht_cet_percentile,
      category,
      preferred_branch,
      selected_package
    } = req.body;

    // 1. Basic validation
    if (!full_name || !email || !phone_number || !password || mht_cet_percentile === undefined || !category || !preferred_branch) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Invalid email address format.' });
    }

    const percentileNum = parseFloat(mht_cet_percentile);
    if (isNaN(percentileNum) || percentileNum < 0 || percentileNum > 100) {
      return res.status(400).json({ error: 'Invalid percentile. Must be between 0 and 100.' });
    }

    // Validate package selection
    const validPackages = ['basic', 'premium'];
    const packageChoice = validPackages.includes(selected_package) ? selected_package : 'basic';

    // 2. Check if email already exists
    const [existingUsers] = await db.execute('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    // 3. Insert user into DB (password stored directly, default role: student, default payment_status: pending)
    const sql = `
      INSERT INTO users 
      (full_name, email, phone_number, password_hash, mht_cet_percentile, category, preferred_branch, selected_package, role, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'student', 'pending')
    `;
    const params = [
      full_name.trim(),
      email.trim().toLowerCase(),
      phone_number.trim(),
      password,
      percentileNum,
      category.trim(),
      preferred_branch.trim(),
      packageChoice
    ];

    const [result] = await db.execute(sql, params);

    // 4. Store session variables to auto-login
    req.session.userId = result.insertId;
    req.session.role = 'student';
    req.session.fullName = full_name;

    // 5. Send automated WhatsApp Message (asynchronous, doesn't block response)
    sendWhatsAppMessage(phone_number, full_name);

    return res.status(201).json({
      success: true,
      message: 'Registration successful!',
      role: 'student'
    });

  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// @route   POST /api/auth/login
// @desc    Log in a user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // 1. Fetch user by email
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = users[0];

    // 2. Compare password directly (plain text comparison)
    if (password !== user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // 3. Set session
    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.fullName = user.full_name;

    return res.json({
      success: true,
      message: 'Login successful!',
      role: user.role
    });

  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// @route   POST /api/auth/logout
// @desc    Log out a user and destroy session
// @access  Public (or Authenticated)
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Could not log out. Please try again.' });
    }
    res.clearCookie('connect.sid'); // Clear session cookie
    return res.json({ success: true, message: 'Logged out successfully.' });
  });
});

// @route   GET /api/auth/me
// @desc    Get current logged in user details
// @access  Public
router.get('/me', async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.json({ loggedIn: false });
  }

  try {
    const [users] = await db.execute(
      'SELECT id, full_name, email, phone_number, mht_cet_percentile, category, preferred_branch, selected_package, role, payment_status, receipt_path FROM users WHERE id = ?', 
      [req.session.userId]
    );

    if (users.length === 0) {
      req.session.destroy();
      return res.json({ loggedIn: false });
    }

    return res.json({
      loggedIn: true,
      user: users[0]
    });
  } catch (error) {
    console.error('Session user fetch error:', error);
    return res.status(500).json({ error: 'Failed to retrieve session user details.' });
  }
});

module.exports = router;
