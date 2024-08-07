const moment = require('moment');
const orderHelper = require('../../helper/orderHelper');
const user = require("../../models/userModel");


const adminOrderPageLoad = async (req, res) => {
  try {
      let allOrders = await orderHelper.getAllOrders();
      // // Sort orders by orderedOn date in descending order
      // allOrders.sort((a, b) => {
      //     return new Date(b.orderedOn) - new Date(a.orderedOn);
      // });

      // Format dates and render the template
      for (const order of allOrders) {
          const dateString = order.orderedOn;
          order.formattedDate = moment(dateString).format("MMMM Do, YYYY");
      }
      console.log("after",allOrders);

      res.render("orderPage", { allOrders });
  } catch (error) {
      console.log(error);
  }
};



const adminOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;

    const productDetails = await orderHelper.getOrderDetailsOfEachProduct(orderId);
    const userData = await user.findOne({ _id: productDetails[0].user });

    let grandTotal = 0;

    productDetails.forEach(product => {
      product.formattedDate = moment(product.orderedOn).format("MMMM Do, YYYY");

      const discountedPrice = product.product.productPrice * (1 - (product.products.discount / 100));

      const totalAmountForProduct = discountedPrice * product.products.quantity;

      grandTotal += totalAmountForProduct;

      product.formattedTotal = totalAmountForProduct.toFixed(2);
      product.products.formattedProductPrice = discountedPrice.toFixed(2);
    });

    const couponAmount = productDetails[0].couponAmount || 0; 

    const grandTotalAfterCoupon = grandTotal - (grandTotal * (couponAmount / 100));

    const formattedGrandTotal = `₹${grandTotalAfterCoupon.toFixed(2)}`;

    res.render("orderDetail", { productDetails, userData, formattedGrandTotal });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};



const changeOrderStatusOfEachProduct = async (req, res) => {
  const orderId = req.params.orderId;
  const productId = req.params.productId;
  const status = req.body.status;
  const result = await orderHelper.changeOrderStatusOfEachProduct(
    orderId,
    productId,
    status,
  );
  if (result) {
    res.json({ status: true });
  } else {
    res.json({ status: false });
  }
};

const loadSalesReport = async (req, res) => {
  console.log("Getting in");
  try {
    orderHelper
      .salesReport()
      .then((response) => {
        console.log(response);
        response.forEach((order) => {
          const orderDate = new Date(order.orderedOn);
          const formattedDate = orderDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
          order.orderedOn = formattedDate;
        });

        res.render("salesReport", { sales: response });
      })
      .catch((error) => {
        console.log(error);
      });
  } catch (error) {
    console.log(error);
  }
};

const loadSalesReportDateSort = async (req, res) => {
  const startDate = req.body.startDate;
  const endDate = req.body.endDate;
  orderHelper
    .salesReportDateSort(startDate, endDate)
    .then((response) => {
      response.forEach((order) => {
        const orderDate = new Date(order.orderedOn);
        const formattedDate = orderDate.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        order.orderedOn = formattedDate;
      });

      res.json({ sales: response });
    })
    .catch((error) => {
      console.log(error);
    });
};


module.exports = {
    adminOrderPageLoad, 
    adminOrderDetails,
    changeOrderStatusOfEachProduct,
    loadSalesReport,
    loadSalesReportDateSort,
}