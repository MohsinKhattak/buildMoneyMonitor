const cron = require("node-cron");
const ExpensePrediction = require("../models/ExpensePrediction");
const Transaction = require("../models/Transaction");
const MonthlyData = require("../models/MonthlyData");

const User = require("../models/User");

const {
  predictNextMonthExpenses,
} = require("../predictExpense/predictExpense");
const ExpensePredictionJob = cron.schedule("0 0 1 * *", async () => {
  try {
    console.log("////////////////starting JOb///////////////////////////");

    const users = await User.find();

    for (const user of users) {
      // Get the date of the last month
      const currentDate = new Date();
      const lastMonthDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      );

      console.log("This is the current Date    ", currentDate);
      console.log("This is the last month Date    ", lastMonthDate);

      console.log("***************ONE USER***********************");
      console.log(user);
      console.log("***************ONE USER***********************");
      // Find all transactions within the last month for the current user
      const lastMonthTransactions = await Transaction.find({
        user: user._id,
        createdAt: { $gte: lastMonthDate, $lt: currentDate },
      });
      if (
        Array.isArray(lastMonthTransactions) &&
        lastMonthTransactions.length
      ) {
        console.log(
          "***************last Month Transactions***********************"
        );
        console.log(lastMonthTransactions);
        console.log(
          "***************last Month Transactions***********************"
        );

        // Calculate income and expense for the last month
        let lastMonthIncome = 0;
        let lastMonthExpense = 0;
        lastMonthTransactions.forEach((transaction) => {
          if (transaction.typeOfTransaction === "income") {
            lastMonthIncome += transaction.amount;
          } else {
            lastMonthExpense += transaction.amount;
          }
        });

        console.log(
          "??????????????????????????",
          lastMonthIncome,
          lastMonthExpense
        );

        // Predict the expense for the next month
        const nextMonthIncome = lastMonthIncome - lastMonthExpense;
        console.log(nextMonthIncome);

        const monthlyData = new MonthlyData({
          expense: lastMonthExpense,
          income: lastMonthIncome,
          balance: nextMonthIncome,
          user: user._id,
        });

        await monthlyData.save();

        const lastMonthsData = await MonthlyData.find({ user: user._id }).sort({
          timestamp: -1,
        });
        const incomes = [];
        const expenses = [];

        lastMonthsData.forEach((data) => {
          incomes.push(data.income);
          expenses.push(data.expense);
        });

        console.log("income", incomes)
        console.log("expense", expenses)

        const nextMonthExpense = predictNextMonthExpenses(
            incomes,
          expenses,
          nextMonthIncome
        );

        console.log("this is next monthIncome : ", nextMonthExpense);

        // Save the predicted expense to the database
        const newPrediction = new ExpensePrediction({
          predictedExprense: nextMonthExpense,
          user: user._id,
        });
        await newPrediction.save();
        console.log("------------------------------------------------");

        console.log("new prediction : ", newPrediction);
        console.log("------------------------------------------------");
      }
    }

    console.log("Expense prediction job completed successfully");
  } catch (error) {
    console.error("Error in expense prediction job:", error);
  }
});

module.exports = ExpensePredictionJob;
