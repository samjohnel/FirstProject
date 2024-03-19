const admin = require("../models/adminModel");
const users = require("../models/userModel");

const loadLogin = (req, res) => {
    try {
         const error = req.query.error;
        res.render("adminLogin",{error:error})
    } catch (error) {
        console.log(error);
    }
}

const loadLogins = (req, res) => {
    try {
        res.render("adminHome");
    } catch (error) {
        console.log(error);
    }
}

const loginAdmin = async (req, res) => {
    try {
        // Log the entire request body to inspect its contents
        console.log(req.body);

        const logemail = req.body.email;
        console.log(logemail);

        if (!logemail) {
            return res.status(400).json({ error: "Email is required" });
        }

        // Check admin credentials here
        const adminData = await admin.findOne({ email: logemail });
        if (adminData) {
            if (adminData.password === req.body.password) {
                return res.redirect("/adminLogins");
            } else {
                // Invalid credentials
                // req.flash("error", "Invalid credentials");
                // return res.render("adminLogin");
                res.redirect("/adminLogin?error=Invalid credentials")
            }
        } else {
            // Admin not found
            req.flash("error", "Admin not found");
            return res.render("adminLogin");
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const userList = async (req, res) => {
    try {
        const userList = await users.find();
// res.send('userlist')
    res.render("usersList", { users:userList });
    } catch (error) {
        console.log(error);     
    }
}

const category = (req, res) => {
    try {
        res.render("category");
        
    } catch (error) {
        console.log(error);
    }
}





module.exports = {
    loadLogin, loginAdmin, loadLogins, userList, category
}


                    