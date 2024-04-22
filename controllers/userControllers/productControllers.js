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


module.exports = {productViewLoad};