const express = require("express");
const mailAuthRouter = express.Router();
const transporter = require("../utils/nodeMailerConfig");


mailAuthRouter.post("/send-email", async (req, res) => {
    const { name, email, message } = req.body;
  
    const mailOptions = {
        from: `"${name}" <${process.env.EMAIL_USER}>`, // Always send from your own email
        to: process.env.EMAIL_USER, // Your receiving email
        subject: `${name} User Try To Contact Us.`,
        text: message,
        replyTo: email, // Correctly set user's email for replies
    };
  
    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ success: true, message: "Email sent successfully!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Email could not be sent." });
    }
  });
  

module.exports = mailAuthRouter;