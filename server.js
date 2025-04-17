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
    console.log("Received payment data:", paymentData);

    const customerEmail = paymentData.email;

    if (!customerEmail) {
      console.error("Email is missing in payload");
      return res.status(400).send("Email is required");
    }

    console.log("Customer email extracted:", customerEmail);

    // Setup nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "tradenest99@gmail.com",
        pass: "mkkc rpkc tvhy rfon", // App password, not your actual Gmail password
      },
    });

    // Verify SMTP connection
    transporter.verify((error, success) => {
      if (error) {
        console.error("SMTP Authentication failed:", error);
      } else {
        console.log("SMTP Authentication success:", success);
      }
    });

    const mailOptions = {
      from: "tradenest99@gmail.com",
      to: customerEmail,
      subject: "Tradenest Course Purchase Receipt",
      text: `Thank you for your payment! Your course link: https://drive.google.com/yourcourse`,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Email send success");
    console.log("Sent to:", customerEmail);
    console.log("Message ID:", info.messageId);

    res.status(200).send("Webhook received and email sent to " + customerEmail);
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).send("Server error");
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
