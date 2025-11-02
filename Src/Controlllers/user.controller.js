import User from "../Models/user.model.js";
import { ApiResponse } from "../Utilities/ApiResponse.js";
import { ApiError } from "../Utilities/ApiError.js";
import { asyncHandler} from "../Utilities/Asynchandler.js";
import {generateTokens} from "../Utilities/tokenGenerate.js"
import {uploadToCloudinary,deleteFromCloudinary } from "../Services/Cloudinary.service.js";

/**
 * @desc    Register new user
 * @route   POST /api/users/register
 * @access  Public
 */
export const userRegister = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // ✅ Check if body is empty
  if (!req.body || Object.keys(req.body).length === 0) {
    throw new ApiError(400, "Request body is missing");
  }

  // ✅ Check required fields
  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required");
  }

  // ✅ Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "User with this email already exists");
  }

  // ✅ Create new user (password encrypted in schema middleware)
  const newUser = await User.create({ name, email, password });

  // ✅ Handle failure to create user
  if (!newUser) {
    throw new ApiError(500, "Failed to register user");
  }

  // ✅ Return success response
  return res.status(201).json(
    new ApiResponse(201, [newUser], "User registered successfully")
  );
});


/**
 * @desc    Login user
 * @route   POST /api/users/login
 * @access  Public
 */
export const userLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

    // ✅ Check if body is empty
  if (!req.body || Object.keys(req.body).length === 0) {
    throw new ApiError(400, "Request body is missing");
  }

  // ✅ Validate request body
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // ✅ Find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  // ✅ Compare password (assuming hashed in schema middleware)
  const isMatch = await user.matchPassword(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid  password");
  }

  // ✅ Generate access and refresh tokens
  const { accessToken, refreshToken } = await generateTokens(user);

  // ✅ Save refresh token in DB (optional)
  user.refreshToken = refreshToken;
  await user.save();

  // ✅ Set tokens in HTTP-only cookies
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production"? "strict":"lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production"? "strict":"lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  // ✅ Return success response
 return res.status(200).json(
  new ApiResponse(200, [{
    id: user._id,
    name: user.name,
    email: user.email,
    avatar:user.avatar?.url,
    accessToken,
    refreshToken,
  }], "Login successful")
);
});


/**
 * @desc    Get logged-in user info
 * @route   GET /api/users/me
 * @access  Private
 */
export const getUser = asyncHandler(async (req, res) => {
  // req.user is set by jwtVerify middleware
  if (!req.user) {
    throw new ApiError(401, "Unauthorized access");
  }

  const userDoc = await User.findById(req.user.id).select("-password -refreshToken");
  if (!userDoc) {
    throw new ApiError(404, "User not found");
  }

  // Convert to plain object to safely delete fields
  const user = userDoc.toObject();

  // Remove public_id from avatar before sending to client
  if (user.avatar) {
    delete user.avatar.public_id;
  }

  return res.status(200).json(
    new ApiResponse(200, user, "User retrieved successfully")
  );
});

/**
 * @desc    Logout user
 * @route   POST /api/users/logout
 * @access  Private
 */
export const logoutUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized access");
  }

  // ✅ Clear refresh token from DB
  const user = await User.findById(req.user.id);
  if (user) {
    user.refreshToken = null;
    await user.save();
  }

  // ✅ Clear cookies
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  // ✅ Clear Authorization header from current request (server-side)
  if (req.headers.authorization) {
    delete req.headers.authorization;
  }

  return res.status(200).json(
    new ApiResponse(200, null, "Logout successful")
  );
});


/**
 * @desc    Update user profile (fields or avatar on Cloudinary)
 * @route   PUT /api/users/update
 * @access  Private
 */
export const userUpdate = asyncHandler(async (req, res) => {
  // ✅ Ensure at least body or file is provided
  if ((!req.body || Object.keys(req.body).length === 0) && !req.file) {
    throw new ApiError(400, "No data or file provided for update");
  }

  const updates = { ...req.body }; // fields to update

  // ✅ Validate body fields if provided
  if (req.body && Object.keys(req.body).length > 0) {
    const { name, email, password } = req.body;

    // Validate name
    if ("name" in req.body && !name) {
      throw new ApiError(400, "Name cannot be empty");
    }

    // Validate email
    if ("email" in req.body) {
      if (!email) {
        throw new ApiError(400, "Email cannot be empty");
      }
      // Simple email regex validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ApiError(400, "Invalid email format");
      }
    }

    // Validate password
    if ("password" in req.body && !password) {
      throw new ApiError(400, "Password cannot be empty");
    }
  }

  // ✅ Handle uploaded avatar image
  if (req.file) {
    const user = await User.findById(req.user.id);

    // ✅ Delete previous avatar from Cloudinary if exists
    if (user?.avatar?.public_id) {
      await deleteFromCloudinary(user.avatar.public_id);
    }

    // ✅ Upload new image to Cloudinary
    const cloudRes = await uploadToCloudinary(req.file.path, "avatars");

    updates.avatar = {
      url: cloudRes.url,
      public_id: cloudRes.public_id,
    };
  }

  // ✅ Update user
  const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  }).select("-password -refreshToken");

  if (!updatedUser) {
    throw new ApiError(500, "Failed to update user");
  }

  // ✅ Remove public_id before sending to client
  const updatedUserObj = updatedUser.toObject();
  if (updatedUserObj.avatar) delete updatedUserObj.avatar.public_id;

  return res.status(200).json(
    new ApiResponse(200, [updatedUserObj], "User updated successfully")
  );
});


/**
 * @desc    Refresh access token
 * @route   POST /api/users/refresh-token
 * @access  Public (needs refresh token)
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    throw new ApiError(401, "Refresh token missing. Please login again");
  }

  // ✅ Find user with this refresh token
  const user = await User.findOne({ refreshToken });
  if (!user) {
    throw new ApiError(401, "Invalid refresh token. Please login again");
  }

  // ✅ Generate new tokens
  const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user);

  // ✅ Save new refresh token in DB
  user.refreshToken = newRefreshToken;
  await user.save();

  // ✅ Set new cookies
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  return res.status(200).json(
    new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Token refreshed successfully")
  );
});
