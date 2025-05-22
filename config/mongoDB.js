import mongoose from "mongoose";

const connectDB = async () => {
    
        // Establish a connection to MongoDB without deprecated options
        
        await mongoose.connect("mongodb+srv://saketh214:saketh21@cluster0.hgtdt.mongodb.net/MAD_Project_DB");
        
        mongoose.connection.on('connected', () => {
            console.log('Database connected successfully.');
        });

        mongoose.connection.on('error', (err) => {
            console.error(`Database connection error: ${err}`);
        });
    
        
};

export default connectDB;