const { name } = require("ejs");
const otpHelper = require("../../helper/otpHelper");
const user = require("../../models/userModel");
const User = require("../../models/userModel");
const flash = require('express-flash');
const session = require('express-session');

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
            console.log(userInfo);
            if(userInfo.password === logpassword) {
                req.session.user = userInfo._id; 
                console.log(req.session.user);
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

const userHome = (req, res) => {
    try {
        res.render("homepage");
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





module.exports = {
    userLogin, getUserSignUp, otpRedirect, getOtpPage, otpPost, registerPost, loginPost, verifyCredentials, userHome, logout
}