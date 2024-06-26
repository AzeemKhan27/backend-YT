import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { deleteVideo, getAllVideos, getVideoById, publishAVideo, updateVideo, togglePublishStatus } from "../controllers/video.controller.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").get(getAllVideos).post(
    upload.fields([
        {
            name : "videoFile",
            maxCount : 1
        },
        {
            name : "thumbnail",
            maxCount : 1
        },
    ]),
    publishAVideo
);

// router.route("/").get(getAllVideos).post(
//     upload.single("videoFile"),
//     publishAVideo
// );

router.route("/:videoId")
      .get(getVideoById)
      .delete(deleteVideo)
      .patch(upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);   
router.route("/toggle/publish/:imageId").patch(togglePublishStatus);   



export default router;