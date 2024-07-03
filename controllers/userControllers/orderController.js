const user = require("../../models/userModel");
const cartModel = require('../../models/cartModel');
const productModel = require('../../models/productModel');
const orderModel = require('../../models/orderModel');
const cartHelper = require('../../helper/cartHelper');
const orderHelper = require("../../helper/orderHelper");
const couponModel = require("../../models/couponModel");
const moment = require("moment");
const Razorpay = require("razorpay");
require('dotenv').config();
const crypto = require('crypto');


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
    console.log("orderDetails is", orderDetails)


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
    const cart = await cartModel.findOne({ user: req.session.user });
    for (const product of cart.products) {
      const availableStock = await productModel.findOne({
        _id: product.productItemId,
        "productQuantity.size": product.size,
      });

      const availableStockForSize = availableStock.productQuantity.find(item => item.size === product.size);
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

      console.log("This is the signatuere", signature);
      console.log("This is hmac", hash);


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
    // Enhanced Debugging
    const orderId = req.query.orderId;
    const singleOrderId = req.query.singleOrderId;
    const reason = req.query.reason;
    const price = req.query.price;

    console.log("Received orderId:", orderId);
    console.log("Received singleOrderId:", singleOrderId);
    console.log("Received reason:", reason);
    console.log("Received price:", price);

    const result = await orderHelper.returnSingleOrder(orderId, singleOrderId, price, reason);
    if (result) {
      res.json({ status: true });
    } else {
      res.json({ status: false });
    }
  } catch (error) {
    console.log(error);
  }
};

const createWalletOrder = async (req, res) => {
  try {
      const { amount } = req.body; 

      if (!amount || isNaN(amount) || amount <= 0) {
          return res.status(400).json({ status: false, error: 'Invalid amount' });
      }

      const order = await razorpay.orders.create({
          amount: amount, 
          currency: "INR",
          receipt: `wallet_recharge_${Date.now()}`, // Unique receipt ID
          payment_capture: 1 // Auto capture the payment
      });

      console.log("This is the orderId", order);

      res.json({ orderId: order, status: true });

  } catch (error) {
      console.error('Error creating Razorpay order:', error);
      res.status(500).json({ status: false, error: 'Internal Server Error' });
  }
};


function getNumericHash(alphanumericId) {
  // Create a numeric hash from the alphanumeric string
  return parseInt(crypto.createHash('md5').update(alphanumericId).digest('hex'), 16);
}

const verifyWalletPayment = async (req, res) => {
  try {
    const { paymentid, signature, orderId, amount } = req.body;
    const { createHmac } = require("crypto");

    if (!paymentid || !signature || !orderId) {
      return res.status(400).json({ success: false, message: 'Missing required payment details' });
    }

    const hmac = createHmac("sha256", process.env.KEY_SECRET)
      .update(`${orderId}|${paymentid}`)
      .digest("hex");

    if (hmac === signature) {
      console.log("Payment verified successfully");

      const userId = req.session.user;
      console.log("User ID:", userId);

      const userDocument = await user.findById(userId);

      if (userDocument) {
        if (!amount || isNaN(amount)) {
          return res.status(400).json({ success: false, message: 'Invalid amount' });
        }
        
        const amountInINR = parseInt(amount, 10); // Convert paise to INR
        userDocument.wallet.balance += amountInINR;

        const numericTransactionId = getNumericHash(paymentid);


        // Add the transaction details to the wallet
        const newTransaction = {
          type: "credit",
          amount: amountInINR,
          date: new Date(),
          transactionId: numericTransactionId, // Using paymentId as the transactionId
        };
        userDocument.wallet.details.push(newTransaction);

        // Save the updated user document
        await userDocument.save();

        res.status(200).json({ success: true, message: 'Wallet recharged successfully' });
      } else {
        res.status(404).json({ success: false, message: 'User not found' });
      }
    } else {
      console.log("Invalid payment details");
      res.status(400).json({ success: false, message: 'Invalid payment details' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


const retryPayment = async (req, res) => {
  try {
    console.log("inside retrypayment");
    const orderId = req.query.orderId;
    console.log('orderId', orderId);
    const orderDetails = await orderModel.findOne({ orderId: orderId });
    console.log(orderDetails);

    orderDetails.products.forEach((item) => {
      item.status = "pending";
    });

    await orderDetails.save();

    const totalAmount = orderDetails.totalAmount;
    console.log('orderdetails', orderDetails);

    console.log("THis is the id", orderDetails._id);
    console.log("This is the totalAmount", totalAmount);
    res.status(200).json({ orderId: orderDetails._id, totalAmount });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
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
  createWalletOrder,
  verifyWalletPayment,
  retryPayment,
}