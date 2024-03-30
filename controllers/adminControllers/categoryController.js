const categoryModel = require("../../models/categoryModel");
const categoryHelper = require("../../helper/categoryHelper");

const loadCategory = (req, res) => {
    categoryHelper.getAllCategory().then((response) => {
      const message = req.flash("message");
      res.render("category", { categories: response, message: message });
    });
  };

const category = async(req, res) => {
    try {
        const categoryList = await categoryModel.find();
        res.render("category", { categories:categoryList });
        
    } catch (error) {
        console.log(error);
    }
}

const addCategory = async (req, res) => {
  try {
    const result = await categoryHelper.addCategory(req.body);
    req.flash('success', 'Category added successfully');
    res.redirect("/admin/category");
  } catch (error) {
    console.error("Error adding category:", error);
    req.flash('error', 'Category name and description are required');
    res.redirect("/admin/category");
  }
};




const editCategoryLoad = async (req, res) => {
  console.log("helloos");
    const catId = req.query.catId;
    const catDetails = await categoryModel.findById({ _id: catId });
    console.log(catDetails);
    res.render("editCategory", { details: catDetails });
  };

const editCategory = async (req, res) => {
    console.log(req.body);
    const check = await categoryModel.findOne({
      categoryName: req.body.categoryName,
    });
    
  console.log(check);
    const checks = await categoryModel.findOne({ _id: req.params.id });
  
    if (!check) {
      checks.categoryName = req.body.categoryName;
      checks.description = req.body.categoryDescription;
      await checks.save();
  
      res.redirect("/admin/category");
    } else if (req.params.id === check._id) {
      check.categoryName = req.body.categoryName;
      check.description = req.body.categoryDescription;
     
      await check.save();
  
      res.redirect("/admin/category");
    } else {
      req.flash("message", "Category already Exists");
      console.log("Hi");
      res.redirect("/admin/category");
    }
  };

 

  const deleteCategory = async (req, res) => {
    const categoryId = req.params.id;
    console.log(categoryId);
    await categoryHelper.softDeleteCategory(categoryId).then((response) => {
      if (response.status) {
        res.json({ error: false, message: "Category is listed", listed: true });
      } else {
        res.json({
          error: false,
          message: "Category is Unlisted",
          listed: false,
        });
      }
    });
  };
    
     


module.exports = { category, addCategory, loadCategory, editCategoryLoad, editCategory, deleteCategory };
