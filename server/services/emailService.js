const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

// Initialize Nodemailer SMTP Transporter
const getTransporter = async () => {
  if (transporter) return transporter;

  if (env.SMTP_USER && env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465, // true for 465, false for 587
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    });
    console.log(`📧 SMTP Email Transporter configured via ${env.SMTP_HOST}`);
  } else {
    // Fallback Ethereal test account for local testing
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('📧 SMTP credentials not set in .env. Using Ethereal test mail service.');
    } catch (err) {
      console.warn('⚠️ Could not create Ethereal test email account:', err.message);
    }
  }

  return transporter;
};

/**
 * Send Password Reset Confirmation / OTP Email
 */
const sendPasswordResetEmail = async (toEmail, userName, otpCode) => {
  try {
    const mailer = await getTransporter();
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 12px;">
        <div style="background-color: #B30E2E; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="color: #ffffff; margin: 0;">Gulmohar City - Password Reset</h2>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
          <p>Hello <strong>${userName}</strong>,</p>
          <p>We received a request to reset your password for your Gulmohar City account.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #555;">Your Password Reset Verification Code:</p>
            <h1 style="margin: 10px 0; font-size: 32px; letter-spacing: 5px; color: #B30E2E;">${otpCode}</h1>
            <p style="margin: 0; font-size: 12px; color: #888;">Valid for 10 minutes</p>
          </div>
          <p style="font-size: 13px; color: #666;">If you did not request a password reset, please ignore this email or contact support immediately.</p>
        </div>
        <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 8px 8px;">
          &copy; ${new Date().getFullYear()} Gulmohar City Real Estate CRM System. All rights reserved.
        </div>
      </div>
    `;

    const mailOptions = {
      from: env.SMTP_FROM || '"Gulmohar City Admin" <noreply@gulmoharcity.com>',
      to: toEmail,
      subject: `🔑 Gulmohar City - Password Reset Verification Code [${otpCode}]`,
      html: htmlContent
    };

    const isConfigured = Boolean(env.SMTP_USER && env.SMTP_PASS);

    if (mailer) {
      const info = await mailer.sendMail(mailOptions);
      console.log(`✉️ Password reset email sent to ${toEmail}. Message ID: ${info.messageId}`);
      if (nodemailer.getTestMessageUrl && info) {
        console.log(`🔗 Preview Email URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
      return { 
        success: true, 
        isConfigured, 
        messageId: info.messageId, 
        previewUrl: nodemailer.getTestMessageUrl && info ? nodemailer.getTestMessageUrl(info) : null 
      };
    }
    
    return { success: true, isConfigured, message: 'Email sent successfully' };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
    // Don't throw error to prevent process crash
    return { success: false, error: error.message };
  }
};

/**
 * Send Password Changed Notification Email
 */
const sendPasswordChangedConfirmation = async (toEmail, userName) => {
  try {
    const mailer = await getTransporter();
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 12px;">
        <div style="background-color: #2e7d32; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="color: #ffffff; margin: 0;">Password Successfully Reset</h2>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
          <p>Hello <strong>${userName}</strong>,</p>
          <p>Your Gulmohar City account password has been successfully updated.</p>
          <p style="font-size: 13px; color: #666;">If you did not perform this action, please contact your System Administrator immediately.</p>
        </div>
        <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 8px 8px;">
          &copy; ${new Date().getFullYear()} Gulmohar City Real Estate CRM System.
        </div>
      </div>
    `;

    const mailOptions = {
      from: env.SMTP_FROM || '"Gulmohar City Admin" <noreply@gulmoharcity.com>',
      to: toEmail,
      subject: '✅ Security Alert: Gulmohar City Password Changed',
      html: htmlContent
    };

    if (mailer) {
      await mailer.sendMail(mailOptions);
    }
  } catch (error) {
    console.error('Error sending password changed notification:', error.message);
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendPasswordChangedConfirmation
};
