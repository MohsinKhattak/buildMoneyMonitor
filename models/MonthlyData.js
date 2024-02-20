const mongoose = require("mongoose");

const monthlyDataSchema = new mongoose.Schema({
  income: {
    type: Number,
    required: true,
  },
  expense: {
    type: Number,
    required: true,
  },
  balance:{
    type: Number,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const MonthlyData = mongoose.model("MonthlyData", monthlyDataSchema);

module.exports = MonthlyData;
