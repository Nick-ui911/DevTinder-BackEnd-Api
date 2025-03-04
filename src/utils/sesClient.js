require("dotenv").config();
const { SESClient } = require("@aws-sdk/client-ses");

// Configure AWS SES Client
const sesClient = new SESClient({
  region: "ap-south-1", // Directly setting the region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

module.exports = sesClient;