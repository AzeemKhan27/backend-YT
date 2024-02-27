import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY ,
    api_secret : process.env.CLOUDINARY_API_SECRECT
})

const deleteOldImage = async function (oldImageLocation) {
    // if(image){
    //     fs.unlinkSync(image.path);
    // }

    //delete old avatar file.
    console.log("oldImageLocatoion Before 1-:>",oldImageLocation);
    if(oldImageLocation){
        await cloudinary.uploader.destroy(req.user?.avatar);
    }
    console.log("oldImageLocatoion After 2-:>",oldImageLocation);
}

export {deleteOldImage};