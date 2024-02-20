const express = require("express");
const router = express.Router();
const { authorize } = require("../middlewares/authorization");
const {predict, getLatestPrediction} = require("../controllers/ExpensePrediction")

router.post('/:userId', predict )
router.get("/", authorize, getLatestPrediction)


module.exports = router;
