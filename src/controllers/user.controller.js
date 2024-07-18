import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiResponse.js";


const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new apiError(500, "Something went wrong while generating refresh and access token")
    }
}


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
    // console.log("email: ", email);

    if (
        [fullName , email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new apiError(400, "All field are required")
    }

    const existedUser = await User.findOne({
        $or : [{ username },{ email }]
    })
    if(existedUser){
        throw new apiError(409, "User with email or username exists")
    }
    // console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    // let coverImageLocalPath;
    // if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    //     coverImageLocalPath = req.files.coverImage[0].path
    // }

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

const loginUser = asyncHandler(async(req, res) => {
    /*
    req body -> data
    username or Mail 
    find user
    password validation  
    access and refresh token 
    send cookie
    */
   const {email,username,password} = req.body

   if(!username || !email){
    throw new apiError(400, "Username and Password is required")
   }

   const user = await User.findOne({
    $or: [{username}, {email}]
   })
   
   if(!user){
    throw new apiError(400, "user does not exist")
   }

   const ispasswordValid = await user.isPasswordCorrect(password)

   if(!ispasswordValid){
    throw new apiError(401, "Invalid user credentials")
   }

   const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

   const loggedInUser = await User.findById(user._id).select(" -password -refreshToken ") //optional

   const options = { 
    httpOnly: true,
    secure: true
   }

   return res
   .status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refreshToken", refreshToken, options)
   .json(
    new apiResponse(
        200,
        {
            user: loggedInUser, accessToken, refreshToken
        },
        "User logged in succesfully"
    )
   )

// const logoutUser = asyncHandler(async(req, res) => {
//     await User.findByIdAndUpdate(
//         req.user._id,{
//             $set:{ 
//                 refreshToken: undefined
//             }
//         },
//         {
//             new: true
//         }
//     ) 
//     const options = { 
//         httpOnly: true,
//         secure: true
//     }  
//     return res
//     .status(200)
//     .clearCookie("accessToken", options)
//     .clearCookie("refreshToken", options)
//     .json(new apiResponse (200, {},"User logged out successfully"))
// })

})

export {registerUser, loginUser , /*logoutUser*/}