import jwt from "jsonwebtoken";
import { ApiError } from "./ApiError.js";

/**
 * ✅ decodeToken (secure verify)
 * - Verifies and decodes JWT using your secret
 * - Returns decoded payload if valid
 */
export const decodeToken = async (token, secret) => {
  try {
    // Validate inputs
    if (!token) {
      throw new ApiError(401, "Token not provided");
    }
    if (!secret) {
      throw new ApiError(500, "JWT secret not provided");
    }

    // Verify token securely
    const decoded = jwt.verify(token, secret);
    return decoded; // e.g. { id, email, role, iat, exp }
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);

    // Handle JWT-specific errors
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Token expired. Please login again.");
    } else if (error.name === "JsonWebTokenError") {
      throw new ApiError(401, "Invalid token. Authentication failed.");
    } else {
      throw new ApiError(500, "Failed to decode token");
    }
  }
};
