const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const app = express();

app.use(bodyParser.json());

app.post('/razorpay-webhook', async (req, res) => {
  const payload = req.body;

  const customerEmail = payload.payload?.payment?.entity?.email || 'default@example.com';
  const customerName = payload.payload?.payment?.entity?.notes?.name || 'Customer';

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'tradenest99@gmail.com',
      pass: 'mkkc rpkc tvhy rfon'
    }
  });

  const mailOptions = {
    from: 'tradenest99@gmail.com',
    to: customerEmail,
    subject: 'Course Access & Payment Confirmation',
    html: `
      <p>Hi ${customerName},</p>
      <p>Thanks for your purchase. Here is your access:</p>
      <p><strong>Google Drive Link:</strong> <a href="https://drive.google.com/your-course-link">Click Here</a></p>
      <p>Payment ID: ${payload.payload?.payment?.entity?.id}</p>
      <p>Regards,<br>Tradenest</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Email sent to customer.' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, message: 'Failed to send email.' });
  }
});

app.get('/', (req, res) => {
  res.send('Welcome to Tradenest Webhook Server');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});