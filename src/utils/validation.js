const validator = require("validator");

const validateData = (req)=>{

    const {name,email,password,gender} = req.body;

    if(!name){
        throw new Error("Name is required");
    }else if(!validator.isEmail(email)){
        throw new Error("Please Add valid Email");

    }else if(!validator.isStrongPassword(password)){
        throw new Error("Please Add Strong Password");
    }

};

const validateEditData = (req)=>{
    const allowedFields = ["name", "gender", "skills"," PhotoUrl","description","location"]; // Allowed fields for editing
    const updates = Object.keys(req.body); // Extract keys from the request body
    
    // Check if all fields in the request are allowed
    const isValidUpdate = updates.every((field) => allowedFields.includes(field));

    return isValidUpdate;
    
}
const ValidatePassword = (password)=>{
   
    if (!password) {
        throw new Error("Password is required.");
      }
    if(!validator.isStrongPassword(password)){
        throw new Error("kamjor hai password sahi karo");
    }


}

module.exports = {validateData , validateEditData,ValidatePassword};