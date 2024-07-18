import { apiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import  Jwt  from "jsonwebtoken";
import { User } from "../models/user.model";

export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        const token = req.cookie?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if (!token){
            throw new apiError(400, "Unauthorised request")
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        
        const user = await User.findById(decodedToken?._id).select(" -password -refreshToken ")
    
        if(!user){
            //TODO: discuss about frontend 
            throw new apiError(401, "invalid access token")
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new apiError(401, error?.message || "invalid access token")
    }
    
})