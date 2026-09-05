import User from "../models/User.js";
import jwt from "jsonwebtoken";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET || "default_jwt_secret_dev",
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || "default_refresh_secret_dev",
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
};

const setRefreshTokenCookie = (res, refreshToken) => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd, // true in production (HTTPS)
    sameSite: isProd ? "none" : "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
};

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

    const user = await User.create({
      email,
      password,
    });

    const { accessToken, refreshToken } = generateTokens(user._id);
    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      message: "User created successfully",
      token: accessToken,
      user: {
        _id: user._id,
        email: user.email,
        streak: user.streak,
        focusCoins: user.focusCoins,
        xp: user.xp,
        duelWins: user.duelWins,
      },
    });

  } catch (error) {
    console.error("Signup error:", error);

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

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      message: "Login successful",
      token: accessToken,
      user: {
        _id: user._id,
        email: user.email,
        streak: user.streak,
        focusCoins: user.focusCoins,
        xp: user.xp,
        duelWins: user.duelWins,
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const secret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || "default_refresh_secret_dev";
    
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate new token pair (refresh token rotation)
    const tokens = generateTokens(user._id);
    setRefreshTokenCookie(res, tokens.refreshToken);

    res.status(200).json({
      token: tokens.accessToken,
    });
  } catch (error) {
    console.error("RefreshToken error:", error);
    res.status(500).json({ message: "Failed to refresh token" });
  }
};

export const logout = async (req, res) => {
  try {
    const isProd = process.env.NODE_ENV === "production";
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Logout failed" });
  }
};