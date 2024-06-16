const cartModel = require("../models/cartModel");
const ObjectId = require("mongoose").Types.ObjectId;
const product=require("../models/productModel");
const offerModel = require("../models/offerModel");

const addToCart = async (userId, productId, size) => {
  try {
    // Fetch the product by its ID
    const findProduct = await product.findById(productId);
    if (!findProduct) {
      throw new Error("Product not found");
    }

    // Fetch all active category offers
    const categoryOffers = await offerModel.find({ status: true }).lean();
    const categoryOfferMap = {};

    // Map category offers for easy lookup
    categoryOffers.forEach(offer => {
      if (offer.categoryOffer && offer.categoryOffer.category) {
        const categoryId = offer.categoryOffer.category.toString();
        categoryOfferMap[categoryId] = offer.categoryOffer.discount;
      }
    });

    // Calculate the original price
    const originalPrice = findProduct.productPrice;

    // Get the product's own discount
    const productDiscount = findProduct.productDiscount || 0;

    // Get the category ID of the product
    const productCategoryId = findProduct.productCategory ? findProduct.productCategory.toString() : null;

    // Find the applicable category discount
    const categoryDiscount = productCategoryId ? (categoryOfferMap[productCategoryId] || 0) : 0;

    // Determine the best discount to apply
    const bestDiscount = Math.max(productDiscount, categoryDiscount);

    // Calculate the final discounted price
    const discountedPrice = originalPrice - (originalPrice * bestDiscount / 100);

    // Fetch the user's cart
    const userInCart = await cartModel.findOne({ user: userId });

    if (userInCart) {
      let productInCart = false;
      let sizeInCart = false;
      let existingProduct;

      // Check if the product is already in the cart
      for (let i = 0; i < userInCart.products.length; i++) {
        if (productId.toString() == userInCart.products[i].productItemId.toString()) {
          productInCart = true;
          existingProduct = userInCart.products[i];

          // Check if the specific size is already in the cart
          if (size === existingProduct.size) {
            sizeInCart = true;
            break;
          }
        }
      }

      if (productInCart && sizeInCart) {
        // Product with the same size already in cart - increment quantity
        existingProduct.quantity += 1;
        existingProduct.subTotal += discountedPrice; // Update the subtotal for this item
        userInCart.totalAmount += discountedPrice; // Update the cart's total amount
      } else {
        // Product or size not in cart - add new item to the cart
        userInCart.products.push({
          productItemId: productId,
          quantity: 1,
          size: size,
          discount: bestDiscount,
          subTotal: discountedPrice // Set the subtotal for the new item
        });
        userInCart.totalAmount += discountedPrice; // Update the cart's total amount
      }

      // Save the updated cart
      await userInCart.save();
      return true;
    } else {
      // No cart for user - create a new cart
      const newCart = new cartModel({
        user: userId,
        products: [{
          productItemId: productId,
          quantity: 1,
          size: size,
          discount: bestDiscount,
          subTotal: discountedPrice // Set the subtotal for the new item
        }],
        totalAmount: discountedPrice // Set the total amount to the discounted price of the first item
      });

      await newCart.save();
      return true;
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    throw error;
  }
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
    try {
      let cart = await cartModel.findOne({ user: userId });

      let total = 0;
      if (cart) {
        if (cartItems.length) {
          for (let i = 0; i < cartItems.length; i++) {
            let productPrice = parseFloat(cartItems[i].product.productPrice);
            let productDiscount = parseFloat(cartItems[i].product.finalDiscount) || 0;
            let quantity = parseInt(cartItems[i].quantity);
            
            let discountedPrice = productPrice - (productPrice * productDiscount / 100);

            total += discountedPrice * quantity;
          }
        }
      
        cart.totalAmount = parseFloat(total.toFixed(2)); 

        await cart.save();

        resolve(total);
      } else {
        resolve(total);
      }
    } catch (error) {
      reject(error);
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


const incDecProductQuantity = async (userId, productId, quantity, size, operation, qty) => {
  return new Promise(async (resolve, reject) => {
    try {
      const findPro = await product.findById({ _id: productId });
      
      const sizeIndex = findPro.productQuantity.findIndex(item => item.size === size);

      if (sizeIndex === -1) {
        // Size not found in the product's quantity array
        reject(new Error("Size not found"));
        return;
      }

      let updateQuery = {};

      const cartBefore = await cartModel.findOne({user: userId});


      if (operation === "increment" && qty < findPro.productQuantity[sizeIndex].quantity ) {
        updateQuery = {
          $inc: {
            "products.$.quantity": 1,
            "products.$.subTotal": findPro.productPrice,
            totalAmount: findPro.productPrice
          }
        };
      } else if (operation === "decrement" && qty > 1) {
        
        console.log("This is findPro.productPrice", findPro.productPrice);
        updateQuery = { 
          $inc: {
            "products.$.quantity": -1,
            "products.$.subTotal": -findPro.productPrice,
            totalAmount: -findPro.productPrice
          }
        };
      } else {
        // Operation not allowed
        resolve(null);
        return;
      }

      const cart = await cartModel.findOneAndUpdate(
        { user: userId, "products.productItemId": findPro._id ,'products.size':size},
        updateQuery
      );

      const cartAfter = await cartModel.findOne({user: userId});
      
      let total = cartAfter.totalAmount;
      resolve(total);
    } catch (error) {
      reject(error);
    }
  });
};




// const removeItemFromCart = (userId, productId, size) => {
//   return new Promise(async (resolve, reject) => {
//     cartModel 
//       .updateOne(
//         { user: userId },
//         {
//           $pull: { products: {$and: [
//             { productItemId: productId },
//             { size: size }
//           ]} },
//         }
//       )
//       .then((result) => {
//         resolve(result);
//       });
//   });
// };

const removeItemFromCart = async (userId, productId, size) => {
  try {
    const cart = await cartModel.findOne({ user: userId });

    if (!cart) {
      throw new Error("Cart not found");
    }

    const productToRemove = cart.products.find(product => 
      product.productItemId.toString() === productId.toString() && product.size === size
    );

    if (!productToRemove) {
      throw new Error("Product not found in cart");
    }

    const newTotalAmount = cart.totalAmount - productToRemove.subTotal;

    const updatedCart = await cartModel.updateOne(
      { user: userId },
      {
        $pull: { 
          products: { 
            productItemId: productId,
            size: size 
          } 
        },
        $set: { totalAmount: newTotalAmount }
      }
    );

    const remainingProducts = cart.products.filter(product => 
      !(product.productItemId.toString() === productId.toString() && product.size === size)
    );

    if (remainingProducts.length === 0) {
      await cartModel.updateOne(
        { user: userId },
        { $set: { totalAmount: 0 } }
      );
      // Alternatively, to delete the empty cart:
      // await cartModel.deleteOne({ user: userId });
    }

    return updatedCart;
  } catch (error) {
    console.error("Error removing item from cart:", error);
    throw error;
  }
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