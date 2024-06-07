const express = require("express");
const router = express.Router();
const userController = require("../controllers/userControllers/userController");
const productController = require("../controllers/userControllers/productControllers");
const orderController = require("../controllers/userControllers/orderController");
const wishlistController = require("../controllers/userControllers/wishlistController");
const couponController = require("../controllers/adminControllers/couponController");
const userMiddleware = require("../middleware/userMiddleware");
const userAuth= require("../middleware/userAuth");


router.get("/login", userAuth.islogin ,userController.userLogin);
router.post("/login", userController.loginPost);


router.get("/signUp", userController.getUserSignUp);//This is fine
router.post("/signUp", userController.registerPost, userController.otpRedirect);

// router.post("/signUp", );
router.get("/otpPage", userController.getOtpPage);
router.post("/otpPage", userController.otpPost);
router.get("/resendOtp", userController.resendOtpRedirect);
router.post("/verifyCredentials", userController.verifyCredentials);


router.get("/logout", userController.logout);


router.get("/userHome",userAuth.isAuthenticated ,userController.userHome);
router.get("/accountView", userMiddleware.isLogout, userController.accountView);
router.get("/getOrderData", userMiddleware.isLogout, userController.getOrderData);
router.get("/getOrderData", userMiddleware.isLogout, userController.accountView);
router.post("/addAddress", userMiddleware.isLogout, userController.addAddress);
router.get("/addressEditor/:userId/:addressId", userMiddleware.isLogout, userController.addressEditModal);
router.put("/editAddress/:id", userMiddleware.isLogout, userController.editAddress);
router.put('/deleteAddress/:id', userMiddleware.isLogout, userController.deleteAddress);
router.put("/updateUser", userMiddleware.isLogout, userController.updateUser);//update user details
router.put('/updatePassword',userMiddleware.isLogout,userController.updatePassword)
router.get("/userShop", userMiddleware.isLogout, userController.loadShop);
router.get('/detailProductPage/:id',userMiddleware.isLogout,userController.LoadUserProduct);
router.get("/cart", userMiddleware.isLogout, userController.userCartLoad);
router.post("/addToCart/:id/:size", userMiddleware.isLogout, userController.addToCart);
router.patch("/updateCartQuantity", userController.updateCartQuantity);
router.delete("/removeCart/:id/:size", userMiddleware.isLogout, userController.removeCartItem);
router.get("/checkout", userMiddleware.isLogout, userController.checkoutPage);
router.get("/addressEditor/:userId/:addressId",userMiddleware.isLogout, userController.addressEditModal);
router.post("/placeOrder", userMiddleware.isLogout, orderController.placeOrder);
router.get("/orderSuccessPage",userMiddleware.isLogout,orderController.orderSuccessPageLoad);
router.get("/orderDetails/:id", userMiddleware.isLogout, orderController.orderDetails);
router.patch("/cancelSingleOrder", userMiddleware.isLogout, orderController.cancelSingleOrder);
router.post("/searchProduct",userMiddleware.isLogout, productController.searchProduct);
router.get("/shopFilter", userMiddleware.isLogout, userController.shopFilterLoad);
router.get("/wishlist",userMiddleware.isLogout,wishlistController.wishlistLoad);
router.post("/addToWishlist/:id",userMiddleware.isLogout, wishlistController.addToWishlist);
router.put("/removeFromWishlist", wishlistController.removeFromWishlist);
router.post("/createOrder", userMiddleware.isLogout, orderController.createOrder);
router.post('/paymentSuccess', userMiddleware.isLogout, orderController.paymentSuccess);
router.get("/orderFailure", userMiddleware.isLogout, orderController.orderFailedPageLoad);
router.post("/applyCoupon", userMiddleware.isLogout, couponController.applyCoupon);
router.post('/removeCoupon', userMiddleware.isLogout, couponController.removeCoupon);
router.patch("/returnSingleOrder", userMiddleware.isLogout, orderController.returnSingleOrder);



module.exports = router;
