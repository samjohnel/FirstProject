const user = require("../../models/userModel");
const cartModel = require('../../models/cartModel');
const productModel = require('../../models/productModel');
const cartHelper = require('../../helper/cartHelper');
const orderHelper = require("../../helper/orderHelper");
const couponModel = require("../../models/couponModel");
const moment = require("moment");
const Razorpay = require("razorpay");
require('dotenv').config();


var razorpay = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});


const placeOrder = async (req, res) => {
  try {
    const { couponCode, ...body } = req.body;
    const userId = req.session.user;

    let coupon = { discount: 0 };

    if (couponCode) {
      const foundCoupon = await couponModel.findOne({ code: couponCode });
      if (foundCoupon) {
        coupon = foundCoupon;
      }
    }


    const result = await orderHelper.placeOrder(body, userId, coupon.discount);

    if (result.status) {
      if (coupon && coupon.code) { 
        coupon.usedBy.push(userId);
        await coupon.save();
      }

      const cart = await cartHelper.clearAllCartItems(userId);
      if (cart) {
        res.json({ url: "/orderSuccessPage", status: true });
      }
    } else {
      res.json({ message: result.message, status: false });
    }
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ message: "Internal server error", status: false });
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

  const cancelSingleOrder = async (req, res) => {
    try {
      const orderId = req.query.orderId;
      const singleOrderId = req.query.singleOrderId;
      const price = req.query.price;
      const result = await orderHelper.cancelSingleOrder(orderId, singleOrderId, price);
      if (result) {
        res.json({ status: true });
      } else {
        res.json({ status: false });
      }
    } catch (error) {
      console.log(error);
    }
  };


const createOrder = async (req, res) => {
  try {
    const amount = req.query.totalAmount;
    console.log("THis is the amount", amount);
    const cart = await cartModel.findOne({ user: req.session.user });
    console.log("This is the cart", cart)
    for (const product of cart.products) {
      const availableStock = await productModel.findOne({
        _id: product.productItemId,
        "productQuantity.size": product.size,
      });
      
      const availableStockForSize = availableStock.productQuantity.find(item => item.size === product.size);
      console.log("this is availableStockForSize", availableStockForSize);
      if (!availableStockForSize || availableStockForSize.quantity < product.quantity) {
        // If stock is not available for the preferred size, reject the promise and return error
        res.json({ result: `Insufficient stock for size ${product.size}`, status: false });
      } else {
        const order = await razorpay.orders.create({
          amount: amount * 100,
          currency: "INR",
          receipt: req.session.user,
        });
        console.log({ orderId: order, status: true });

        res.json({ orderId: order, status: true });
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const paymentSuccess = (req, res) => {
  try {
    console.log("this is payment success")
    const { paymentid, signature, orderId } = req.body;
    const { createHmac } = require("node:crypto");


    const hash = createHmac("sha256", process.env.KEY_SECRET)
      .update(orderId + "|" + paymentid)
      .digest("hex");


    if (hash === signature) {
      console.log("success");
      res.status(200).json({ success: true, message: "Payment successful" });
    } else {
      console.log("error");
      res.json({ success: false, message: "Invalid payment details" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


const orderFailedPageLoad = (req, res) => {
  res.render("orderFailure");
};

const returnSingleOrder = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const singleOrderId = req.query.singleOrderId;
    const price = req.query.price;
    const result = await orderHelper.returnSingleOrder(orderId, singleOrderId,price);
    if (result) {
      res.json({ status: true });
    } else {
      res.json({ status: false });
    }
  } catch (error) {
    console.log(error);
  }
};




  module.exports = {
    placeOrder,
    orderSuccessPageLoad,
    orderDetails,
    cancelSingleOrder,
    createOrder,
    paymentSuccess,
    orderFailedPageLoad,
    returnSingleOrder,
  }