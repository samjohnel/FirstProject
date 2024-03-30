// const sharp = require("sharp");
// const fs = require("fs");

// const resizeImages = async (req, res, next) => {
//     try {
//         for (let i = 0; i < req.files.length; i++) {
//             const file = req.files[i];
            
//             try {
//                 const resizeBuffer = await sharp(file.path)
//                     .resize({ width: 636, height: 500})
//                     .toBuffer();

//                 const resizePath = `./public/uploads/resized/${file.filename}`; 
//                 fs.writeFileSync(resizePath, resizeBuffer);

//                 file.path = resizePath;
//             } catch (resizeError) {
//                 console.log("Error in resizing image:", resizeError);
//                 // You can choose to throw the error here or handle it accordingly
//             }
//         }
//         next();
//     } catch (error) {
//         console.log("Error in processing images:", error);
//         res.status(500).send("Error in resizing image");
//     }
// };

// module.exports = { resizeImages };


const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const resizeImages = async (req, res, next) => {
    try {
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            
            const resizeBuffer = await sharp(file.path)
                .resize({ width: 636, height: 500})
                .toBuffer();

            const resizeDir = './public/uploads/resized';
            if (!fs.existsSync(resizeDir)) {
                fs.mkdirSync(resizeDir, { recursive: true });
            }

            const resizePath = path.join(resizeDir, file.filename);
            fs.writeFileSync(resizePath, resizeBuffer);

            file.path = resizePath;
        }
        next();
    } catch (error) {
        console.log(error);
        res.status(500).send("Error in resizing image");
    }
};

module.exports = { resizeImages };