import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, changePassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    registerUser
    )

router.route("/login").post(loginUser);

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)  // "verifyJWT" this middleware verify token by Id.
router.route("/refresh-token").post(refreshAccessToken) // here we are verifying the refresh token
router.route("/change-password").post(verifyJWT,changePassword)
router.route("/current-user").post(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)
router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/update-coverImage").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)


route.route("/c/:username").get(verifyJWT,getUserChannelProfile) //getUserChannelProfile
route.route("/watch-history").get(verifyJWT,getWatchHistory) //getUserChannelProfile

export default router;