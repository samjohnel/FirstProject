
const loadLogin = (req, res) => {
    try {
        res.render("adminLogin")
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    loadLogin
}

                    