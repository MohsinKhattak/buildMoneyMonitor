const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const asyncHandler = require("express-async-handler");

const addTransaction = asyncHandler(async (req, res) => {
  try {
    const { typeOfTransaction, description, amount, category } = req.body;
    const { date, day, user } = req;

    if (!typeOfTransaction || !description || !amount || !category) {
      return res
        .status(400)
        .json({ error: "Type, description, and amount are required fields" });
    }

    const newTransaction = new Transaction({
      typeOfTransaction,
      description,
      category,
      amount,
      date,
      day,
      user: user._id,
    });
    await newTransaction.save();

    user.lastChatRenewal = new Date(); 
    await user.save();

    res.status(201).json({
      message: "Transaction added successfully",
      transaction: newTransaction,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
const getExpense = asyncHandler(async (req, res) => {
  try {
    const { user } = req;
    const expenseSum = await Transaction.aggregate([
      {
        $match: {
          user: user._id,
          typeOfTransaction: "expense",
        },
      },
      {
        $group: {
          _id: null,
          totalExpense: { $sum: "$amount" },
        },
      },
    ]);
    const totalExpense = expenseSum.length > 0 ? expenseSum[0].totalExpense : 0;

    res.status(200).json(totalExpense);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const getIncome = asyncHandler(async (req, res) => {
  try {
    const { user } = req;
    const incomeSum = await Transaction.aggregate([
      {
        $match: {
          user: user._id,
          typeOfTransaction: "income",
        },
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: "$amount" },
        },
      },
    ]);

    // Check if there is any result
    const totalIncome = incomeSum.length > 0 ? incomeSum[0].totalIncome : 0;

    res.status(200).json(totalIncome);
  } catch (error) {
    console.error("Error fetching income data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const getAllTransactions = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    // Extract and parse the year and month parameters from the URL
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    console.log("getting all transactions for a specific month", month, year);

    // Validate year and month
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: "Invalid year or month" });
    }

    // Create a new Date object with the specified year and month
    const startDate = new Date(year, month - 1, 1);
    const nextMonthDate = new Date(year, month, 1);
    const endDate = new Date(
      nextMonthDate.getFullYear(),
      nextMonthDate.getMonth(),
      1
    );

    console.log("start date:", startDate, "end date:", endDate);

    const transactions = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            date: "$date",
            day: "$day",
          },
          transactions: {
            $push: {
              _id: "$_id",
              typeOfTransaction: "$typeOfTransaction",
              description: "$description",
              category: "$category",
              amount: "$amount",
            },
          },
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ["$typeOfTransaction", "income"] }, "$amount", 0],
            },
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ["$typeOfTransaction", "expense"] }, "$amount", 0],
            },
          },
        },
      },
      {
        $sort: {
          "_id.date": -1,
        },
      },
    ]);

    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const getOneTransaction = asyncHandler(async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId);

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Check if the user has permission to access this transaction
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const editTransaction = asyncHandler(async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { typeOfTransaction, description, category, amount } = req.body;
    console.log("inside edit for amount", amount);

    if (!typeOfTransaction || !description || !category || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Update transaction fields
    transaction.typeOfTransaction = typeOfTransaction;
    transaction.description = description;
    transaction.category = category;
    transaction.amount = amount;

    // Save updated transaction
    await transaction.save();

    res.json({ message: "Transaction updated successfully", transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const getPercentagesAccordingCategory = asyncHandler(async (req, res) => {
  const { month, year, type } = req.params;
  const userId = req.user._id;

  try {
    // Get transactions for the specified month, year, and type for the logged-in user
    const startDate = new Date(year, month - 1, 1);
    const nextMonthDate = new Date(year, month, 1);
    const endDate = new Date(
      nextMonthDate.getFullYear(),
      nextMonthDate.getMonth(),
      1
    );

    const transactions = await Transaction.find({
      user: userId,
      typeOfTransaction: type,
      createdAt: { $gte: startDate, $lt: endDate },
    });

    // Group transactions by description and calculate total amount for each description
    const groupedTransactions = transactions.reduce((acc, curr) => {
      acc[curr.description] = acc[curr.description] || {
        amount: 0,
        category: curr.category,
        typeOfTransaction: curr.typeOfTransaction,
      };
      acc[curr.description].amount += curr.amount;
      return acc;
    }, {});

    // Calculate total amount for the month
    const totalAmount = transactions.reduce(
      (acc, curr) => acc + curr.amount,
      0
    );

    // Calculate percentages for each description and round off to two decimal places
    const percentages = [];
    for (const desc in groupedTransactions) {
      console.log(groupedTransactions[desc]);
      const { amount, category, typeOfTransaction } = groupedTransactions[desc];
      const percentageValue = parseFloat(
        ((amount / totalAmount) * 100).toFixed(1)
      );
      percentages.push({
        value: percentageValue,
        label: desc,
        amount: amount,
        category: category,
        typeOfTransaction: typeOfTransaction,
      });
    }

    res.status(200).json({ percentages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

const deleteTransaction = asyncHandler(async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transaction.findById(transactionId);
    console.log("inside delete transaction", transactionId);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    await Transaction.deleteOne({ _id: transactionId });
    res.status(200).json({ message: "transaction deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});
const getExportData = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const { user } = req;
    const startDateObj = new Date(startDate);
    startDateObj.setDate(startDateObj.getDate() - 1);

    const transactions = await Transaction.find({
      user: user._id,
      createdAt: { $gte: startDateObj, $lte: endDate },
    });
    if (transactions.length === 0) {
      return res
        .status(404)
        .json({
          message: "No transactions found within the specified date range",
        });
    }

    // Prepare data for CSV conversion
    const csvData = transactions.map((transaction, index) => [
      index + 1,
      transaction.date,
      transaction.day,
      transaction.typeOfTransaction,
      transaction.description,
      transaction.amount,
    ]);

    // Add header row
    csvData.unshift(["No", "Date", "Day", "Type", "Category", "Amount"]);

    // Send CSV content as response
    res.status(200).json(csvData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = {
  addTransaction,
  getExpense,
  getIncome,
  getAllTransactions,
  getOneTransaction,
  editTransaction,
  getPercentagesAccordingCategory,
  deleteTransaction,
  getExportData,
};
