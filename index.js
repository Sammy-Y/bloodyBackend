import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import passport from "passport";
import cors from "cors";

import authRouter from "./routes/auth.js";
import bloodPressureRouter from "./routes/bloodPressure.js";
import { JWT } from "./config/passport.js";
JWT(passport);

import cookieSession from "cookie-session";

import https from "https";
import fs from "fs";

// Initial Express
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const app = express();

// 讀取 SSL 憑證和私鑰文件
const privateKey = fs.readFileSync("./server.key");
const certificate = fs.readFileSync("./server.crt", "utf8");
// const ca = fs.readFileSync('/path/to/ca.pem', 'utf8');

const credentials = { key: privateKey, cert: certificate };

// connect to MongoDB
mongoose
  .connect(process.env.DB_CONNECT)
  .then(() => {
    console.log("Connect to Mongo Altas.");
  })
  .catch((e) => {
    console.log(e);
  });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(
  cookieSession({
    keys: [process.env.COOKIE_SECRET],
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/user", authRouter);
// if user not login can't get route, by using passport-jwt
app.use(
  "/api/bp",
  passport.authenticate("jwt", { session: false }),
  bloodPressureRouter
);

app.listen(8000, () => {
  console.log("Server is running on port 8000.");
});

// 創建 HTTPS 服務器
const PORT = 8000;

// const httpsServer = https.createServer(credentials, app);
// httpsServer.listen(PORT, () => {
//   console.log(`Server is running on https://localhost:${PORT}`);
// });
