import express from "express";
const router = express.Router();
import User from "../models/user-model.js";
import { registerValidation, loginValidation } from "../validation.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import axios from "axios";
dotenv.config();
import passport from "passport";

import { sendVerifyMail, getDay } from "../config/util.js";
import { ExtractJwt } from "passport-jwt";

const tranporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.CLIENT_ID,
    pass: process.env.CLIENT_PASS,
  },
});

// get current time
const date = new Date();
const year = date.getFullYear();
const month = date.getMonth() + 1;
const day = date.getDate();
const today = [year, month, day].join("/");

router.use((req, res, next) => {
  console.log("A request is coming in to auth.js");
  next();
});

router.get("/testAPI", (req, res) => {
  const msgObj = {
    message: "Test API is working.",
    today: today,
  };
  return res.json(msgObj);
});

// verify the email when user click verify link
router.get(`/confirmation/:token`, async (req, res) => {
  const { token } = req.params;
  console.log(token);

  try {
    const { userId } = jwt.verify(token, process.env.EMAIL_SECRET);
    const user = await User.findOneAndUpdate({ userId }, { confirmed: true });
    console.log(user);
    return res.send({ success: true, token: token, user: user });
  } catch (e) {
    return res.send(e);
  }
});

// get current user by token
router.get("/getUser/:token", async (req, res) => {
  const { token } = req.params;

  try {
    const { userId } = jwt.verify(token, process.env.PASSPORT_SECRET);
    const user = await User.findOne({ userId: userId });
    return res.status(200).send({ user });
  } catch (e) {
    return res.status(500).send(e);
  }
});

// to google login page
router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile"],
  })
);

router.get(
  "/auth/google/redirect",
  passport.authenticate("google"),
  (req, res) => {
    console.log(req);
    res.redirect("http://localhost:3000/login");
  }
);

// redirect from line notify and get response code
router.post("/api/linenotify", async (req, res) => {
  const { code, state } = req.body;
  // console.log(state.split(",")[1]);
  const userId = state.split(",")[1];
  await axios
    .post("https://notify-bot.line.me/oauth/token", null, {
      params: {
        grant_type: "authorization_code",
        // redirect_uri: `${process.env.CLIENT_IPADDRESS}:8000/user/api/linenotify`,
        redirect_uri: `http://localhost:8000/user/api/linenotify`,
        client_id: `${process.env.LINE_CLIENT_ID}`,
        client_secret: `${process.env.LINE_CLIENT_SECRET}`,
        code: code,
      },
    })
    .then(async (response) => {
      console.log(response.data);
      const lineToken = response.data.access_token;
      // console.log(response.data.access_token);
      // res.redirect(`${process.env.CLIENT_IPADDRESS}:3000/profile`);
      await User.findOneAndUpdate(
        { userId: userId },
        { lineToken: lineToken },
        { new: true }
      ).then((user) => {
        console.log(user);
      });
      res.redirect(`http://localhost:3000/profile`);
    });
});

router.post("/api/linenotify", (req, res) => {
  const { userId } = req.body;
  window.location.href = `https://notify-bot.line.me/oauth/authorize?response_type=code&scope=notify&response_mode=form_post&state=f094a459&client_id=PdLvERXPclVj8N9uUy2Tlo&redirect_uri=http://localhost:8000/user/api/linenotify&state=${userId}`;
});

// router.post("https://notify-bot.line.me/oauth/token", { params: {} });

// register the user
router.post("/register", async (req, res) => {
  const { userName, userId, userPw } = req.body;
  // check validation of data
  const { error } = registerValidation(req.body);

  if (error) return res.status(400).send(error.details[0].message);

  // check if userId exist.
  const userIdExist = await User.findOne({ userId: userId });
  if (userIdExist) return res.status(400).send("Email已經註冊過");
  // register the user
  const newUser = new User({
    userName: userName,
    userId: userId,
    userPw: userPw,
  });
  try {
    jwt.sign(
      { userId: userId },
      process.env.EMAIL_SECRET,
      {
        expiresIn: 10 * 1000,
      },
      async (err, emailToken) => {
        const url = `${process.env.CLIENT_IPADDRESS}:3000/confirmation/${emailToken}`;

        sendVerifyMail(userId, userName, today, url);

        // await tranporter.verify((error, success) => {
        //   if (error) {
        //     console.log(error);
        //   } else {
        //     console.log("Server is ready to take our messages");
        //   }
        // });
        // await tranporter.sendMail({
        //   from: `"Bloody Help"<bloodyhelpyou@gmail.com>`,
        //   to: `${userId}`,
        //   subject: "Bloody Help：電子郵箱驗證",
        //   html: `<h3>親愛的 ${userName} 先生/小姐，您好，</h3>
        //   <br/>
        //   Bloody Help歡迎您的加入，請<a href="${url}">點擊這裡</a>完成信箱驗證。<br/>
        //   您的加入日期：${today}
        //   <br/>
        //   您的聯絡信箱：${userId}
        //   <br/>
        //   此為系統自動發送，請勿直接回覆`,
        // });
      }
    );
    const saveUser = await newUser.save();
    return res.status(200).send({
      message: "Success",
      saveObject: saveUser,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).send("User not saved.");
  }
});

// user login
router.post("/login", async (req, res) => {
  const { userId, userPw } = req.body;

  // check validation of data
  const { error } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // find user by userId and compare info that user entered
  const user = await User.findOne({ userId: userId });
  // user provided email not found.
  if (!user) return res.status(401).send("用戶尚未註冊！");

  try {
    user.comparePassword(userPw, function (err, isMatch) {
      if (err) return res.status(400).send(err);
      else if (isMatch) {
        // entered password is the same with DB
        const userData = {
          userId: user.userId,
          userName: user.userName,
          confirmed: foundUser.confirmed,
        };
        const tokenObject = { _id: user._id, userId: user.userId };
        const token = jwt.sign(tokenObject, process.env.PASSPORT_SECRET);
        return res.send({ success: true, token: token, user: userData });
      } else return res.status(401).send("密碼錯誤！");
    });
  } catch (err) {
    res.status(401).send(err);
  }
});

// send verify mail
router.post("/sendVerify", async (req, res) => {
  const { userId } = req.body;

  const user = await User.findOne({ userId: userId });

  const joinDay = getDay(user.date);
  try {
    jwt.sign(
      { userId: userId },
      process.env.EMAIL_SECRET,
      {
        expiresIn: 10 * 1000,
      },
      async (err, emailToken) => {
        const url = `${process.env.CLIENT_IPADDRESS}:3000/confirmation/${emailToken}`;

        sendVerifyMail(userId, user.userName, joinDay, url);
      }
    );
    return res.status(200).send({
      message: "Send verify mail successfully.",
    });
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});

// google login, register
router.post("/google/login", async (req, res) => {
  const { userData } = req.body;

  // check if userId exist.
  // const userIdExist = await User.findOne({ googleId: userData.googleId });
  // if (userIdExist) return res.status(400).send("Email已經註冊過");
  // // register the user
  // const newUser = new User({
  //   userName: userData.name,
  //   googleId: userData.googleId,
  //   userId: userData.email,
  //   userPw: userData.googleId,
  //   confirmed: true,
  // });
  // try {
  //   const saveUser = await newUser.save();
  //   return res.status(200).send({
  //     message: "Success",
  //     saveObject: saveUser,
  //   });
  // } catch (e) {
  //   return res.status(400).send({
  //     message: "User not saved",
  //     error: e,
  //   });
  // }

  await User.findOne({ googleId: userData.googleId }).then((foundUser) => {
    if (foundUser) {
      // user is already existed
      const userData = {
        userId: foundUser.userId,
        userName: foundUser.userName,
        confirmed: foundUser.confirmed,
      };
      console.log(userData);
      const tokenObject = { _id: foundUser._id, userId: foundUser.userId };
      const token = jwt.sign(tokenObject, process.env.PASSPORT_SECRET);
      return res
        .status(200)
        .send({ Sueeess: true, token: token, user: userData });
    } else {
      // add new user into database
      const newUser = new User({
        userName: userData.name,
        googleId: userData.googleId,
        confirmed: true,
        userId: userData.email,
        userPw: userData.googleId,
      });

      newUser.save().then((user) => {
        console.log("New User created.");
        console.log(user);
        const userData = {
          userId: user.userId,
          userName: user.userName,
          confirmed: foundUser.confirmed,
        };
        const tokenObject = { _id: user._id, userId: user.userId };
        const token = jwt.sign(tokenObject, process.env.PASSPORT_SECRET);
        return res.send({ success: true, token: token, user: userData });
      });
    }
  });
});

// update user data
router.post("/update", async (req, res) => {
  const { userId, userName } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      { userId: userId },
      { userName: userName },
      { new: true }
    );

    const userData = {
      userId: user.userId,
      userName: user.userName,
      confirmed: foundUser.confirmed,
    };
    const tokenObject = { _id: user._id, userId: user.userId };
    const token = jwt.sign(tokenObject, process.env.PASSPORT_SECRET);
    return res.send({ success: true, token: token, user: userData });
  } catch (e) {
    return res.status(500).send({ Error: e });
  }
});

export default router;
