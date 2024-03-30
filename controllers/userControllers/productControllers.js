const productModel = require('../../models/productModel');

const productViewLoad = async (req, res) => {
 
    const prpduct = await productModel
       .findById({_id: id})
       .populate('productCategory')
       .lean();

}


module.exports = {productViewLoad};