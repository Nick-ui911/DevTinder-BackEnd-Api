const express = require("express");
const mongoose = require("mongoose");
const requestRouter = express.Router();
const { authUser } = require("../middleware/authuser");
const User = require("../models/user");
const ConnectionRequest = require("../models/connectionRequest");

requestRouter.post(
  "/request/send/:status/:toUserId",
  authUser,
  async (req, res) => {
    try {
      // console.log("Request Body:", req.user);
      // console.log("Request Params:", req.params);
      const fromUserId = req.user?._id;
      const toUserId = req.params.toUserId;
      const status = req.params.status;
      const allowedStatus = ["ignored", "interested"];

      // Validate status
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      // Validate toUserId
      if (!mongoose.Types.ObjectId.isValid(toUserId)) {
        return res.status(400).json({ error: "Invalid toUserId" });
      }

      // Check if toUser exists
      const toUser = await User.findById(toUserId);
      if (!toUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if connection request already exists
      const existingConnectionRequest = await ConnectionRequest.findOne({
        $or: [
          // iska mtlb hai ki khud ko nahi bhej skte request
          { fromUserId, toUserId },
          // iska mtlb hai ki agar tum bhej diye ho request toh woh nahi bhej skta request tumhe;
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });

      if (existingConnectionRequest) {
        return res
          .status(400)
          .json({ error: "Connection request already sent" });
      }

      // Create new connection request
      const connectionRequest = new ConnectionRequest({
        fromUserId,
        toUserId,
        status,
      });

      const data = await connectionRequest.save();
      res.json({
        message: "Connection request sent successfully",
        data,
      });
    } catch (error) {
      console.error("Error occurred:", error);
      res.status(500).json({ error: error.message || "Something went wrong" });
    }
  }
);

requestRouter.post(
  "/request/review/:status/:requestId",
  authUser,
  async (req, res) => {
    try {
      const loggedInUser = req.user;
      const { status, requestId } = req.params;
      const allowedStatus = ["accepted", "rejected"];
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const connectionRequest = await ConnectionRequest.findOne({
        _id: requestId,
        toUserId: loggedInUser._id,
        status: "interested",
      });
      if (!connectionRequest) {
        return res.status(404).json({ error: "Connection request not found" });
      }
      connectionRequest.status = status;
      const data = await connectionRequest.save();
      res.json({
        message: "Connection request reviewed successfully",
        data,
      });
    } catch (error) {
      res.status(400).send("ERROR : " + error.message);
    }
  }
);
requestRouter.delete("/user/unfollow/:userId", authUser, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const { userId } = req.params;

    // Check if the connection exists
    const connectionRequest = await ConnectionRequest.findOne({
      $or: [
        { fromUserId: loggedInUser._id, toUserId: userId, status: "accepted" },
        { fromUserId: userId, toUserId: loggedInUser._id, status: "accepted" },
      ],
    });

    if (!connectionRequest) {
      return res.status(404).json({ error: "No connection found to unfollow" });
    }

    // Remove the connection
    await ConnectionRequest.deleteOne({ _id: connectionRequest._id });

    res.json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
});

module.exports = requestRouter;
