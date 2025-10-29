import {ApiError} from "./ApiError.js"; // ✅ Ensure correct file extension

// 🔐 Helper function to generate and store tokens
export const generateTokens = async (user) => {
  try {
    // 🧩 Generate tokens using model instance methods
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // 🛑 Validate token generation
    if (!accessToken) {
      throw new ApiError(500, "Failed to generate access token");
    }
    if (!refreshToken) {
      throw new ApiError(500, "Failed to generate refresh token");
    }

    // 💾 Save refresh token in DB (without triggering validations)
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // ✅ Return both tokens
    return { accessToken, refreshToken };
  } catch (error) {
    // 🚨 Centralized error handling
    throw new ApiError(500, "Token generation failed: " + error.message);
  }
};
