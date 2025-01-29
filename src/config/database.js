const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://Nikhil:@nicknode.qujbj.mongodb.net/"
    );
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    
  }
};

module.exports = connectDB;
