import express from 'express';
import cors from 'cors';    
import cookieParser from 'cookie-parser';

const app = express();

//-------middlewares-------
app.use(cors({                        
    origin : process.env.CORS_ORIGIN,
    credentials : true
}));
    
app.use(express.json({limit : "16kb"}));                         // we are allowing JSON data from body/form until 16KB
app.use(express.urlencoded({extended : true, limit: "16kb"}));   //this middleware allows data from URL.
app.use(express.static("public"))                                //this middleware allows to store files/images, and giving access to all.
app.use(cookieParser());                                         //we used cookieParser for set/access cookies from user browser to perform CRUD operation.


//Routes Import
import userRoutes from "./routes/user.routes.js";

//Routes Declaration and using middlewares.
app.use("/api/v1/users", userRoutes);

export { app }