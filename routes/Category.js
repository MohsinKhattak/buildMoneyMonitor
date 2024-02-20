const express = require("express");
const router = express.Router();
const { authorize } = require("../middlewares/authorization");
const { addCategory, getCategories , updateCategoriesOrder} = require("../controllers/Category");

router.post("/addCategory", authorize,addCategory);
router.patch("/updateOrder", authorize, updateCategoriesOrder);
router.get("/getCategories/:type", authorize, getCategories);

module.exports = router;
