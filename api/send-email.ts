import { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { subject, message, name, email } = req.body; // email is the visitor's email

  const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_GLOBALLOGISTICK_SMTP_USER,
      pass: process.env.EMAIL_GLOBALLOGISTICK_PASSWORD,
    },
    tls: { rejectUnauthorized: false }
  });

  try {
    await transporter.sendMail({
      // 1. MUST be your authenticated Hostinger email
      from: `"Website Contact: ${name}" <${process.env.EMAIL_GLOBALLOGISTICK_SMTP_USER}>`, 
      
      // 2. Your Inbox
      to: "support@globallogistick.com", 
      
      // 3. Put the visitor's email here so you can reply to them!
      replyTo: email, 
      
      subject: `[Contact Form] ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    return res.status(200).json({ success: true, message: "Email sent!" });
  } catch (err: any) {
    console.error("SMTP ERROR:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
