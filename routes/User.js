const express = require("express");
const router = express.Router();
const { authorize } = require("../middlewares/authorization");
const {
  registerUser,
  resetPassword,
  loginUser,
  forgotPassword,
  editUserDetails,
  getUserDetails,
  paidAccount,
  getMessageCount,
  getPaidStatus,
  verifyAccount,
} = require("../controllers/User");

router.route("/signup").post(registerUser);
router.post("/login", loginUser);
router.patch("/edit", authorize, editUserDetails);
router.patch("/paid", authorize, paidAccount);
router.get("/paid", authorize, getPaidStatus);
router.get("/messageCount", authorize, getMessageCount);
router.get("/", authorize, getUserDetails);
router.post("/password/forgot", forgotPassword);
router.patch("/password/reset", resetPassword);
router.patch("/verify", verifyAccount);

module.exports = router;
