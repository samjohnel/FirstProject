const couponHelper = require("../../helper/couponHelper");
const cartModel = require("../../models/cartModel");
const couponModel = require("../../models/couponModel");

const couponListLoad = async (req, res) => {
    try {
      let allCoupons = await couponHelper.findAllCoupons();
  
      for (let i = 0; i < allCoupons.length; i++) {
        allCoupons[i].discount = allCoupons[i].discount;
        allCoupons[i].expiryDate = dateFormatter(allCoupons[i].expiryDate);
      }

      const message = req.flash("message");
  
      if (message) {
        res.render("couponlist", {
          coupons: allCoupons,message:message
        });
      } else {
        res.render("couponlist", {
          coupons: allCoupons,
        });
      }
  
     
    } catch (error) {
      console.log(error)
    }
  };


  function dateFormatter(date) {
    return date.toISOString().slice(0, 10);
  }

  const addCoupon = async (req, res) => {
    try {
      if (req.body.couponAmount > 1000) {
        req.flash("message", "Max Coupon Amount Exceeded");
        res.redirect("/admin/coupons");
      } else if (req.body.couponAmount < 1) {
        req.flash("message", "Minimum Coupon Amount Not Met");
        res.redirect('/admin/coupons');
      } else {
        const coupon = await couponHelper.addCoupon(req.body);
        res.redirect("/admin/coupons");
      }
    
    } catch (error) {
    console.log(error);
    }
  };

  const getEditCoupon = async (req, res) => {
    try {
      const couponData = await couponHelper.getCouponData(req.params.id);
  
      couponData.expiryDate = dateFormatter(couponData.expiryDate);
  
      res.json({ couponData });
    } catch (error) {
      console.log(error);
    }
  };


  const editCoupon = async (req, res) => {
    try {
      let editedCoupon = await couponHelper.editTheCouponDetails(req.body);
  
      res.redirect("/admin/coupons");
    } catch (error) {
      console.log(error);
    }
  };


  const deleteCoupon = async (req, res) => {
    try {
      const result = await couponHelper.deleteSelectedCoupon(req.params.id);
      res.json({ message: "Coupon deleted" });
    } catch (error) {
      console.log(error);
    }
  };

  const applyCoupon = async (req, res) => {
    try {
      const price = parseInt(req.query.price);
    
      const userId = req.session.user;
      const couponCode = req.query.couponCode;
      console.log(price,userId,couponCode);
      if (price > 1500) {
        const result = await couponHelper.applyCouponHelper(userId, couponCode);
       
        if (result.status) {
          res.json({ result:result,status:true,message:"Coupon Applied Successfuly" }); 
        } else {
          res.json({ result:result,status:true,message:result.message }); 
        }
    
      } else {
        res.json({ message: "Please purchase for 1500 above to apply coupon" ,status:false});
      }
    } catch (error) {
      console.log(error);
    }
  };

  const removeCoupon = async (req, res) => {
    try {
     
      const appliedCoupon = req.query.coupon;
      const userId = req.query.userId
      const coupon = await couponModel.findOne({code:appliedCoupon});
      const cart = await cartModel.findOne({user:userId})
    
      if (coupon) {
        cart.coupon = null;
        await cart.save();
        res.json({success:true})
      } else {  
        res.status(404).send('No active coupon found.'); 
      }
    } catch (error) {
      console.error('Error removing coupon:', error);
      res.status(500).send('Internal Server Error');
    }
  };
  
  

module.exports = {
    couponListLoad,
    addCoupon,
    getEditCoupon,
    editCoupon,
    deleteCoupon,
    applyCoupon,
    removeCoupon,
}