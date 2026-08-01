import crypto from "crypto";
import Razorpay from "razorpay";
import { db } from "../config/firebase.js";

export const TOPUP_PACKAGES = Object.freeze({
  pack_10: {
    id: "pack_10",
    amountInr: 10,
    creditAmount: 200000,
    label: "Starter",
  },
  pack_20: {
    id: "pack_20",
    amountInr: 20,
    creditAmount: 450000,
    label: "Growth",
  },
  pack_50: {
    id: "pack_50",
    amountInr: 50,
    creditAmount: 1000000,
    label: "Pro",
  },
  pack_100: {
    id: "pack_100",
    amountInr: 100,
    creditAmount: 2500000,
    label: "Elite",
  },
});

const getRazorpay = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw { status: 500, message: "Razorpay keys are not configured" };
  }

  return new Razorpay({ key_id, key_secret });
};

export const listTopupPackages = () => Object.values(TOPUP_PACKAGES);

export const createTopupOrder = async ({ userId, userEmail, packageId }) => {
  const pack = TOPUP_PACKAGES[packageId];
  if (!pack) {
    throw { status: 400, message: "Invalid top-up package" };
  }

  const razorpay = getRazorpay();
  const amountPaise = pack.amountInr * 100;

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: `topup_${userId.slice(0, 8)}_${Date.now()}`.slice(0, 40),
    notes: {
      userId,
      userEmail: userEmail || "",
      packageId: pack.id,
      creditAmount: String(pack.creditAmount),
      type: "wallet_topup",
    },
  });

  await db.collection("payments").doc(order.id).set({
    razorpayOrderId: order.id,
    razorpayPaymentId: null,
    userId,
    userEmail: userEmail || "",
    packageId: pack.id,
    packageLabel: pack.label,
    amountInr: pack.amountInr,
    creditAmount: pack.creditAmount,
    currency: "INR",
    paymentStatus: "created",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    keyId: process.env.RAZORPAY_KEY_ID,
    order: {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    },
    package: pack,
  };
};

export const verifyTopupPayment = async ({
  userId,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw { status: 400, message: "Missing payment verification fields" };
  }

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expected !== razorpay_signature) {
    throw { status: 400, message: "Invalid payment signature" };
  }

  const paymentRef = db.collection("payments").doc(razorpay_order_id);
  const paymentDoc = await paymentRef.get();

  if (!paymentDoc.exists) {
    throw { status: 404, message: "Payment order not found" };
  }

  const payment = paymentDoc.data();

  if (payment.userId !== userId) {
    throw { status: 403, message: "Payment does not belong to this user" };
  }

  if (payment.paymentStatus === "success") {
    const userDoc = await db.collection("users").doc(userId).get();
    return {
      alreadyProcessed: true,
      balance: userDoc.data()?.balance ?? 0,
      creditAmount: payment.creditAmount,
      amountInr: payment.amountInr,
    };
  }

  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw { status: 404, message: "User not found" };
  }

  const currentBalance = Number(userDoc.data()?.balance || 0);
  const creditAmount = Number(payment.creditAmount || 0);
  const updatedBalance = Number((currentBalance + creditAmount).toFixed(2));

  await userRef.update({
    balance: updatedBalance,
  });

  await paymentRef.update({
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
    paymentStatus: "success",
    balanceBefore: currentBalance,
    balanceAfter: updatedBalance,
    purchasedAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    alreadyProcessed: false,
    balance: updatedBalance,
    creditAmount,
    amountInr: payment.amountInr,
    packageId: payment.packageId,
  };
};
