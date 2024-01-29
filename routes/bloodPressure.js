import express from "express";
import BloodPressure from "../models/bloodPressure-model.js";
import User from "../models/user-model.js";
import { pressureValidation } from "../validation.js";
import axios from "axios";
import moment from "moment";

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
  console.log("getALlbp");
  const { userId } = req.params;
  console.log("body", req.params);
  try {
    const bpDetail = await BloodPressure.find({
      userId: userId,
    }).sort({
      userAddDate: "ASC",
    });
    return res.status(200).send({ success: true, data: bpDetail });
  } catch (e) {
    return res.send(e);
  }
});

// 依照日期獲取血壓資料
router.get("/getBP", async (req, res) => {
  // console.log(req.query);
  const { userId, date } = req.query;

  console.log(userId, date);
  let bloodPressure = [];
  try {
    bloodPressure = await BloodPressure.find({
      userId: userId,
      userAddDate: { $regex: new RegExp(date, "i") },
    });
  } catch (e) {
    return res.send(e);
  }
  return res.status(200).send({ success: true, bloodPressure: bloodPressure });
});

// making a new BP record
router.post("/newbp", async (req, res) => {
  const {
    systolicPressure,
    diastolicPressure,
    heartRate,
    userId,
    addDate,
    remark,
    state, // 是新增或編輯
  } = req.body;
  let lineToken = "";
  console.log(req.body);

  // validate the BP before making a new one
  const { error } = pressureValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const newBPDate = {
    systolicPressure: systolicPressure,
    diastolicPressure: diastolicPressure,
    heartRate: heartRate,
    tester: req.user._id,
    userId: userId,
    userAddDate: addDate,
    remark: remark,
  };

  const newBP = new BloodPressure(newBPDate);

  try {
    // save new BP into DB
    let saveBP = [];
    if (state === "add") {
      saveBP = await newBP.save().then(async () => {
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
            // 發送line 通知
            const date = moment(new Date(addDate)).format("YYYY/MM/DD");
            const message = `${user.userName}先生/女士 家屬您好，${date}量測血壓的紀錄為收縮壓(SYS)為${systolicPressure}，舒張壓(DIA)為${diastolicPressure}，心跳(PUL)為${heartRate}，${pressureMessage}。 Bloody Help關心您的血壓健康。`;
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
    } else if (state === "edit") {
      await BloodPressure.findOneAndUpdate(
        {
          userId: userId,
          userAddDate: { $regex: new RegExp(addDate, "i") },
        },
        newBPDate,
        {
          new: true,
        }
      );
    }
    return res.status(200).send({
      message: "Success.",
      saveObject: saveBP,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).send("Blood Pressure not saved.");
  }
});

router.post("/exportSheet", async (req, res) => {
  console.log(req.body);
  return res.status(200).send("Blood Pressure exports.");
});
export default router;
