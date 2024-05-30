const mongoose=require('mongoose')

const cartSchema= new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users",
        required:true
    },
    products:[
        {
            productItemId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'Product',
                required:true
            },
            size:{
                type: String,
                require:true
            },
            quantity: {
                type: Number,
                required: true,
                default: 1,
              },
              subTotal:{
                type: Number,
                required:true
              }
        }
    ],
    coupon:{
        type:String,
        default:null  
    },
    totalAmount:{
        type:Number,
        required:true
    },
},
{
    timestamps:true
}
)

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;