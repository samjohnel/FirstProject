const { name } = require("ejs");
const otpHelper = require("../helper/otpHelper")

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

module.exports = {
    userLogin, getUserSignUp, otpRedirect, getOtpPage
}