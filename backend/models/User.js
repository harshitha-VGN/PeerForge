import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    // User email used for authentication
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"], // basic email validation
    },

    // Hashed password (not returned in queries by default)
    password: {
      type: String,
      required: true,
      select: false,
    },

    // ── Economy & Gamification ────────────────────────────────────────────────
    streak: { type: Number, default: 0 },          // daily learning streak
    focusCoins: { type: Number, default: 0 },      // in-app currency
    lastCheckIn: { type: Date },                   // last streak claim date
    xp: { type: Number, default: 0 },              // experience points
    duelWins: { type: Number, default: 0 },        // number of duel victories
    hasStreakFreeze: { type: Boolean, default: false }, // allows streak protection

    // ── LeetCode Integration ──────────────────────────────────────────────────
    leetcodeUsername: { type: String, trim: true, default: "" },

    // ── Extended Profile ──────────────────────────────────────────────────────
    displayName: { type: String, trim: true, default: "" },

    // Current user role/status (student, professional, etc.)
    currentStatus: { type: String, trim: true, default: "" },

    // User's technology stack
    techStack: [{ type: String, trim: true }],

    // Self-assessed DSA skill level
    dsaLevel: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Expert", ""],
      default: "",
    },

    // Coding experience in years
    codingExperienceYears: { type: Number, default: 0 },

    // Short profile bio
    bio: { type: String, trim: true, default: "", maxlength: 300 },

    // Projects the user has built
    projects: [
      {
        name: { type: String, trim: true },
        description: { type: String, trim: true },
        link: { type: String, trim: true },  // GitHub or live project URL
        techUsed: [{ type: String }],
      },
    ],

    // Social / portfolio links
    githubUrl: { type: String, trim: true, default: "" },
    linkedinUrl: { type: String, trim: true, default: "" },
    portfolioUrl: { type: String, trim: true, default: "" },

    // Tracks last time user solved a duel (used for streak validation)
    lastDuelSolvedAt: { type: Date, default: null },
  },
  { timestamps: true } // automatically adds createdAt and updatedAt
);

// ── Instance Methods ─────────────────────────────────────────────────────────
// Compare a plain password with the stored hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ── Pre-save Hook ────────────────────────────────────────────────────────────
// Hash password before saving if it has been modified
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  try {
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const salt = await bcrypt.genSalt(saltRounds);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

const User = mongoose.model("User", userSchema);

export default User;