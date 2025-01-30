const express = require("express");
const connectDB = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require('cors')
const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use(express.json());
app.use(cookieParser());

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");

app.use("/",authRouter);
app.use("/",profileRouter);
app.use("/",requestRouter);
app.use("/",userRouter);



// Connect to the database and start the server
connectDB()
  .then(() => {
    console.log("Database is connected");
    app.listen(9000, () => {
      console.log("Server is running on port 9000");
    });
  })
  .catch((err) => {
    console.error("Cannot connect to the database:", err.message);
  });
