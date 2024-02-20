const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const ExpensePredictionJob = require("./jobsScheduling/ExpensePredictionJob");

dotenv.config();
const app = express();
app.use(cors());

const userRouter = require("./routes/User");
const transactionRouter = require("./routes/transaction");
const chatRouter = require("./routes/chat");
const predictRouter = require("./routes/expensePrediction");
const paymentRouter = require("./routes/payment");
const categoryRouter = require("./routes/Category");
//middlewares
app.use(express.json());
app.use(cookieParser());

app.use("/users", userRouter);
app.use("/transaction", transactionRouter);
app.use("/chat", chatRouter);
app.use("/predict", predictRouter);
app.use("/payments", paymentRouter);
app.use("/category", categoryRouter);

const mongoURL = process.env.MONGODB_URL;

mongoose
  .connect(mongoURL)
  .then((res) => {
    console.log("connection success");
    const port = process.env.PORT || 5000;

    app.listen(port, () => {
      console.log(`server listening on ${port}`);
    });
  })
  .catch((err) => {
    console.log("connection error", err);
  });
