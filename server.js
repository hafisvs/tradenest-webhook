const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const { google } = require("googleapis");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Constants
const RAZORPAY_WEBHOOK_SECRET = "razorpay_secret10";
const FILE_ID = "1k1e0dsJtN0WPDb9XWkA5obXWxMKkgome";
const CREDENTIALS_PATH = "/etc/secrets/credentials.json";

// Razorpay webhook signature verification
app.use(
  "/webhook",
  bodyParser.json({
    verify: (req, res, buf) => {
      const signature = req.headers["x-razorpay-signature"];
      const expected = crypto
        .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
        .update(buf)
        .digest("hex");
      if (signature !== expected) {
        throw new Error("Invalid Razorpay signature");
      }
    },
  })
);

// Google Drive Authorization
function authorizeGoogleDrive() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const { client_email, private_key } = credentials;
  const auth = new google.auth.JWT(client_email, null, private_key, [
    "https://www.googleapis.com/auth/drive",
  ]);
  return google.drive({ version: "v3", auth });
}

async function shareFileWithEmail(email) {
  const drive = authorizeGoogleDrive();

  await drive.permissions.create({
    fileId: FILE_ID,
    requestBody: {
      role: "reader",
      type: "user",
      emailAddress: email,
    },
  });

  const { data } = await drive.files.get({
    fileId: FILE_ID,
    fields: "webViewLink",
  });

  return data.webViewLink;
}

// Generate PDF Invoice
function generateInvoice(data, filename) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const filePath = path.join(__dirname, filename);
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Title
    doc.fontSize(24).font("Helvetica-Bold").text("Tradenest Invoice", { align: "center" });
    doc.moveDown(1);

    // Invoice ID
    doc.fontSize(16).font("Helvetica").text(`Invoice ID: ${data.paymentId}`);
    doc.text(`Customer: ${data.name || "N/A"}`);
    doc.text(`Email: ${data.email}`);
    doc.text(`Amount: ₹${(data.amount / 100).toFixed(2)}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.text(`Status: ${data.status}`);
    doc.moveDown(1);
    doc.text("Description: Course Purchase");
    
    doc.moveDown(2);
    doc.text("Thank you for your purchase!", { align: "center" });

    doc.end();

    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
}

// Razorpay webhook handler
app.post("/webhook", async (req, res) => {
  try {
    const payment = req.body.payload?.payment?.entity;
    if (!payment || !payment.email) return res.status(400).send("Missing email");

    const notes = payment.notes || {};
    const emailPrimary = notes.email1 || payment.email;
    const emailSecondary = notes.email2 || "not provided";

    console.log("Primary Email:", emailPrimary);
    console.log("Secondary Email:", emailSecondary);

    const email = emailPrimary;
    const amount = payment.amount;
    const paymentId = payment.id;
    const status = payment.status;
    const name = payment.notes?.name || "Customer";

    const accessLink = await shareFileWithEmail(email);
    const invoicePath = await generateInvoice({ email, amount, paymentId, status, name }, `invoice_${paymentId}.pdf`);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "tradenest99@gmail.com",
        pass: "mkkc rpkc tvhy rfon",
      },
    });

    const mailOptions = {
      from: "tradenest99@gmail.com",
      to: email,
      subject: "Your Tradenest Course Access & Invoice",
      html: `
        <div style="font-family: Arial; background: #f9f9f9; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; padding: 30px;">
            <h2 style="color: #333;">Thank You, ${name}!</h2>
            <p>You have successfully purchased the Tradenest course.</p>
            <p>
              <a href="${accessLink}" style="background: #28a745; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Access Course</a>
            </p>
            <p>Your invoice is attached with this email.</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `invoice_${paymentId}.pdf`,
          path: invoicePath,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    try {
      fs.unlinkSync(invoicePath); // delete file after sending
    } catch (err) {
      console.error("Error deleting the invoice file:", err);
    }

    console.log(`Email with invoice sent to ${email}`);
    res.status(200).send("Payment verified and invoice sent");
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("Webhook error: " + err.message);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
