const categoryModel = require("../models/categoryModel")

const addCategory = (body) => {
    return new Promise(async (resolve, reject) => {
      try {
        let name = body.categoryName;
        let description = body.categoryDescription;
  
        let existingCategory = await categoryModel.findOne({
          categoryName: name,
        });
  
        if (existingCategory) {
          resolve({ status: false });
        } 
        else {
          const newcategory = new categoryModel({
            categoryName: name,
            description: description,
          });
          await newcategory.save();
          resolve({ status: true });
        }
      } catch (error) {
        console.error("Error adding category:", error);
        reject(error);
      }
    });
  };

  const getAllCategory = () => {
    return new Promise(async (resolve, reject) => {
      await categoryModel.find().then((result) => {
        resolve(result);
      });
    });
  };

  
  const softDeleteCategory = async (categoryId) => {
    try {
      let category = await categoryModel.findById(categoryId);
  
      if (!category) {
        throw new Error("Category not found");
      }
  
      // Toggle the status field
      category.status = !category.status;
  
      // Save the changes
      await category.save();
  
      // Resolve with the updated category
      return category;
    } catch (error) {
      console.error("Error soft deleting category:", error);
      throw error;
    }
  };

  
  

  module.exports = { addCategory, getAllCategory, softDeleteCategory };