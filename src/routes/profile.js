const express = require("express");
const profileRouter = express.Router();
const { authUser } = require("../middleware/authuser");
const { validateEditData, ValidatePassword } = require("../utils/validation");
const bcrypt = require("bcrypt");
const User = require("../models/user");

profileRouter.get("/profile/view", authUser, async (req, res) => {
  try {
    const user = req.user;

    // Send user data
    return res.send(user);
  } catch (error) {
    console.error("Error:", error.message);

    // Handle unexpected errors
    return res.status(500).send("Internal server error");
  }
});
profileRouter.patch("/profile/edit", authUser, async (req, res) => {
  try {
    // Validate the request data
    validateEditData(req); // Call the function and pass the req object

    const user = req.user;

    // Update the user fields dynamically
    Object.keys(req.body).forEach((key) => {
      user[key] = req.body[key];
    });

    await user.save(); // Save changes to the database
    // always send response like that it is good practice
    res.json({
      message: "Profile edit completed successfully!",
      data: user,
    });

    console.log("Updated user:", user);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(400).send(`Error: ${error.message}`);
  }
});

profileRouter.patch("/profile/password", authUser, async (req, res) => {
  try {
    if (!req.body || !req.body.password) {
      return res.status(400).send("Password is required.");
    }

    const { password } = req.body;
    console.log("Received password:", password);  // Log the password received

    // Validate password
    ValidatePassword(password);

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = req.user; // This should now be defined

    if (!user) {
      return res.status(400).send("User not found.");
    }

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({
      message: "Password updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(400).send(`Error: ${error.message}`);
  }
});




module.exports = profileRouter;
