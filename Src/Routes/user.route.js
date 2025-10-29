import express from "express";
import {
  userRegister,
  userLogin,
  userUpdate,
  logoutUser,
  getUser,refreshToken
} from "../Controlllers/user.controller.js";
import { upload } from "../Middlewares/multer.middleware.js";
import { jwtVerify } from "../Middlewares/jwt.middleware.js";

const router = express.Router();

// 🔹 Register new user
router.post("/register", userRegister);

// 🔹 Login user
router.post("/login", userLogin);

// 🔹 Update user profile (optional avatar upload)
router.put("/update", jwtVerify,upload.single("avatar"), userUpdate);

// 🔹 Logout user
router.post("/logout", jwtVerify, logoutUser);

router.get("/",jwtVerify,getUser);

router.get("/generate/refreshtoken",refreshToken)
export default router;
