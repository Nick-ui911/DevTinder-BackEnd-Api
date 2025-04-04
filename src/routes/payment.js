const express = require("express");
const paymentRouter = express.Router();
const { authUser } = require("../middleware/authuser");
const instance = require("../utils/razorpay");
const Payment = require("../models/payment");
const membershipAmount = require("../utils/constant");
const User = require("../models/user");
const { sendEmail } = require("../utils/sendEmail");
const Razorpay = require("razorpay");
const transporter = require("../utils/nodeMailerConfig");

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
    console.error("Payment creation error:", error);

    res.status(500).json({ message: error.message });
  }
});

paymentRouter.post("/payment/webhook", async (req, res) => {
  try {
    // console.log("📌 Webhook received at:", new Date().toISOString());

    const secret = process.env.RAZORPAY_WEB_HOOK_SECRET_KEY;
    const signature = req.get("x-razorpay-signature");
    const body = JSON.stringify(req.body);

    // console.log("📌 Webhook Body:", body);
    // console.log("📌 Received Signature:", signature);

    // Validate webhook signature
    const isValid = Razorpay.validateWebhookSignature(body, signature, secret);
    // console.log("📌 Signature Valid:", isValid);

    if (!isValid) {
      // console.error("❌ Invalid webhook signature");
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    // Extract payment data
    const paymentData = req.body.payload.payment.entity;
    const event = req.body.event;

    // console.log("📌 Payment Data:", paymentData);
    // console.log("📌 Event:", event);

    // Find and update payment in DB
    const payment = await Payment.findOne({ orderId: paymentData.order_id });

    if (!payment) {
      console.error("❌ Payment not found for orderId:", paymentData.order_id);
      return res.status(404).json({ message: "Payment not found" });
    }

    // console.log("📌 Payment Found:", payment);

    payment.status = paymentData.status;
    await payment.save();
    // console.log("📌 Payment Status Updated:", payment.status);

    // Find and update user based on payment
    const user = await User.findOne({ _id: payment.userId });

    if (!user) {
      console.error("❌ User not found for userId:", payment.userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("📌 User Found:", user);

    user.isPremium = true;
    user.membershipType = payment.notes.membershipType;
    await user.save();
    // console.log("📌 User Premium Updated:", user.isPremium);

    const mailOptions = {
      from: process.env.EMAIL_ADMIN, // Always send from your own email
      to: user.email, // User's email
      subject: "Payment Confirmation - Thank You for Your Purchase!",
      text: `Dear ${user.name},
    
    We are pleased to inform you that we have successfully received your payment for the **${payment.notes.membershipType}** membership.
    
    Thank you for choosing our service! Your premium benefits are now active. If you have any questions, feel free to reach out to our support team.
    
    Best regards,  
    DevTinder Team`,
    };

    // Handle Payment Events
    if (event === "payment.captured") {
      await transporter.sendMail(mailOptions);
      // console.log("✅ Payment Captured:", paymentData.amount);

      //  sending mail using aws ses
      // await sendEmail(
      //   "ns048019@gmail.com",
      //   "Payment Status",
      //   `Hi ${user.name}, your payment of Rs ${
      //     paymentData.amount / 100
      //   } has been captured successfully`
      // );
    } else if (event === "payment.failed") {
      console.log("❌ Payment Failed:", paymentData.amount);
      await sendEmail(
        "ns048019@gmail.com",
        "Payment Status",
        `Hi ${user.name}, your payment of Rs ${
          paymentData.amount / 100
        } has failed`
      );
    }

    res.status(200).json({ status: "Webhook received" });
  } catch (error) {
    console.error("🚨 Webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});
paymentRouter.get("/premium/verify", authUser, async (req, res) => {
  try {
    const user = req.user;
    if (user.isPremium) {
      res.json({ isPremium: true, membershipType: user.membershipType });
    } else {
      res.json({ isPremium: false });
    }
  } catch (error) {
    console.error("🚨 Error:", error);
    res.status(500).json({ error: "Failed to verify premium status" });
  }
});

module.exports = paymentRouter;
