import { ApiError } from "../Utilities/ApiError.js";
import { JWT_ACCESS_SECRET } from "../constant.js";
import { decodeToken } from "../Utilities/decodeToken.js";

export const jwtVerify = async (req, res, next) => {
  try {
    // ✅ Get token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : req.cookies?.accessToken;

    if (!token) {
      throw new ApiError(401, "Access token missing or not provided");
    }

    // ✅ Await decodeToken (it’s async)
    const decoded = await decodeToken(token, JWT_ACCESS_SECRET);

    // ✅ Attach decoded payload to request
    req.user = decoded;
    delete req?.user?.avatar?.public_id

    next(); // continue to route
  } catch (error) {
    console.error("JWT verification failed:", error.message);

    if (error.name === "TokenExpiredError") {
      next(new ApiError(401, "Token expired, please login again"));
    } else if (error.name === "JsonWebTokenError") {
      next(new ApiError(401, "Invalid token, authentication failed"));
    } else {
      next(new ApiError(500, "Internal server error during token verification"));
    }
  }
};
