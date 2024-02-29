const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const Category = require("../models/Category");
const User = require("../models/User");

const addCategory = asyncHandler(async (req, res) => {
  try {
    const { iconName, text, type } = req.body;
    const { user } = req;

    const newCategory = new Category({
      iconName,
      type,
      text,
      user: user._id,
    });
    await newCategory.save();

    // Update the user's category list
    if (type === "income") {
      user.categoryIncome.push(newCategory._id);
    } else if (type === "expense") {
      user.categoryExpense.push(newCategory._id);
    }
    await user.save();

    return res.status(200).json({ message: "Category Added" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to add category" });
  }
});
const getCategories = asyncHandler(async (req, res) => {
  try {
    const { type } = req.params;
    const { user } = req;

    let categories;

    if (type === "income") {
      categories = await Category.find({ _id: { $in: user.categoryIncome } });
      // Sort the categories based on their positions in the categoryIncome array
      categories = categories.sort((a, b) => {
        return (
          user.categoryIncome.indexOf(a._id) -
          user.categoryIncome.indexOf(b._id)
        );
      });
    } else if (type === "expense") {
      // Retrieve categories based on the user's categoryExpense array
      categories = await Category.find({ _id: { $in: user.categoryExpense } });
      // Sort the categories based on their positions in the categoryExpense array
      categories = categories.sort((a, b) => {
        return (
          user.categoryExpense.indexOf(a._id) -
          user.categoryExpense.indexOf(b._id)
        );
      });
    } else {
      return res.status(400).json({ error: "Invalid category type" });
    }

    res.status(200).json({ categories });
  } catch (error) {
    console.error("Error getting categories:", error);
    res.status(500).json({ error: "Error getting categories" });
  }
});

const updateCategoriesOrder = asyncHandler(async (req, res) => {
  try {
    const { categoryOrder, type } = req.body;
    const { user } = req;

    // Update the category order in the user document
    if (type === "income") {
      user.categoryIncome = categoryOrder;
    } else if (type === "expense") {
      user.categoryExpense = categoryOrder;
    }
    await user.save();

    return res
      .status(200)
      .json({ message: "Category order updated successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update category order" });
  }
});

module.exports = {
  addCategory,
  getCategories,
  updateCategoriesOrder,
};
