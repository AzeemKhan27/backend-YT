import mongoose from 'mongoose';
import {DB_NAME} from '../constants.js';

const connectDB = async () => {
    try {
        const connectInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MongoDB connected !! DB Host: ${connectInstance.connection.host}`); //.connection.host = give hostanme , and where we connected eg: dev, testing, production database.
    } catch (error) {
        console.log("MONGODB connection FAILED : ", error);
        process.exit(1);
    }
}

export default connectDB;