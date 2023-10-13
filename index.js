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

// Initial Express
const app = express();

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
