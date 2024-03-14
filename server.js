const express = require("express");
const app = express();
const adminRoute = require("./routes/adminRoute");
const userRoute = require("./routes/userRoute");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
let port = 2002;

app.use("/", adminRoute);
app.use("/public", express.static(path.join(__dirname,"/public")));
app.use(bodyParser.json());
app.use(session({
    secret: '1231fdsdfssg33435',
    resave: false,
    saveUninitialized: true
}));
app.use(express.urlencoded({extended : true}))
app.set("view engine", "ejs");
app.set("views", [path.join(__dirname, "views/user"), path.join(__dirname, "views/admin")])
app.use("/", userRoute)
app.listen(port, () => {
    console.log("Server Started on http://localhost:2002/login");
})