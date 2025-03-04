const { SendEmailCommand } = require("@aws-sdk/client-ses");
const sesClient = require("./sesClient");

// Function to send an email using SESClient
const sendEmail = async (to, subject, message) => {
  try {
    const params = {
      Source: process.env.SENDER_EMAIL, // Must be a verified email in AWS SES
      Destination: {
        ToAddresses: [to], // Recipient email
      },
      Message: {
        Subject: { Data: subject },
        Body: {
          Text: { Data: message }, // Email text content
        },
      },
    };

    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);

    console.log("Email sent successfully:", response);
    return { success: true, message: "Email sent successfully!" };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, message: error.message };
  }
};

module.exports = { sendEmail };
