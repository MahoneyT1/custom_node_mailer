import { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const allowedOrigins = [
    "http://localhost:5173",
    "https://leaves-admin.com",
    "https://globallogistick.com"
  ];

  const origin = req.headers.origin ?? "";

  // 1. ALWAYS set CORS headers immediately
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 2. Validate Origin
  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({ success: false, error: "Unauthorized origin" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // 3. Dynamic Configuration based on Origin
  let smtpConfig;
  let supportEmail;

  if (origin === "https://leaves-admin.com") {
    supportEmail = "support@leaves-admin.com";
    smtpConfig = {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    };
  } else {
    // Default for localhost and globallogistick
    supportEmail = "support@globallogistick.com";
    smtpConfig = {
      user: process.env.EMAIL_GLOBALLOGISTICK_SMTP_USER,
      pass: process.env.EMAIL_GLOBALLOGISTICK_PASSWORD,
    };
  }

  // 4. Create Transporter INSIDE the handler to ensure fresh Env Vars
  const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 587,
    secure: false, // Use STARTTLS for 587
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    },
    tls: {
      rejectUnauthorized: false, // Essential for Hostinger + Vercel
    },
  });

  const { subject, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ success: false, error: "Missing fields" });
  }

  try {
    // 5. Verify and Send
    await transporter.verify();

    const info = await transporter.sendMail({
      from: `"${subject}" <${smtpConfig.user}>`, // Format as "Subject <email>"
      to: supportEmail,
      subject: subject,
      text: message,
    });

    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
      messageId: info.messageId
    });

  } catch (err: any) {
    console.error("SMTP ERROR:", err.message);
    // Return 500 but still with valid JSON so the frontend doesn't trigger a "CORS" error
    return res.status(500).json({ 
      success: false, 
      error: err.message,
      code: err.code 
    });
  }
}
