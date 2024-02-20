const mongoose = require("mongoose");
const ExpensePrediction = require("../models/ExpensePrediction");
const asyncHandler = require("express-async-handler");
const {
  predictNextMonthExpenses,
} = require("../predictExpense/predictExpense");

const predict = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { incomeData, expenseData } = req.body;
    console.log("/predict body : ", incomeData, expenseData);

    const nextMonthIncome =
      parseInt(incomeData[incomeData.length - 1] || 0) -
      parseInt(expenseData[expenseData.length - 1] || 0);
    const nextMonthExpense = await predictNextMonthExpenses(
      incomeData,
      expenseData,
      nextMonthIncome
    );
    console.log("99999999999999999999999    ", nextMonthIncome);
    const newPrediction = new ExpensePrediction({
      predictedExprense: nextMonthExpense,
      user: userId,
    });

    await newPrediction.save();
    console.log("new predictions: ", newPrediction);

    return res
      .status(200)
      .json({ message: "Data Successfully predicted, Login to check." });
  } catch (error) {
    console.error("Error predicting expenses:", error);
    return res
      .status(500)
      .json({ message: "Error predicting expenses, please try again later." });
  }
});

const getLatestPrediction = asyncHandler(async (req, res) => {
  try {
    const { user } = req;
    const predictionData = await ExpensePrediction.find({ user: user._id })
      .sort({ timestamp: -1 })
      .limit(1);

      console.log(predictionData[0])

    res.status(200).json({ prediction: predictionData[0].predictedExprense || 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
module.exports = {
  predict,
  getLatestPrediction,
};
