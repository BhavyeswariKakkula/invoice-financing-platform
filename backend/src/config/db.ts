import dns from "dns";
import mongoose from "mongoose";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const connectDB = async (): Promise<void> => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI as string, {
      family: 4,
    });

    console.log(`✅ MongoDB Connected: ${connection.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Failed");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exit(1);
  }
};

export default connectDB;