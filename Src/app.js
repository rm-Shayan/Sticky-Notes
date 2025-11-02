// index.js
import express from "express";
import cors from "cors";
import { ApiErrorMiddleware } from "./Middlewares/ApiError.middleware.js";
import cookieParser from "cookie-parser";
import userRoute from "./Routes/user.route.js"
import noteRoute from "./Routes/note.route.js"

export const app = express();

const allowOrigins = [
  "http://localhost:3200",
  "http://localhost:3000",
  "http://localhost:5173",

   // Next.js server
];

// ✅ CORS Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like Postman or curl)
      if (!origin) return callback(null, true);
      if (allowOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ✅ Express Middlewares
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser())

// ✅ Test Route
app.get("/", (req, res) => {
  res.send("Sticky Notes API is running 🚀");
});

app.use("/api/v1/user",userRoute);
app.use("/api/v1/note",noteRoute)

app.use(ApiErrorMiddleware)