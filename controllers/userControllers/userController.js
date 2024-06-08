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

        const userEnteredOtp = req.body.otp; // Assuming userEnteredOtp is the key for OTP in the request body
        const userData = req.session.userData;
        const storedOtp = req.session.otp;

        // Compare the user-entered OTP with the stored OTP
        if (userEnteredOtp === storedOtp && Date.now() < req.session.otpExpiryTime){
            // Create a new user using the session data
 
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

        // Redirect the user after OTP verification
        
    } catch (error) {
        console.log('Error:', error);
        // Handle the error appropriately, such as displaying an error page or message
        res.status(500).send('Internal Server Error');
    }
};



const registerPost = async (req, res, next) => {
    try {

        // Extract user data from request body
        const userData = {
            name: req.body.name,
            mobile: req.body.mobile, // Assuming the phone field corresponds to mobile
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
        // Handle error
        console.error('Error creating user:', error);
        // Render an error page or handle error response
        res.status(500).send('Internal Server Error'); // Render an error page or send an error response
    }
};

// const loginPost = async (req, res) => {

//     const logemail = req.body.email;
//     const logpassword = req.body.password;

//     try {
      
//             let userInfo = await user.findOne({email: logemail});
//             if(userInfo.password === logpassword) {
//                 req.session.user = userInfo._id; 
//                 res.redirect("/userhome");
//             } else {
//                 res.send("error");
//             }


//         } 

//      catch (error) {
//         console.log(error);
//     }

// }


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

// const resendOtpNew = (req, res) => {
//   try {

//       const otp = generateRandomOtp();
//       console.log(otp);
//       const email = req.session.email

//       const mailOptions = {
//           from: 'hafismhdthaleekara764@gmail.com',
//           to: email,
//           subject: 'OTP Verification In Register Side',
//           text: Your OTP is: ${otp}
//       };
//       console.log("email, otp",email, otp)
//       transporter.sendMail(mailOptions, (error, info) => {
//           if (error) {
//               console.error("Error sending OTP email", error.message);
//           } else {
//               console.log("Register Side OTP mail sent", info.response);
//           }
//       });


//        console.log("This is resended otp: ",otp);
//       // Store OTP in session
//       req.session.otp = otp;
      
//       req.session.otpExpirationTime = Date.now() + 20 * 1000
//       res.redirect("/otpRegister")
//   } catch (error) {
//       console.log(error);
//   }
// }



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

      const products = await productModel
          .find().populate("productCategory")
          .lean();

      // Pass cartTotalCount and wishlistTotalCount to the view
      res.render("homepage", { products, cartTotalCount, wishlistTotalCount });
  } catch (error) {
      console.log(error);
  }
}




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
        // Fetch the cart document for the logged-in user
        const cartDocument = await cartModel.findOne({ user: req.session.user });
        let cartTotalCount = 0;
        if (cartDocument) {
            cartTotalCount = cartDocument.products.length;
        } else {
            console.log("Cart not found");
        }

        // Fetch the wishlist document for the logged-in user
        const wishlistDocument = await wishlistModel.findOne({ user: req.session.user });
        let wishlistTotalCount = 0;
        if (wishlistDocument) {
            wishlistTotalCount = wishlistDocument.products.length;
        } else {
            console.log("Wishlist not found");
        }

        // Initialize default values for sorting variables
        let sorted = false;
        let normalSorted = null; // Default value for normalSorted

        // Handle search query
        if (req.query.search) {
            let payload = req.query.search.trim();
            let searchResult = await productModel
                .find({
                    productName: { $regex: new RegExp(payload + ".*", "i") },
                })
                .populate("productCategory")
                .exec();

            if (searchResult.length > 0) {
                // Process search results
                let userId = req.session.user;
                const categories = await categoryHelper.getAllCategory();
                let cartCount = await cartHelper.getCartCount(userId);
                let products = await productHelper.getAllActiveProducts();

                // Filter products with the same category as the first search result
                let sameCatProduct = await productModel.aggregate([
                    {
                        $match: {
                            productName: searchResult[0].productName,
                        },
                    },
                    {
                        $lookup: {
                            from: "categories",
                            localField: "productCategory",
                            foreignField: "_id",
                            as: "category",
                        },
                    },
                    {
                        $match: {
                            productStatus: true,
                            "category": { $ne: [] },
                        },
                    },
                ]);

                let itemsPerPage = 6;
                let currentPage = parseInt(req.query.page) || 1;
                let totalPages = Math.ceil(products.length / itemsPerPage);

                res.render("userShop", {
                    products: sameCatProduct,
                    userData: req.session.user,
                    cartCount,
                    categories,
                    sorted: true,
                    normalSorted: false,
                    totalPages,
                    payload,
                    cartTotalCount, 
                    wishlistTotalCount,
                });
            } else {
                // No search results
                res.render("userShop", {
                    products: [],
                    userData: req.session.user,
                    cartCount: 0,
                    categories: [],
                    sorted: false,
                    normalSorted: false,
                    totalPages: 0,
                    payload,
                    cartTotalCount, 
                    wishlistTotalCount,
                });
            }
        } else {
            // No search query
            const users = req.session.user;
            const categories = await categoryHelper.getAllCategory();
            let products = await productHelper.getAllActiveProducts();
            let totalPages = Math.ceil(products.length / 6);

            // Handle sorting/filtering
            if (req.query.filter) {
                const extractPrice = (price) => parseInt(price.replace(/[^\d]/g, ""));
                if (req.query.filter === "Ascending") {
                    products.sort(
                        (a, b) => extractPrice(a.productPrice.toString()) - extractPrice(b.productPrice.toString())
                    );
                    normalSorted = "Ascending";
                } else if (req.query.filter === "Descending") {
                    products.sort(
                        (a, b) => extractPrice(b.productPrice.toString()) - extractPrice(a.productPrice.toString())
                    );
                    normalSorted = "Descending";
                } else if (req.query.filter === "Alpha") {
                    products.sort((a, b) => {
                        const nameA = a.productName.toUpperCase();
                        const nameB = b.productName.toUpperCase();
                        if (nameA < nameB) return -1;
                        if (nameA > nameB) return 1;
                        return 0;
                    });
                    normalSorted = "Alpha";
                }
                sorted = true; // Set sorted to true if any filter is applied
            } else {
                normalSorted = "None"; // Indicate no sorting applied
            }

            res.render("userShop", {
                products,
                categories,
                users,
                normalSorted,
                sorted,
                totalPages,
                cartTotalCount, 
                wishlistTotalCount,
            });
        }
    } catch (error) {
        console.log(error);
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
    const cartDocument = await cartModel.findOne({ user: req.session.user });
        let cartTotalCount = 0;
        if (cartDocument) {
            cartTotalCount = cartDocument.products.length;
        } else {
            console.log("Cart not found");
        }

        // Fetch the wishlist document for the logged-in user
        const wishlistDocument = await wishlistModel.findOne({ user: req.session.user });
        let wishlistTotalCount = 0;
        if (wishlistDocument) {
            wishlistTotalCount = wishlistDocument.products.length;
        } else {
            console.log("Wishlist not found");
        }
    
    const id=req.params.id
    const userData=req.session.user
    const categories=await categoryHelper.getAllCategory()
    const product = await productModel
    .findById({_id:id})
    .populate("productCategory")
    .lean()
     

    const categoryId= product.productCategory;
    
    const products = await productModel.find({productCategory:categoryId}) 
    .populate("productCategory")
    .lean()
    

    // const cartStatus = await cartHelper.isAProductInCart(userData, product._id);
    // product.cartStatus = cartStatus;

    const wishlistStatus = await wishlistHelper.isInWishlist(
      userData,
      product._id
    );
    
    product.wishlistStatus = wishlistStatus;
      
        res.render('detailProductPage', {
         product,products,
         userData,categories,
         cartTotalCount, wishlistTotalCount })
   
}

const userCartLoad = async (req, res) => {
    try {

      const cartDocument = await cartModel.findOne({ user: req.session.user });
      let cartTotalCount = 0;
      if (cartDocument) {
          cartTotalCount = cartDocument.products.length;
      } else {
          console.log("Cart not found");
      }

      // Fetch the wishlist document for the logged-in user
      const wishlistDocument = await wishlistModel.findOne({ user: req.session.user });
      let wishlistTotalCount = 0;
      if (wishlistDocument) {
          wishlistTotalCount = wishlistDocument.products.length;
      } else {
          console.log("Wishlist not found");
      }

      const userData = req.session.user;
  
      const cartItems = await cartHelper.getAllCartItems(userData);
  
      const cartCount = await cartHelper.getCartCount(userData._id);
  
    //   const wishListCount = await wishlistHelper.getWishListCount(userData._id);
  
      let totalandSubTotal = await cartHelper.totalSubtotal(
        userData,
        cartItems
      );
  
      let totalAmountOfEachProduct = [];
      for (i = 0; i < cartItems.length; i++) {
        let total =
          cartItems[i].quantity * parseInt(cartItems[i].product.productPrice);
        total = total;
        totalAmountOfEachProduct.push(total);
      }
  
      totalandSubTotal = totalandSubTotal;
      for (i = 0; i < cartItems.length; i++) {
        cartItems[i].product.productPrice = 
          cartItems[i].product.productPrice
        
      }

      //add wishlist count when you do the wishlist here 
  
      res.render("userCart", {
        userData: req.session.user,
        cartItems,
        cartCount,
        totalAmount: totalandSubTotal,
        totalAmountOfEachProduct,
        cartTotalCount,
        wishlistTotalCount,
      });
    } catch (error) {
      console.log(error);
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
      let totalandSubTotal = await cartHelper.totalSubtotal(userId, cartItems);
      const now = new Date();
  
      // Fetch and filter coupons directly from MongoDB using aggregation
      const filteredCoupons = await couponModel.aggregate([
        {
          $match: {
            expiryDate: { $gt: now }, // Not expired
            usedBy: { $not: { $elemMatch: { $eq: userId } } } // Not used by the current user
          }
        },
        {
          $sort: { createdAt: -1 } // Sort by createdAt in descending order
        }
      ]);
  
      console.log("This is the filtered coupons", filteredCoupons);
  
      let cart = await cartModel.findOne({ user: userId });
  
      if (cart.coupon != null) {
        const appliedCoupon = await couponModel.findOne({ code: cart.coupon });
        cartItems.couponAmount = appliedCoupon.discount;
        cartItems.coupon = cart.coupon;
  
        // Calculate total amount for each product
        let totalAmountOfEachProduct = [];
        for (let i = 0; i < cartItems.length; i++) {
          const product = cartItems[i].product;
          const quantity = cartItems[i].quantity;
          const total = product.productPrice * quantity;
          totalAmountOfEachProduct.push(total);
        }
  
        console.log("This is cartItems.coupon when there is coupon", cart);
  
        res.render("checkout", {
          userData,
          cartItems,
          totalandSubTotal,
          totalAmountOfEachProduct,
          coupons: filteredCoupons,
        });
      } else {
        let totalAmountOfEachProduct = [];
        // Calculate total amount for each product
        for (let i = 0; i < cartItems.length; i++) {
          const product = cartItems[i].product;
          const quantity = cartItems[i].quantity;
          const total = product.productPrice * quantity;
          totalAmountOfEachProduct.push(total);
        }
  
        console.log("This is cartItems.coupon when there is no coupon", cartItems);
  
        res.render("checkout", {
          userData,
          cartItems,
          totalandSubTotal,
          totalAmountOfEachProduct,
          coupons: filteredCoupons,
        });
      }
    } catch (error) {
      console.log(error);
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