const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Home route
app.get("/", (req, res) => {
  res.send("Welcome to Tradenest Webhook Server");
});

// Webhook route
app.post("/webhook", async (req, res) => {
  try {
    const paymentData = req.body;

    // Extract email from payload
  const customerEmail = paymentData.email;

if (!customerEmail) {
  return res.status(400).send("Email is required");
}

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "tradenest99@gmail.com",
    pass: "mkkc rpkc tvhy rfon"
  },
});

const mailOptions = {
  from: "tradenest99@gmail.com",
  to: "hafisvs6@gmail.com",
  subject: "Test Email",
  text: "This is a test",
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    return console.log("Error sending test email:", error);
  }
  console.log("Test email sent:", info.response);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
