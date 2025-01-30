const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://Nikhil:Nick%40102030@nicknode.qujbj.mongodb.net/"
    );
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    
  }
};

module.exports = connectDB;
