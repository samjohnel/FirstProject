const adminModel = require('../../models/adminModel');

const adminLoginLoad = (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    if (req.session.admin) {
        res.redirect('/admin/adminHome');
    }
    const message = req.flash('message');
    res.render("adminLogin", { message: message });
}

const adminLoginPost = async (req, res) => {
    const result = await adminModel.findOne({ email: req.body.email });
    console.log("This is the result", req.body.password);

    if (!result) {
        // If no admin with the provided email exists
        return res.render("adminLogin", { errormessage: "Wrong email" });
    }

    // If an admin with the provided email exists, check the password
    if (req.body.password === result.password) {
        // If the password is correct, set the session and redirect to adminHome
        req.session.admin = result._id;
        return res.render("adminHome");
    } else {
        // If the password is incorrect, render adminLogin with error message
        return res.render('adminLogin', { errormessage: "Wrong password" });
    }
}


const adminLogout = (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

    if (req.session.admin) {
        console.log("THis is req.session.admin", req.session.admin)
        delete req.session.admin;
        req.flash('message', 'Logged out successfully');
        res.redirect('/admin');
    } else {
        res.redirect('/admin');
    }
}

module.exports = {adminLoginLoad, adminLoginPost, adminLogout};