const cartModel = require("../models/cartModel");
const ObjectId = require("mongoose").Types.ObjectId;
const product=require("../models/productModel")

const addToCart = async(userId, productId,size) => {
const findProduct= await product.findById({_id:productId})
console.log("This is finProduct", findProduct);


  return new Promise(async (resolve, reject) => {
    const userInCart = await cartModel.findOne({user:userId})
    console.log("This is user in cart", userInCart)
   

    if(userInCart){ 
      let pro=false
      let insidePro=[]

      for(let i=0;i<userInCart.products.length;i++){
        if(productId.toString() == userInCart.products[i].productItemId.toString()){
          pro = true
          insidePro.push(userInCart.products[i])
        }
      }
      
      if(pro){
        let sizeIn = false;
        for(let i=0; i < insidePro.length; i++){
          if(size===insidePro[i].size){
            sizeIn=true
          }
        }
        
        if(sizeIn===false){
          const cart = await cartModel.updateOne(
            { user: userId },
            { $push: { products: { productItemId: productId, quantity: 1 ,size:size,subTotal:findProduct.productPrice} } ,$inc:{totalAmount:findProduct.productPrice}},
            { upsert: true }
          );
            }else{
              console.log("This is supposed to happen")
              resolve(false);
              
              ///  size true  
            }

      }else{

    const cart = await cartModel.updateOne(
      { user: userId },
      { $push: { products: { productItemId: productId, quantity: 1 ,size:size,subTotal:findProduct.productPrice} } ,$inc:{totalAmount:findProduct.productPrice}},
      { upsert: true }
    );
      }
      resolve(true)
    } 
    
    else {
      const newCart = new cartModel({
        user:userId,
        products:[{
          productItemId:productId,
          quantity:1,
          size:size,
          subTotal:findProduct.productPrice
        }],
        totalAmount:findProduct.productPrice
      })

      await newCart.save()
      resolve(true)

    }
  
  });
};

const getCartCount = (userId) => {
  return new Promise(async (resolve, reject) => {
    let count = 0;
    let cart = await cartModel.findOne({ user: userId });
    if (cart) {
      count = cart.products.length;
    } else {
      count = 0;
    }
    resolve(count);
  });
};

const totalSubtotal = (userId, cartItems) => {
  return new Promise(async (resolve, reject) => {
    let cart = await cartModel.findOne({ user: userId });
    let total = 0;
    if (cart) {
      if (cartItems.length) {
        for (let i = 0; i < cartItems.length; i++) {
          total =
            total +
            cartItems[i].quantity * parseInt(cartItems[i].product.productPrice);
        }
      }
      cart.totalAmount = parseFloat(total);

      await cart.save();

      resolve(total);
    } else {
      resolve(total);
    }
  });
};



const getAllCartItems = (userId) => {
  return new Promise(async (resolve, reject) => {
    let userCartItems = await cartModel.aggregate([
      {
        $match: { user: new ObjectId(userId) },
      },
      {
        $unwind: "$products",
      },
      
      {
        $project: {
          item: "$products.productItemId",
          quantity: "$products.quantity",
          size:"$products.size"
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "item",
          foreignField: "_id",
          as: "product",
        },
      },
    //  {$unwind:"$product.productQuantity"},
      {
        $project: {
          size:1,
          item: 1,
          quantity: 1,
          product: {
            $arrayElemAt: ["$product", 0],
          },
        },
      },
    ]);
    resolve(userCartItems);
  });
};

const isAProductInCart = (userId, productId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const cart = await cartModel.findOne({
        user: userId,
        "products.productItemId": productId,
      });

      if (cart) {
        resolve(true);
      } else {
        resolve(false);
      }
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
};


const incDecProductQuantity = async (userId, productId, quantity, operation) => {
  return new Promise(async (resolve, reject) => {
    const findPro = await product.findById({ _id: productId });
    //const findCart = await cartModel.findOne({user: userId});
    // const product = findCart.products.find((items) => {
    //   return items._id.toString() == productId
    // })
    // console.log(product);


    let updateQuery = {};

    if (operation === "increment") {
      updateQuery = {
        $inc: {
          "products.$.quantity": 1,
          "products.$.subTotal": findPro.productPrice,
          totalAmount: findPro.productPrice
        }
      };
    } else if (operation === "decrement") {
      updateQuery = { 
        $inc: {
          "products.$.quantity": -1,
          "products.$.subTotal": -findPro.productPrice,
          totalAmount: -findPro.productPrice
        }
      };
    }

    const cart = await cartModel.findOneAndUpdate(
      { user: userId, "products.productItemId": findPro._id },
      updateQuery
    );

    let total = cart.totalAmount;
    resolve(total);
  });
};


const removeItemFromCart = (userId, productId) => {
  return new Promise(async (resolve, reject) => {
    cartModel
      .updateOne(
        { user: userId },
        {
          $pull: { products: { productItemId: productId } },
        }
      )
      .then((result) => {
        resolve(result);
      });
  });
};


const clearTheCart = (userId) => {
  return new Promise(async (resolve, reject) => {
    await cartModel
      .findOneAndUpdate(
        { user: userId },
        { $set: { products: [] } },
        { new: true }
      )

      .then((result) => {
        resolve(result);
      });
  });
};

const clearAllCartItems = (userId) => {
  return new Promise(async (resolve, reject) => {
    const result = await cartModel.deleteOne({ user: userId });
    resolve(result);
  });
};

module.exports = {
  addToCart,
  getCartCount,
  totalSubtotal,
  getAllCartItems,
  isAProductInCart,
  incDecProductQuantity,
  removeItemFromCart,
  clearTheCart,
  clearAllCartItems,
};