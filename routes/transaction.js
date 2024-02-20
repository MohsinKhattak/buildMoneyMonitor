const express = require("express");
const router = express.Router();
const { authorize } = require("../middlewares/authorization");
const {getDateAndDay} = require("../middlewares/getDateAndDay");
const {addTransaction, getExpense, getIncome, getAllTransactions , getOneTransaction, editTransaction,deleteTransaction, getPercentagesAccordingCategory, getExportData} = require("../controllers/Transaction")

// router.get("/", authorize, getUserDetails);
router.post('/add', authorize, getDateAndDay, addTransaction)
router.get('/totalExpense', authorize, getExpense)
router.get('/totalIncome', authorize, getIncome)
router.get('/getAllTransactions/:month/:year', authorize, getAllTransactions)
router.get('/getCategoryPercentages/:type/:month/:year', authorize, getPercentagesAccordingCategory)
router.get('/one/:transactionId/', authorize, getOneTransaction)
router.patch('/:transactionId', authorize, editTransaction)
router.delete('/:transactionId', authorize, deleteTransaction)
router.post('/getExportData', authorize, getExportData)


module.exports = router;
