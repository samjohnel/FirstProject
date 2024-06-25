const productModel = require('../models/productModel');
const fs = require('fs');

const getAllProducts = () => {
    return new Promise(async (resolve, reject) => {
        const product = await productModel
        .aggregate([
            {
                $lookup: {
                    from: "categories",
                    localField: "productCategory",
                    foreignField: "_id",
                    as: "category",
                },
            },
        ])
        .then((result) => {
            resolve(result);
        })
        .catch((error) => {
            console.log(error);
        });
    });
                    
};

// const getAllActiveProducts = () => {
//   return new Promise(async (resolve, reject) => {
//     try {

//       const result = await productModel.aggregate([
//         {
//           $lookup: {
//             from: "Category",
//             localField: "productCategory",
//             foreignField: "_id",
//             as: "category",
//           },
//         },
//         {
//           $match: {
//             productStatus: true,
//             "category.isListed": true,
//           },
//         },
//       ]);
//       console.log("This is the result", result);

//       resolve(result);
//     } catch (error) {
//       console.error(error);
//       reject(error);
//     }
//   });
// };


const getAllActiveProducts = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await productModel.aggregate([
        {
          $lookup: {
            from: "categories", // Corrected collection name
            localField: "productCategory",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $match: {
            productStatus: true,
            "category": { $ne: [] } // Check if category array is not empty
          },
        },
      ]);
      resolve(result);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
};



const addProduct = (data, files,req,res) => {


  return new Promise(async (resolve, reject) => {
   
    let images=[]
    for(const file of files){
        images.push(file.filename);
    }
    let totalQuantity =
      parseInt(data.smallQuantity) +
      parseInt(data.mediumQuantity) +
      parseInt(data.largeQuantity);

    const productQuantity = [
      {
        size: "S",
        quantity:parseInt(data.smallQuantity),
      },
      {
        size: "M",
        quantity:parseInt(data.mediumQuantity),
      },
      {
        size: "L",
        quantity:parseInt(data.largeQuantity),
      },
    ];

    await productModel
      .create({
        productName: data.name,
        productDescription: data.description,
        productCategory: data.productCategory,
        productPrice: data.price,
        productQuantity: productQuantity,
        productDiscount: data.discount,
        totalQuantity: totalQuantity,
        image: images,
      })
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        console.log(error);
      });
  });
};



const checkDuplicateFunction = (body, productId) => {
    return new Promise(async (resolve, reject) => {
      const checker = await productModel.findOne({ _id: productId });
      const check = await productModel.findOne({
        productName: body.productName,
      });
  
      if (!check) {
        resolve({ status: 1 });
      } else if (productId == check._id) {
        resolve({ status: 2 });
      } else {
        resolve({ status: 3 });
      }
    });
  };


  const editImages = async (oldImages, newImages) => {
    return new Promise((resolve, reject) => {
      if (newImages && newImages.length > 0) {
        // if new files are uploaded
        let filenames = [];
        for (let i = 0; i < newImages.length; i++) {
          filenames.push(newImages[i].filename);
        }
        // delete old images if they exist
        if (oldImages && oldImages.length > 0) {
          for (let i = 0; i < oldImages.length; i++) {
            fs.unlink("public/uploads/" + oldImages[i], (err) => {
              if (err) {
                reject(err);
              }
            });
          }
        }
        resolve(filenames);
      } else {
        // use old images if new images are not uploaded
        resolve(oldImages);
      }
    });
  }


  const productListUnlist = (id) => {
    return new Promise(async (resolve, reject) => {
      const result = await productModel.findOne({ _id: id });
      result.productStatus = !result.productStatus;
      result.save();
      resolve(result);
    });
  };

  const editProductPost = async (req, res) => {
    try {
      const product = await productModel.findById(req.params.id);
      if (!product) {
        res.redirect("/admin/productList");
      }
     
      const totalAmount =
        parseInt(req.body.smallQuantity) +
        parseInt(req.body.mediumQuantity) +
        parseInt(req.body.largeQuantity);

      // const validate = true;
      // if (req.body.smallQuantity < 0) {
      //   validate = false;
      // }
      // if (req.body.mediumQuantity < 0) {
      //   validate = false;
      // } 
      // if (req.body.largeQuantity < 0) {
      //   validate = false;
      // }
  
      const check = await checkDuplicateFunction(
        req.body,
        req.params.id
      );
      const productQuantity = [
        {
          size:"S",
          quantity:req.body.smallQuantity
        },
        {
          size:"M",
          quantity:req.body.mediumQuantity
        },
        {
          size:"L",
          quantity:req.body.largeQuantity
        }
      ]
      switch (check.status) {
        case 1:
          product.productName = req.body.productName;
          product.productDescription = req.body.description;
          product.productPrice = req.body.productPrice;
          product.productQuantity = productQuantity;
          product.totalQuantity = totalAmount;
          product.productCategory = req.body.productCategory;
          product.productDiscount = req.body.productDiscount;
          break;
        case 2:
          product.productName = req.body.productName;
          product.productDescription = req.body.description;
          product.productPrice = req.body.productPrice;
          product.productQuantity = productQuantity;
          product.totalQuantity = totalAmount;
          product.productCategory = req.body.productCategory;
          product.productDiscount = req.body.productDiscount;
          break;
        case 3:
          break;
        default:
          console.log("error");
          break;
      }
      if (req.files) {
        const filenames = await editImages(
          product.image,
          req.files
        );
        if (filenames.status) {
          product.image = filenames;
        } else {
          product.image = filenames;
        }
      }
      await product.save();
      res.redirect("/admin/productList");
    } catch (err) {
      console.log(err);
    }
  };
            

module.exports = { getAllProducts, addProduct, checkDuplicateFunction, editImages, productListUnlist, editProductPost, getAllActiveProducts};