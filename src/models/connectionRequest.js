const mongoose = require("mongoose");

const connectionRequestSchema = new mongoose.Schema(
    {
        fromUserId: {
            type: mongoose.Schema.Types.ObjectId,
            // this is for creating a reference or relation with user collection ,to know who is sending the request
            ref:"User",
            required: true,
        },
        toUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref:"User",
            required: true,
        },
        status: {
            type: String,
            required: true,
            enum: {
                values: ["pending", "accepted", "rejected", "interested"],
                message: `{VALUE} is an incorrect status type`,
            },
        },
    },
    { timestamps: true }
);


connectionRequestSchema.index({fromUserId: 1,toUserId: 1});
// Pre-save hook to prevent self-connection
connectionRequestSchema.pre("save", function (next) {
    const connectionRequest = this;

    if (connectionRequest.fromUserId.equals(connectionRequest.toUserId)) {
        return next(new Error("You can't send a connection request to yourself"));
    }

    next();
});

const ConnectionRequest = mongoose.model(
    "ConnectionRequest",
    connectionRequestSchema
);

module.exports = ConnectionRequest;
