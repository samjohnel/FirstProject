const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");


router.get("/login", userController.userLogin);
router.post("/signUp", userController.otpRedirect);
router.get("/signUp", userController.getUserSignUp);
router.post("/signUp", userController.registerPost)
router.get("/otpPage", userController.getOtpPage);
router.post("/otpPage", userController.otpPost);

module.exports = router;
