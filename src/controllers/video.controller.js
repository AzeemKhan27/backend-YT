import mongoose from 'mongoose';
import {Video} from "../models/video.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    //TODO: get all videos based on query, sort, pagination
    
    let filter = {};

    if(query){
        filter = { $text: { $search: query }};
    }

    if(userId){
        filter.owner = userId;
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        lean: true,
        sort: sortBy ? { [sortBy]: sortType === 'desc' ? -1 : 1 } : { createdAt: -1 },
    };

    if(!Videos){
        return res.status(404).json(new ApiResponse(404, {}, 'No videos found.'));
    }

    // Retrieve paginated videos based on the filter and options
    const Videos = await Video.aggregatePaginate(filter, options);
    
    return res.status(200).json(new ApiResponse(200, Videos, "Retrieved videos."))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video

    //checking video file is included in request or not.
    if(
            !title || !description || 
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
            console.log("both file videFile and thumbnail is uploaded to cloudinary successfully.")
        }

        //extract the video entry in the database
        const videoUrl = videoUploadResponse?.secure_url;
        const videoDuration = videoUploadResponse?.duration;  //taking duration of video from cloudinary
        
        //extract the video entry in the database
        const thumbnailUrl = thumbnailUploadResponse?.secure_url;

        //Creating and storing video in db
        const addVideo = await Video.create({title, description, duration:videoDuration , videoFile:videoUrl, thumbnail:thumbnailUrl});
        
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
    try {
        let getVideoById = asyncHandler(async (req, res) => {
            const video = await Video.findById(videoId);
            if(!video){
                console.log(`Video not found`, videoId);
                throw new ApiError(404, "video not found.");
            }
            return res.status(200).json(new ApiResponse(200, video, "video retrieved successfully."));
        });
    } catch (error) {
        return res.status(500)
                  .json(new ApiResponse(500,{},`Could not find video || Internal Server Error.`))
    }
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