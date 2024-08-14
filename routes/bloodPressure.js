import express from "express";
import BloodPressure from "../models/bloodPressure-model.js";
import User from "../models/user-model.js";
import { pressureValidation } from "../validation.js";
import axios from "axios";
import moment from "moment";
import cron from "node-cron";

const router = express.Router();

// 設置每 10 秒執行一次的任務
cron.schedule('*/10 * * * * *', async () => {
  const date = moment(new Date()).format("YYYY/MM/DD/00:00:00"); // today
  // console.log('每 10 秒執行一次的任務');
  const allUser = await User.find();
  allUser.forEach( async (user) => {
    // 有設定 line notify
    if(user.lineToken){
      const lineToken = user.lineToken;
      let message = "";
      const bloodPressure = await BloodPressure.find({
        userId: user.userId,
        measureTime: "1", // 上午
        userAddDate: { $regex: new RegExp(date, "i") },
      });
      // console.log(bloodPressure);
      if(bloodPressure.length === 0){ // 沒有血壓紀錄，需要提醒
        const messageDate = moment(new Date()).format("YYYY/MM/DD");
        message = `${user.userName}先生/女士 家屬您好，${messageDate}下午血壓尚未量測，提醒您不要忘記囉！`;
        // send line notify to user
        // await axios
        // .post("https://notify-api.line.me/api/notify", null, {
        //   params: {
        //     message: message,
        //   },
        //   headers: {
        //     Authorization: `Bearer ${lineToken}`,
        //   },
        // })
        // .then((response) => {
        //   // console.log(response);
        // })
        // .catch((err) => {
        //   console.log(err);
        // });
      }
    }
  });
});

// 設置每天早上10點執行的任務
cron.schedule('0 10 * * *', async () => {
  console.log('每天早上10點發送通知');
  // 在這裡添加你的通知發送代碼
  const date = moment(new Date()).format("YYYY/MM/DD/00:00:00"); // today
  const allUser = await User.find();
  allUser.forEach( async (user) => {
    // 有設定 line notify
    if(user.lineToken){
      const lineToken = user.lineToken;
      let message = "";
      const bloodPressure = await BloodPressure.find({
        userId: user.userId,
        measureTime: "0", // 上午
        userAddDate: { $regex: new RegExp(date, "i") },
      });
      console.log(bloodPressure);
      if(bloodPressure.length === 0){ // 沒有血壓紀錄，需要提醒
        const messageDate = moment(new Date()).format("YYYY/MM/DD");
        message = `${user.userName}先生/女士 家屬您好，${messageDate}上午血壓尚未量測，提醒您不要忘記囉！`;
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
    }
  });
});

// 設置每天晚上8點執行的任務
cron.schedule('0 20 * * *', async () => {
  console.log('每天晚上20點發送通知');
  // 在這裡添加你的通知發送代碼
  const date = moment(new Date()).format("YYYY/MM/DD/00:00:00"); // today
  const allUser = await User.find();
  allUser.forEach( async (user) => {
    // 有設定 line notify
    if(user.lineToken){
      const lineToken = user.lineToken;
      let message = "";
      const bloodPressure = await BloodPressure.find({
        userId: user.userId,
        measureTime: "1", // 下午
        userAddDate: { $regex: new RegExp(date, "i") },
      });
      console.log(bloodPressure);
      if(bloodPressure.length === 0){ // 沒有血壓紀錄，需要提醒
        const messageDate = moment(new Date()).format("YYYY/MM/DD");
        message = `${user.userName}先生/女士 家屬您好，${messageDate}下午血壓尚未量測，提醒您不要忘記囉！`;
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
    }
  });
});

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
  const date = moment(new Date()).format("YYYY/MM/DD/00:00:00"); // today
  const sevenDaysAgo = moment().subtract(choosePeriod, 'days').format("YYYY/MM/DD/00:00:00"); // 特定日期之前
  try {
    const bpDetail = await BloodPressure.aggregate([
      {
        $match: {
          userId: userId,
          userAddDate: {
            $gte: sevenDaysAgo,
            $lte: date, // 包含今天
          }
        }
      },
      {
        $group: {
          _id : "$userAddDate",
          sys: { $avg: "$systolicPressure" }, // 計算每組的sys平均值
          dia: { $avg: "$diastolicPressure" }, // 計算每組的dia平均值
          pul: { $avg: "$heartRate" } // 計算每組的pul平均值
        }
      },
      {
        $sort: { userAddDate: 1 } // 根據日期升序排序
      },
      {
        $limit: choosePeriod * 2 // 限制結果數量
      }
    ]);

    // 獲取上週平均血壓
    const { avgSys, avgDia } = await getLastWeekAvg(userId, "0", date);

    // 構建七天日期範圍
    const dateRange = Array.from({ length: choosePeriod }, (_, i) =>
      moment(date).subtract(choosePeriod- 1 - i, "days").startOf("day").format("YYYY/MM/DD/00:00:00")
    );

    // 將補0的數據添加到結果中
    const result = dateRange.map(date => {
      const existingData = bpDetail.find(item => item._id === date);
      if (existingData) {
        return existingData;
      } else {
        return {
          _id: date,
          sys: 0,
          dia: 0,
          pul: 0
        };
    }
    });

    const returnResult = {
      result,
      avgDia,
      avgSys
    }

    return res.status(200).send({ success: true, data: returnResult });
  } catch (e) {
    return res.send(e);
  }
})

// 獲取血壓匯出資料
router.get("/getBPExportDetail", async (req, res) => {
  const { userId } = req.query;
  const bpDetail = await BloodPressure.aggregate([
    {
      $match: {
        userId: userId,
      }
    },
    {
      $lookup: {
        from: "users", // 另一個集合的名稱
        localField: "userId", // 本地字段是 BloodPressure 集合中的 userId
        foreignField: "userId", // 外部字段是 User 集合中的 userId
        as: "user" // 將匹配的文檔放入名為 user 的數組中
      }
    },
    {
      $group: {
        _id: { $toDate: "$userAddDate" }, // 將日期字符串轉換為日期對象
        bloodyData: { $push: "$$ROOT" }, // 將文檔添加到bloodyData數組中
        userName: { $first: { $arrayElemAt: ["$user.userName", 0] } }, // 提取第一個用戶名稱
      }
    },
    {
      $sort: { "_id": 1 } // 根據日期升序排序
    },
    {
      $project: {
        date: "$_id", // 將_id字段重命名為date
        _id: 0, // 隱藏_id字段
        userName: 1, // 包含用戶名稱
        bloodyData: 1 // 保留bloodyData數組
      }
    }
  ]);

  const formattedBpDetail = bpDetail.map(item => {
    const date = new Date(item.date);
    // 格式化日期為指定格式
    const formattedDate = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    let morningData = { dia: 0, sys: 0, pul: 0 };
    let afternoonData = { dia: 0, sys: 0, pul: 0 };
  
    item.bloodyData.forEach(data => {
      if (data.measureTime === "0") {
        // 上午
        morningData = {
          dia: data.diastolicPressure,
          sys: data.systolicPressure,
          pul: data.heartRate
        };
      } else {
        // 下午
        afternoonData = {
          dia: data.diastolicPressure,
          sys: data.systolicPressure,
          pul: data.heartRate
        };
      }
    });
  
    // 返回格式化的對象
    return {
      date: formattedDate,
      user_name: item.userName,
      mor_dia: morningData.dia,
      mor_sys: morningData.sys,
      mor_pul: morningData.pul,
      aft_dia: afternoonData.dia,
      aft_sys: afternoonData.sys,
      aft_pul: afternoonData.pul
    };
  });

  return res.status(200).send({ success: true, data: formattedBpDetail });
})

// 依照日期獲取血壓資料
router.get("/getBP", async (req, res) => {
  const { userId, date } = req.query;

  console.log(userId, date);
  let bloodPressure = [];
  try {
    // 上週血壓平均值處理
    const { avgSys, avgDia } = await getLastWeekAvg(userId);
    console.log(avgSys, avgDia);

    bloodPressure = await BloodPressure.find({
      userId: userId,
      userAddDate: { $regex: new RegExp(date, "i") },
    });
  } catch (e) {
    console.log(e);
    return res.send(e);
  }
  return res.status(200).send({ success: true, bloodPressure: bloodPressure });
});

// making a new BP record
router.post("/newbp", async (req, res) => {
  const {
    userId,
    addDate,
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
              // 上週血壓平均值處理
              const { avgSys, avgDia } = await getLastWeekAvg(userId);

              // 與前一週血壓平均比較，提供訊息
              let compareMessage = "";
              if(avgSys > 0 && avgDia > 0) { // 上週有血壓紀錄才比較
                if(bloodyData.sys > avgSys || bloodyData.dia > avgDia) { // 新增的血壓比上週平均高
                  compareMessage = "與過去七天的平均值相比有上升趨勢，請留意身體狀況。";
                }
              }

              // 判斷血壓是否正常，提供訊息
              let pressureMessage = "";
              if (bloodyData.sys < 120 && bloodyData.dia < 80) {
                pressureMessage = "血壓為正常範圍內。";
              } else if (bloodyData.sys < 130 && bloodyData.dia < 89) {
                pressureMessage = "血壓略高需注意！";
              } else {
                pressureMessage = "血壓偏高，需注意身體狀況並及時就醫。";
              }
              // 發送line 通知
              const date = moment(new Date(addDate)).format("YYYY/MM/DD");
              let measureTimeMessage = "";
              switch (bloodyData.measureTime) {
                case "0": // 上午
                  measureTimeMessage = "上午"
                  break;
                case "1": // 下午
                  measureTimeMessage = "下午"
                  break;
              }
              const message = `${user.userName}先生/女士 家屬您好，${date}${measureTimeMessage}血壓量測結果為收縮壓(SYS)：${bloodyData.sys}，舒張壓(DIA)：${bloodyData.dia}，心跳(PUL)：${bloodyData.pul}，${pressureMessage}${compareMessage}Bloody Help關心您的血壓健康。`;
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

// 獲取上週血壓平均的日期
const getLastWeekAvg = async (userId) => {
  const addDate = moment(new Date());
  const sevenDaysAgo = moment().subtract(6, 'days'); // 特定日期之前
  // const dayOfWeek = addDate.day(); // 0 是星期天，1 是星期一，依此类推
  // const startOfLastWeek = addDate.subtract(dayOfWeek + 7, 'days').startOf('day'); // 上周日
  // const endOfLastWeek = startOfLastWeek.clone().add(6, 'days').endOf('day'); // 上周六
  const formatStartWeek = moment(sevenDaysAgo).format("YYYY/MM/DD/00:00:00");
  const formatEndWeek = moment(addDate).format("YYYY/MM/DD/00:00:00");
  console.log("Start of last week:", formatStartWeek); // 上週第一天（日）
  console.log("End of last week:", formatEndWeek); // 上週最後一天（六）

  // 上週血壓平均值處理
  const bpDetail = await BloodPressure.aggregate([
    {
      $match: {
        userId: userId,
        userAddDate: {
          $gte: formatStartWeek,
          $lte: formatEndWeek,
        },
        // measureTime: measureTime,
      }
    },
  ]);
  console.log(bpDetail)
  // 計算平均
  let totalSys = 0;
  let totalDia = 0;
  bpDetail.forEach( (bp) => {
    totalSys += bp.systolicPressure;
    totalDia += bp.diastolicPressure;
  });

  let avgSys = 0;
  let avgDia = 0;
  if(bpDetail.length > 0){
    avgSys = Math.round(totalSys / bpDetail.length);
    avgDia = Math.round(totalDia / bpDetail.length);
  }

  return {
    avgSys,
    avgDia
  };
}
export default router;
