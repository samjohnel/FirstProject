const express = require("express");
const router = express.Router();
const userController = require("../controllers/userControllers/userController");
const productController = require("../controllers/userControllers/productControllers");
const orderController = require("../controllers/userControllers/orderController");
const userMiddleware = require("../middleware/userMiddleware");
const userAuth= require("../middleware/userAuth");


router.get("/login", userAuth.islogin ,userController.userLogin);
router.post("/login", userController.loginPost);


router.get("/signUp", userController.getUserSignUp);
router.post("/signUp", userController.registerPost);
router.post("/signUp", userController.otpRedirect);
router.get("/otpPage", userController.getOtpPage);
router.post("/otpPage", userController.otpPost);
router.post("/verifyCredentials", userController.verifyCredentials);


router.get("/logout", userController.logout);


router.get("/userHome",userAuth.isAuthenticated ,userController.userHome);
router.get("/accountView", userController.accountView);
router.patch("/addAddress", userController.addAddress);
router.get("/addressEditor/:userId/:addressId",userController.addressEditModal);
router.put("/editAddress/:id",userController.editAddress);
router.put('/deleteAddress/:id',userController.deleteAddress);
router.put("/updateUser",userController.updateUser);//update user details
router.get("/userShop",userMiddleware.isLogout,userController.loadShop);
router.get('/detailProductPage/:id',userMiddleware.isLogout,userController.LoadUserProduct);
router.get("/cart",userAuth.isLogout, userController.userCartLoad);
router.post("/addToCart/:id/:size", userController.addToCart);
router.patch("/updateCartQuantity", userController.updateCartQuantity);
router.delete("/removeCart/:id", userController.removeCartItem);
router.get("/checkout", userController.checkoutPage);
router.get("/addressEditor/:userId/:addressId",userController.addressEditModal);
router.post("/placeOrder", orderController.placeOrder);
router.get("/orderSuccessPage",userMiddleware.isLogout,orderController.orderSuccessPageLoad);
router.get("/orderDetails/:id",orderController.orderDetails);

module.exports = router;
