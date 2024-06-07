const userModel = require("../models/userModel");
const ObjectId = require("mongoose").Types.ObjectId;
const bcrypt = require("bcrypt");

const addAddress = (body, userId) => {
    console.log("getting into helper");
    console.log(body);
    console.log(userId);
    return new Promise(async (resolve, reject) => {
      try {
        const result = await userModel.updateOne(
          { _id: userId },
          {
            $push: { address: body },
          }
        );
        console.log(result);
        resolve(result);
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  };

  const editAddressHelper = async(userId,addressId,body)=>{
    try {
        console.log("entered into editAddress in userHelper");
        const result = await userModel.updateOne(
            { _id:new ObjectId(userId), 'address._id': new ObjectId(addressId)},
            {$set:{ 'address.$':body }}        
        )
        console.log(result);
        return result
    } catch (error) {
        console.log(error);
    }
}

const deleteAddressHelper= async(userId,addressId)=>{
    try {
      console.log('entered in to delete addrss helper',userId,addressId);
      const result =await userModel.updateOne(
        {_id:userId},
        {$pull:{address:{_id:addressId}}}
      )
      console.log(result);
      if(result){
       
       return result;
      }
      console.log(result);
    } catch (error) {
      console.log(error);    
    }
   }

   const updateUserDetails = (userId, userDetails) => {
       return new Promise(async (resolve, reject) => {
      const user = await userModel.findById(new ObjectId(userId));
  
      let response = {};
      if (user) {
        if (user.isActive) {
          const success = await bcrypt.compare(
            userDetails.password,
            user.password
          );
            console.log(success);

          // if (userDetails.password === user.password) {
          //   success = true;
          // } else {
          //   success = false;
          // }

          if (success) {
  
            if (userDetails.name) {
              user.name = userDetails.name;
            }
            if (userDetails.email) {
              user.email = userDetails.email;
            }
            if (userDetails.phone) {
              user.mobile = userDetails.phone;
            }
           
            await user.save();
            response.status = true;
            resolve(response);
          } else {
            response.message = "Incorrect Password";
            resolve(response);
          }
        }
      }
    });
  };


  const updateUserPassword = async (userId, passwordDetails) => {
    return new Promise(async (resolve, reject) => {
      const user = await userModel.findById(new ObjectId(userId));
      
      console.log(passwordDetails);
      let response = {};
      if (user) {
        if (user.isActive) {
          if (typeof passwordDetails.oldPassword === 'string' && typeof user.password === 'string') {
            const success = await bcrypt.compare(passwordDetails.oldPassword, user.password);
            if (success) {
              if (
                passwordDetails.newPassword &&
                passwordDetails.newPassword === passwordDetails.confirmPassword
              ) {
                user.password = await bcrypt.hash(passwordDetails.newPassword, 10);
                await user.save();
                response.status = true;
                resolve(response);
              }
            } else {
              response.message = "Incorrect Password";
              resolve(response);
            }
          } else {
            response.message = "Invalid input data format";
            resolve(response);
          }
        }
      }
    });
  };

  const getWalletDetails = async (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await userModel.findOne({ _id: userId });
  
        if (result) {
          // Sort the wallet details by date in descending order
          result.wallet.details.sort((a, b) => new Date(b.date) - new Date(a.date));
          resolve(result);
        } else {
          console.log("not found");
          reject("User not found");
        }
      } catch (error) {
        reject(error);
      }
    });
  };
  
  

module.exports = {
                  addAddress, 
                  editAddressHelper,
                  deleteAddressHelper,
                  updateUserDetails,
                  updateUserPassword,
                  getWalletDetails,
                };