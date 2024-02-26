import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import JWT from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
       
        const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        console.log("TOKEN :",token)

        if(!token){
            throw new ApiError(401,"Unauthorized request")
        }
    
        const decodedToken = await JWT.verify(token,process.env.ACCESS_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id)
                               .select("-password -refreshToken");
        if(!user){
            // TODO: discuss
            throw new ApiError(401,"Invalid Access Token")
        } 
        
        req.user = user;
        next()
    } catch (error) {
        console.log("auth == 4 =>",error)
        throw new ApiError("Invalid Access Token");
    }
})