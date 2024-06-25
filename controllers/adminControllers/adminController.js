const admin = require("../../models/adminModel");
const users = require("../../models/userModel");
const orderModel = require("../../models/orderModel");
const productModel = require("../../models/productModel");
const categoryModel = require("../../models/categoryModel");


const userList = async (req, res) => {
    try {
        const userList = await users.find();
// res.send('userlist')
    res.render("usersList", { users:userList });
    } catch (error) {
        console.log(error);     
    }
}

const blockUnblockUser = async (req, res) => {
    const id = req.params.id;
    const result = await users.findOne({_id: id})
    result.isActive = !result.isActive;
    result.save();
    if (!result.isActive) {
        delete req.session.user;
    }
    let message = result.isActive ? "User unblocked" : "User blocked";
    res.json({ message: message });
}

const loadDashboard = async(req,res)=>{
    try {
      
      const salesDetails = await orderModel.find();
  
     
      const products = await productModel.find();
      const categories = await categoryModel.find();
  
     
      const topSellingProducts = await orderModel.aggregate([
        { $unwind: "$products" },
        {
          $group: {
            _id: "$products.product",
            totalQuantity: { $sum: "$products.quantity" },
          },
        }, 
        { $sort: { totalQuantity: -1 } }, 
        { $limit: 10 }, 
      ]);
  
      
      const productIds = topSellingProducts.map((product) => product._id);
  
      
     
      const productsData = await productModel.find(
        { _id: { $in: productIds } },
        { productName: 1, image: 1 }
      );
  
      
      const topSellingCategories = await orderModel.aggregate([
        { $unwind: "$products" }, 
        {
          $lookup: {
            from: "products",
            localField: "products.product",
            foreignField: "_id",
            as: "product",
          },
        }, 
        { $unwind: "$product" },
        {
          $lookup: {
            from: "categories",
            localField: "product.productCategory",
            foreignField: "_id",
            as: "category",
          },
        }, 
        
        { $unwind: "$category" }, 
        {
          $group: {
            _id: "$category._id",
            totalQuantity: { $sum: "$products.quantity" },
          },
        },
        { $sort: { totalQuantity: -1 } }, 
        { $limit: 10 },
      ]);
  
    
      const topSellingCategoriesData = await categoryModel.find({
        _id: { $in: topSellingCategories.map((cat) => cat._id) },
      });

      
  
      res.render("dashboard", {
        salesDetails: salesDetails,
        products: products,
        categories: categories,
        productsData: productsData,
        topSellingCategories: topSellingCategoriesData,
        topSellingProducts: topSellingProducts,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }

  const showChart = async (req, res) => {
 
    try {
        console.log("Getting in")
     
      if (req.query.msg) {
        console.log("Getting in 2")
      
       
        const monthlySalesData = await orderModel.aggregate([
          {
            $match: { "products.status": "delivered" }, 
          },
          {
            $group: {
              _id: { $month: "$orderedOn" },
              totalAmount: { $sum: "$totalAmount" }, 
            },
          },
          {
            $sort: { _id: 1 },
          },
        ]);
        
  
        
        const dailySalesData = await orderModel.aggregate([
          {
            $match: { "products.status": "delivered" }, 
          },
          {
            $group: {
              _id: { $dayOfMonth: "$orderedOn" }, 
              totalAmount: { $sum: "$totalAmount" },
            },
          },
          {
            $sort: { _id: 1 },
          },
        ]);
        console.log("daily",dailySalesData);
  
        const orderStatuses = await orderModel.aggregate([
          {
            $unwind: "$products", 
          },
          {
            $group: {
              _id: "$products.status", 
              count: { $sum: 1 }, 
            },
          },
        ]);
        console.log("order",orderStatuses);
  
       
        const eachOrderStatusCount = {};
        orderStatuses.forEach((status) => {
          eachOrderStatusCount[status._id] = status.count;
        });
        
        console.log("monthlySalesData", monthlySalesData);
        console.log("dailySalesData", dailySalesData);
        console.log("eachOrderStatusCount", eachOrderStatusCount);
  
        res
          .status(200)
          .json({ monthlySalesData, dailySalesData, eachOrderStatusCount });
      }
     
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal server error" });
    }
  };




module.exports = {
    userList, blockUnblockUser,
    loadDashboard,
    showChart,
}


                    