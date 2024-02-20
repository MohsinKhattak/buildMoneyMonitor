const express = require("express");
const router = express.Router();
const { authorize } = require("../middlewares/authorization");

const { createCheckoutSession } = require("../controllers/Payment");

router.post("/intent", authorize, createCheckoutSession);

module.exports = router;
