const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const userAuth= require("../middleware/userAuth")


router.get("/login", userAuth.islogin ,userController.userLogin);
router.post("/login", userController.loginPost);
router.post("/signUp", userController.otpRedirect);
router.get("/signUp", userController.getUserSignUp);
router.post("/signUp", userController.registerPost)
router.get("/otpPage", userController.getOtpPage);
router.post("/otpPage", userController.otpPost);
router.post("/verifyCredentials", userController.verifyCredentials);
router.get("/userHome",userAuth.isAuthenticated ,userController.userHome);
router.get("/logout", userController.logout);

module.exports = router;
