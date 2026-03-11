import mongoose from "mongoose"

// Function to connect the application to MongoDB
const connectDB = async () => {
    try {
        // Connect to MongoDB using connection string from environment variables
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000 // stop trying to connect after 5 seconds
        });

        console.log("MongoDB connected");

    } catch (error) {

        console.error("MongoDB connection failed", error);

        // Exit the application if database connection fails
        process.exit(1);
    }  
}

// Export the function so it can be used in server/app initialization
export default connectDB