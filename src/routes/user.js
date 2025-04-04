const express = require("express");
const userRouter = express.Router();
const { authUser } = require("../middleware/authuser");
const User = require("../models/user");
const ConnectionRequest = require("../models/connectionRequest");

userRouter.get("/user/requests", authUser, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const connectionRequests = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: "interested",
    }).populate("fromUserId", ["name", "gender", "PhotoUrl", "skills"]);
    res.json({
      message: "Data fetched Successfully",
      data: connectionRequests,
    });
  } catch (error) {
    res.status(400).send("ERROR: " + error.message);
  }
});

userRouter.get("/user/connections", authUser, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const connections = await ConnectionRequest.find({
      $or: [
        { toUserId: loggedInUser._id, status: "accepted" },
        { fromUserId: loggedInUser._id, status: "accepted" },
      ],
    })
      .populate("fromUserId", ["_id", "name", "gender", "PhotoUrl", "skills"])
      .populate("toUserId", ["_id", "name", "gender", "PhotoUrl", "skills"]);
    // This ensures that only the other connected user's details are returned and not return own details.
    // if i do not this it will return both user's details for every connection.
    const data = connections.map((row) => {
      if (row.fromUserId._id.toString() === loggedInUser._id.toString()) {
        return row.toUserId;
      }
      return row.fromUserId;
    });
    res.json({
      message: "Data fetched Successfully",
      data,
    });
  } catch (error) {
    res.status(400).send("Error :" + error.message);
  }
});
userRouter.get("/feed", authUser, async (req, res) => {
  try {
    const loggedInUser = req.user;
    // query parameters.
    // const page = parseInt(req.query.page) || 1; // Default page is 1
    // const limit = parseInt(req.query.limit) || 10; // Default limit is 10
    // const skip = (page - 1) * limit;
    const connections = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
    }).select("fromUserId toUserId");

    const hideUserSFromFeed = new Set();
    connections.forEach((req) => {
      hideUserSFromFeed.add(req.fromUserId._id.toString());
      hideUserSFromFeed.add(req.toUserId._id.toString());
    });
    const users = await User.find({
      $and: [
        { _id: { $nin: Array.from(hideUserSFromFeed) } },
        { _id: { $ne: loggedInUser._id } },
      ],
    }).select([
      "name",
      "gender",
      "age",
      "PhotoUrl",
      "skills",
      "description",
      "location",
    ]);
    // .skip(skip)
    // .limit(limit);
    res.json({ data: users });
  } catch (error) {
    res.status(400).send("Error : " + error.message);
  }
});

// for firebase cloud messaging

userRouter.post("/update-fcm-token", authUser, async (req, res) => {
  const { userId, fcmToken } = req.body;

  try {
    await User.findByIdAndUpdate(userId, { fcmToken });
    res.json({ success: true, message: "FCM token updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update token" });
  }
});

module.exports = userRouter;
