
const session = require('express-session');
const islogin = (req, res, next) => {
    if (req.session.user) {
        console.log("User is already logged in");
        res.redirect("/userhome");
    } else {
        next();
    }
}

const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        // User is authenticated, continue with the request
        next();
    } else {
        // User is not authenticated, redirect to login page or handle as needed
        res.redirect('/login');
    }
};


const isLogout = (req, res, next) => {
    try {
        if (req.session.user) {
            next();
        } else {
            res.redirect('/login');
        }
    } catch (err) {
        console.log(err);
    }
}


module.exports = {islogin, isAuthenticated, isLogout}
