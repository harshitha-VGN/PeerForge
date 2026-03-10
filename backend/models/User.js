import mongoose from "mongoose";
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

    // ── Economy & Gamification ────────────────────────────────────────────────
    streak: { type: Number, default: 0 },
    focusCoins: { type: Number, default: 0 },
    lastCheckIn: { type: Date },
    xp: { type: Number, default: 0 },
    duelWins: { type: Number, default: 0 },
    hasStreakFreeze: { type: Boolean, default: false },

    // ── LeetCode Integration ──────────────────────────────────────────────────
    leetcodeUsername: { type: String, trim: true, default: "" },

    // ── Extended Profile ──────────────────────────────────────────────────────
    displayName: { type: String, trim: true, default: "" },

    // e.g. "Undergraduate", "Graduate", "Working Professional", "Bootcamp", "Self-Taught"
    currentStatus: { type: String, trim: true, default: "" },

    // e.g. ["React", "Node.js", "Python", "MongoDB"]
    techStack: [{ type: String, trim: true }],

    // DSA skill self-assessment: "Beginner" | "Intermediate" | "Advanced" | "Expert"
    dsaLevel: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Expert", ""],
      default: "",
    },

    // Coding experience in years (0, 1, 2, 3, 4, 5+)
    codingExperienceYears: { type: Number, default: 0 },

    // Short bio / about
    bio: { type: String, trim: true, default: "", maxlength: 300 },

    // Projects the user has built
    projects: [
      {
        name: { type: String, trim: true },
        description: { type: String, trim: true },
        link: { type: String, trim: true },  // GitHub or live URL
        techUsed: [{ type: String }],
      },
    ],

    // Social / portfolio links
    githubUrl: { type: String, trim: true, default: "" },
    linkedinUrl: { type: String, trim: true, default: "" },
    portfolioUrl: { type: String, trim: true, default: "" },
    lastDuelSolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ── Methods ───────────────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

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
