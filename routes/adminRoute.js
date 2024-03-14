const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController")

router.get("/adminLogin", adminController.loadLogin);

module.exports = router;