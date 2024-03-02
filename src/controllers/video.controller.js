import mongoose from 'mongoose';
import {Video} from "../models/video.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    const find = await Video.findOne()
    return res.status(200).json(new ApiResponse(200, find, "retrieved videos."))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, duration  } = req.body
    // TODO: get video, upload to cloudinary, create video

    //checking video file is included in request or not.
    if(
            !title || !description || !duration || 
            !req.files || !req.files.videoFile || 
            !Array.isArray(req.files.videoFile) || 
            req.files.videoFile.length === 0 ||
            !req.files || !req.files.thumbnail || 
            !Array.isArray(req.files.thumbnail) || 
            req.files.thumbnail.length === 0
       )
       {
        return res.status(400).json(new ApiResponse(400, {}, 'All fields are required.'));
    }

    try {
        const videoLocalPath = req.files.videoFile[0].path;
        const thumbnailLocalPath = req.files.thumbnail[0].path;
        
        //uploading thee video to cloudinary
        const videoUploadResponse = await uploadOnCloudinary(videoLocalPath);

        //uploading thee thumbnail to cloudinary
        const thumbnailUploadResponse = await uploadOnCloudinary(thumbnailLocalPath);

        //check video uploaded or not
        if(!videoUploadResponse || !thumbnailUploadResponse){
           throw new ApiError(500,"failed to upload the video or thumbnail to cloudinary.")
        }else{
            console.log("working fine...")
        }

        //extract the video entry in the database
        const videoUrl = videoUploadResponse?.secure_url;
        
        //extract the video entry in the database
        const thumbnailUrl = thumbnailUploadResponse?.secure_url;

        //Creating and storing video in db
        const addVideo = await Video.create({title, description, duration, videoFile:videoUrl, thumbnail:thumbnailUrl});
        
        //checking created video or not
        if(!addVideo){
            throw new ApiError(500,"Failed to create video entry.");
        }

        // finding it on Video model
        const checkStoredVideo = await Video.findById(addVideo._id);

        if(!checkStoredVideo){
            throw new ApiError(500,"failed to find video")
        }

        return res.status(200)
                  .json(new ApiResponse(200,checkStoredVideo,"video uploaded successfully with given data."))

    } catch (error) {
        return res.status(500)
                  .json(new ApiResponse(500,{},`Internal Server Error : ${error.message}`));
    }

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}