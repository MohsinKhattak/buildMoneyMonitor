const mongoose = require("mongoose");
const {
  defaultExpenseCategories,
  defaultIncomeCategories,
} = require("../categories/defaultCategories");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String },
    chatbotThread: { type: String },
    assistantId: { type: String },
    paid: { type: Boolean, default: false },
    messageCount: { type: Number, default: 0 },
    categoryIncome: {
      type: [{ type: String }],
      default: defaultIncomeCategories,
    },
    categoryExpense: {
      type: [{ type: String }],
      default: defaultExpenseCategories,
    },
    lastChatRenewal: {
      type: Date,
      default: () => new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours in milliseconds
    },
    accountType: {
      type: String,
      enum: ["free", "pro", "ultimate"],
      required: true,
      default: "free",
    },
    resetToken: { type: String },
    resetTokenExpiration: { type: Date },
    verified: { type: Boolean, default: false },
    verificationOtp: { type: String },
    currency: { type: String, default: "USD" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema, "Users");
