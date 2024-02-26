import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

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
            $set:{ refreshToken: undefined }
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

export { 
    registerUser, 
    loginUser, 
    logoutUser 
};