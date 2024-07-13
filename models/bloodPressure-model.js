import mongoose from "mongoose";

const bloodPressureSchema = mongoose.Schema({
  id: {
    type: String,
  },
  measureTime: {
    // 量測時間
    type: String, // 0->早上, 1->晚上
  },
  systolicPressure: {
    // 收縮值
    type: Number,
  },
  diastolicPressure: {
    // 舒張壓
    type: Number,
  },
  heartRate: {
    // 心律
    type: Number,
    minLength: 30,
  },
  // tester: {
  //   // 測試者
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "User", // connect with User collection
  // },
  userId: {
    type: String,
  },
  userAddDate: {
    // 用戶選擇的日期
    type: String,
  },
  remark: {
    // 備註
    type: String,
  },
  // date: {
  //   // 測試日期、時間
  //   type: Date,
  //   default: Date.now(),
  // },
}, 
// 取消 __v 欄位
{ 
  versionKey: false 
});

export default mongoose.model("BloodPressure", bloodPressureSchema);
