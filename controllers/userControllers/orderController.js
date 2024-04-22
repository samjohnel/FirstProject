const user = require("../../models/userModel");
const cartModel = require('../../models/cartModel');
const productModel = require('../../models/productModel');
const cartHelper = require('../../helper/cartHelper');
const orderHelper = require("../../helper/orderHelper")
const moment = require("moment");


const placeOrder = async (req, res) => {
    const body = req.body;
    const userId = req.session.user;
  
    const result = await orderHelper.placeOrder(body, userId);
    if (result.status) {
      const cart = await cartHelper.clearAllCartItems(userId);
      if (cart) {
        res.json({ url: "/orderSuccessPage", status: true });
      }
    } else {
      res.json({ message: result.message, status: false })
    }
  };
  
  const orderSuccessPageLoad = (req, res) => {
    res.render("orderSuccessPage");
  };
  
  const orderDetails = async (req, res) => {
    try {
      const orderId = req.params.id;
      const userData = await user.findById({ _id: req.session.user })
      const orderDetails = await orderHelper.getSingleOrderDetails(orderId);
      const productDetails = await orderHelper.getOrderDetailsOfEachProduct(
        orderId
      );
    
      console.log("productDetails is", productDetails)
  
  
      if (orderDetails && productDetails) {
        res.render("orderDetails", {
          userData,
          orderDetails,
          productDetails
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  module.exports = {
    placeOrder,
    orderSuccessPageLoad,
    orderDetails,
  }