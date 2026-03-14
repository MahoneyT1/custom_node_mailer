import { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";

const transporters: Record<string, any> = {
  "http://localhost:5173": nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_GLOBALLOGISTICK_SMTP_USER,
      pass: process.env.EMAIL_GLOBALLOGISTICK_PASSWORD
    }
  }),

  "https://leaves-admin.com": nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  }),

  "https://globallogistick.com": nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_GLOBALLOGISTICK_SMTP_USER,
      pass: process.env.EMAIL_GLOBALLOGISTICK_PASSWORD
    }
  })
};

export default async function handler(req: VercelRequest, res: VercelResponse) {

  const allowedOrigins = [
    "http://localhost:5173",
    "https://leaves-admin.com",
    "https://globallogistick.com"
  ];

  const origin = req.headers.origin ?? "";

  // CORS headers FIRST
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({
      success: false,
      error: "Unauthorized origin"
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  const supportEmails: Record<string, string> = {
    "https://leaves-admin.com": "support@leaves-admin.com",
    "https://globallogistick.com": "support@globallogistick.com"
  };

  const transporter = transporters[origin];
  const supportEmail = supportEmails[origin];

  if (!transporter || !supportEmail) {
    return res.status(400).json({
      success: false,
      error: "No transporter configured for this origin"
    });
  }

  const { subject, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({
      success: false,
      error: "Missing fields"
    });
  }

  try {
    await transporter.sendMail({
      from: transporter.options.auth.user,
      to: supportEmail,
      subject,
      text: message
    });

    return res.status(200).json({
      success: true,
      message: "Email sent successfully"
    });

  } catch (err) {
    console.error("Email error:", err);

    return res.status(500).json({
      success: false,
      error: "Email sending failed"
    });
  }
}