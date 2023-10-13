import mongoose from "mongoose";

const bloodPressureSchema = mongoose.Schema({
  id: {
    type: String,
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
  tester: {
    // 測試者
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // connect with User collection
  },
  userId: {
    type: String,
  },
  date: {
    // 測試日期、時間
    type: Date,
    default: Date.now(),
  },
});

export default mongoose.model("BloodPressure", bloodPressureSchema);
