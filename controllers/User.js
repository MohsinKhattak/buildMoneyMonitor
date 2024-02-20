const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../configurations/generateToken");
const asyncHandler = require("express-async-handler");
const OpenAI = require("openai");
const fs = require("fs").promises;
const crypto = require("crypto");
const { sendEmail } = require("../configurations/sendEmail");

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  console.log(req.body);
  if (!name || !email || !password) {
    res.status(400).json({ message: "Fields not defined correctly" });
    throw new Error("Fields not defined correctly");
  }

  const userAlreadyExists = await User.findOne({ email });

  if (userAlreadyExists) {
    res.status(409).json({ message: "User already exists" });
    throw new Error("User already exists");
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = new User({
    name: name,
    email: email.trim(),
    password: hashedPassword,
  });

  const response = createNewAssistant(newUser);
  if ((await response).success) {
    res.status(201).json({
      message: "Verification code send to your email.",
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
    });
  } else {
    await User.deleteOne({ email: newUser.email });
    res.status(400).json({
      message: "Error try again later.",
    });
  }
});

const createNewAssistant = async (user) => {
  try {
    // Create assistant
    const assistant = await openai.beta.assistants.create({
      name: "Finance Manager",
      instructions: `You are a helpful finance manager who helps ${user.name} manage his finances`,
      tools: [{ type: "retrieval" }],
      model: "gpt-4-turbo-preview",
    });
    user.assistantId = assistant.id;
    console.log("created assistant: ", assistant);
    const otp = generateVerificationCode();
    user.verificationOtp = otp;
    await user.save();
    if (user) {
      await sendEmail(
        user.email,
        "MoneyManager.ai Verification Email Verification Code",
        otp,
        "code"
      );
    }
    return { success: true };
  } catch (error) {
    console.error("Error creating new assistant:", error);
    return { success: false };
  }
};

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.trim() });
  console.log("Here");
  console.log(req.body);
  console.log(user);
  if (user.verified === false) {
    res.status(404).json({ message: "Not verified sign in again." });
  }

  if (user) {
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    console.log("check pass correct ? ", isPasswordCorrect);
    if (isPasswordCorrect) {
      const token = generateToken(user._id);
      res.status(200).json({
        message: "logged in successful",
        _id: user._id,
        name: user.name,
        email: user.email,
        token: token,
      });
    } else {
      res.status(400).json({ message: "Please check your credentials" });
    }
  } else {
    res
      .status(404)
      .json({ message: "User not found, Please create account to login" });
  }
});

const editUserDetails = asyncHandler(async (req, res) => {
  const { user } = req;
  const userId = user._id;
  console.log("In patch ", user);
  const editedUserDetails = await User.findByIdAndUpdate(
    { _id: userId },
    { ...req.body },
    { new: true, projection: "-password" }
  );
  res.status(202).json(editedUserDetails);
});

const getUserDetails = asyncHandler(async (req, res) => {
  const { user } = req;
  console.log(user);
  res.status(200).json(user);
});

function generateVerificationCode() {
  const codeLength = 6;
  const excludeChars = ["0", "O", "o"]; // Characters to exclude
  let verificationCode = "";

  while (verificationCode.length < codeLength) {
    const buffer = crypto.randomBytes(1);
    const char = buffer.toString("hex").toUpperCase()[0];

    if (!excludeChars.includes(char)) {
      verificationCode += char;
    }
  }

  console.log("Verification code:", verificationCode);
  return verificationCode;
}
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    const token = generateVerificationCode();
    user.resetToken = token;
    user.resetTokenExpiration = Date.now() + 3600000;
    await user.save();
    await sendEmail(
      email,
      "Verification Code For MoneyManager.ai",
      token,
      "code"
    );
    res.status(200).json({ success: true });
  } else {
    res
      .status(404)
      .json({ message: "There is some problem. Please try again." });
    throw new Error("Forgot Password:user not found");
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, verificationCode, newPassword } = req.body;
  console.log(email, verificationCode, newPassword);
  try {
    const user = await User.findOne({ email });
    console.log("its user token", user);
    if (!user || user.resetToken !== verificationCode) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid verification code." });
    }

    if (user.resetTokenExpiration < new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "Token has expired." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = "";
    user.resetTokenExpiration = null;
    await user.save();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
});

const paidAccount = asyncHandler(async (req, res) => {
  try {
    const { user } = req;
    const { accountType } = req.body;
    user.paid = true;
    user.accountType = accountType;
    await user.save();
    res.status(200).json({ message: "Account successfully updated to paid." });
  } catch (error) {
    console.error("Error updating paid account:", error);
    res.status(500).json({ message: "Error updating paid account." });
  }
});

const getMessageCount = asyncHandler(async (req, res) => {
  try {
    const { user } = req;
    console.log("getting message count");
    res.status(200).json({ count: user.messageCount || 0 });
  } catch (error) {
    console.error("Error getting message count:", error);
    res.status(500).json({ message: "Error getting message count." });
  }
});

const getPaidStatus = asyncHandler(async (req, res) => {
  try {
    const { user } = req;
    res.status(200).json({
      paid: user.paid || false,
      accountType: user.accountType || "free",
    });
  } catch (error) {
    console.error("Error getting Account status for payment:", error);
    res
      .status(500)
      .json({ message: "Error getting Account status for payment." });
  }
});

const verifyAccount = asyncHandler(async (req, res) => {
  console.log("In verify ", req.body);
  const { email, otp } = req.body;
  const user = await User.find({ email: email });

  if (!user[0]) {
    return res.status(400).send({ message: "user not found" });
  }
  console.log("This is from user", user);
  if (otp != user[0].verificationOtp) {
    await User.deleteOne({ email: email });
    return res
      .status(400)
      .send({ message: "Wrong verification code, Sign in Again." });
  }
  const response = await User.findByIdAndUpdate(user[0]._id, {
    verified: true,
  });
  res.status(200).send({ response, message: "Email verified successfully" });
});

module.exports = {
  loginUser,
  resetPassword,
  forgotPassword,
  registerUser,
  editUserDetails,
  getUserDetails,
  paidAccount,
  getMessageCount,
  getPaidStatus,
  verifyAccount,
};
