const moment = require('moment');
const orderHelper = require('../../helper/orderHelper');
const user = require("../../models/userModel");


const adminOrderPageLoad = async (req, res) => {
  try {
      // Retrieve all orders
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

      // Render the orderPage template with sorted orders
      res.render("orderPage", { allOrders });
  } catch (error) {
      console.log(error);
  }
};


// const adminOrderDetails = async (req, res) => {
//   try {
//       const orderId = req.params.id;

//       // Fetch order details
//       const productDetails = await orderHelper.getOrderDetailsOfEachProduct(orderId);
//       console.log("This is the productDetails", productDetails)
//       const userData = await user.findOne({ _id: productDetails[0].user });

//       // Initialize grand total
//       let grandTotal = 0;

//       productDetails.forEach(product => {
//           // Format orderedOn date
//           product.formattedDate = moment(product.orderedOn).format("MMMM Do, YYYY");

//           // Calculate discounted product price
//           const discountedPrice = product.product.productPrice * (1 - (product.product.productDiscount / 100));
          
//           // Calculate total amount for the product (considering quantity)
//           const totalAmountForProduct = discountedPrice * product.products.quantity;

//           // Add to the grand total
//           grandTotal += totalAmountForProduct;

//           // Store the formatted total and formatted product price
//           product.formattedTotal = totalAmountForProduct.toFixed(2);
//           product.products.formattedProductPrice = discountedPrice.toFixed(2);
//       });

//       // Format the grand total to display as currency (assuming Indian Rupee)
//       const formattedGrandTotal = `₹${grandTotal.toFixed(2)}`;

//       // Pass formatted grand total and product details to the template
//       res.render("orderDetail", { productDetails, userData, formattedGrandTotal });
//   } catch (error) {
//       console.log(error);
//       // Handle error response
//       res.status(500).send("Internal Server Error");
//   }
// };

const adminOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;

    // Fetch order details
    const productDetails = await orderHelper.getOrderDetailsOfEachProduct(orderId);
    const userData = await user.findOne({ _id: productDetails[0].user });

    // Initialize grand total
    let grandTotal = 0;

    // Iterate through each product detail
    productDetails.forEach(product => {
      // Format orderedOn date
      product.formattedDate = moment(product.orderedOn).format("MMMM Do, YYYY");

      // Calculate discounted product price
      const discountedPrice = product.product.productPrice * (1 - (product.products.discount / 100));

      // Calculate total amount for the product (considering quantity)
      const totalAmountForProduct = discountedPrice * product.products.quantity;

      // Add to the grand total
      grandTotal += totalAmountForProduct;

      // Store the formatted total and formatted product price
      product.formattedTotal = totalAmountForProduct.toFixed(2);
      product.products.formattedProductPrice = discountedPrice.toFixed(2);
    });

    // Apply any coupon amount if available
    const couponAmount = productDetails[0].couponAmount || 0; // Assuming coupon amount is consistent across products

    // Calculate grand total after applying coupon discount if applicable
    const grandTotalAfterCoupon = grandTotal - (grandTotal * (couponAmount / 100));

    // Format the grand total to display as currency (assuming Indian Rupee)
    const formattedGrandTotal = `₹${grandTotalAfterCoupon.toFixed(2)}`;

    // Pass formatted grand total and product details to the template
    res.render("orderDetail", { productDetails, userData, formattedGrandTotal });
  } catch (error) {
    console.log(error);
    // Handle error response
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