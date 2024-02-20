const express = require("express");
const router = express.Router();
const { authorize } = require("../middlewares/authorization");
const { addMessage, getChat,renewChat, addMessageWithoutAssistant, getChatWithoutAssistant } = require("../controllers/Chat");

// router.get('/renewChat', authorize, renewChat )
router.get('/getChatWithoutAssistant', authorize, getChatWithoutAssistant )
router.post('/addMessageWithoutAssistant', authorize, addMessageWithoutAssistant )
router.post('/addMessage', authorize, addMessage )
router.get('/',authorize, getChat );

module.exports = router;
