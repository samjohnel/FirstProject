const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminControllers/adminController")
const categoryController = require("../controllers/adminControllers/categoryController")

router.get("/", adminController.loadLogin);
router.get("/adminLogins", adminController.loadLogins);
router.post("/adminLogin", adminController.loginAdmin);
router.get("/userList", adminController.userList);
router.get("/category", categoryController.loadCategory);
router.post("/addCategory", categoryController.addCategory);
router.get("/editCategory", categoryController.editCategoryLoad);
router.put("/editCategory/:id", categoryController.editCategory);
router.post("/categorychange",categoryController.changeCategoryStatus);

module.exports = router;    