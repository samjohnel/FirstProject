const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminControllers/adminController")
const authContoller = require("../controllers/adminControllers/authController");
const adminAuth = require("../middleware/adminAuth");
const categoryController = require("../controllers/adminControllers/categoryController")
const productController = require("../controllers/adminControllers/productController")
const orderController = require("../controllers/adminControllers/orderController")
const couponController = require("../controllers/adminControllers/couponController");
const productHelper = require("../helper/productHelper");
const offerController = require("../controllers/adminControllers/offerController");
const multer = require("../middleware/multer");
const sharp = require("../middleware/sharp");

router.get("/", adminAuth.isLogin, authContoller.adminLoginLoad);
router.get("/adminhome", authContoller.adminHome);
router.post("/", authContoller.adminLoginPost);
router.get("/logout", adminAuth.isLogout, authContoller.adminLogout)
router.get("/userList", adminAuth.isLogout, adminController.userList);
router.patch("/blockUnblockUser/:id", adminAuth.isLogout, adminController.blockUnblockUser);
router.get("/category", adminAuth.isLogout, categoryController.loadCategory);
router.post("/addCategory", adminAuth.isLogout, categoryController.addCategory);
router.get("/editCategory", adminAuth.isLogout, categoryController.editCategoryLoad);
router.put("/editCategory/:id", adminAuth.isLogout, categoryController.editCategory);
router.patch("/deleteCategory/:id", adminAuth.isLogout, categoryController.deleteCategory);
router.get("/productList", adminAuth.isLogout, productController.productListLoad);
router.get("/addProduct", adminAuth.isLogout, productController.addProductLoad);

router.get("/orders", adminAuth.isLogout, orderController.adminOrderPageLoad);

router.get("/orderDetails/:id", adminAuth.isLogout, orderController.adminOrderDetails);

router.patch("/orderStatusChangeForEachProduct/:orderId/:productId", adminAuth.isLogout,
    orderController.changeOrderStatusOfEachProduct
);

router.post('/addproduct', multer.productUpload.array("images"), adminAuth.isLogout, productController.addProductPost);

router.get("/editProduct/:id", adminAuth.isLogout, productController.editProductLoad);

router.put("/editProduct/:id", adminAuth.isLogout, multer.productUpload.array("images"), productHelper.editProductPost);

router.patch("/deleteproduct/:id", adminAuth.isLogout, productController.deleteProduct);

router.get("/coupons", adminAuth.isLogout, couponController.couponListLoad);

router.post("/addCoupon", adminAuth.isLogout, couponController.addCoupon);

router.get(
    "/editCoupon/:id",
    adminAuth.isLogout,
    couponController.getEditCoupon
);

router.post("/editCoupon", couponController.editCoupon);

router.delete("/deleteCoupon/:id", couponController.deleteCoupon);

router.get("/salesReport", adminAuth.isLogout, orderController.loadSalesReport);

router.post("/salesReport", orderController.loadSalesReportDateSort);

router.get(
    "/categoryOffers",
    adminAuth.isLogout,
    offerController.categoryOfferLoad
);

router.post("/categoryAddOffer", offerController.addCategoryOffer);

router.get("/categoryEditOffer/:id", adminAuth.isLogout, offerController.categoryEditLoad);

router.post("/categoryEditOffer", offerController.categoryEditOffer);

router.patch('/deleteCategoryOffer/:id', adminAuth.isLogout, offerController.deleteCategoryOffer);

router.get("/dashboard", adminAuth.isLogout, adminController.loadDashboard);

router.post("/showChart", adminController.showChart)

module.exports = router;    