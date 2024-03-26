const categoryModel = require("../../models/categoryModel");
const categoryHelper = require("../../helper/categoryHelper");

const loadCategory = (req, res) => {
    categoryHelper.getAllcategory().then((response) => {
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

const addCategory = async(req, res) => {
  
    await categoryHelper.addCategory(req.body).then((response) => {
      console.log("reached here")
       res.redirect("/admin/category")
       // res.json(response);
      });
}

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

 

// const changeCategoryStatus = async (req, res) => {
//     console.log("controller called")
//     const {id,status}= req.query
//     if(status==="listed"){
//         const category = await categoryModel.findByIdAndUpdate({_id: id}, {$set: {status:false}} );
//         res.json({listed:false,message:"Category status changed successfully"})

//     }else{

//         const category = await categoryModel.findByIdAndUpdate({_id: id}, {$set: {status:true}} );
//         res.json({listed:true,message:"Category status changed successfully"})

//     }
// }
    
     


module.exports = { category, addCategory, loadCategory, editCategoryLoad, editCategory};
