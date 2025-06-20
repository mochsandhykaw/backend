// controllers/emailController.js
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const sendEmail = async (req, res) => {
  const { subject, message, name, email } = req.body;

  // Validasi input
  if (!subject || !message || !name || !email) {
    return res.status(400).json({
      message: "Semua field (subject, message, name, email) harus diisi.",
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const templatePath = path.join(
      __dirname,
      "../templates/emailTemplate.html"
    );
    let htmlContent = fs.readFileSync(templatePath, "utf8");

    htmlContent = htmlContent
      .replace(/{{name}}/g, name)
      .replace(/{{subject}}/g, subject)
      .replace(/{{email}}/g, email)
      .replace(/{{message}}/g, message);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO,
      subject,
      message,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Email berhasil dikirim", info });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengirim email", error });
  }
};

module.exports = { sendEmail };
