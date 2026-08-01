import {
  createTopupOrder,
  listTopupPackages,
  verifyTopupPayment,
} from "../services/payment.service.js";

export const getPackages = async (_req, res) => {
  try {
    return res.json({
      success: true,
      data: listTopupPackages(),
    });
  } catch (err) {
    console.error("GET PACKAGES ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load packages",
    });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { packageId } = req.body;
    const { userId, email } = req.user;

    if (!packageId) {
      return res.status(400).json({
        success: false,
        message: "packageId is required",
      });
    }

    const data = await createTopupOrder({
      userId,
      userEmail: email,
      packageId,
    });

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to create payment order",
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { userId } = req.user;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const data = await verifyTopupPayment({
      userId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    return res.json({
      success: true,
      message: data.alreadyProcessed
        ? "Payment already processed"
        : "Payment verified and balance updated",
      data,
    });
  } catch (err) {
    console.error("VERIFY PAYMENT ERROR:", err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Payment verification failed",
    });
  }
};
