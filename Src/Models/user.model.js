import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_ACCESS_SECRET,JWT_REFRESH_SECRET } from "../constant.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    avatar: {
      url: { type: String,default: "https://example.com/default-avatar.png" },
      public_id: { type: String ,default:null},
    },
    refreshToken: { type: String },
  },
  { timestamps: true }
);


// ✅ Encrypt password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// ✅ Compare password
userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

//Generate Tokens
userSchema.methods.generateAccessToken = function () {
  // Include minimal necessary payload
  return jwt.sign(
    {
      id: this._id,
      name: this.name,
      email: this.email,
        avatar:this.avatar.url
    },
    JWT_ACCESS_SECRET,
    {
      expiresIn: "7d", // Access tokens typically short-lived (1h–7d)
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  // Refresh tokens can contain minimal user info or just id
  const refreshToken = jwt.sign(
    {
        id: this._id,
      name: this.name,
      email: this.email,
      avatar:this.avatar.url
    },
    JWT_REFRESH_SECRET,
    {
      expiresIn: "30d", // Longer expiry for refresh tokens
    }
  );

  // Save refresh token in DB (optional, for revocation)
  this.refreshToken = refreshToken;
  return refreshToken;
};


const User= mongoose.model("User", userSchema);

export default User;
