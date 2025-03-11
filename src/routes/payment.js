const express = require("express");
const paymentRouter = express.Router();
const { authUser } = require("../middleware/authuser");
const instance = require("../utils/razorpay");
const Payment = require("../models/payment");
const membershipAmount = require("../utils/constant");
const User = require("../models/user");
const { sendEmail } = require("../utils/sendEmail");

paymentRouter.post("/payment/create", authUser, async (req, res) => {
  try {
    const { membershipType } = req.body;
    const { name, email } = req.user;
    const order = await instance.orders.create({
      amount: membershipAmount[membershipType] * 100,
      currency: "INR",
      receipt: `receipt#1 ${Date.now()}`,
      notes: {
        name,
        email,
        membershipType: membershipType,
      },
    });
    const payment = new Payment({
      userId: req.user._id,
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      notes: order.notes,
    });
    const savedPayment = await payment.save();

    res.json({ ...savedPayment.toJSON(), keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
paymentRouter.post("/payment/webhook", async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEB_HOOK_SECRET_KEY;
    const signature = req.headers["x-razorpay-signature"];
    const body = JSON.stringify(req.body);

    // Validate webhook signature
    const isValid = razorpay.validateWebhookSignature(body, signature, secret);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    // Extract payment data
    const paymentData = req.body.payload.payment.entity;
    const event = req.body.event;

    // Find and update payment in DB
    const payment = await Payment.findOne({ orderId: paymentData.order_id });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    payment.status = paymentData.status;
    await payment.save();

    // Find and update user based on payment
    const user = await User.findOne({ _id: payment.userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isPremium = true;
    user.membershipType = payment.notes.membershipType;
    await user.save();

    // Handle Payment Events
    if (event === "payment.captured") {
      // here i am currently sending a mail to the ns048019@gmail.com because we are in ses sandbox mode
      sendEmail(
        "ns048019@gmail.com",
        "Payment Status",
        `Hi ${user.name} your payment of Rs ${paymentData.amount} has been captured successfully`
      );
      //   console.log("✅ Payment Successful:", paymentData);
      // Additional success logic here , like sending success email to user
    } else if (event === "payment.failed") {
      sendEmail(
        "ns048019@gmail.com",
        "Payment Status",
        `Hi ${user.name} your payment of Rs ${paymentData.amount} has been failed due to some reason`
      );
      //   console.log("❌ Payment Failed:", paymentData.error_reason);
      // Additional failure logic here , like sending failure email to user
    }

    res.status(200).json({ status: "Webhook received" });
  } catch (error) {
    console.error("Webhook error:", error.message);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

module.exports = paymentRouter;
