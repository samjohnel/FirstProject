const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController")

router.get("/adminLogin", adminController.loadLogin);
router.get("/adminLogins", adminController.loadLogins);
router.post("/adminLogin", adminController.loginAdmin);
router.get("/userList", adminController.userList);
router.get("/category", adminController.category);

module.exports = router;    