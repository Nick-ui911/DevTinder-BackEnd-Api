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

    // console.log("Updated user:", user);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(400).send(`Error: ${error.message}`);
  }
});

profileRouter.patch("/profile/password", authUser, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Both old and new passwords are required." });
    }

    const user = req.user; // Retrieved from auth middleware
    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    // Compare old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect." });
    }

    // Validate new password
    ValidatePassword(newPassword);

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(400).json({ message: `Error: ${error.message}` });
  }
});

// profileRouter.js
profileRouter.patch("/createPassword", authUser, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required." });
    }

    const user = await User.findById(req.user._id); // req.user from auth middleware

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // 👉 Check if password already exists
    if (user.password) {
      return res.status(400).json({
        message: "Password is already created. Please update it instead.",
      });
    }

    ValidatePassword(password); // Assuming this is your custom password validator

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password created successfully." });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message || "Server error." });
  }
});

module.exports = profileRouter;
