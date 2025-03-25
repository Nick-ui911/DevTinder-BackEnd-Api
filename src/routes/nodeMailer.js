const express = require("express");
const mailAuthRouter = express.Router();
const transporter = require("../utils/nodeMailerConfig");

mailAuthRouter.post("/send-email", async (req, res) => {
  const { name, email, message } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_ADMIN, // Always send from your own email
    to: process.env.EMAIL_SUPPORT, // Support team's email
    subject: "New User Inquiry - Support Request",
    text: `Hello Support Team,
  
  A user has submitted a contact request with the following details:
  
  - **Name:** ${name}
  - **Email:** ${email}
  - **Issue:** ${message}
  
  Please look into this and respond to the user at your earliest convenience.
  
  Best regards,  
  DevTinder Team`,
  };

  const mailOptions2 = {
    from: process.env.EMAIL_ADMIN, // Always send from your own email
    to: email, // User's email
    subject: "We Have Received Your Inquiry",
    text: `Dear ${name},
  
  Thank you for reaching out to us. We have received your message and our support team will review your issue as soon as possible. We will get back to you shortly with a response.
  
  If you need immediate assistance, please feel free to contact our support team at ${process.env.EMAIL_SUPPORT}.
  
  Best regards,  
  DevTinder Team`,
  };

  try {
    await transporter.sendMail(mailOptions);
    await transporter.sendMail(mailOptions2);
    res
      .status(200)
      .json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Email could not be sent." });
  }
});

module.exports = mailAuthRouter;
