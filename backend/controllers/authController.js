import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Just pass raw password — model handles hashing
    await User.create({
      email,
      password,
    });

    res.status(201).json({
      message: "User created successfully",
    });

  } catch (error) {
  console.error(error);

  // MongoDB duplicate key error
  if (error.code === 11000) {
    return res.status(400).json({
      message: "Email already registered",
    });
  }

  res.status(500).json({
    message: "Server error",
  });
}
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // 2️⃣ check user exists
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    // 3️⃣ compare password
    const isMatch = await user.comparePassword(password)

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    
    // 4️⃣ generate token
    const token = jwt.sign(
      { userId: user._id },     // payload
      process.env.JWT_SECRET,   // secret
      { expiresIn: "1h" }       // expiration
    );
    res.status(200).json({
      message: "Login successful",token,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

