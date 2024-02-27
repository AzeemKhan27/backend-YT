import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY ,
    api_secret : process.env.CLOUDINARY_API_SECRECT
})

const uploadOnCloudinary = async function(localFilePath){
    try {
        if(!localFilePath) return null;
        //upload the file on the cloudinary.
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type : "auto"   //type of file like video,image,raw etc
        })
        //file has been uploaded successfully.
        // console.log("file is uploaded successfully on cloudinary", response.url);

        fs.unlinkSync(localFilePath);  //if image uploaded successfully then delete automatically.
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)   //remove the saved temporary file as the upload got failed.
        return null;
    }
}

export {uploadOnCloudinary};