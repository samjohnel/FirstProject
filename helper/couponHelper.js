const couponModel = require("../models/couponModel");
const cartModel = require("../models/cartModel");
const moment=require("moment");
const ObjectId = require("mongoose").Types.ObjectId; 1
const voucherCode = require("voucher-code-generator");

const findAllCoupons = () => {
  return new Promise(async (resolve, reject) => {
      try {
          const result = await couponModel
              .find()
              .sort({ createdAt: -1 }) // Sort by 'createdAt' in descending order
              .lean();
          resolve(result);
      } catch (error) {
          reject(error);
      }
  });
};


  const addCoupon = (couponData) => {
    return new Promise(async (resolve, reject) => {
     
      const dateString = couponData.couponExpiry;
      // const [day, month, year] = dateString.split(/[-/]/);
  
      // const paddedMonth = month.padStart(2, "0");
      // const paddedDay = day.padStart(2, "0");
  
      // const dateString = new Date(`${year}-${paddedMonth}-${paddedDay}`);
      const date = moment(dateString, 'YYYY-MM-DD');
      const convertedDate = date.toISOString();
  
      let couponCode = voucherCode.generate({
        length: 6,
        count: 1,
        charset: voucherCode.charset("alphabetic"),
      });
  
      const coupon = new couponModel({
        couponName: couponData.couponName,
        code: couponCode[0],
        discount: couponData.couponAmount,
        expiryDate: convertedDate,
      });
  
      await coupon
        .save()
        .then(() => {
          resolve(coupon._id);
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  const getCouponData = (couponId) => {
    return new Promise(async (resolve, reject) => {
      await couponModel
        .findOne({ _id: couponId })
        .lean()
        .then((result) => {
          resolve(result);
        });
    });
  };


  const editTheCouponDetails = (editedCouponData) => {
    return new Promise(async (resolve, reject) => {
      let coupon = await couponModel.findById({
        _id: editedCouponData.couponId,
      });
      coupon.couponName = editedCouponData.couponName;
      coupon.discount = editedCouponData.couponAmount;
      coupon.expiryDate = editedCouponData.couponExpiry;
  
      await coupon.save();
      resolve(coupon);
    });
  };

  const deleteSelectedCoupon = (couponId) => {
    return new Promise(async (resolve, reject) => {
      let result = await couponModel.findOneAndDelete({ _id: couponId });
      resolve(result);
    });
  };
  
  const  applyCouponHelper = (userId, couponCode) => {
    return new Promise(async (resolve, reject) => {
      console.log(couponCode);
      let coupon = await couponModel.findOne({ code: couponCode })
      console.log("this is apply coupon",coupon);
      if (coupon && coupon.isActive === "Active") {
        if (!coupon.usedBy.includes(userId)) {
          let cart = await cartModel.findOne({ user: new ObjectId(userId)});
          console.log(cart)
          const discount = coupon.discount;
          console.log(cart.totalAmount,discount);
          cart.totalAmount = cart.totalAmount - discount;
          cart.coupon = couponCode;
  
          await cart.save();
          console.log(cart)
  
          
          resolve({
            discount,
            cart,
            status: true,
            message: "Coupon applied successfully",
          });
        } else {
          resolve({ status: false, message: "This coupon is already used" });
        }
      } else {
        resolve({ status: false, message: "Invalid Coupon code" });
      }
    });
  };

module.exports = {
    findAllCoupons,
    addCoupon,
    getCouponData,
    editTheCouponDetails,
    deleteSelectedCoupon,
    applyCouponHelper,
}