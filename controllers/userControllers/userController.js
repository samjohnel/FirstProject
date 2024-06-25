const { name } = require("ejs");
const otpHelper = require("../../helper/otpHelper");
const user = require("../../models/userModel");
const flash = require('express-flash');
const session = require('express-session');
const productModel = require('../../models/productModel');
const userHelper = require('../../helper/userHelper');
const categoryHelper = require('../../helper/categoryHelper');
const productHelper = require('../../helper/productHelper');
const cartHelper = require('../../helper/cartHelper');
const cartModel = require('../../models/cartModel');
const wishlistModel = require('../../models/wishlistModel');
const orderHelper = require('../../helper/orderHelper');
const wishlistHelper = require('../../helper/wishlistHelper');
const couponHelper = require('../../helper/couponHelper');
const couponModel = require('../../models/couponModel');
const orderModel = require('../../models/orderModel');
const offerModel = require('../../models/offerModel');
const ObjectId = require("mongoose").Types.ObjectId;
const bcrypt = require('bcrypt');
const moment = require("moment");
const { query } = require("express");
const wishlist = require("../../models/wishlistModel");

const userLogin = (req, res) => {
    try {
       res.render("login"); 
    } catch (error) {
        console.log(error);
    }
}

const getUserSignUp = (req, res) => {
    try {
      let error = req.flash("error")
        res.render("signUp",{error: error} )
    } catch (error) {
        console.log(error)
    }
}

const otpRedirect = async (req, res) => {
    try {
        // const { email, password, mobile} = req.body
        // console.log( email, password, mobile);
 
        req.session.userData = req.body;
        const otp = await otpHelper.generateOtp(req.body.email);
        req.session.otp = otp;
        req.session.otpExpiryTime = Date.now() + 60 * 1000; 
        console.log(`otp is ${otp}`) ;
        res.redirect("/otpPage");
    } catch (error) {
        console.log(error)
    }
}


const getOtpPage = (req, res) => {
    try {
        const message = req.flash('message');
        res.render("otpPage", { message, layout: false });
    } catch (error) {
       console.log(error); 
    } 
}



const otpPost = async (req, res) => {
    try {
        // Check if session data exists
        if (!req.session || !req.session.userData || !req.session.otp) {
            throw new Error('Session data not found');
        }

        const userEnteredOtp = req.body.otp;  
        const userData = req.session.userData;
        const storedOtp = req.session.otp;

        if (userEnteredOtp === storedOtp && Date.now() < req.session.otpExpiryTime){
 
            const hashedPassword = await bcrypt.hash(userData.password, 10); // Using a salt factor of 10
            // Save hashed password to user data
             userData.password = hashedPassword;

            const newUser = await user.create(userData);
            res.redirect('/login');
        } else {
            req.flash('message', 'Invalid OTP');
            // Handle invalid OTP
            console.log('Invalid OTP');
            // You may want to redirect the user to a different page or show an error message
            res.redirect('/otpPage');
        }
        
    } catch (error) {
        console.log('Error:', error);
        res.status(500).send('Internal Server Error');
    }
};



const registerPost = async (req, res, next) => {
    try {

        // Extract user data from request body
        const userData = {
            name: req.body.name,
            mobile: req.body.mobile,
            email: req.body.email,
            password: req.body.password,
            cpassword: req.body.confpassword,
            isActive: 0,
        };

        
       
        // if (userData.password !== userData.cpassword) {
        //        req.flash("error","Passwords don't match" )
        //     return res.redirect("/signup?error=Passwords don't match");
        // }
      
          req.session.userData = userData;

      
       next();
        

    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).send('Internal Server Error'); 
    }
};



const resendOtp = async (email) => {
  try {
      const otp = await otpHelper.generateOtp(email);
      // console.log("Resent OTP:", otp);
      return otp;
  } catch (error) {
      throw error;
  }
};

const resendOtpRedirect = async (req, res) => {
  try {
      const email = req.session.userData.email; 
      const otp = await resendOtp(email);
      req.session.otp = otp;
      req.session.otpExpiryTime = Date.now() + 60 * 1000; 
      console.log(`Resent OTP: ${otp}`);
      res.redirect("/otpPage");
  } catch (error) {
      console.error("Failed to resend OTP:", error);
      // Handle the error accordingly
      res.status(500).send("Failed to resend OTP");
  }
};



const loginPost = async (req, res) => {
  const logemail = req.body.email;
  const logpassword = req.body.password;

  try {
      let userInfo = await user.findOne({ email: logemail });

      if (userInfo) {
          // Compare the plain text password with the hashed password from the database
          bcrypt.compare(logpassword, userInfo.password, (err, result) => {
              if (err) {
                  // Handle error
                  console.error('Error comparing passwords:', err);
                  res.status(500).render('login', { error: 'Internal Server Error' });
              }
              if (result) {
                  // Passwords match
                  req.session.user = userInfo._id;
                  res.redirect("/userhome");
              } else {
                  // Passwords don't match
                  res.status(401).render('login', { error: 'Incorrect password' });
              }
          });
      } else {
          // User not found
          res.status(401).render('login', { error: 'Incorrect email' });
      }
  } catch (error) {
      console.error('Error finding user:', error);
      res.status(500).render('login', { error: 'Internal Server Error' });
  }
}





const verifyCredentials = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { email: sessionEmail, password: sessionPassword } = req.session;

        // Find the user with the given email
        const userInfo = await user.findOne({ email });

        if (!userInfo) {
            // User not found
            res.send("User not found");
            return;
        }

        // Compare the password with the stored password
        if (userInfo.password === password) {
            // Passwords match, authentication successful
            redirectToHomePage(req, res);
        } else {
            // Passwords don't match
            res.send("Invalid password");
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};



const userHome = async (req, res) => {
  try {
      // Fetch cart details
      const cartDocument = await cartModel.findOne({ user: req.session.user });
      const cartTotalCount = cartDocument ? cartDocument.products.length : 0;

      // Fetch wishlist details
      const wishlistDocument = await wishlistModel.findOne({ user: req.session.user });
      const wishlistTotalCount = wishlistDocument ? wishlistDocument.products.length : 0;

      // Fetch products where productStatus is true and populate the productCategory
      const products = await productModel.find({ productStatus: true }).populate("productCategory").lean();

      // Fetch all category offers and map them
      // Fetch all category offers with status true and map them
      const categoryOffers = await offerModel.find({ status: true }).lean();
      const categoryOfferMap = {};
      categoryOffers.forEach(offer => {
          if (offer.categoryOffer && offer.categoryOffer.category) {
              const categoryId = offer.categoryOffer.category.toString();
              categoryOfferMap[categoryId] = offer.categoryOffer.discount;
          }
      });

      // Add category offers to each product
      products.forEach(product => {
          // Check if productCategory and _id are defined
          if (product.productCategory && product.productCategory._id) {
              const categoryId = product.productCategory._id.toString();
              product.categoryOffer = categoryOfferMap[categoryId] || 0; // Add the category discount if available, otherwise 0
          } else {
              product.categoryOffer = 0; // Default to 0 if category or ID is not defined
          }
      });

      // Render the homepage view with the updated product details
      res.render("homepage", { products, cartTotalCount, wishlistTotalCount });
  } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
  }
};




const logout = (req, res) => {
    try {
        if (req.session.user) {
           //req.session.destroy();
           req.session.user = null;
           res.redirect("/login");
        }
        else {
            res.redirect("/userhome");
        }
    } catch (error) {
        console.log(error);
    }
}


const accountView = async (req, res) => {
  try {
    const cartDocument = await cartModel.findOne({ user: req.session.user });
    let cartTotalCount = 0;
    if (cartDocument) {
        cartTotalCount = cartDocument.products.length;
    } else {
        console.log("Cart not found");
    }

    const wishlistDocument = await wishlistModel.findOne({ user: req.session.user });
    let wishlistTotalCount = 0;
    if (wishlistDocument) {
        wishlistTotalCount = wishlistDocument.products.length;
    } else {
        console.log("Wishlist not found");
    }

    const userId = req.session.user;

    const walletResult = await userHelper.getWalletDetails(userId);
    
    const walletData = walletResult.toObject(); 

    for (const amount of walletData.wallet.details) {
      amount.formattedDate = moment(amount.date).format("MMM Do, YYYY");
    }

    const walletPage = parseInt(req.query.walletPage) || 1;
    const walletLimit = 7; // Number of wallet transactions per page
    const walletSkip = (walletPage - 1) * walletLimit;

    const totalWalletTransactions = walletData.wallet.details.length;
    const totalWalletPages = Math.ceil(totalWalletTransactions / walletLimit);

    const paginatedWalletDetails = walletData.wallet.details.slice(walletSkip, walletSkip + walletLimit);

    const page = parseInt(req.query.page) || 1;
    const limit = 7; // Number of orders per page
    const skip = (page - 1) * limit;

    const totalOrders = await orderModel.countDocuments({ user: userId });
    const totalPages = Math.ceil(totalOrders / limit);

    const orderDetails = await orderModel.find({ user: userId })
      .sort({ orderedOn: -1 })
      .skip(skip)
      .limit(limit)
      .populate("products.product")
      .lean();


    for (const order of orderDetails) {
      const dateString = order.orderedOn;
      order.formattedDate = moment(dateString).format("MMMM Do, YYYY");
      order.formattedTotal = order.totalAmount;
      let quantity = 0;
      for (const product of order.products) {
        quantity += Number(product.quantity);
      }
      order.quantity = quantity;
      quantity = 0;
    }

    let sum = walletData.wallet.details.reduce((acc, detail) => {
      if (detail.type === "refund") {
        return acc + detail.amount;
      } else if (detail.type === "debit") {
        return acc - detail.amount;
      }
      return acc;
    }, 0);


    if (req.xhr) {
      // If the request is AJAX, return JSON data
      res.json({
        walletData: { wallet: { details: paginatedWalletDetails } },
        walletCurrentPage: walletPage,
        totalWalletPages: totalWalletPages,
        cartTotalCount,
        wishlistTotalCount,
      });
    } else {
      // Otherwise, render the full page
      res.render("userAccount", {
        userData: walletData,
        orderDetails,
        walletData: { wallet: { details: paginatedWalletDetails } },
        sum,
        currentPage: page,
        totalPages: totalPages,
        walletCurrentPage: walletPage,
        totalWalletPages: totalWalletPages,
        cartTotalCount,
        wishlistTotalCount,
      });
    }
  } catch (error) {
    console.log(error);
  }
}



const getOrderData = async (req, res) => {
  try {
    const userId = req.session.user;

    const page = parseInt(req.query.page) || 1;
    const limit = 7; // Number of orders per page
    const skip = (page - 1) * limit;

    const totalOrders = await orderModel.countDocuments({ user: userId });
    const totalPages = Math.ceil(totalOrders / limit);

    const orderDetails = await orderModel.find({ user: userId })
    .sort({ orderedOn: -1 })
    .skip(skip)
    .limit(limit)
    .populate("products.product")
    .lean();


    for (const order of orderDetails) {
      const dateString = order.orderedOn;
      order.formattedDate = moment(dateString).format("MMMM Do, YYYY");
      order.formattedTotal = order.totalAmount;
      let quantity = 0;
      for (const product of order.products) {
        quantity += Number(product.quantity);
      }
      order.quantity = quantity;
    }


    res.json({
      orderDetails,
      currentPage: page,
      totalPages: totalPages
    });
  } catch (error) {
    console.log(error);
  }
};



const addAddress = async (req, res) => {
  console.log("Code reached addAddress")
    const body = req.body;
    const userId = req.session.user;
    const result = await userHelper.addAddress(body, userId);
    if (result) {
      res.redirect("/accountView")
    }
  };

  const addressEditModal = async (req, res) => {
    try {
      console.log("entered in Add edit modal");
      const userId = req.params.userId;
      const addressId = req.params.addressId;
  
      // Assuming you have a User model
      const userData = await user.findById(userId);
      console.log(userId)
      if (userData) {
        
        const address = userData.address.id(addressId);
        
        if (address) {
          console.log(address);
          res.json({ address });
        } else {
          res.status(404).json({ message: 'Address not found' });
        }
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  const editAddress = async (req,res,next)=>{
    try {
      const userId = req.session.user;
      const addressId = req.params.id;
      const body = req.body;
      const result = await userHelper.editAddressHelper(userId,addressId,body)
      if(result){
        console.log(result);
        res.json(result)
      }
    } catch (error) {
      console.log(error);
    }
  }

  const deleteAddress=async(req,res,next)=>{
    try {
        const userId=req.session.user
        const addressId=req.params.id
        const result=await userHelper.deleteAddressHelper(userId,addressId)
        if(result){
            console.log(result);
            res.json(result)
        }
    } catch (error) {
        console.log(error);
    }
  }

  const updateUser=async(req,res,next)=>{
    try {
        const userId=req.session.user
        const userDetails=req.body;
        const result=await userHelper.updateUserDetails(userId,userDetails);
        res.json(result)
    } catch (error) {
        console.log(error);
    }
   }

   const updatePassword=async(req,res,next)=>{
    try{
    console.log("Getting into update Password");
    const userId=req.session.user;
    const passwordDetails=req.body;
   
    const result=await userHelper.updateUserPassword(userId,passwordDetails)
    res.json(result)
    }catch(error){
    console.log(error);
    }
  }
  const loadShop = async (req, res) => {
    try {
      const userId = req.session.user;
  
      // Fetch the cart and wishlist documents for the logged-in user
      const [cartDocument, wishlistDocument, categoryOffers] = await Promise.all([
        cartModel.findOne({ user: userId }).lean(),
        wishlistModel.findOne({ user: userId }).lean(),
        offerModel.find({ status: true }).lean()
      ]);
  
      let cartTotalCount = cartDocument ? cartDocument.products.length : 0;
      let wishlistTotalCount = wishlistDocument ? wishlistDocument.products.length : 0;
  
      // Create a map of category offers for quick lookup
      const categoryOfferMap = {};
      categoryOffers.forEach(offer => {
        if (offer.categoryOffer && offer.categoryOffer.category) {
          const categoryId = offer.categoryOffer.category.toString();
          categoryOfferMap[categoryId] = offer.categoryOffer.discount;
        }
      });
  
      // Initialize variables for rendering
      let products = [];
      let categories = await categoryHelper.getAllCategory();
      let sorted = false;
      let normalSorted = "None";
      let payload = req.query.search ? req.query.search.trim() : '';
  
      if (payload) {
        // Handle search query
        products = await productModel
          .find({
            productName: { $regex: new RegExp(payload + ".*", "i") }
          })
          .populate("productCategory")
          .lean();
      } else {
        // Fetch all active products if no search query
        products = await productHelper.getAllActiveProducts();
      }
  
      // Add category offers to each product
      products.forEach(product => {
        if (product.productCategory && product.productCategory._id) {
          const categoryId = product.productCategory._id.toString();
          product.categoryOffer = categoryOfferMap[categoryId] || 0;
        } else {
          product.categoryOffer = 0;
        }
      });
  
      // Sorting products if a filter is applied
      if (req.query.filter) {
        const extractPrice = (price) => parseInt(price.replace(/[^\d]/g, ""));
        switch (req.query.filter) {
          case "Ascending":
            products.sort((a, b) => extractPrice(a.productPrice.toString()) - extractPrice(b.productPrice.toString()));
            normalSorted = "Ascending";
            break;
          case "Descending":
            products.sort((a, b) => extractPrice(b.productPrice.toString()) - extractPrice(a.productPrice.toString()));
            normalSorted = "Descending";
            break;
          case "Alpha":
            products.sort((a, b) => {
              const nameA = a.productName.toUpperCase();
              const nameB = b.productName.toUpperCase();
              return nameA.localeCompare(nameB);
            });
            normalSorted = "Alpha";
            break;
          default:
            normalSorted = "None";
        }
        sorted = true;
      }
  
      // Pagination variables
      const itemsPerPage = 6;
      const currentPage = parseInt(req.query.page) || 1;
      const totalPages = Math.ceil(products.length / itemsPerPage);
      const paginatedProducts = products.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
      // Render the shop page with the prepared data
      res.render("userShop", {
        products: paginatedProducts,
        userData: userId,
        cartCount: cartTotalCount,
        categories,
        sorted,
        normalSorted,
        totalPages,
        payload,
        cartTotalCount,
        wishlistTotalCount,
        currentPage
      });
    } catch (error) {
      console.error("Error loading shop:", error);
      res.status(500).send("Internal Server Error");
    }
  };
  



  const shopFilterLoad = async (req, res, next) => {
    try {
      let filteredProducts;
      const extractPrice = (price) => parseInt(price.replace(/[^\d]/g, ""));
    
      const { search, category, sort, page, limit } = req.query;
      if (category) {
        let userId = req.session.user;
        var categories = await categoryHelper.getAllCategory();
  
        var cartCount = await cartHelper.getCartCount(userId);
  
        // var wishListCount = await wishlistHelper.getWishListCount(userId);
  
        //var product = await productHelper.getAllActiveProducts();
        
        //const products = await productHelper.getAllActiveProducts();
        const products = await productHelper.getAllActiveProducts();
        for (let product of products) {
          product.category = product.category.map(cat => cat.categoryName);
        }
        

        let categorySortedProducts = await products.filter((product) => {
          return product.productCategory.toString().trim() == category.trim();
        });
  
        filteredProducts = categorySortedProducts;
        var sorted = false;
      }
     
      if (sort) {
        if (sort == "Ascending") {
          filteredProducts.sort(
            (a, b) => extractPrice(a.productPrice.toString()) - extractPrice(b.productPrice.toString())
          );
          sorted = "Ascending";
        } else if (sort == "Descending") {
          filteredProducts.sort(
            (a, b) => extractPrice(b.productPrice.toString()) - extractPrice(a.productPrice.toString())
          );
          sorted = "Descending";
        } else if (sort == "Alpha") {
          filteredProducts.sort((a, b) => {
            const nameA = a.productName.toUpperCase();
            const nameB = b.productName.toUpperCase();
            if (nameA < nameB) {
              return -1;
            }
            if (nameA > nameB) {
              return 1;
            }
            return 0;
          });
          sorted = "Alpha";
        }
      }
      let itemsPerPage = 6;
      let currentPage = parseInt(req.query.page) || 1;
      let startIndex = (currentPage - 1) * itemsPerPage;
      let endIndex = startIndex + itemsPerPage;
      let totalPages = Math.ceil(filteredProducts.length / 6);
      const currentProduct = filteredProducts.slice(startIndex, endIndex);
      
      res.json({
        products: currentProduct,
        totalPages,
        userData: req.session.user,
        cartCount,
        categories,
        sorted,
      });
    } catch (error) {
      next(error);
    }
  };
  

  const LoadUserProduct = async (req, res) => {
    try {
      const id = req.params.id;
      const userData = req.session.user;
      const categories = await categoryHelper.getAllCategory();
  
      // Fetch the cart document for the logged-in user
      const cartDocument = await cartModel.findOne({ user: userData });
      let cartTotalCount = cartDocument ? cartDocument.products.length : 0;
  
      // Fetch the wishlist document for the logged-in user
      const wishlistDocument = await wishlistModel.findOne({ user: userData });
      let wishlistTotalCount = wishlistDocument ? wishlistDocument.products.length : 0;
  
      const product = await productModel
        .findById({ _id: id })
        .populate("productCategory")
        .lean();
  
      const categoryId = product.productCategory;
  
      const products = await productModel.find({ productCategory: categoryId })
        .populate("productCategory")
        .lean();
  
      // Fetch all category offers and map them
      const categoryOffers = await offerModel.find({ status: true }).lean();
      
      const categoryOfferMap = {};
      categoryOffers.forEach(offer => {
        if (offer.categoryOffer && offer.categoryOffer.category) {
          const categoryId = offer.categoryOffer.category.toString();
          categoryOfferMap[categoryId] = offer.categoryOffer.discount;
        }
      });
  
      // Add category offers to each product and calculate the best discount
      products.forEach(product => {
        if (product.productCategory && product.productCategory._id) {
          const categoryId = product.productCategory._id.toString();
          const categoryOffer = categoryOfferMap[categoryId] || 0;
          
          // Determine the better discount: product discount or category offer
          product.finalDiscount = Math.max(product.productDiscount || 0, categoryOffer);
          product.categoryOffer = categoryOffer; // Just for reference if needed in the EJS
          console.log(`Product: ${product._id}, Category ID: ${categoryId}, Category Offer: ${categoryOffer}, Final Discount: ${product.finalDiscount}`);
        } else {
          product.finalDiscount = product.productDiscount || 0; // Default to product discount if category is not defined
        }
      });
  
      // Calculate the final discount for the main product
      const categoryOfferForMainProduct = categoryOfferMap[product.productCategory._id.toString()] || 0;
      product.finalDiscount = Math.max(product.productDiscount || 0, categoryOfferForMainProduct);
  
      const wishlistStatus = await wishlistHelper.isInWishlist(userData, product._id);
  
      product.wishlistStatus = wishlistStatus;
  
      console.log("This is the product", product);
  
      res.render('detailProductPage', {
        product,
        products,
        userData,
        categories,
        cartTotalCount,
        wishlistTotalCount
      });
    } catch (error) {
      console.error(error);
      // Handle errors appropriately
      res.status(500).send('Internal Server Error');
    }
  }
  
  

  const userCartLoad = async (req, res) => {
    try {
      const userData = req.session.user;
  
      // Fetch the cart document for the logged-in user
      const cartDocument = await cartModel.findOne({ user: userData });
      let cartTotalCount = cartDocument ? cartDocument.products.length : 0;
  
      // Fetch the wishlist document for the logged-in user
      const wishlistDocument = await wishlistModel.findOne({ user: userData });
      let wishlistTotalCount = wishlistDocument ? wishlistDocument.products.length : 0;
  
      // Get all cart items for the user
      const cartItems = await cartHelper.getAllCartItems(userData);
  
      // Get the cart count
      const cartCount = await cartHelper.getCartCount(userData._id);
  
      // Fetch all category offers and map them
      const categoryOffers = await offerModel.find({ status: true }).lean();

      const categoryOfferMap = {};
      categoryOffers.forEach(offer => {
        if (offer.categoryOffer && offer.categoryOffer.category) {
          const categoryId = offer.categoryOffer.category.toString();
          categoryOfferMap[categoryId] = offer.categoryOffer.discount;
        }
      });
  
      let totalAmountOfEachProduct = [];
      let totalCartAmount = 0;
  
      for (let i = 0; i < cartItems.length; i++) {
        const item = cartItems[i];
        const product = item.product;
  
        // Determine the applicable category offer
        const categoryId = product.productCategory ? product.productCategory.toString() : null;
        const categoryOffer = categoryId ? categoryOfferMap[categoryId] : 0;
  
        // Calculate the final discount: the higher of the product's own discount or the category offer
        const finalDiscount = Math.max(product.productDiscount || 0, categoryOffer || 0);
  
        // Calculate the final price after applying the discount
        const discountedPrice = product.productPrice - (product.productPrice * finalDiscount / 100);
  
        // Calculate the total amount for each product in the cart (quantity * discounted price)
        const total = item.quantity * discountedPrice;
        totalAmountOfEachProduct.push(total);
  
        // Update the total cart amount
        totalCartAmount += total;
  
        // Store the final discounted price and discount used for each product
        cartItems[i].product.finalDiscount = finalDiscount;
        cartItems[i].product.discountedPrice = discountedPrice;
      }

      console.log("THis is the cart Items", cartItems);
  
      // Render the cart page with updated information
      res.render("userCart", {
        userData,
        cartItems,
        cartCount,
        totalAmount: totalCartAmount, // Total amount for all products in the cart
        totalAmountOfEachProduct, // Array of total amounts per product
        cartTotalCount,
        wishlistTotalCount
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  };
  
  
  const addToCart = async (req, res) => {
    const userId = req.session.user;
    const productId = req.params.id;
    const size=req.params.size
  
    const result = await cartHelper.addToCart(userId, productId,size);
    console.log("result is ",result )
    if (result) {
      res.json({ status: true });
    } else {
      res.json({ status: false });
    }
  };

  const updateCartQuantity = async (req, res) => {
    const productId = req.query.productId;
    const quantity = req.query.quantity;
    const userId = req.session.user;
    const size = req.query.size;
    const operation = req.query.operation; // 'increment' or 'decrement'
    const qty = req.query.qty;
    console.log("This is quantity", quantity)
    
    const update = await cartHelper.incDecProductQuantity(
      userId,
      productId,
      quantity,
      size,
      operation, 
      qty
    );

    console.log("This is update", update)

    console.log("THis is the quantity that we are passing", quantity)
    
    if (update) {
      res.json({ status: true, quantity, total: update });
    } else {
      res.json({ status: false });
    }
  };

  const removeCartItem = async (req, res) => {
    try {
      const userId = req.session.user;
      const productId = req.params.id;
      const size = req.params.size;
      const result = await cartHelper.removeItemFromCart(userId, productId, size);
      if (result) {
        res.json({ status: true });
      } else {
        res.json({ status: false });
      }
    } catch (error) {
      console.log(error);
    }
  }; 
  

  const checkoutPage = async (req, res) => {
    try {
      const userId = req.session.user;
      const userData = await user.findById({ _id: userId });
      let cartItems = await cartHelper.getAllCartItems(userId);
  
      // Fetch category offers and map them
      const categoryOffers = await offerModel.find({ status: true }).lean();
      const categoryOfferMap = {};
      categoryOffers.forEach(offer => {
        if (offer.categoryOffer && offer.categoryOffer.category) {
          const categoryId = offer.categoryOffer.category.toString();
          categoryOfferMap[categoryId] = offer.categoryOffer.discount;
        }
      });
  
      // Determine the best discount and calculate the final discounted price for each product
      cartItems.forEach(item => {
        const product = item.product;
        const productDiscount = product.productDiscount || 0;
  
        // Check if there's a category offer for this product's category
        const categoryId = product.productCategory ? product.productCategory.toString() : null;
        const categoryOffer = categoryId ? (categoryOfferMap[categoryId] || 0) : 0;
  
        // Use the higher discount between product discount and category offer
        const finalDiscount = Math.max(productDiscount, categoryOffer);
  
        // Calculate the final discounted price
        const discountedPrice = product.productPrice - (product.productPrice * finalDiscount / 100);
  
        // Store the final discounted price and the discount used
        item.finalPrice = discountedPrice;
        item.finalDiscount = finalDiscount;
  
      });
  
      // Calculate total and subtotal based on the final discounted prices
      let totalandSubTotal = await cartHelper.totalSubtotal(userId, cartItems.map(item => ({
        ...item,
        product: { ...item.product, productPrice: item.finalPrice } // Use the final discounted price
      })));

  
      const now = new Date();
  
      // Fetch and filter coupons directly from MongoDB using aggregation
      const filteredCoupons = await couponModel.aggregate([
        {
          $match: {
            expiryDate: { $gt: new Date() },  // Coupons that are not expired
            usedBy: { $nin: [new ObjectId(userId)] },  // Coupons that are not used by the current user
            isActive: "Active"  // Coupons that are marked as active
          }
        },
        {
          $sort: { createdAt: -1 }  // Sort coupons by creation date in descending order
        }
      ]);

  
      let cart = await cartModel.findOne({ user: userId });
  
      let totalAmountOfEachProduct = [];
      cartItems.forEach(item => {
        const total = item.finalPrice * item.quantity;
        totalAmountOfEachProduct.push(total);
      });
  
      // Check if there's a coupon applied to the cart
      if (cart && cart.coupon != null) {
        const appliedCoupon = await couponModel.findOne({ code: cart.coupon });
        cartItems.couponAmount = appliedCoupon ? appliedCoupon.discount : 0;
        cartItems.coupon = cart.coupon;
      } else {
      }
  
      res.render("checkout", {
        userData,
        cartItems,
        totalandSubTotal,
        totalAmountOfEachProduct,
        coupons: filteredCoupons,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal Server Error');
    }
  };
  
  


module.exports = {
    userLogin, 
    getUserSignUp, 
    otpRedirect, 
    getOtpPage, 
    otpPost, 
    registerPost, 
    loginPost, 
    verifyCredentials, 
    userHome, 
    logout, 
    accountView, 
    addAddress, 
    addressEditModal,
    editAddress, 
    deleteAddress,
    updateUser,
    loadShop,
    LoadUserProduct,
    userCartLoad,
    addToCart,
    updateCartQuantity,
    removeCartItem,
    checkoutPage,
    addressEditModal,
    updatePassword,
    shopFilterLoad,
    resendOtpRedirect,
    getOrderData,
}