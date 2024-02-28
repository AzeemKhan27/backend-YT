import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import  jwt  from "jsonwebtoken"
import { deleteOldImage } from "../utils/oldImageDelete.js"

// making method for generate and refresh tokens because it will increase reusability of code.
const generateAccessAndRefreshToken = async(userId) => {
    try {   
        const user = await User.findById(userId);
       
        const accessToken = await user.generateAccessToken()    //generateAccessToken() and generateRefreshToken() defined in user model.
    
        const refreshToken = await user.generateRefreshToken()  //generateRefreshToken we can save in DB.

        user.refreshToken = refreshToken;
       
        await user.save({ validateBeforeSave : false })

        return { accessToken, refreshToken }

    } catch (error) {
        console.error("Error generating tokens METHOD : == top =>", error);
        throw new ApiError(500,"Something went wrong while generating access and refresh token.")
    }
};

const registerUser = asyncHandler( async (req,res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const {username,email,fullName,password} = req.body;
    console.log(username,email,fullName,password);

    // if(fullName === ""){
    //     throw new ApiError(400,"fullName is required.")
    // }

    //Optimize way
    if([username,email,fullName,password].some((field) => field?.trim() === "")){
        throw new ApiError(400,"All fields are required.")
    }

    const existedUser = await User.findOne({
        $or:[{ username },  { email }]
    })

    if(existedUser){
        throw new ApiError(409,"User already exists with these email/username.")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;  //?. it means optionally
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;  //?. it means optionally

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImageLocalPath[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required.");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar file is required.");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase(),
    })

    const createdUser = await User.findById(user._id).select(
        "-refreshToken -password"
    );

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user.")
    }

    return res.status(201).json(
       new ApiResponse(200, createdUser, "User created successfully.")
    )
})

//login user

const loginUser = asyncHandler( async (req,res) => {

    // req body => data
    // username or email 
    // find user
    // password check
    // access and refresh token
    // send cookie

    const {email, username, password} = req.body;
   
    // if (!(username || email)) {
    //     throw new ApiError(400,"username or email is required.")
    // }
    
    if (!username && !email) {
        throw new ApiError(400,"username or email is required.")
    }

    const user = await User.findOne({
        $or:[{email},{username}]
    })
 
    if(!user){
        throw new ApiError(400,"User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials.")
    }

    //access and refresh token method using.
    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    //now we are sending cookies, and set strict security setting
    const options = {
        httpOnly : true,    // we these options, anybody can't change cookies.
        secure : true
    }

    console.log("refreshToken :: > ",refreshToken);
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "User Logged In Successfully"
            )
    )

})

//Logout User
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

     //now we are sending cookies, and set strict security setting
     const options = {
        httpOnly : true,    // we these options, anybody can't change cookies.
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out successfully."))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if(!incomingRefreshToken){
       throw ApiError(401,"unauthorized request.")
    }

try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id);
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
    
        // we check the refresh token available in db or not
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token has expired or used.")
        }
    
        const options = {
            httpOnly : true,    // we these options, anybody can't change cookies.
            secure : true
        }
    
        const {newRefreshToken, accessToken} = await generateAccessAndRefreshToken(user._id);
    
        return res
        .status(200)
        .cookie("accessToken",accessToken, options)
        .cookie("newRefreshToken",newRefreshToken, options)
        .json(
            new ApiResponse(200,
                {
                    user: user,
                    accessToken,
                    refreshToken: newRefreshToken
                },
                "Access token refreshed successfully."
                )
        )
} catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token")
}

})

const changePassword = asyncHandler(async(req,res,next)=>{
    const { oldPassword, newPassword } = req.body;

    // const { oldPassword, newPassword, confirmPassword } = req.body;
    // if(!(confirmPassword === newPassword)){
    //     throw new ApiError(400,"new and confirm password is not matching.")
    // }

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old Password")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(new ApiResponse(200,{},"password changed successfully."))


})

const getCurrentUser = asyncHandler(async(req,res,next)=>{
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"current user fetched successfully!"))
});

const updateAccountDetails = asyncHandler(async(req,res,next)=>{
    const {fullName, email} = req.body;

    if(!email || !fullName){
        throw new ApiError(400, "All fields are required.")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
           $set : {     // $set operator recieve an object.
             fullName,
             email
           }
       },
        {new : true}

        ).select("-password")

        return res
               .status(200)
               .json(new ApiResponse(200,user,"Account details updated successfully."));
})

const updateUserAvatar = asyncHandler(async(req,res,next)=>{
    const avatarLocalPath = req.file?.path;  // this path coming from postman or client-side.

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing.");
    }

    const oldAvatarPath = req.user?.avatar;  // this "req.user?.avatar" will be old image path.
    await deleteOldImage(oldAvatarPath)      //deleteOldImage() := delete the old avatar file from cloudinary server.

    // upload the avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(400, "Error found while uploading avatar file");
    }

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar : avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
     .status(200)
     .json(new ApiResponse(200,user,"Avatar updated successfully"))

});

const updateUserCoverImage = asyncHandler(async(req,res,next)=>{
    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover Image file is missing.");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage.url){
        throw new Error(400,"Error while uploading coverImage.")
    }

   const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage : coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
      .status(200)
      .json(new ApiResponse(200,user,"Cover Image updated successfully."));

});

const getUserChannelProfile = asyncHandler(async(req,res)=>{
     const { username } = req.params;

     if(!username){
        throw new ApiError(400,"username is missing.")
     }

     const channel = await User.aggregate([
        {
            $match:{                                    // here we are filtering username from document.
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from : "subscriptions",             //Subscription convert into subscriptions, mongodb automatically convert into lowercase.
                localField : "_id",
                foreignField : "channel",           // this is field of subscription model schema.
                as : "subscribers"
            }
        },
        {
           $lookup:{
            from : "subscriptions",
            localField : "_id",
            foreignField : "subscriber",
            as : "subscribedTo"         // subscribedTo is a variable of subscribed channels by me.
           } 
        },
        {
            $addFields : {
                subscribersCount : {
                    $size : "subscribers"
                },
                channelsSubsribedToCount : {
                    $size : "subscribedTo"
                },
                isSubscribed : {
                    $cond : {
                        if : {$in : [req.user?._id,"$subscribers.subscriber" ]},
                        then : true,
                        else : false
                    }
                }
            }
        },
        {
            $project : {
                fullName : 1,
                username : 1,
                email : 1,
                avatar : 1,
                coverImage : 1,
                isSubscribed : 1,
                channelsSubsribedToCount : 1,
                subscribersCount : 1
            }
        }
     ])

     if(!channel?.length){
        throw new ApiError(404, "channel does not exist.")
     }

     return res
     .status(200)
     .ApiResponse(200,channel[0],"User channel data fetched successfully")

});

const getWatchHistory = asyncHandler(async(req,res,next)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id : new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline : [     // we add sub pipeline
                  {
                     $lookup: {
                        from : "users",
                        localField : "owner",
                        foreignField : "_id",
                        as : "owner",
                        pipeline : [
                            {
                                $project : {
                                    fullName : 1,
                                    username : 1,
                                    avatar : 1,
                                }
                            }
                        ]
                     },
                  },

                  {
                    $addFields : {
                        owner : {
                            $first : "$owner",
                        }
                     }
                  }

                ]
            }
        }
    ])

    return res
    .status(200)
    .json(ApiResponse(200,user[0].watchHistory,"Watch history fetched successfully"))

});

export { 
    registerUser, 
    loginUser, 
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};