const mongoose = require("mongoose");

const category = new mongoose.Schema({
  iconName: { type: String, required: true },
  type: { type: String, enum: ["income", "expense"], required: true },
  text: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId },
  timestamp: { type: Date, default: Date.now },
});

const Category = mongoose.model("Category", category);

module.exports = Category;
