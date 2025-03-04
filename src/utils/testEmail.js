const sendEmail = require("./sendEmail");

sendEmail("nbaghel392@gmail.com", "Hello from AWS SES!", "Hi Nikhil, this is a test email from AWS SES.")
  .then((response) => console.log(response))
  .catch((err) => console.error(err));
