// require('dotenv').config()   // it will be working properly but we are using modules in nodejs
import dotenv from 'dotenv';
dotenv.config = ({path : './env'});

import connectDB from "./db/index.js";
connectDB();












/*

import mongoose from 'mongoose';
import { DB_NAME } from './constants';
import express from 'express';
const app = express();

( async () => {
   try {
      await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
      app.on('error',() => {     //listener of express
        console.log("ERROR:",error);
        throw error;
      });

      app.listen(process.env.PORT, () => {
        console.log(`App is listening on ${process.env.PORT}`);
      })

   } catch (error) {
    console.error(error);
    throw error;
   }
})()

*/