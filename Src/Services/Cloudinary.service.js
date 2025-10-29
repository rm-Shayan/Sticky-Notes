import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import {
  CLOUDINARY_CLOUDNAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_PRESET,
} from "../constant.js";
import {ApiError} from "../Utilities/ApiError.js";

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUDNAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

// ✅ Upload Function with Strong Validation
export const uploadToCloudinary = async (filePath, folder = "TodoProfile") => {
  try {
    // 🔍 1. Check if filePath exists
    if (!filePath) {
      throw new ApiError(400, "No file path provided for upload");
    }

    // 🔍 2. Check if file physically exists
    if (!fs.existsSync(filePath)) {
      throw new ApiError(404, "File not found on server");
    }

    // 🔍 3. Validate file size (example: max 10 MB)
    const stats = fs.statSync(filePath);
    const maxSizeMB = 10;
    if (stats.size > maxSizeMB * 1024 * 1024) {
      fs.unlinkSync(filePath); // delete large file
      throw new ApiError(400, `File size exceeds ${maxSizeMB}MB limit`);
    }

    // 🔍 4. Optional: Validate file type
   const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".svg"];

// ✅ Inside uploadToCloudinary
const fileExtension = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
if (!allowedExtensions.includes(fileExtension)) {
  fs.unlinkSync(filePath);
  throw new ApiError(
    400,
    "Invalid file type. Only images (jpg, jpeg, png, webp, svg) are allowed."
  );
}

    // ✅ 5. Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      upload_preset: CLOUDINARY_PRESET,
      resource_type: "auto",
    });

    console.log("✅ Cloudinary Upload Successful:", result.secure_url);

    // ✅ 6. Delete local file after upload
    fs.unlinkSync(filePath);

    // ✅ 7. Return only required data
    return {
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error("❌ Cloudinary Upload Failed:", error.message);

    // 🧹 Cleanup if file exists
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkError) {
        console.warn("⚠️ Failed to delete local file after upload error:", unlinkError.message);
      }
    }

    // 🔥 Custom error for your API
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Cloudinary upload failed");
  }
};

/**
 * @desc Delete a file from Cloudinary by public_id
 * @param {string} publicId - The public_id of the Cloudinary file
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      throw new ApiError(400, "No public_id provided for deletion");
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== "ok" && result.result !== "not found") {
      throw new ApiError(500, "Failed to delete file from Cloudinary");
    }

    console.log(`✅ Cloudinary file deleted: ${publicId}`);
    return result;
  } catch (error) {
    console.error("❌ Cloudinary deletion failed:", error.message);
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Cloudinary deletion error");
  }
};
