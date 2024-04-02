const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminControllers/adminController")
const authContoller = require("../controllers/adminControllers/authController");
const adminAuth = require("../middleware/adminAuth");
const categoryController = require("../controllers/adminControllers/categoryController")
const productController = require("../controllers/adminControllers/productController")
const multer = require("../middleware/multer");
const sharp = require("../middleware/sharp");

router.get("/", adminAuth.isLogin, authContoller.adminLoginLoad);
// router.get("/adminLogins", adminController.loadLogins);
router.post("/", authContoller.adminLoginPost);
router.get("/logout", adminAuth.isLogout, authContoller.adminLogout)
router.get("/userList", adminController.userList);
router.patch("/blockUnblockUser/:id", adminController.blockUnblockUser);
router.get("/category", categoryController.loadCategory);
router.post("/addCategory", categoryController.addCategory);
router.get("/editCategory", categoryController.editCategoryLoad);
router.put("/editCategory/:id", categoryController.editCategory);
router.patch("/deleteCategory/:id",categoryController.deleteCategory);
router.get("/productList", productController.productListLoad);
router.get("/addProduct", productController.addProductLoad);
router.post("/addProduct", multer.productUpload.array("images"), sharp.resizeImages, productController.addProductPost);
router.get("/editProduct/:id", productController.editProductLoad);
router.put("/editProduct/:id",multer.productUpload.array("images"),sharp.resizeImages,productController.editProductPost);
router.patch("/deleteproduct/:id", productController.deleteProduct);


  
  

module.exports = router;    