require("dotenv").config(); // Load environment variables
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const authUser = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json("You must be logged in to access this.");
    }

    // Verify token using secret key from .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by email
    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      return res.status(404).json("User not found.");
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Error:", error.message);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json("Token has expired. Please log in again.");
    }
    return res.status(401).json("Invalid token.");
  }
};

module.exports = { authUser };
