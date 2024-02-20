const regression = require('regression');

exports.predictNextMonthExpenses = (income, expenses, nextMonthIncome) => {
  // Parse income and expenses into integers
  const parsedIncome = income.map(x => parseInt(x||0, 10));
  const parsedExpenses = expenses.map(x => parseInt(x||0, 10));

  // Create inputData array with parsed data
  const inputData = parsedIncome.map((x, index) => [x, parsedExpenses[index]]);
  console.log(inputData);

  // Perform linear regression
  const result = regression.linear(inputData);
  const [slope, intercept] = result.equation;
  console.log("slope ", slope, "intercept ", intercept);

  // Calculate next month expenses
  const nextMonthExpenses = slope * nextMonthIncome + intercept;
  console.log("next month expense ",nextMonthExpenses);


  return nextMonthExpenses;
};
