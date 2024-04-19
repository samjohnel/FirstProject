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
const ObjectId = require("mongoose").Types.ObjectId;

const userLogin = (req, res) => {
    try {
       res.render("login"); 
    } catch (error) {
        console.log(error);
    }
}

const getUserSignUp = (req, res) => {
    try {
        res.render("signUp")
    } catch (error) {
        console.log(error)
    }
}

const otpRedirect = async (req, res) => {
    try {
        // const { email, password, mobile} = req.body
        // console.log( email, password, mobile);
        console.log(req.body);
 
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
            const newUser = await User.create(userData);
            console.log('New user created:', newUser);
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




const registerPost = async (req, res) => {
    try {
        // Extract user data from request body
        const userData = {
            name: req.body.name,
            mobile: req.body.phone, // Assuming the phone field corresponds to mobile
            email: req.body.email,
            password: req.body.password,
            cpassword: req.body.cpassword,
            isActive: 0,
        };

        // Save user data to session (if needed)
        req.session.userData = userData;

        // Create a new user document using the User model
       
        if (password !== cpassword) {
            res.redirect("/signup?error=Passwords don't match");
        }
        

        // Redirect to a success page or handle success response
        res.redirect('/success-page'); // Redirect to a success page

        

    } catch (error) {
        // Handle error
        console.error('Error creating user:', error);
        // Render an error page or handle error response
        res.status(500).send('Internal Server Error'); // Render an error page or send an error response
    }
};

const loginPost = async (req, res) => {

    const logemail = req.body.email;
    const logpassword = req.body.password;

    try {
      
            let userInfo = await user.findOne({email: logemail});
            if(userInfo.password === logpassword) {
                req.session.user = userInfo._id; 
                res.redirect("/userhome");
            } else {
                res.send("error");
            }


        } 

     catch (error) {
        console.log(error);
    }

}

// const homePage = (req, res) => {
//     try {
//         res.render("homepage");
//     } catch (error) {
//         console.log(error);
//     }
// }

const verifyCredentials = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the user with the given email
        const userInfo = await User.findOne({ email });

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

const userHome =async(req, res) => {
    try {
        const products = await productModel
        .find().populate("productCategory")
       .lean();

        res.render("homepage",{products});
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
        
        const userId = req.session.user
        console.log(userId)
        const userData = await user.findOne({_id:userId})
           console.log(userData)
        
        res.render("userAccount",{
          userData
        })
    } catch (error) {
        console.log(error);
    }
}

const addAddress = async (req, res) => {
    console.log("getting in");
    const body = req.body;
    const userId = req.session.user;
    console.log(userId);
    const result = await userHelper.addAddress(body, userId);
    if (result) {
      res.json({ status: true });
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
      console.log("entered into editAddress controller");
      const userId = req.session.user;
      console.log(userId);
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
        console.log('entered in to delete address');
        const userId=req.session.user
        console.log(userId);
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
        console.log("entered in to update user");
        const userId=req.session.user
        console.log("User ID:", userId);
        const userDetails=req.body;
        const result=await userHelper.updateUserDetails(userId,userDetails)
        console.log("Update result:", result);
        res.json(result)
    } catch (error) {
        console.log(error);
    }
   }

   const loadShop = async(req,res)=>{
    try {
      const users = req.session.user;
      const categories = await categoryHelper.getAllCategory();
      let products = await productHelper.getAllActiveProducts();
  
  
      if (users) {
        res.render("userShop", {
          products: products,
          categories,
          users
  
        });
      } else {
        res.render("homepage", {
          products: products,
          categories
  
        });
      }
    } catch (error) {
      console.log(error);
    }
  }

  const LoadUserProduct = async (req, res) => {
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
      
        res.render('detailProductPage', {
         product,products,
         userData,categories })
   
}

const userCartLoad = async (req, res) => {
    try {
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
    const operation = req.query.operation; // 'increment' or 'decrement'
    
    const update = await cartHelper.incDecProductQuantity(
      userId,
      productId,
      quantity,
      operation
    );
    
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
      console.log(userId, productId);
      const result = await cartHelper.removeItemFromCart(userId, productId);
      console.log(result);
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
      const userData = await user.findById({ _id: userId })
      let cartItems = await cartHelper.getAllCartItems(userId);
      console.log("This is checkout",cartItems);
      let totalandSubTotal = await cartHelper.totalSubtotal(userId, cartItems);
     
  
     
  
        let totalAmountOfEachProduct = [];
        for (i = 0; i < cartItems.products.length; i++) {
          let total = cartItems.products[i].quantity * parseInt(cartItems.products[i].price);
          totalAmountOfEachProduct.push(total);
        }
        res.render("checkout", {
          userData,
          cartItems,
          totalandSubTotal,
          totalAmountOfEachProduct
        })
     
    } catch (error) {
      console.log(error);
    }
  }

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
}