import mongoose from "mongoose";
import dotenv from "dotenv";
import Duel from "./models/Duel.js";
dotenv.config();

const clear = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Duel.deleteMany({});
  console.log("Database cleared! Create a new room now.");
  process.exit();
};
clear();