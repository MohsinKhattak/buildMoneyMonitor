const mongoose = require("mongoose");

const expensePrediction = new mongoose.Schema({
  predictedExprense:{ type: Number, required: true },
  user: { type: mongoose.Schema.Types.ObjectId },
  timestamp: { type: Date, default: Date.now },
});

const ExpensePrediction = mongoose.model("ExpensePrediction", expensePrediction);

module.exports = ExpensePrediction;