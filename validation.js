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
  });

  return schema.validate(data);
};
