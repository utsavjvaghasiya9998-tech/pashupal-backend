import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config()
export const ConnectDb = async () => {
    try {
        mongoose.connect(process.env.MONGO_URL);
        console.log("DataBase Connected Successfully...!!");
    } catch (error) {
        console.log("Error", error);
        process.exit(1)
    }
}