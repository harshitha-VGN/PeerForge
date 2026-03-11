import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    // Get Authorization header (expected format: "Bearer <token>")
    const authHeader = req.headers.authorization;

    // Validate header presence and correct Bearer format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided or invalid format" });
    }

    // Extract token from header
    const token = authHeader.split(" ")[1];

    // Verify token using JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach decoded user info (e.g., userId) to request object
    // This allows downstream routes/controllers to access req.user
    req.user = decoded;

    // Pass control to the next middleware/route handler
    next();

  } catch (error) {
    console.error("Auth Middleware Error:", error.message);

    // Token is invalid, malformed, or expired
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Also export as 'protect' for routes that use a different naming convention
export const protect = authMiddleware;

// Default export
export default authMiddleware;