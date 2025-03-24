require("dotenv").config();
const nodemailer = require("nodemailer");
// Configure Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_PASS, // App Password (not your Gmail password)
    },
  });
  
module.exports =  transporter ;