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
    const customerEmail = paymentData.email;

    if (!customerEmail) {
      return res.status(400).send("Email is required");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "tradenest99@gmail.com",
        pass: "mkkc rpkc tvhy rfon",
      },
    });

    const mailOptions = {
      from: "tradenest99@gmail.com",
      to: customerEmail,
      subject: "Tradenest Course Purchase Receipt",
      text: "Thank you for your payment! Here is your course link: https://drive.google.com/yourcourse",
    };

    await transporter.sendMail(mailOptions);

    console.log("Email sent to:", customerEmail);
    res.status(200).send("Webhook received and email sent");
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).send("Server error");
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
