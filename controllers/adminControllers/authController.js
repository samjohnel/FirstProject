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
    const result = await adminModel.findOne({email: req.body.email});
    if (result) {
       // req.body.password === result.password ? (req.session.admin = result._id, res.render('adminHome')) :  req.flash('message', 'Invalid Password'), res.redirect('/admin/adminLogin');
       if(req.body.password === result.password) {
        res.render("adminHome")
        }else{
            req.flash('message', 'Invalid Password');
            res.redirect('/admin');
            }
    } else {
        req.flash('message', 'Invalid Email');
        res.redirect('/admin');
    }
}

const adminLogout = (req, res) => {
    req.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

    if (req.session.admin) {
        delete req.session.admin;
        req.flash('message', 'Logged out successfully');
        res.redirect('/admin');
    } else {
        res.redirect('/admin');
    }
}

module.exports = {adminLoginLoad, adminLoginPost, adminLogout};