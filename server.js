const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const fs = require("fs");
const { google } = require("googleapis");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Home route
app.get("/", (req, res) => {
  res.send("Welcome to Tradenest Webhook Server");
});

// Google Drive setup
const SCOPES = ["https://www.googleapis.com/auth/drive"];
const CREDENTIALS_PATH = "client_secret_18734625095-2949nf2oa0padji5kbvs1k0ena6mashk.apps.googleusercontent.com.json";
const FILE_ID = "1k1e0dsJtN0WPDb9XWkA5obXWxMKkgome"; // your folder/file ID

function authorizeGoogleDrive() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const { client_email, private_key } = credentials;
  const auth = new google.auth.JWT(client_email, null, private_key, SCOPES);
  return google.drive({ version: "v3", auth });
}

async function shareFileWithEmail(email) {
  const drive = authorizeGoogleDrive();

  // Grant viewer access to email
  await drive.permissions.create({
    fileId: FILE_ID,
    requestBody: {
      role: "reader",
      type: "user",
      emailAddress: email,
    },
  });

  // Get the shareable link
  const { data } = await drive.files.get({
    fileId: FILE_ID,
    fields: "webViewLink",
  });

  return data.webViewLink;
}

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

    // Grant viewer access
    const courseLink = await shareFileWithEmail(customerEmail);
    console.log("Viewer access granted:", courseLink);

    // Setup nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "tradenest99@gmail.com",
        pass: "mkkc rpkc tvhy rfon", // App password
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
      subject: "Welcome to Tradenest - Your Course Access",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
          <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <h2 style="color: #333;">Thank You for Your Purchase!</h2>
            <p style="font-size: 16px; color: #555;">
              Hi there,<br><br>
              We're excited to welcome you to <strong>Tradenest</strong>! You've successfully purchased our course. Click the button below to access your content:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${courseLink}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Access Course
              </a>
            </div>
            <p style="font-size: 14px; color: #888;">
              If you have any questions or issues, feel free to contact us at tradenest99@gmail.com.<br><br>
              Happy Learning!<br>
              — The Tradenest Team
            </p>
          </div>
        </div>
      `,
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
