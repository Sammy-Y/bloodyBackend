import Joi from "@hapi/joi";

// Register Validation
export const registerValidation = (data) => {
  const schema = Joi.object({
    userName: Joi.string().min(2).max(10).required().messages({
      "string.empty": `名稱不可空白`,
      "string.min": `名稱長度需大於{#limit}`,
      "string.max": `名稱長度需小於{#limit}`,
      "any.required": `"a" is a required field`,
    }),
    userId: Joi.string().min(6).max(50).required().email().messages({
      "string.empty": `帳號不可空白`,
      "string.min": `帳號長度需大於{#limit}`,
      "string.max": `帳號長度需小於{#limit}`,
      "string.email": "請輸入有效的Email",
    }),
    userPw: Joi.string().min(6).max(200).required().messages({
      "string.empty": `密碼不可空白`,
      "string.min": `密碼長度需大於{#limit}`,
      "string.max": `密碼長度需小於{#limit}`,
    }),
  });

  return schema.validate(data);
};

// Login Validation
export const loginValidation = (data) => {
  const schema = Joi.object({
    userId: Joi.string().min(6).max(50).required().email(),
    userPw: Joi.string().min(6).max(200).required(),
  });

  return schema.validate(data);
};

// new Blood pressure validation
export const pressureValidation = (data) => {
  console.log("valid " + JSON.stringify(data));
  const schema = Joi.object({
    systolicPressure: Joi.number().required().messages({
      "number.base": `收縮壓不可空白`,
    }),
    diastolicPressure: Joi.number().required().messages({
      "number.base": `舒張壓不可空白`,
    }),
    heartRate: Joi.number().min(30).required().messages({
      "number.base": `心跳不可空白`,
      "number.min": `心跳需大於{#limit}`,
      "number.max": `心跳需小於{#limit}`,
    }),
    userId: Joi.string().min(6).max(50).required().email(),
    addDate: Joi.date(),
    remark: Joi.string().allow(""), // 允許為空字串
    state: Joi.string(),
  });

  const morningSchema = Joi.object({
    sys: Joi.number().required().messages({
      "number.base": `上午收縮壓不可空白`,
    }),
    dia: Joi.number().required().messages({
      "number.base": `上午舒張壓不可空白`,
    }),
    pul: Joi.number().min(30).required().messages({
      "number.base": `上午心跳不可空白`,
      "number.min": `上午心跳需大於{#limit}`,
      "number.max": `上午心跳需小於{#limit}`,
    }),
    userId: Joi.string().min(6).max(50).required().email(),
    addDate: Joi.date(),
    remark: Joi.string().allow(""), // 允許為空字串
    state: Joi.string(),
  });

  const afternoonSchema = Joi.object({
    sys: Joi.number().required().messages({
      "number.base": `下午收縮壓不可空白`,
    }),
    dia: Joi.number().required().messages({
      "number.base": `下午舒張壓不可空白`,
    }),
    pul: Joi.number().min(30).required().messages({
      "number.base": `下午心跳不可空白`,
      "number.min": `下午心跳需大於{#limit}`,
      "number.max": `下午心跳需小於{#limit}`,
    }),
    userId: Joi.string().min(6).max(50).required().email(),
    addDate: Joi.date(),
    remark: Joi.string().allow(""), // 允許為空字串
    state: Joi.string(),
  });

  // 驗證早上和下午的數據
  // const newMorningData = {
  //   systolicPressure: data.morningData.sys,
  //   diastolicPressure: data.morningData.dia,
  //   heartRate: data.morningData.pul,
  //   userId: data.userId,
  //   addDate: data.addDate,
  //   remark: data.morningData.remark,
  //   measureTime: "1",
  //   state: data.state,
  // };
  data.morningData = {
    ...data.morningData,
    userId: data.userId,
    addDate: data.addDate,
    state: data.state,
  };
  data.afternoonData = {
    ...data.afternoonData,
    userId: data.userId,
    addDate: data.addDate,
    state: data.state,
  };
  // 有輸入資料才處理
  if (data.morningData.sys || 
      data.morningData.dia || 
      data.morningData.pul) {
    const newMorningData = {
      sys: data.morningData.sys,
      dia: data.morningData.dia,
      pul: data.morningData.pul,
      remark: data.morningData.remark,
      userId: data.morningData.userId,
      addDate: data.morningData.addDate,
      state: data.morningData.state,
    };
    const morningResult = morningSchema.validate(newMorningData);
    if (morningResult.error) {
      return morningResult;
    }
  }
  // 有輸入資料才處理
  if (
    data.afternoonData.sys ||
    data.afternoonData.dia ||
    data.afternoonData.pul
  ) {
    const newAfternoonData = {
      sys: data.afternoonData.sys,
      dia: data.afternoonData.dia,
      pul: data.afternoonData.pul,
      remark: data.afternoonData.remark,
      userId: data.afternoonData.userId,
      addDate: data.afternoonData.addDate,
      state: data.afternoonData.state,
    };
    const afternoonResult = afternoonSchema.validate(newAfternoonData);
    if (afternoonResult.error) {
      return afternoonResult;
    }
  }

  // 返回驗證結果
  return { error: null };
};
