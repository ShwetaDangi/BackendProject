import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler( async(req, res) =>{
    // get user details from frontend
    // validation - not empty
    // cheak if user alredy exists : by username or mail
    // cheak for images , cheak for avatar
    // upload em to cloudinary , avatar // cheak user, multer and cloudinary
    // create user object - create entry in db
    // remove password and refreshToken field from response
    // cheak for user creation
    // return resp ose


    const {fullName, email, username, password}= req.body
    console.log("email: ", email);

    if (
        [fullName , email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new apiError(400, "All field are required")
    }

    const existedUser = User.findOne({
        $or : [{ username },{ email }]
    })
    if(existedUser){
        throw new apiError(409, "User with email or username exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new apiError(400, "Avatar file is required")
    }
 
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar){
        throw new apiError(400, "Avatar file is required")
    }
    
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "", // bcz we havent cheaked if its been uploded so well pass another condition so that database wont crash
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        " -password -refreshToken "
    )
    if (!createdUser){
        throw new apiError(500, "something went wrong while registering the user")
    }

    return res.status(201).json(
        new apiResponse (200, createdUser, "User registered successfully")
    )

})

export {registerUser }