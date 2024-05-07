const productModel = require('../../models/productModel');

const productViewLoad = async (req, res) => {
    try{
    const products = await productModel
        .find()
       .lean();

       console.log(products);

    res.render('homepage', { products });
} catch (err) {
    console.log(err);
} 
}

const searchProduct = async (req, res, next) => {
    let payload = req.body.payload.trim();
    try {
      let searchResult = await productModel
        .find({ productName: { $regex: new RegExp(payload + ".*", "i") } })
        .exec();
      searchResult = searchResult.slice(0, 5);
      res.json({ searchResult });
    } catch (error) {
      // res.status(500).render("error", { error, layout: false });
      console.log(error);
    }
  };


module.exports = {
                  productViewLoad,
                  searchProduct,
                };