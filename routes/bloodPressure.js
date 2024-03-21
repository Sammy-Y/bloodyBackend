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
  const { userId } = req.params;
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

router.get("/getDashBoardBp/:userId", async (req, res) => {
  const { userId } = req.params;
  const { choosePeriod } = req.query;
  const date = moment(new Date()).format("YYYY/MM/DD"); // today
  const sevenDaysAgo = moment().subtract(choosePeriod, 'days').format("YYYY/MM/DD"); // 特定日期之前
  try {
    const bpDetail = await BloodPressure.find({
      userId: userId,
      date: {
        $gte: sevenDaysAgo,
        $lt: date,
      }
    }).sort({
      userAddDate: "ASC",
    }).limit(choosePeriod * 2);

    // 定義一個函數來計算數值的平均值
const calculateAverage = (values) => values.reduce((acc, curr) => acc + curr, 0) / values.length;

// 建立一個物件來存放合併後的資料
const mergeBpList = {};

// 遍歷查詢結果
bpDetail.forEach((item) => {
  // 從每個項目中提取日期和數值
  const { userAddDate, sys, dia, pul } = item;

  // 如果mergeBpList中已經有該日期的項目，則將當前的數值加入並更新平均值
  if (mergeBpList[userAddDate]) {
    mergeBpList[userAddDate].sys.push(sys);
    mergeBpList[userAddDate].dia.push(dia);
    mergeBpList[userAddDate].pul.push(pul);
  } else {
    // 否則，在mergeBpList中建立一個新項目
    mergeBpList[userAddDate] = {
      sys: [sys],
      dia: [dia],
      pul: [pul],
    };
  }
});

// 遍歷mergeBpList，計算每個日期的平均值
// for (const date in mergeBpList) {
//   mergeBpList[date] = {
//     sys: calculateAverage(mergeBpList[date].sys),
//     dia: calculateAverage(mergeBpList[date].dia),
//     pul: calculateAverage(mergeBpList[date].pul),
//   };
// }

console.log(mergeBpList);


    return res.status(200).send({ success: true, data: bpDetail, mergeBpList:mergeBpList });
  } catch (e) {
    return res.send(e);
  }
})

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
    morningData,
    afternoonData,
    bloodyList,
  } = req.body;
  let lineToken = "";
  console.log(bloodyList);

  // validate the BP before making a new one
  const { error } = pressureValidation(req.body);
  console.log(error);
  if (error) return res.status(200).send({
    success: false,
    message: error.details[0].message
  });

  bloodyList.forEach(async (bloodyData) => {
    const bpData = {
      systolicPressure: bloodyData.sys,
      diastolicPressure: bloodyData.dia,
      heartRate: bloodyData.pul,
      tester: req.user._id,
      userId: userId,
      userAddDate: addDate,
      measureTime: bloodyData.measureTime,
      remark: bloodyData.remark,
    };
    const newBP = new BloodPressure(bpData);
    // 有輸入資料才處理
    if (bloodyData.sys && bloodyData.dia && bloodyData.pul) {
      console.log(bpData);
      if (bloodyData.state === "add") {
        // save new BP into DB
        let saveBP = [];
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
              let message = "";
              switch (bloodyData.measureTime) {
                case "0": // 上午
                  message = `${user.userName}先生/女士 家屬您好，${date}上午量測血壓的紀錄為收縮壓(SYS)為${systolicPressure}，舒張壓(DIA)為${diastolicPressure}，心跳(PUL)為${heartRate}，${pressureMessage}。 Bloody Help關心您的血壓健康。`;
                  break;
                case "1": // 下午
                  message = `${user.userName}先生/女士 家屬您好，${date}下午量測血壓的紀錄為收縮壓(SYS)為${systolicPressure}，舒張壓(DIA)為${diastolicPressure}，心跳(PUL)為${heartRate}，${pressureMessage}。 Bloody Help關心您的血壓健康。`;
                  break;
              }
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
      } else {
        await BloodPressure.findOneAndUpdate(
          {
            userId: userId,
            measureTime: bloodyData.measureTime,
            userAddDate: { $regex: new RegExp(addDate, "i") },
          },
          bloodyData,
          {
            new: true,
          }
        );
      }
    }
  });

  return res.status(200).send({
    success: true,
    message: 'success',
  });
});

router.post("/exportSheet", async (req, res) => {
  console.log(req.body);
  return res.status(200).send("Blood Pressure exports.");
});
export default router;
