import mongoose from "mongoose"
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
        },
        password: {
            type: String,
            required: true,
            select: false,  
        },
        streak: {
            type: Number,
            default: 0,
        },
        focusCoins: {
            type: Number,
            default: 0,
        },
        lastCheckIn: {
            type: Date,
        },
        leetcodeUsername: { type: String, trim: true },
        // Add these to your existing userSchema:
        xp: { type: Number, default: 0 },
        duelWins: { type: Number, default: 0 },
        focusCoins: { type: Number, default: 0 },
        streak: { type: Number, default: 0 },
        leetcodeUsername: { type: String, default: "" },

    },
    {
        timestamps: true,
    }
)

// Method to compare passwords during login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Hashing password before saving
// Note: We do NOT use 'next' here at all. 
// Mongoose treats async functions as middleware automatically.
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  try {
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const salt = await bcrypt.genSalt(saltRounds);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    // If something fails, we throw the error so Mongoose catches it
    throw error;
  }
});

const User = mongoose.model("User", userSchema)

export default User