const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT || '587'),
  secure: false, // true for 465, false for 587 (STARTTLS)
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// Verify transporter on startup (non-blocking)
transporter.verify()
  .then(() => console.log('Mail transporter is ready to send emails.'))
  .catch((err) => {
    console.warn('MAIL WARNING: Could not verify mail transporter. Emails will not be sent.');
    console.warn('Configure MAIL_USER and MAIL_PASS in .env to enable automated emails.');
    console.warn(err.message);
  });

/**
 * Send a payment approval confirmation email to the student
 * @param {string} toEmail - Student's email address
 * @param {string} studentName - Student's full name
 * @param {string} packageType - 'basic' or 'premium'
 */
async function sendPaymentApprovalEmail(toEmail, studentName, packageType) {
  const packageLabel = packageType === 'premium' ? 'Premium Counseling' : 'Form Assist (Basic)';

  const premiumFeatures = `
    <li>✅ Unlimited preference list updates</li>
    <li>✅ Personalized category/caste cutoff analysis</li>
    <li>✅ Live 1-on-1 counseling via Google Meet</li>
    <li>✅ Spot Round admission strategy guides</li>
    <li>✅ Emergency WhatsApp support for form locks</li>
  `;

  const basicFeatures = `
    <li>✅ Personalized Preference List (PDF)</li>
    <li>✅ Cutoff analysis of 3 preferred branches</li>
    <li>✅ Email & Web dashboard notices</li>
  `;

  const features = packageType === 'premium' ? premiumFeatures : basicFeatures;

  const htmlBody = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #4f46e5, #06b6d4); padding: 32px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; color: white;">✅ Payment Confirmed!</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Welcome to Saksham Pravesh Counseling</p>
      </div>
      <div style="padding: 32px;">
        <p style="font-size: 16px; color: #f8fafc;">Hi <strong>${studentName}</strong>,</p>
        <p style="color: #94a3b8; line-height: 1.6;">
          Your payment for the <strong style="color: #22d3ee;">${packageLabel}</strong> package has been verified successfully by our counselor team!
        </p>
        <div style="background: #1e293b; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid rgba(255,255,255,0.06);">
          <h3 style="color: #22d3ee; margin: 0 0 12px; font-size: 16px;">Your Package Includes:</h3>
          <ul style="color: #94a3b8; padding-left: 0; list-style: none; margin: 0; line-height: 2;">
            ${features}
          </ul>
        </div>
        <p style="color: #94a3b8; line-height: 1.6;">
          You now have <strong style="color: #f8fafc;">full access</strong> to your student dashboard — including live counseling notices, meeting links, and downloadable resources.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.APP_URL || 'http://localhost:3000'}/login" style="background: linear-gradient(135deg, #4f46e5, #8b5cf6); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
            Login to Your Dashboard →
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 24px 0;">
        <p style="color: #64748b; font-size: 13px; text-align: center; margin: 0;">
          — Team Saksham Pravesh<br>
          MHT CET Counseling & Admissions Support
        </p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"Saksham Pravesh" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: '✅ Payment Confirmed — Welcome to Saksham Pravesh!',
    html: htmlBody
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Payment confirmation email sent to ${toEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Failed to send email to ${toEmail}:`, error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendPaymentApprovalEmail };
