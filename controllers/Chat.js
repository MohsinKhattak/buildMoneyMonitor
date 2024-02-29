const axios = require("axios");
const Transaction = require("../models/Transaction");
const asyncHandler = require("express-async-handler");
const OpenAI = require("openai");
const fs = require("fs").promises;
const Chat = require("../models/Chat");

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});
function getYesterdayDate() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, "0");
  const day = String(yesterday.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

async function fetchTransactionData(userId) {
  console.log("inside Transactions");
  return Transaction.find({ user: userId }).sort({ createdAt: -1 }).lean();
}

async function getDataSet(transactions) {
  let dataset = [];
  let totalIncome = 0;
  let totalExpenses = 0;
  if (transactions.length > 0) {
    transactions.forEach((trans) => {
      if (trans.typeOfTransaction === "income") {
        totalIncome += parseFloat(trans.amount);
      } else {
        totalExpenses += parseFloat(trans.amount);
      }

      // Add a question for each transaction
      dataset.push({
        prompt: `What was the total ${trans.description} ${trans.typeOfTransaction} amount on ${trans.date}, ${trans.day}?`,
        completion: `The total amount of ${trans.typeOfTransaction} for ${trans.description} on ${trans.date}, ${trans.day} was ${trans.amount}.`,
      });
    });

    dataset.push({
      prompt: `What is the total amount of income till ${
        transactions[transactions.length - 1].date
      }?`,
      completion: `The total amount of income is ${totalIncome} till ${
        transactions[transactions.length - 1].date
      }.`,
    });

    dataset.push({
      prompt: `What is the total amount of expenses till ${
        transactions[transactions.length - 1].date
      }?`,
      completion: `The total amount of expenses is ${totalExpenses} till ${
        transactions[transactions.length - 1].date
      }.`,
    });

    dataset.push({
      prompt: `What is the net balance till ${
        transactions[transactions.length - 1].date
      }?`,
      completion: `The net balance till ${
        transactions[transactions.length - 1].date
      } is ${(totalIncome - totalExpenses).toFixed(2)}.`,
    });
    const yesterdayExpenses = transactions
      .filter(
        (trans) =>
          trans.date === getYesterdayDate() &&
          trans.typeOfTransaction === "expense"
      )
      .reduce((acc, trans) => acc + parseFloat(trans.amount), 0);

    dataset.push({
      prompt: `What was the total amount spent yesterday?`,
      completion: `The total amount spent yesterday was ${yesterdayExpenses}.`,
    });

    const yesterdayIncome = transactions
      .filter(
        (trans) =>
          trans.date === getYesterdayDate() &&
          trans.typeOfTransaction === "income"
      )
      .reduce((acc, trans) => acc + parseFloat(trans.amount), 0);

    dataset.push({
      prompt: `What was the total income yesterday?`,
      completion: `The total income yesterday was ${yesterdayIncome}.`,
    });

    console.log("first : ", dataset[0]);
    console.log("last : ", dataset[dataset.length - 1]);
    console.log("total length : ", dataset.length);

    const datasetString = dataset
      .map(
        (item) => `prompt: ${item.prompt}\n completion: ${item.completion}\n`
      )
      .join("\n");
    try {
      const filename = `dataset_${transactions[0].user}.txt`;
      await fs.writeFile(filename.toString(), datasetString);
      console.log("Dataset saved to", filename);
      return filename;
    } catch (err) {
      console.error("Error saving dataset:", err);
    }
  } else {
    return [];
  }
}

const updatingAssistant = async (user) => {
  let filename = "";

  try {
    console.log("Inside update assistant", user);
    const transactions = await fetchTransactionData(user._id);
    if (transactions.length === 0 || transactions === null) {
      return;
    }
    filename = await getDataSet(transactions); // Assign filename value
    console.log("----------------THE FILE NAME--------------", filename);
    const file = await openai.files.create({
      file: require("fs").createReadStream(filename),
      purpose: "assistants",
    });

    console.log("FILE: ", file);
    const assistant = await openai.beta.assistants.update(user.assistantId, {
      file_ids: [file.id],
    });

    console.log("Updated ASSISTANT : ", assistant);
  } catch (error) {
    console.error("Error updating assistant:", error);
    throw error;
  } finally {
    try {
      if (filename) {
        await fs.unlink(filename);
        console.log("File deleted successfully");
      }
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  }
};

const renewChatIfNeeded = async (user) => {
  console.log("inside renew user ", user.lastChatRenewal);
  const today = new Date();
  const sixHoursInMillis = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
  console.log(today - user.lastChatRenewal >= sixHoursInMillis);
  if (
    !user.lastChatRenewal ||
    today - user.lastChatRenewal >= sixHoursInMillis
  ) {
    await renewChat(user);
    user.lastChatRenewal = today;
    await user.save();
  }
};

const renewChat = async (user) => {
  try {
    if (user.chatbotThread) {
      await openai.beta.threads.del(user.chatbotThread);
    }
    const thread = await openai.beta.threads.create();
    user.chatbotThread = thread.id;
    user.lastChatRenewal = new Date();
    await user.save();
    console.log("Created thread: ", thread);
    const response = await updatingAssistant(user);
    console.log(response);
  } catch (error) {
    console.log("Error while creating assistant: ", error);
    res.status(500).json({ error: "Error while creating assistant" });
  }
};

const addMessage = asyncHandler(async (req, res) => {
  try {
    const { user } = req;
    await renewChatIfNeeded(user);
    const threadId = user.chatbotThread;
    const assistantId = user.assistantId;
    const { userMessage } = req.body;
    console.log(userMessage, user);
    const messages = {
      role: "user",
      content: userMessage,
    };

    const messageResponse = await openai.beta.threads.messages.create(
      threadId,
      messages
    );
    console.log("message created", messageResponse);

    const run = await openai.beta.threads.runs.create(
      messageResponse.thread_id,
      {
        assistant_id: assistantId,
        instructions: `You are a helpful finance manager who helps ${user.name} manage his/her finances.
        /nPlease note: If user asks question related to his income expense details tell the answer from data file uploaded. /n
        if the question is not related to budget finance money or saving then reply that 
        you are a finance manger who cannot tell such answers only.
        also Please address the user with name: ${user.name} and dont return the source of the answer 
        /nThe unit of currency for ${user.name} is ${user.currency} 
        `,
      }
    );

    console.log("this is run ,", run);
    let runStatus = await openai.beta.threads.runs.retrieve(
      messageResponse.thread_id,
      run.id
    );

    while (runStatus.status !== "completed") {
      console.log(runStatus);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(
        messageResponse.thread_id,
        run.id
      );
      if (["failed", "cancelled", "expired"].includes(runStatus.status)) {
        console.error("Request cant complete : ", runStatus.status);
        res.status(400).json({ success: false });
      }
    }
    if (user.messageCount === undefined || user.messageCount <= 3) {
      user.messageCount = (user.messageCount || 0) + 1; // Corrected parentheses
      await user.save();
    }
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in addMessage:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

const getChat = asyncHandler(async (req, res) => {
  console.log("--------------inside get chats----------------------");
  try {
    const { user } = req;
    const thread_id = user.chatbotThread;
    console.log(user);
    const allMessages = await openai.beta.threads.messages.list(thread_id);

    const extractedData = allMessages.data
      .map((message) => {
        return {
          id: message.id,
          role: message.role,
          content: message.content[0].text.value,
          created_at: message.created_at,
        };
      })
      .filter(Boolean);
    extractedData.sort((a, b) => a.created_at - b.created_at);
    res.status(200).json({ extractedData });
  } catch (error) {
    console.log("Error fetching messages", error);
  }
});

const addMessageWithoutAssistant = asyncHandler(async (req, res) => {
  try {
    const { user } = req;
    const { userMessage } = req.body;
    console.log(userMessage);
    console.log(
      user.currency +
        "------------------------------User Currency -----------------------"
    );
    const messages = [
      {
        role: "system",
        content: `You are a helpful finance manager who helps ${user.name} manage his finances. 
        /nPlease note if the question is not related to budget finance money or saving then reply that you are a finance manger who cannot tell such answers only
        /nalso Please address the user with name: ${user.name}  and dont return the source of the answer 
        /nThe unit of currency for ${user.name} is ${user.currency}
        /nHere is question: `,
      },
      {
        role: "user",
        content: userMessage,
      },
    ];

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: 0,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPEN_AI_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const generatedText = response.data.choices[0].message.content;
    const chat = new Chat({
      message: userMessage,
      answer: generatedText,
      user: user._id,
    });
    await chat.save();
    if (user.messageCount === undefined || user.messageCount <= 3) {
      user.messageCount = (user.messageCount || 0) + 1;
      await user.save();
    }
    res.status(201).json({ success: true, answer: generatedText });
  } catch (error) {
    console.error("Error in addMessage:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

const getChatWithoutAssistant = asyncHandler(async (req, res) => {
  try {
    console.log("--------------inside get chats----------------------");
    const { user } = req;
    const currentDate = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const chats = await Chat.find({
      user: user._id,
      timestamp: { $gte: oneMonthAgo, $lte: currentDate },
    }).sort({ timestamp: "asc" });

    res.status(200).json({ chats: chats });
  } catch (error) {
    console.error("Error in getChat:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = {
  addMessage,
  getChat,
  renewChat,
  addMessageWithoutAssistant,
  getChatWithoutAssistant,
};
