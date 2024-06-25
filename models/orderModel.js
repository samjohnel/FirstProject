const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
  products: [
    {
      product: {
        type: mongoose.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      size: {
        type: String,
        required: true,
      },
      discount: {
        type: Number,
        default: 0, // Assuming discount is optional
      },
      productPrice: {
        type: Number,
        required: true,
      },
      status: {
        type: String,
        enum: [
          "pending",
          "processing",
          "confirmed",
          "outForDelivery",
          "shipped",
          "delivered",
          "cancelled",
          "return pending",
          "returned",
          "payment pending",
        ],
        default: "pending",
      },
      returnReason: {
        type: String,
        default: null, // Make it optional
      },
    },
  ],
  address: {
    name: String,
    house: String,
    street: String,
    area: String,
    district: String,
    state: String,
    country: String,
    pin: Number,
    phone: Number,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  orderedOn: {
    type: Date,
    default: Date.now,
  },
  deliveredOn: {
    type: Date,
  },
  status: {
    type: String,
    enum: [
      "pending",
      "processing",
      "confirmed",
      "outForDelivery",
      "shipped",
      "delivered",
      "cancelled",
      "return pending",
      "returned",
      "payment pending",
    ],
    default: "pending",
  },
  orderId: {
    type: Number,
    default: () => Math.floor(100000 + Math.random() * 900000),
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  couponAmount: {
    type: Number,
    default: 0,
  },
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
