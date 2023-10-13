import express from "express";
import BloodPressure from "../models/bloodPressure-model.js";
import { pressureValidation } from "../validation.js";

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
  const { systolicPressure, diastolicPressure, heartRate, userId } = req.body;
  console.log(req.body);

  // validate the BP before making a new one
  const { error } = pressureValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const newBP = new BloodPressure({
    systolicPressure: systolicPressure,
    diastolicPressure: diastolicPressure,
    heartRate: heartRate,
    tester: req.user._id,
    userId: userId,
  });

  try {
    // save new BP into DB
    const saveBP = await newBP.save();
    res.status(200).send({
      message: "Success.",
      saveObject: saveBP,
    });
  } catch (err) {
    return res.status(400).send("Blood Pressure not saved.");
  }
});

export default router;
