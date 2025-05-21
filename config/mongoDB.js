import mongoose from "mongoose";

const connectDB = async () => {
    
        // Establish a connection to MongoDB without deprecated options
        
        await mongoose.connect("mongodb+srv://raghavendraashokkumbar:anMFR0NhsY4AzUmG@cluster0.tmnttqo.mongodb.net/todo-app-database");

        mongoose.connection.on('connected', () => {
            console.log('Database connected successfully.');
        });

        mongoose.connection.on('error', (err) => {
            console.error(`Database connection error: ${err}`);
        });
    
        
};

export default connectDB;