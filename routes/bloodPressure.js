import express from "express";
import BloodPressure from "../models/bloodPressure-model.js";
import User from "../models/user-model.js";
import { pressureValidation } from "../validation.js";
import axios from "axios";

const router = express.Router();

router.use((req, res, next) => {
  console.log("A request is coming into blood pressure api...");
  next();
});

router.get("/testAPI", (req, res) => {
  const msgObj = {
    message: "Test API is working.",
  };
  return res.json(msgObj);
});

// get all bloody data
router.get("/getAllbp/:userId", async (req, res) => {
  const bpDetail = [];
  console.log("getALlbp");
  const { userId } = req.params;
  console.log("body", req.params);
  try {
    const bpDetail = await BloodPressure.find({
      userId: userId,
    }).sort({
      date: "desc",
    });
    return res.status(200).send({ success: true, data: bpDetail });
  } catch (e) {
    return res.send(e);
  }
});

// making a new BP record
router.post("/newbp", async (req, res) => {
  const { systolicPressure, diastolicPressure, heartRate, userId, addDate } =
    req.body;
  let lineToken = "";
  console.log(req.body);
  console.log(addDate);

  // validate the BP before making a new one
  const { error } = pressureValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const newBP = new BloodPressure({
    systolicPressure: systolicPressure,
    diastolicPressure: diastolicPressure,
    heartRate: heartRate,
    tester: req.user._id,
    userId: userId,
    testDate: addDate,
  });

  try {
    // save new BP into DB
    const saveBP = await newBP.save().then(async () => {
      // find user and send line notify
      await User.findOne({ userId: userId }).then(async (user) => {
        if (user.lineToken) {
          lineToken = user.lineToken;
          console.log(user);
          // 判斷血壓是否正常，提供訊息
          let pressureMessage = "";
          if (systolicPressure < 120 && diastolicPressure < 80) {
            pressureMessage = "血壓為正常範圍～";
          } else if (systolicPressure < 139 && diastolicPressure < 89) {
            pressureMessage = "血壓為略高需注意！";
          } else {
            pressureMessage = "血壓高需注意，請注意身體狀況並就醫！";
          }
          const message = `${user.userName}先生/女士 家屬您好，今天量測血壓的紀錄為收縮壓(SYS)為${systolicPressure}，舒張壓(DIA)為${diastolicPressure}，心跳(PUL)為${heartRate}，${pressureMessage}。 Bloody Help關心您的血壓健康。`;
          console.log(lineToken);
          // send line notify to user
          await axios
            .post("https://notify-api.line.me/api/notify", null, {
              params: {
                message: message,
              },
              headers: {
                Authorization: `Bearer ${lineToken}`,
              },
            })
            .then((response) => {
              // console.log(response);
            })
            .catch((err) => {
              console.log(err);
            });
        }
      });
    });
    res.status(200).send({
      message: "Success.",
      saveObject: saveBP,
    });
  } catch (err) {
    return res.status(400).send("Blood Pressure not saved.");
  }
});

export default router;
