import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config()
const connectDB = async () => {
    
        // Establish a connection to MongoDB without deprecated options
       
        await mongoose.connect(process.env.DB_CONN);
        
        mongoose.connection.on('connected', () => {
            console.log('Database connected successfully.');
        });

        mongoose.connection.on('error', (err) => {
            console.error(`Database connection error: ${err}`);
        });
    
        
};

export default connectDB;