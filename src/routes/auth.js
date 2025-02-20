const express = require("express");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const { validateData } = require("../utils/validation");
const authRouter = express.Router();

authRouter.post("/signup", async (req, res) => {
  try {
    validateData(req);
    const { name, email,age, password, gender, PhotoUrl,skills } = req.body;
    const hashPassword = await bcrypt.hash(password, 10);
    console.log(hashPassword);

    // create a new instance of user model
    const user = new User({
      name,
      password: hashPassword,
      email,
      age,
      gender,
      PhotoUrl,
      skills,
    });

   const savedUser =  await user.save(); // Save the user to the database

      // Generate a JWT token
      const token = await savedUser.getJWT(); // Removed unnecessary `await` as `getJWT()` is synchronous
      // console.log(token);
      // Set the cookie with the token
      res.cookie("token", token, { 
        expires: new Date(Date.now() + 8 * 3600000), // 8 hours expiration
      });
    res.json({
      message: "User created successfully",
      data: savedUser
    });
  } catch (error) {
    console.error("Error saving user:", error.message);
    res.status(500).send("Failed to save user data.");
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).send("Email and password are required");
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Compare the provided password with the hashed password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).send("Invalid email or password");
    }

    // Generate a JWT token
    const token = await user.getJWT(); // Removed unnecessary `await` as `getJWT()` is synchronous
    // console.log(token);
    // Set the cookie with the token
    res.cookie("token", token, { 
      expires: new Date(Date.now() + 8 * 3600000), // 8 hours expiration
    });

    // Successful login
    return res.status(200).send(user);
  } catch (error) {
    console.error("Error during login:", error.message);

    // Handle unexpected errors
    return res.status(500).send("Internal server error");
  }
});
authRouter.post("/logout",async(req,res)=>{
    res.cookie("token",null,{ expires: new Date(Date.now())});
    res.send("Logout succesfull")
})

module.exports = authRouter;
