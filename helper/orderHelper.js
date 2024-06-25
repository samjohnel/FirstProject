const cartModel = require("../models/cartModel");
const userModel = require('../models/userModel');
const productModel = require("../models/productModel");
const orderModel = require("../models/orderModel");
const walletHelper = require("../helper/walletHelper");
const ObjectId = require("mongoose").Types.ObjectId;
const mongoose = require("mongoose");


const placeOrder = (body, userId, discount) => {
  return new Promise(async (resolve, reject) => {
    try {
      const cart = await cartModel.findOne({ user: userId });
      const address = await userModel.findOne(
        { _id: userId, "address._id": body.addressId },
        {
          "address.$": 1,
          _id: 0,
        }
      );

      const user = await userModel.findOne({ _id: userId });
      let products = [];
      let status = "pending";
      console.log("This is the body.status", body.status);
      if (body.status) {
        status = "payment pending";
      }
     
      for (const product of cart.products) {
        products.push({
          product: product.productItemId,
          quantity: product.quantity,
          size: product.size,
          discount: product.discount,
          productPrice: product.subTotal,
          status: status,
        });
        console.log("This is the product", product);

        if (body.paymentOption == "Wallet") {
          if (cart.totalAmount > user.wallet.balance) {
            console.log("This is cart.totalAmount", cart.totalAmount);
            console.log("This is user.wallet.balance", user.wallet.balance);
            resolve({ status: false, message: "Insufficient Balance" });
            return;
          } else {
            const newDetail = {
              type: "debit",
              amount: cart.totalAmount,
              date: new Date(),
              transactionId: Math.floor(100000 + Math.random() * 900000),
            };

            // Updating user with new balance and new detail
            const response = await userModel.findOneAndUpdate(
              { _id: userId },
              {
                $set: {
                  "wallet.balance": user.wallet.balance - cart.totalAmount,
                },
                $push: { "wallet.details": newDetail },
              },
              { new: true } // to return the updated document
            );
          }
        }

        let changeStock = await productModel.updateOne(
          { 
            "_id": product.productItemId, 
            "productQuantity.size": product.size 
          },
          {
            $inc: {
              "productQuantity.$.quantity": -product.quantity,
              "totalQuantity": -product.quantity,
            },
          }
        );
      }

      if (cart && address) {
        const result = orderModel.create({
          user: userId,
          products: products,
          address: {
            name: user.name,
            house: address.address[0].housename,
            street: address.address[0].streetname,
            area: address.address[0].areaname,
            district: address.address[0].districtname,
            state: address.address[0].statename,
            country: address.address[0].countryname,
            pin: address.address[0].pin,
            phone: user.phone,
          },
          paymentMethod: body.paymentOption,
          totalAmount: cart.totalAmount,
          couponAmount: discount
        });

        resolve({ result: result, status: true });
      }
    } catch (error) {
      console.log(error);
    }
  });
};


  const getSingleOrderDetails = (orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const singleOrderDetails = await orderModel.aggregate([
          {
            $match: {
              _id: new ObjectId(orderId),
            },
          },
          {
            $project: {
              user: 1,
              totalAmount: 1,
              paymentMethod: 1,
              orderedOn: 1,
              status: 1,
            },
          },
        ]);
        resolve(singleOrderDetails);
      } catch (error) {
        console.log(error);
      }
    });
  };

  const getOrderDetailsOfEachProduct = (orderId) => {
    return new Promise(async (resolve, reject) => {
      console.log('the order is',orderId);
      const id = new ObjectId(orderId)

        try {
          const orderDetails = await orderModel.aggregate([
            {
              $match: {
                _id:id
              }
            },
            { $unwind: "$products" },
            {
              $lookup: {
                from: "products",
                localField: "products.product",
                foreignField: "_id",
                as: "product"
              }
            },
            {$unwind:"$product"}
          ]);
          

            console.log("orderDetails is", orderDetails);
            let check = true;
            let count = 0;

            for (const order of orderDetails) {
                if (order.products.status == "delivered") {
                    check = true;
                    count++;
                } else if (order.products.status == "cancelled") {
                    check = true;
                } else {
                    check = false;
                    break;
                }
            }
            if (check == true && count >= 1) {
                orderDetails.deliveryStatus = true;
            }
            console.log("This is the plaves your neber", orderDetails);

            resolve(orderDetails);
        } catch (error) {
            console.log(error);
            reject(error); // Reject the promise with the error
        }
    });
};


  const getOrderDetails = (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const orderDetails = await orderModel
          .find({ user: userId })
          .sort({ orderedOn: -1 });
  
        resolve(orderDetails);
      } catch (error) {
        console.log(error);
      }
    });
  };

  const getAllOrders = () => {
    return new Promise(async (resolve, reject) => {
      const result = await orderModel
        .aggregate([
          {
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "userOrderDetails",
            },
          },
          {
            $sort:{
              orderedOn:-1
            }
          }
        ])
        // .sort({ orderedOn: -1 });
      if (result) {
        resolve(result);
      }
    });
  };


  // const changeOrderStatusOfEachProduct = async (orderId, productId, status) => {
  //   try {
  //     const result = await orderModel.findOneAndUpdate(
  //       { _id: new ObjectId(orderId), "products._id": new ObjectId(productId) },
  //       {
  //         $set: { "products.$.status": status },
  //       },
  //       { new: true }
  //     );
  
  //     if (!result) {
  //       throw new Error('Order or Product not found');
  //     }
  
  //     const allProducts = result.products;
  //     const allSameStatus = allProducts.every(product => product.status === status);

  //     const userId = result.user;
  //       console.log("This is the userId", userId);

  //     if (status === "Returned") {
  //       const userId = result.user;
  //       console.log("This is the userId", userId);
  //     }
  
  //     if (allSameStatus) {
  //       const updatedOrder = await orderModel.findByIdAndUpdate(
  //         orderId,
  //         { $set: { status: status } },
  //         { new: true }
  //       );
  //       return updatedOrder;
  //     }
  
  //     return result;
  //   } catch (error) {
  //     console.log(error);
  //     throw error;
  //   }
  // };
  

  const changeOrderStatusOfEachProduct = async (orderId, productId, status) => {
    try {
      const result = await orderModel.findOneAndUpdate(
        { _id: new ObjectId(orderId), "products._id": new ObjectId(productId) },
        {
          $set: { "products.$.status": status },
        },
        { new: true }
      );
  
      if (!result) {
        throw new Error('Order or Product not found');
      }
  
      const allProducts = result.products;
      const allSameStatus = allProducts.every(product => product.status === status);

      if (status === "returned") {
        const userId = result.user;

        const returnedProduct = allProducts.find(product => product._id.toString() === productId);
        
        if (returnedProduct) {
          const refundAmount = returnedProduct.productPrice;
          await walletHelper.walletAmountAdding(userId, refundAmount);
        } else {
          throw new Error('Returned product not found in the order');
        }
      }
 
      if (allSameStatus) {
        const updatedOrder = await orderModel.findByIdAndUpdate(
          orderId,
          { $set: { status: status } },
          { new: true }
        );
        return updatedOrder;
      }
  
      return result;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };
  

  

  const cancelSingleOrder = (orderId, singleOrderId, price) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Update the order status to "cancelled"
        const cancelled = await orderModel.findOneAndUpdate(
          {
            _id: new ObjectId(orderId),
            "products._id": new ObjectId(singleOrderId),
          },
          {
            $set: { "products.$.status": "cancelled" },
          },
          {
            new: true,
          }
        );
  
        // Aggregate to get the specific product details from the order
        const result = await orderModel.aggregate([
          {
            $unwind: "$products",
          },
          {
            $match: {
              _id: new ObjectId(orderId),
              "products._id": new ObjectId(singleOrderId),
            },
          },
        ]);
  
        if (result.length === 0) {
          reject(new Error('Product not found in order'));
          return;
        }
  
        const singleProductId = result[0].products.product;
        const singleProductSize = result[0].products.size;
        const singleProductQuantity = result[0].products.quantity;
  
        // Increase the product stock in the inventory
        const stockIncrease = await productModel.updateOne(
          { 
            _id: singleProductId, 
            "productQuantity": { $elemMatch: { size: singleProductSize } } 
          },
          {
            $inc: {
              "productQuantity.$.quantity": singleProductQuantity,
              totalQuantity: singleProductQuantity,
            },
          }
        );        
  
        const response = await orderModel.findOne({ _id: orderId });
        
        // Calculate the total refund amount based on the product quantity and price
        const refundAmount = singleProductQuantity * price;
        
        // Add the refund amount to the user's wallet if the payment method was RazorPay
        if (response.paymentMethod === 'RazorPay') {
          const walletUpdation = await walletHelper.walletAmountAdding(
            response.user,
            refundAmount
          );
        }
  
        resolve(cancelled);
      } catch (error) {
        console.log(error);
        reject(error);
      }
    });
  };
  
  const salesReport = async () => {
    try {
      const result = await orderModel.aggregate([
        { $unwind: "$products" },
        { $match: { "products.status": "delivered" } },
        {
          $lookup: {
            from: "products",
            localField: "products.product",
            foreignField: "_id",
            as: "productDetails",
          },
        },
      ]);
  
      return result;
    } catch (error) {
      console.log("Error:", error);
      throw error; 
    }
  };

  const salesReportDateSort = async (startDate, endDate) => {
    try {
      const startDateSort = new Date(startDate);
      const endDateSort = new Date(endDate);
  
      const result = await orderModel.aggregate([
        {
          $match: {
            orderedOn: { $gte: startDateSort, $lte: endDateSort },
          },
        },
        { $unwind: "$products" },
        { $match: { "products.status": "delivered" } },
        {
          $lookup: {
            from: "products",
            localField: "products.product",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        { $sort: { orderedOn: 1 } }, 
      ]);
      return result;
    } catch (error) {
      console.log("Error:", error);
      throw error;
    }
  };

  const returnSingleOrder = (orderId, singleOrderId, price, reason) => {
    return new Promise(async (resolve, reject) => {
      try {
        const cancelled = await orderModel.findOneAndUpdate(
          {
            _id: new ObjectId(orderId),
            "products._id": new ObjectId(singleOrderId),
          },
          {
            $set: { 
              "products.$.status": "return pending",
              "products.$.returnReason": reason || null  // Update returnReason if provided, otherwise set to null
            },
          },
          {
            new: true, // Return the updated document
          }
        );
        
        const result = await orderModel.aggregate([
          {
            $unwind: "$products",
          },
          {
            $match: {
              _id: new ObjectId(orderId),
              "products._id": new ObjectId(singleOrderId),
            },
          },
        ]);
        const singleProductId = result[0].products.product;
        const singleProductSize = result[0].products.size;
        const singleProductQuantity = result[0].products.quantity;
  
        const stockIncrease = await productModel.updateOne(
          { _id: singleProductId, "productQuantity.size": singleProductSize },
          {
            $inc: {
              "productQuantity.$.quantity": singleProductQuantity,
              totalQuantity: singleProductQuantity,
            },
          }
        );
        const response = await orderModel.findOne({ _id: orderId });
        let amountToReturn;
        response.products.forEach(product=>{
          if(product._id==singleOrderId){
            amountToReturn = product.productPrice
          }
        })
        console.log("order id is",orderId)
        console.log("response issssssssssss",response.paymentMethod)
        if (response.paymentMethod == 'RazorPay') {
          console.log("razorpay");
          console.log("price issssssssssssssss",price)
          const walletUpdation = await walletHelper.walletAmountAdding(
            response.user,
            amountToReturn
          );
        }
  
        resolve(cancelled);
      } catch (error) {
        console.log(error);
      }
    });
  };


module.exports = {
      placeOrder,
      getSingleOrderDetails,
      getOrderDetailsOfEachProduct,
      getOrderDetails,
      getAllOrders,
      changeOrderStatusOfEachProduct,
      cancelSingleOrder,
      salesReport,
      salesReportDateSort,
      returnSingleOrder,
}