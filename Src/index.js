// server.js (or index.js)
import { app } from "./app.js";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" }); // ⚡ must be first

import { PORT } from "./constant.js";
import {connectDB} from "./DB/index.js"


connectDB()
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });

