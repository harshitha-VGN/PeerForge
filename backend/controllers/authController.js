import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate request body
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Check if user already exists with this email
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Password hashing is handled inside the User model (pre-save hook)
    await User.create({
      email,
      password,
    });

    res.status(201).json({
      message: "User created successfully",
    });

  } catch (error) {
    console.error(error);

    // MongoDB duplicate key error (usually triggered by unique email index)
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

    // Validate request body
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Explicitly include password since schema may exclude it by default
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    // Custom method defined in User model to compare hashed password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    // Generate JWT token for authenticated requests
    const token = jwt.sign(
      { userId: user._id },     // payload
      process.env.JWT_SECRET,   // secret key
      { expiresIn: "1h" }       // token expiry
    );

    res.status(200).json({
      message: "Login successful",
      token,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};