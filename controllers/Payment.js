const asyncHandler = require("express-async-handler");
const stripe = require("stripe")(
  "sk_test_51N2zfiBHAK3VyaqU5ttPNGD74utWUd4p3RoiSm2Jz8bu4wsRW1xSGHswuJWCMueQhnGbNbnMETQvUEj7sPwlqCR600iuHJVcNR"
);

const createCheckoutSession = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (!amount) {
    return res
      .status(400)
      .json({ success: false, message: "Amount is required" });
  }
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
    });

    res.status(200).json(paymentIntent);
  } catch (error) {
    console.error("Stripe payment intent creation error:", error);
    res.status(500).json({ paymentIntent: null, error: "Server error" });
  }
});

module.exports = { createCheckoutSession };
