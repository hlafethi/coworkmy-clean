const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/send-email', async (req, res) => {
  const { to, subject, html } = req.body;
  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Champs requis : to, subject, html' });
  }
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.coworkmy.fr',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'contact@coworkmy.fr',
        pass: process.env.SMTP_PASS || '',
      },
    });
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'contact@coworkmy.fr',
      to,
      subject,
      html,
    });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Erreur envoi email SMTP:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.API_PORT || 5000;
app.listen(PORT, () => {
  console.log(`API SMTP listening on port ${PORT}`);
}); 