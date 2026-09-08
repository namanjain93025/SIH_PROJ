const nodemailer = require("nodemailer");

let transporter = null;

// Only build a real SMTP transporter if credentials are actually configured.
// Keeps local dev from crashing registration/OTP flows when .env isn't fully set up yet.
const getTransporter = () => {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

/**
 * Sends an email. Falls back to logging to console if SMTP env vars
 * aren't configured yet, so auth flows (OTP, password reset) remain
 * testable without a mail provider set up.
 */
exports.sendEmail = async ({ to, subject, text, html }) => {
  const mailer = getTransporter();

  if (!mailer) {
    console.warn(
      `[notificationService] SMTP not configured — logging email instead of sending.\nTo: ${to}\nSubject: ${subject}\nText: ${text}`
    );
    return { simulated: true };
  }

  return mailer.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
};
