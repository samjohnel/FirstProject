
const express = require("express");
const adminRoute = require("./routes/adminRoute");
const userRoute = require("./routes/userRoute");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const mongoose = require("mongoose");
const flash = require("express-flash");
const noCache = require("nocache");
const nocache = require("nocache");
const app = express();
let port = 2002;

mongoose.connect("mongodb://localhost:27017/SHANAPPARELS");
mongoose.connection.on("connected", (req, res) => {
    console.log("connected to mongodb");
})


app.use("/public", express.static(path.join(__dirname,"/public")));
app.use(bodyParser.json());

app.use(nocache());

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

app.use(flash());

app.use((req, res, next) => {
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
})

app.use(express.urlencoded({extended : true}));
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", [path.join(__dirname, "views/user"), path.join(__dirname, "views/admin")])
app.use("/admin", adminRoute);

app.use("/", userRoute)
app.listen(port, () => {
    console.log("Server Started on http://localhost:2002/login and admin on http://localhost:2002/admin");
})
