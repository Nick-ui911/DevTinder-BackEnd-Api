const express = require("express");
const connectDB = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();
const corsOptions = {
  origin: "http://localhost:5173", // Specify frontend origin
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true, // Allow credentials (cookies/tokens)
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));



app.use(cors(corsOptions));
 
app.use(express.json());
app.use(cookieParser());

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.get("/test-cors", cors(corsOptions), (req, res) => {
  res.json({ message: "CORS is working!" });
});


// Connect to the database and start the server
connectDB()
  .then(() => {
    console.log("Database is connected");
    app.listen(3300, () => {
      console.log("Server is running on port 3300");
    });
  })
  .catch((err) => {
    console.error("Cannot connect to the database:", err.message);
  });
