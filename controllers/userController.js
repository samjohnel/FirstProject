const { name } = require("ejs");
const otpHelper = require("../helper/otpHelper");
const user = require("../models/userModel");
const User = require("../models/userModel");

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
        res.render("otpPage");
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
        if (userEnteredOtp === storedOtp) {
            // Create a new user using the session data
            const newUser = await User.create(userData);
            console.log('New user created:', newUser);
        } else {
            // Handle invalid OTP
            console.log('Invalid OTP');
            // You may want to redirect the user to a different page or show an error message
        }

        // Redirect the user after OTP verification
        res.redirect('/login');
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
            isActive: 0,
        };

        // Save user data to session (if needed)
        req.session.userData = userData;

        // Create a new user document using the User model
       
        // Redirect to a success page or handle success response
        res.redirect('/success-page'); // Redirect to a success page

    } catch (error) {
        // Handle error
        console.error('Error creating user:', error);
        // Render an error page or handle error response
        res.status(500).send('Internal Server Error'); // Render an error page or send an error response
    }
};

module.exports = {
    userLogin, getUserSignUp, otpRedirect, getOtpPage, otpPost, registerPost
}