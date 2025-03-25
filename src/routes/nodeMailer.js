const express = require("express");
const mailAuthRouter = express.Router();
const transporter = require("../utils/nodeMailerConfig");

mailAuthRouter.post("/send-email", async (req, res) => {
  const { name, email, message } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_ADMIN, // Always send from your own email
    to: process.env.EMAIL_SUPPORT, // Your receiving email
    subject: `User Try To Contact Us.`,
    text: `${name} have this issue : ${message} and email: ${email}`,
  };
  const mailOptions2 = {
    from: process.env.EMAIL_ADMIN, // Always send from your own email
    to: email, // Your receiving email
    subject: `User Try To Contact Us.`,
    text: `We have received your message and we will contact you soon, And Try to Solve Problem as soon as possible`,
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
