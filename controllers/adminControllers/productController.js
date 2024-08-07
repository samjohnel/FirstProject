const productModel = require('../../models/productModel');
const categoryHelper = require('../../helper/categoryHelper');
const productHelper = require('../../helper/productHelper');

const productListLoad = async (req, res) => {
    const products = await productHelper.getAllProducts();
    res.render("productList", { products: products });
};

const addProductLoad = (req, res) => {
    categoryHelper.getAllCategory().then((response) => {
        res.render("addProduct", { categories: response });
    });
};

// const addProductPost = (req, res) => {
//     const body = req.body;
//     const files = req.files;
//     productHelper.addProduct(body, files)
//     .then((response) => {
//         res.redirect("/admin/productList");
//     })
//     .catch((error) => {
//         console.log(error);
//     });
// };

const addProductPost=(req,res)=>{
  const body=req.body
  const files=req.files
  productHelper
  .addProduct(body,files)
  .then((response)=>{
    res.redirect('/admin/productList')
  })
  .catch((error)=>{
    console.log(error);
  })
}

const editProductLoad = async (req, res) => {
    const id = req.params.id;
    const category = await categoryHelper.getAllCategory();
    const productDetail = await productModel.findOne({ _id: id });
    res.render("editProduct", {
      product: productDetail,
      category: category,
    });
  };

  // const editProductPost = async (req, res) => {
  //   try {
  //     const product = await productModel.findById(req.params.id);
  //     if (!product) {
  //       res.redirect("/admin/productList");
  //     }
     
  //     const totalAmount =
  //       parseInt(req.body.smallQuantity) +
  //       parseInt(req.body.mediumQuantity) +
  //       parseInt(req.body.largeQuantity);
  //     console.log(totalAmount);
  //     const check = await productHelper.checkDuplicateFunction(
  //       req.body,
  //       req.params.id
  //     );
  //     const productQuantity = [
  //       {
  //         size:'small',
  //         quantity:req.body.smallQuantity
  //       },
  //       {
  //         size:'medium',
  //         quantity:req.body.mediumQuantity
  //       },
  //       {
  //         size:'large',
  //         quantity:req.body.largeQuantity
  //       }
  //     ]
  //     switch (check.status) {
  //       case 1:
  //         product.productName = req.body.productName;
  //         product.productDescription = req.body.productDescription;
  //         product.productPrice = req.body.productPrice;
  //         product.productQuantity = productQuantity;
  //         product.totalQuantity = totalAmount;
  //         product.productCategory = req.body.productCategory;
  //         product.productDiscount = req.body.productDiscount;
  //         break;
  //       case 2:
  //         product.productName = req.body.productName;
  //         product.productDescription = req.body.productDescription;
  //         product.productPrice = req.body.productPrice;
  //         product.productQuantity = productQuantity;
  //         product.totalQuantity = totalAmount;
  //         product.productCategory = req.body.productCategory;
  //         product.productDiscount = req.body.productDiscount;
  //         break;
  //       case 3:
  //         console.log("Product already Exists");
  //         break;
  //       default:
  //         console.log("error");
  //         break;
  //     }
  //     if (req.files) {
  //       const filenames = await productHelper.editImages(
  //         product.image,
  //         req.files
  //       );
  //       if (filenames.status) {
  //         product.image = filenames.map((path) => path.substring(2));
  //       } else {
  //         product.image = filenames;
  //       }
  //     }
  //     await product.save();
  //     res.redirect("/admin/productList");
  //   } catch (err) {
  //     console.log(err);
  //   }
  // };


  const deleteProduct = (req, res) => {
    const id = req.params.id;
    productHelper
      .productListUnlist(id)
      .then((response) => {
        if (response.productStatus) {
          res.json({ message: "Listed Successfuly" });
        } else {
          res.json({ message: "Unlisted Succesfuly" });
        }
      })
      .catch((error) => {
        res.json({ error: "Failed" });
      });
  };



module.exports = { productListLoad, addProductLoad, addProductPost, editProductLoad, deleteProduct };