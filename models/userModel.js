const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        reqired: true
    }, 
    email: {
        type: String,
        required: true
    },
    mobile: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    address:[
        {
            housename:{
                type:String
            },
            streetname:{
                type:String
            },
            areaname:{
                type:String
            },
            districtname:{
                type:String
            },
            statename:{
                type:String
            },
            countryname:{
                type:String
            },
            pin:{
                type:Number
            }
        }
    ],
})

const User = mongoose.model("User", userSchema);
module.exports = User;